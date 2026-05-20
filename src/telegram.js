export async function sendTelegramMessage({ botToken, chatId, text }) {
  if (!botToken) throw new Error('Thiếu TELEGRAM_BOT_TOKEN trong file .env');
  if (!chatId) throw new Error('Thiếu TELEGRAM_CHAT_ID trong file .env');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram lỗi ${response.status}: ${JSON.stringify(data)}`);
  }

  return data.result;
}

export async function getTelegramUpdates({ botToken }) {
  if (!botToken) throw new Error('Thiếu TELEGRAM_BOT_TOKEN trong file .env');

  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram getUpdates lỗi ${response.status}: ${JSON.stringify(data)}`);
  }

  return data.result;
}
