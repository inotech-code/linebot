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

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const text = event.message.text;
  const userId = getUserId(event);

  // ---- ステップ1: 工事種別選択（初期化） ----
  if (text.includes('見積もり')) {
    resetSession(userId);
    return client.replyMessage(event.replyToken, {
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

  // ---- ステップ2: 工事内容詳細 ----
  if (text === 'エアコン設置・交換') {
    setSession(userId, 'workType', 'エアコン設置・交換');
    return client.replyMessage(event.replyToken, {
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

  // ---- 新設工事 ----
  if (text === 'エアコン新設工事') {
    setSession(userId, 'workDetail', '新設工事');
    return client.replyMessage(event.replyToken, {
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

  // ---- 新設工事：本体あり・台数選択 ----
  if (text === 'はい（新設）') {
    setSession(userId, 'hasUnit', 'あり');
    return client.replyMessage(event.replyToken, {
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

  // ---- 新設工事：本体なし・手配選択 ----
  if (text === 'いいえ（新設）') {
    setSession(userId, 'hasUnit', 'なし');
    return client.replyMessage(event.replyToken, {
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

  // ---- 新設工事：取り付け台数記録＋最終確認 ----
  if (/^\d+台（新設）$/.test(text)) {
    const n = Number(text.match(/^(\d+)/)[1]);
    setSession(userId, 'installCount', n);
    // --- 最終確認
    const summary = `【見積もり内容】
工事種別：${getSession(userId, 'workType')}
内容：${getSession(userId, 'workDetail')}
本体：${getSession(userId, 'hasUnit') === 'あり' ? 'あり' : 'なし'}
${n ? '取り付け台数：' + n + '台' : ''}
`;

    return client.replyMessage(event.replyToken, {
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

  // ---- 引越し工事：外し台数 ----
  if (text === 'エアコン引越し工事') {
    setSession(userId, 'workDetail', '引越し工事');
    return client.replyMessage(event.replyToken, {
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

  // ---- 引越し工事：外し台数記録→取り付け台数 ----
  if (/^取り外し(\d+)台$/.test(text)) {
    const outCount = Number(text.match(/^取り外し(\d+)台$/)[1]);
    setSession(userId, 'removeCount', outCount);
    return client.replyMessage(event.replyToken, {
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

  // ---- 引越し工事：取り付け台数選択後→台数比較＆余り対応 ----
  if (/^取り付け(\d+)台$/.test(text)) {
    const installCount = Number(text.match(/^取り付け(\d+)台$/)[1]);
    setSession(userId, 'installCount', installCount);

    const removeCount = getSession(userId, 'removeCount');
    if (removeCount > installCount) {
      // 余りあり！ → 回収 or お客様処分フロー
      setSession(userId, 'remainCount', removeCount - installCount);
      return client.replyMessage(event.replyToken, {
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
      // 余りなし→最終確認へ
      return await showSummary(userId, event.replyToken);
    }
  }

  // ---- 引越し工事：余りの対応（回収/処分）選択後→最終確認 ----
  if (text === '無料回収希望' || text === 'お客様で処分') {
    setSession(userId, 'remainAction', text);
    return await showSummary(userId, event.replyToken);
  }

  // ---- 新設工事・その他の台数 or 回答 ----
  if (text === '最終送信') {
    // ここで管理者に転送や保存などを実装可能
    resetSession(userId);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ご依頼内容を送信しました。担当者からご連絡いたします。'
    });
  }

  // --- その他案内 ---
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '見積もりをご希望の方は、リッチメニューから「見積もり」を押してください。'
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

  let summary = `【見積もり内容】
工事種別：${workType}
内容：${workDetail}
`;
  if (hasUnit) summary += `本体：${hasUnit === 'あり' ? 'あり' : 'なし'}\n`;
  if (removeCount) summary += `取り外し台数：${removeCount}台\n`;
  if (installCount) summary += `取り付け台数：${installCount}台\n`;
  if (remainCount) summary += `余剰台数：${remainCount}台\n`;
  if (remainAction) summary += `余剰対応：${remainAction}\n`;

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
