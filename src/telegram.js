export async function sendTelegramMessage({ botToken, chatId, text }) {
  const startTime = new Date();
  
  if (!botToken) throw new Error('Thiếu TELEGRAM_BOT_TOKEN trong file .env');
  if (!chatId) throw new Error('Thiếu TELEGRAM_CHAT_ID trong file .env');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  console.log(`[DEBUG] Starting Telegram API request at ${startTime.toISOString()}`);
  console.log(`[DEBUG] URL: ${url.replace(botToken, '***TOKEN***')}`);
  console.log(`[DEBUG] Chat ID: ${chatId}`);
  console.log(`[DEBUG] Message length: ${text.length} chars`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });

  const fetchTime = new Date();
  console.log(`[DEBUG] Received response at ${fetchTime.toISOString()} (${fetchTime - startTime}ms)`);
  console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);

  const data = await response.json().catch(() => null);

  console.log(`[DEBUG] Response body ok: ${data?.ok}, message_id: ${data?.result?.message_id}`);

  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram lỗi ${response.status}: ${JSON.stringify(data)}`);
  }

  const endTime = new Date();
  console.log(`[DEBUG] Telegram API completed at ${endTime.toISOString()} (Total: ${endTime - startTime}ms)\n`);

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
