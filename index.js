require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
const port = process.env.PORT || 3000;

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const text = event.message.text;

  // ステップ1
  if (text.includes('見積もり')) {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: 'エアコン設置・交換', text: 'エアコン設置・交換' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'エアコン分解洗浄', text: 'エアコン分解洗浄' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: '電気工事', text: '電気工事' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'LAN工事・ネットワーク', text: 'LAN工事・ネットワーク' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: '定期点検・保守', text: '定期点検・保守' }
                },
                {
                  type: 'button',
                  style: 'secondary',
                  height: 'md',
                  action: { type: 'message', label: 'その他', text: 'その他' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ステップ2
  if (text === 'エアコン設置・交換') {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: '新設工事', text: 'エアコン新設工事' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: '引越し工事', text: 'エアコン引越し工事' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ◆ 新設工事：本体をお持ちか？
  if (text === 'エアコン新設工事') {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: 'はい', text: 'はい（新設）' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: 'いいえ', text: 'いいえ（新設）' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ◆ 新設工事：「はい」を選んだ場合（取り付け台数選択）
  if (text === 'はい（新設）') {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: `${i+1}台`, text: `${i+1}台（新設）` }
                })),
                {
                  type: 'button',
                  style: 'secondary',
                  height: 'md',
                  action: { type: 'message', label: 'その他', text: 'その他（新設取付台数）' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ◆ 新設工事：「いいえ」を選んだ場合
  if (text === 'いいえ（新設）') {
    return client.replyMessage(event.replyToken, {
      type: 'flex',
      altText: 'エアコン本体の準備について',
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: '自分で用意する', text: '自分で用意（新設）' }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#06C755',
                  height: 'md',
                  action: { type: 'message', label: '弊社に依頼', text: '弊社に依頼（新設）' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ◆ 引越し工事：取り外し台数
  if (text === 'エアコン引越し工事') {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: `${i+1}台`, text: `取り外し${i+1}台` }
                })),
                {
                  type: 'button',
                  style: 'secondary',
                  height: 'md',
                  action: { type: 'message', label: 'その他', text: 'その他（取り外し台数）' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // ◆ 引越し工事：取り外し台数が押された後 → 取り付け台数
  if (/^取り外し\d+台$/.test(text) || text === 'その他（取り外し台数）') {
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
            {
              type: 'separator',
              margin: 'md'
            },
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
                  action: { type: 'message', label: `${i+1}台`, text: `取り付け${i+1}台` }
                })),
                {
                  type: 'button',
                  style: 'secondary',
                  height: 'md',
                  action: { type: 'message', label: 'その他', text: 'その他（取り付け台数）' }
                }
              ]
            }
          ]
        },
        styles: {
          body: {
            backgroundColor: "#FFFFFF"
          }
        }
      }
    });
  }

  // --- 必要に応じてここに「最終確認」や他質問追加可 ---

  // その他案内
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '見積もりをご希望の方は、リッチメニューから「見積もり」を押してください。'
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
