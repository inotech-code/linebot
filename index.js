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

  // ステップ1: 見積もりフロー開始
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

  // ステップ2: エアコン設置・交換を選んだ場合
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

  // ステップ3: 新設工事→本体有無を質問
  if (text === 'エアコン新設工事') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エアコン本体をお持ちですか？\n「はい」または「いいえ」でご回答ください。'
    });
  }

  // ステップ3: 引越し工事→台数を質問
  if (text === 'エアコン引越し工事') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '取り外し台数を数字で入力してください。'
    });
  }

  // その他案内
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '見積もりをご希望の方は、リッチメニューから「見積もり」を押してください。'
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
