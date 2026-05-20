import 'dotenv/config';
import { getTelegramUpdates } from './telegram.js';

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('Thiếu TELEGRAM_BOT_TOKEN trong file .env');
    process.exit(1);
  }

  const updates = await getTelegramUpdates({ botToken });

  if (!updates.length) {
    console.log('Chưa có tin nhắn nào gửi tới bot. Hãy mở Telegram, nhắn /start hoặc một tin bất kỳ cho bot, rồi chạy lại lệnh này.');
    return;
  }

  console.log('Danh sách chat tìm thấy:\n');
  for (const update of updates) {
    const msg = update.message || update.edited_message || update.channel_post;
    const chat = msg?.chat;
    if (!chat) continue;

    const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || chat.username || 'Không rõ tên';
    console.log(`chat.id: ${chat.id}`);
    console.log(`name: ${name}`);
    console.log(`type: ${chat.type}`);
    console.log('---');
  }
}

main().catch((error) => {
  console.error('Lỗi:', error.message);
  process.exit(1);
});
