require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');

// LINE botの設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
const port = process.env.PORT || 3000;

// LINE用ミドルウェア
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

// LINEクライアント
const client = new line.Client(config);

function handleEvent(event) {
  // メッセージイベント以外は無視
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 「見積もり」を含むテキストに反応（部分一致/Flex Messageで縦型ボタン表示）
  if (event.message.text.includes('見積もり')) {
    return client.replyMessage(event.replyToken, {
      type: 'flex',
      altText: 'どの工事をご希望ですか？',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'どの工事をご希望ですか？',
              weight: 'bold',
              size: 'lg',
              margin: 'md'
            },
            {
              type: 'button',
              style: 'primary',
              color: '#1976D2',
              action: { type: 'message', label: 'エアコン設置・交換', text: 'エアコン設置・交換' }
            },
            {
              type: 'button',
              style: 'primary',
              color: '#388E3C',
              action: { type: 'message', label: 'エアコン分解洗浄', text: 'エアコン分解洗浄' }
            },
            {
              type: 'button',
              style: 'primary',
              color: '#FBC02D',
              action: { type: 'message', label: '電気工事', text: '電気工事' }
            },
            {
              type: 'button',
              style: 'primary',
              color: '#0288D1',
              action: { type: 'message', label: 'LAN工事・ネットワーク', text: 'LAN工事・ネットワーク' }
            },
            {
              type: 'button',
              style: 'primary',
              color: '#8D6E63',
              action: { type: 'message', label: '定期点検・保守', text: '定期点検・保守' }
            },
            {
              type: 'button',
              style: 'secondary',
              action: { type: 'message', label: 'その他', text: 'その他' }
            }
          ]
        }
      }
    });
  }

  // 追加の分岐やフローはここに書き足していく！

  // その他のメッセージは「リッチメニューから『見積もり』を押してください」と案内
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '見積もりをご希望の方は、リッチメニューから「見積もり」を押してください。'
  });
}

// サーバー起動
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
