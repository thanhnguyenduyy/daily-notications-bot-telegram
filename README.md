# 🤖 Telegram Bot Daily Notifications

Bot Node.js gửi lời chào (6h & 22h30) và báo cáo (8h30 & 18h30: Thời tiết Huế, Giá vàng Duy Mong, Xăng RON 95-III) qua Telegram.

## 🛠️ Cài đặt & Chạy

1. **Cài đặt ban đầu:**
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Cấu hình `.env`:** Điền token bot, tọa độ địa điểm và các cài đặt lịch chạy.

3. **Lấy Chat ID:** Nhắn tin cho bot rồi chạy lệnh:
   ```bash
   npm run get:chatid
   ```

4. **Lệnh vận hành:**
   * **Gửi thử ngay:** `npm run test:send`
   * **Chạy tự động:** `npm start`
   * **Chạy ngầm (PM2):** `pm2 start src/index.js --name "telegram-daily-bot"`
