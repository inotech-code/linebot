require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
const port = process.env.PORT || 3000;

// --- ユーザー状態を一時保存するための簡易セッション（メモリ） ---
const sessions = {};

function getUserId(event) {
  return event.source && event.source.userId ? event.source.userId : 'dummy';
}
function resetSession(userId) {
  sessions[userId] = {};
}
function setSession(userId, key, value) {
  if (!sessions[userId]) sessions[userId] = {};
  sessions[userId][key] = value;
}
function getSession(userId, key) {
  return sessions[userId] ? sessions[userId][key] : undefined;
}

// メッセージ/ポストバック両対応（displayText対応に修正）
function getTextFromEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    return event.message.text;
  }
  if (event.type === 'postback') {
    const { data = '', displayText = '' } = event.postback || {};
    return data || displayText;  // ★ 修正：data が空なら displayText
  }
  return '';
}

// === 追加：normalize（全角/半角スペースや改行を消す）関数 ===
function normalizeText(text) {
  return (text || '')
    .replace(/[\s\u3000\r\n]/g, '')
    .toLowerCase();
}

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

// --- replyMessageを例外キャッチで安全化 ---
function replySafe(token, message) {
  return client.replyMessage(token, message).catch((e) => {
    console.error('[replyError]', e);   // ★ 失敗時は必ずコンソール出力
  });
}

async function handleEvent(event) {
  const rawText = getTextFromEvent(event);
  if (!rawText) return Promise.resolve(null);

  // --- 追加：デバッグ用 ---
  const text = rawText.trim();
  const normText = normalizeText(text);
  const userId = getUserId(event);

  console.log('===受信===', { rawText, normText, waiting: getSession(userId, 'waiting') });

  // ====================== 相談・電話で相談：必ず最優先 ======================
  if (normText.includes('電話')) {
    return replySafe(event.replyToken, {
      type: 'flex',
      altText: 'お電話でのご相談',
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: 'お電話でご相談',
              weight: 'bold',
              size: 'md',
              color: '#222222',
              align: 'center',
              margin: 'md'
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'text',
              text: '下のボタンからお電話できます',
              size: 'sm',
              color: '#333333',
              margin: 'md'
            },
            {
              type: 'button',
              style: 'primary',
              color: '#06C755',
              margin: 'lg',
              action: {
                type: 'uri',
                label: '電話をかける',
                uri: 'tel:09020104780'
              }
            }
          ]
        },
        styles: { body: { backgroundColor: "#FFFFFF" } }
      }
    });
  }
  if (normText.includes('相談')) {
    return replySafe(event.replyToken, {
      type: 'text',
      text: '担当者からご連絡いたします。'
    });
  }
  // ====================================================================

  // ---- ステップ1: 工事種別選択（初期化） ----
  if (normText.includes('見積もり')) {
    resetSession(userId);
    return replySafe(event.replyToken, {
      type: 'flex',
      altText: 'どの工事をご希望ですか？',
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: 'どの工事をご希望ですか？',
              weight: 'bold',
              size: 'lg',
              color: '#222222',
              align: 'center',
              margin: 'md'
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              margin: 'lg',
              contents: [
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: 'エアコン設置・交換', text: 'エアコン設置・交換' }
                },
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: 'エアコン分解洗浄', text: 'エアコン分解洗浄' }
                },
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: '電気工事', text: '電気工事' }
                },
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: 'LAN工事・ネットワーク', text: 'LAN工事・ネットワーク' }
                },
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: '定期点検・保守', text: '定期点検・保守' }
                },
                {
                  type: 'button',
                  style: 'secondary', height: 'md',
                  action: { type: 'message', label: 'その他', text: 'その他' }
                }
              ]
            }
          ]
        },
        styles: { body: { backgroundColor: "#FFFFFF" } }
      }
    });
  }

  // --- 電気工事・LAN工事: 担当者連絡のみ ---
  if (
    normText === normalizeText('電気工事') ||
    normText === normalizeText('LAN工事・ネットワーク')
  ) {
    resetSession(userId);
    return replySafe(event.replyToken, {
      type: 'text',
      text: '担当者からご連絡いたします。'
    });
  }

  // --- 定期点検・保守: エアコンかその他か選ばせる ---
  if (normText === normalizeText('定期点検・保守')) {
    setSession(userId, 'workType', '定期点検・保守');
    return replySafe(event.replyToken, {
      type: 'flex',
      altText: '点検内容を選択してください',
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: '点検内容を選択してください',
              weight: 'bold',
              size: 'md',
              color: '#222222',
              align: 'center',
              margin: 'md'
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              margin: 'lg',
              contents: [
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: 'エアコンの保守点検', text: 'エアコンの保守点検' }
                },
                {
                  type: 'button',
                  style: 'primary', color: '#06C755', height: 'md',
                  action: { type: 'message', label: 'その他', text: '点検その他' }
                }
              ]
            }
          ]
        },
        styles: { body: { backgroundColor: "#FFFFFF" } }
      }
    });
  }

  if (normText === normalizeText('エアコンの保守点検')) {
    setSession(userId, 'checkType', 'エアコン点検');
    setSession(userId, 'waiting', 'ac-check-date');
    return replySafe(event.replyToken, {
      type: 'text',
      text: 'いつ頃工事されたエアコンですか？\n（例：2022年8月頃、去年の春ごろ等）'
    });
  }
  if (normText === normalizeText('点検その他')) {
    setSession(userId, 'checkType', 'その他点検');
    setSession(userId, 'waiting', 'other-check');
    return replySafe(event.replyToken, {
      type: 'text',
      text: 'ご希望の点検内容を入力してください。'
    });
  }
  if (getSession(userId, 'waiting') === 'ac-check-date') {
    setSession(userId, 'acCheckDate', text);
    resetSession(userId);
    return replySafe(event.replyToken, {
      type: 'text',
      text: '内容を承りました。担当者からご連絡いたします。'
    });
  }
  if (getSession(userId, 'waiting') === 'other-check') {
    setSession(userId, 'otherCheck', text);
    resetSession(userId);
    return replySafe(event.replyToken, {
      type: 'text',
      text: '内容を承りました。担当者からご連絡いたします。'
    });
  }

  // --- その他: フリーワード ---
  if (normText === normalizeText('その他')) {
    setSession(userId, 'waiting', 'other');
    return replySafe(event.replyToken, {
      type: 'text',
      text: 'ご希望・ご相談内容を入力してください。'
    });
  }
  if (getSession(userId, 'waiting') === 'other') {
    setSession(userId, 'otherFree', text);
    resetSession(userId);
    return replySafe(event.replyToken, {
      type: 'text',
      text: '内容を承りました。担当者からご連絡いたします。'
    });
  }

  // ------------------------ ★ ここから分解洗浄フロー ★ ------------------------
  if (normText === normalizeText('エアコン分解洗浄')) {
    setSession(userId, 'workType', 'エアコン分解洗浄');
    setSession(userId, 'waiting', 'ac-wash-count');
    return replySafe(event.replyToken, {
      type: 'flex',
      altText: '洗浄台数を選択してください',
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: '洗浄台数を選択してください',
              weight: 'bold',
              size: 'md',
              color: '#222222',
              align: 'center',
              margin: 'md'
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              margin: 'lg',
              contents: [
                ...Array.from({length: 10}, (_, i) => ({
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: `${i+1}台`, text: `洗浄${i+1}台` }
                }))
              ]
            }
          ]
        },
        styles: { body: { backgroundColor: "#FFFFFF" } }
      }
    });
  }

  if (/^洗浄(\d+)台$/.test(normText) && getSession(userId, 'waiting') === 'ac-wash-count') {
    const n = Number(normText.match(/^洗浄(\d+)台$/)[1]);
    setSession(userId, 'acWashCount', n);
    setSession(userId, 'waiting', 'ac-wash-osouji');
    return replySafe(event.replyToken, {
      type: 'flex',
      altText: 'お掃除機能の有無',
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: 'お掃除機能はついていますか？',
              weight: 'bold',
              size: 'md',
              color: '#222222',
              align: 'center',
              margin: 'md'
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              margin: 'lg',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'はい', text: 'お掃除機能はい' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'いいえ', text: 'お掃除機能いいえ' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'わからない', text: 'お掃除機能わからない' }
                }
              ]
            }
          ]
        },
        styles: { body: { backgroundColor: "#FFFFFF" } }
      }
    });
  }
  // －－－－ 以降は元コードと完全一致（省略せず全文） －－－－
    // お掃除機能「はい」→台数選択
    if (normText === normalizeText('お掃除機能はい') && getSession(userId, 'waiting') === 'ac-wash-osouji') {
        const total = getSession(userId, 'acWashCount') || 1;
        setSession(userId, 'waiting', 'ac-wash-osouji-count');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: 'お掃除機能付き台数',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: 'お掃除機能付き台数を選択してください',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    ...Array.from({length: total}, (_, i) => ({
                      type: 'button',
                      style: 'primary',
                      color: '#06C755',
                      height: 'md',
                      action: { type: 'message', label: `${i+1}台`, text: `お掃除機能付き${i+1}台` }
                    }))
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      // お掃除機能付き台数 → 最終確認
      if (/^お掃除機能付き(\d+)台$/.test(normText) && getSession(userId, 'waiting') === 'ac-wash-osouji-count') {
        const osoujiCount = Number(normText.match(/^お掃除機能付き(\d+)台$/)[1]);
        setSession(userId, 'acOsoujiCount', osoujiCount);
        setSession(userId, 'waiting', null);
        return await showSummary(userId, event.replyToken);
      }
    
      // お掃除機能「いいえ」→最終確認
      if (normText === normalizeText('お掃除機能いいえ') && getSession(userId, 'waiting') === 'ac-wash-osouji') {
        setSession(userId, 'acOsoujiCount', 0);
        setSession(userId, 'waiting', null);
        return await showSummary(userId, event.replyToken);
      }
    
      // お掃除機能「わからない」→品番入力
      if (normText === normalizeText('お掃除機能わからない') && getSession(userId, 'waiting') === 'ac-wash-osouji') {
        setSession(userId, 'waiting', 'ac-wash-hinban');
        return replySafe(event.replyToken, {
          type: 'text',
          text: 'エアコンの品番を入力してください。'
        });
      }
    
      // 品番入力後→最終確認
      if (getSession(userId, 'waiting') === 'ac-wash-hinban') {
        setSession(userId, 'acHinban', text);
        setSession(userId, 'waiting', null);
        return await showSummary(userId, event.replyToken);
      }
      // ------------------------ ★ ここまで分解洗浄フロー ★ ------------------------
    
      // ---- ステップ2: 工事内容詳細 ----
      if (normText === normalizeText('エアコン設置・交換')) {
        setSession(userId, 'workType', 'エアコン設置・交換');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: '設置・交換内容を選択してください',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: '内容を選択してください',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: '新設工事', text: 'エアコン新設工事' }
                    },
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: '引越し工事', text: 'エアコン引越し工事' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (normText === normalizeText('エアコン新設工事')) {
        setSession(userId, 'workDetail', '新設工事');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: 'エアコン本体をお持ちですか？',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: 'エアコン本体をお持ちですか？',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: 'はい', text: 'はい（新設）' }
                    },
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: 'いいえ', text: 'いいえ（新設）' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (normText === normalizeText('はい（新設）')) {
        setSession(userId, 'hasUnit', 'あり');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: '取り付け台数を選択してください',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: '取り付け台数を選択してください',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    ...Array.from({length: 10}, (_, i) => ({
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: `${i+1}台`, text: `${i+1}台（新設）` }
                    })),
                    {
                      type: 'button',
                      style: 'secondary', height: 'md',
                      action: { type: 'message', label: 'その他', text: 'その他（新設取付台数）' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (normText === normalizeText('いいえ（新設）')) {
        setSession(userId, 'hasUnit', 'なし');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: '本体準備について',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: '施工日までにご用意できますか？',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: '自分で用意する', text: '自分で用意（新設）' }
                    },
                    {
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: '弊社に依頼', text: '弊社に依頼（新設）' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (normText === normalizeText('自分で用意（新設）') || normText === normalizeText('弊社に依頼（新設）')) {
        setSession(userId, 'unitArrange', normText === normalizeText('自分で用意（新設）') ? '自分で用意' : '弊社に依頼');
        return await showSummary(userId, event.replyToken);
      }
    
      if (/^\d+台（新設）$/.test(normText)) {
        const n = Number(normText.match(/^(\d+)/)[1]);
        setSession(userId, 'installCount', n);
        return await showSummary(userId, event.replyToken);
      }
    
      if (normText === normalizeText('エアコン引越し工事')) {
        setSession(userId, 'workDetail', '引越し工事');
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: '取り外し台数を選択してください',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: '取り外し台数を選択してください',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    ...Array.from({length: 10}, (_, i) => ({
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: `${i+1}台`, text: `取り外し${i+1}台` }
                    })),
                    {
                      type: 'button',
                      style: 'secondary', height: 'md',
                      action: { type: 'message', label: 'その他', text: 'その他（取り外し台数）' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (/^取り外し(\d+)台$/.test(normText)) {
        const outCount = Number(normText.match(/^取り外し(\d+)台$/)[1]);
        setSession(userId, 'removeCount', outCount);
        return replySafe(event.replyToken, {
          type: 'flex',
          altText: '取り付け台数を選択してください',
          contents: {
            type: 'bubble',
            size: 'mega',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '20px',
              contents: [
                {
                  type: 'text',
                  text: '取り付け台数を選択してください',
                  weight: 'bold',
                  size: 'md',
                  color: '#222222',
                  align: 'center',
                  margin: 'md'
                },
                { type: 'separator', margin: 'md' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  margin: 'lg',
                  contents: [
                    ...Array.from({length: 10}, (_, i) => ({
                      type: 'button',
                      style: 'primary', color: '#06C755', height: 'md',
                      action: { type: 'message', label: `${i+1}台`, text: `取り付け${i+1}台` }
                    })),
                    {
                      type: 'button',
                      style: 'secondary', height: 'md',
                      action: { type: 'message', label: 'その他', text: 'その他（取り付け台数）' }
                    }
                  ]
                }
              ]
            },
            styles: { body: { backgroundColor: "#FFFFFF" } }
          }
        });
      }
    
      if (/^取り付け(\d+)台$/.test(normText)) {
        const installCount = Number(normText.match(/^取り付け(\d+)台$/)[1]);
        setSession(userId, 'installCount', installCount);
    
        const removeCount = getSession(userId, 'removeCount');
        if (removeCount > installCount) {
          setSession(userId, 'remainCount', removeCount - installCount);
          return replySafe(event.replyToken, {
            type: 'flex',
            altText: '余ったエアコンの対応を選択してください',
            contents: {
              type: 'bubble',
              size: 'mega',
              body: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '20px',
                contents: [
                  {
                    type: 'text',
                    text: `取り外し台数が多いため、${removeCount - installCount}台余ります。どうしますか？`,
                    weight: 'bold',
                    size: 'md',
                    color: '#222222',
                    align: 'center',
                    margin: 'md'
                  },
                  { type: 'separator', margin: 'md' },
                  {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'md',
                    margin: 'lg',
                    contents: [
                      {
                        type: 'button',
                        style: 'primary', color: '#06C755', height: 'md',
                        action: { type: 'message', label: '無料回収を希望', text: '無料回収希望' }
                      },
                      {
                        type: 'button',
                        style: 'primary', color: '#06C755', height: 'md',
                        action: { type: 'message', label: 'お客様で処分', text: 'お客様で処分' }
                      }
                    ]
                  }
                ]
              },
              styles: { body: { backgroundColor: "#FFFFFF" } }
            }
          });
        } else {
          return await showSummary(userId, event.replyToken);
        }
      }
    
      if (
        normText === normalizeText('無料回収希望') ||
        normText === normalizeText('お客様で処分')
      ) {
        setSession(userId, 'remainAction', text);
        return await showSummary(userId, event.replyToken);
      }
    
      // ---- 新設工事・その他の台数 or 回答 ----
      if (normText === normalizeText('最終送信')) {
        resetSession(userId);
        return replySafe(event.replyToken, {
          type: 'text',
          text: 'ご依頼内容を送信しました。担当者からご連絡いたします。'
        });
      }
    
      // --- その他案内 ---
      return replySafe(event.replyToken, {
        type: 'text',
        text: 'メニューからご要望をお選びください。'
      });
    }
    
    // --- 最終確認メッセージ生成 ---
    async function showSummary(userId, replyToken) {
      const workType = getSession(userId, 'workType') || '';
      const workDetail = getSession(userId, 'workDetail') || '';
      const hasUnit = getSession(userId, 'hasUnit');
      const installCount = getSession(userId, 'installCount');
      const removeCount = getSession(userId, 'removeCount');
      const remainCount = getSession(userId, 'remainCount');
      const remainAction = getSession(userId, 'remainAction');
      const unitArrange = getSession(userId, 'unitArrange');
    
      // --- 分解洗浄 専用 ---
      const acWashCount = getSession(userId, 'acWashCount');
      const acOsoujiCount = getSession(userId, 'acOsoujiCount');
      const acHinban = getSession(userId, 'acHinban');
    
      let summary = `【見積もり内容】
    工事種別：${workType}
    `;
      if (workType === 'エアコン分解洗浄') {
        if (acWashCount) {
          if (acOsoujiCount != null) {
            const normal = acWashCount - acOsoujiCount;
            if (normal > 0) summary += `普通洗浄：${normal}台\n`;
            if (acOsoujiCount > 0) summary += `お掃除機能付き：${acOsoujiCount}台\n`;
          }
          if (acHinban) summary += `品番：${acHinban}\n`;
          if (acWashCount && acOsoujiCount == null && !acHinban) summary += `洗浄台数：${acWashCount}台\n`;
        }
      } else {
        if (workDetail) summary += `内容：${workDetail}\n`;
        if (hasUnit) summary += `本体：${hasUnit === 'あり' ? 'あり' : 'なし'}\n`;
        if (unitArrange) summary += `本体手配：${unitArrange}\n`;
        if (removeCount) summary += `取り外し台数：${removeCount}台\n`;
        if (installCount) summary += `取り付け台数：${installCount}台\n`;
        if (remainCount) summary += `余剰台数：${remainCount}台\n`;
        if (remainAction) summary += `余剰対応：${remainAction}\n`;
      }
    
      return client.replyMessage(replyToken, {
        type: 'flex',
        altText: '最終確認',
        contents: {
          type: 'bubble',
          size: 'mega',
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '20px',
            contents: [
              {
                type: 'text',
                text: 'ご依頼内容を確認してください',
                weight: 'bold',
                size: 'md',
                color: '#222222',
                align: 'center',
                margin: 'md'
              },
              { type: 'separator', margin: 'md' },
              {
                type: 'text',
                text: summary,
                margin: 'md',
                wrap: true,
                color: '#333333'
              },
              {
                type: 'button',
                style: 'primary',
                color: '#06C755',
                height: 'md',
                margin: 'lg',
                action: { type: 'message', label: 'この内容で送信', text: '最終送信' }
              }
            ]
          },
          styles: { body: { backgroundColor: "#FFFFFF" } }
        }
      });
    }
    
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
