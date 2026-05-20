# Hue Weather Telegram Bot

App Node.js gửi thời tiết Huế mỗi ngày qua Telegram Bot.

## 1. Cài Telegram bot

1. Mở Telegram, tìm `@BotFather`.
2. Gửi `/newbot`.
3. Đặt tên bot và username cho bot.
4. Copy `TELEGRAM_BOT_TOKEN` mà BotFather trả về.
5. Mở bot vừa tạo, bấm Start hoặc nhắn bất kỳ tin nào cho bot.

## 2. Cài project

```bash
npm install
cp .env.example .env
```

Mở file `.env` và điền:

```env
TELEGRAM_BOT_TOKEN=token_bot_cua_ban
TELEGRAM_CHAT_ID=chat_id_cua_ban
CRON_TIME=0 7 * * *
TIMEZONE=Asia/Ho_Chi_Minh
```

## 3. Lấy TELEGRAM_CHAT_ID

Sau khi đã nhắn tin cho bot, chạy:

```bash
npm run get:chatid
```

Nếu thấy nhiều kết quả, lấy dòng `chat.id` đúng với tài khoản/chat của bạn rồi dán vào `.env`.

## 4. Test gửi ngay

```bash
npm run test:send
```

## 5. Chạy gửi theo lịch mỗi ngày

```bash
npm start
```

Ví dụ `CRON_TIME=0 7 * * *` nghĩa là gửi lúc 07:00 mỗi ngày.

## Ghi chú iPhone

Telegram sẽ hiện notification đẹp hơn ntfy. Nếu muốn iPhone đọc nội dung sau khi bấm vào thông báo:

- Cài đặt → Trợ năng → Nội dung được đọc
- Bật Đọc màn hình
- Mở tin nhắn Telegram rồi vuốt 2 ngón tay từ mép trên màn hình xuống
