import 'dotenv/config';
import cron from 'node-cron';
import { fetchHueWeather, formatWeatherMessage } from './weather.js';
import { sendTelegramMessage } from './telegram.js';
import { fetchDuyMongGold, formatGoldMessage } from './gold.js';
import { fetchPetrolimexFuel, formatFuelMessage } from './fuel.js';

const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID,

  // Dùng khi chạy app liên tục ở local/VPS
  cronTime: process.env.CRON_TIME || '30 8,18 * * *',
  cronGreetingMorning: process.env.CRON_GREETING_MORNING || '0 6 * * *',
  cronGreetingNight: process.env.CRON_GREETING_NIGHT || '30 22 * * *',

  timezone: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
  latitude: Number(process.env.LATITUDE || 16.4637),
  longitude: Number(process.env.LONGITUDE || 107.5909),
  locationName: process.env.LOCATION_NAME || 'Huế',

  // GitHub Actions nên set SEND_ON_START=true
  sendOnStart: String(process.env.SEND_ON_START || 'false').toLowerCase() === 'true',

  // GitHub Actions dùng biến này để phân biệt loại tin nhắn
  // morning | full | night
  messageType: process.env.MESSAGE_TYPE || 'full',

  accuWeatherApiKey: process.env.ACCUWEATHER_API_KEY,
  accuWeatherLocationKey: process.env.ACCUWEATHER_LOCATION_KEY || '356204'
};

// Gửi lời chào, chỉ 1 dòng chào, không kèm thông tin
async function sendGreeting(message) {
  console.log(`[${new Date().toISOString()}] Đang gửi lời chào...`);

  const now = new Date();
  const localTime = now.toLocaleString('vi-VN', { timeZone: config.timezone, hour12: false });
  const fullMessage = `${message}\n\n⏰ ${localTime}`;

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    text: fullMessage
  });

  console.log(`[${new Date().toISOString()}] Đã gửi lời chào thành công.`);
}

// Gửi lời chào buổi sáng
async function sendMorningGreeting() {
  await sendGreeting('🌅 Chào buổi sáng! Chúc bạn một ngày mới tràn đầy năng lượng.');
}

// Gửi lời chào buổi tối
async function sendNightGreeting() {
  await sendGreeting('🌙 Chúc bạn buổi tối vui vẻ và ngủ ngon.');
}

// Gửi thông tin đầy đủ: Thời tiết + Vàng + Xăng
async function sendDailyInfo() {
  console.log(`[${new Date().toISOString()}] Đang lấy thời tiết ${config.locationName}...`);

  let weatherMessage = '';

  try {
    const weather = await fetchHueWeather({
      latitude: config.latitude,
      longitude: config.longitude,
      timezone: config.timezone,
      accuWeatherApiKey: config.accuWeatherApiKey,
      accuWeatherLocationKey: config.accuWeatherLocationKey
    });

    weatherMessage = formatWeatherMessage(weather, config.locationName);
  } catch (error) {
    console.error('Lỗi lấy thời tiết:', error.message);

    const formattedLocation = config.locationName.startsWith('TP.')
      ? config.locationName
      : `TP. ${config.locationName}`;

    weatherMessage = `[🌤️ Thời tiết ${formattedLocation}] - Hiện tại\n\nKhông lấy được thông tin thời tiết lúc này.`;
  }

  console.log(`[${new Date().toISOString()}] Đang lấy giá vàng Duy Mong...`);

  let goldMessage = '';

  try {
    const gold = await fetchDuyMongGold();
    goldMessage = formatGoldMessage(gold);
  } catch (error) {
    console.error('Lỗi lấy giá vàng Duy Mong:', error.message);
    goldMessage = '[🥇 Giá vàng Duy Mong 99.99]\n\nKhông lấy được giá vàng lúc này.';
  }

  console.log(`[${new Date().toISOString()}] Đang lấy giá xăng Petrolimex...`);

  let fuelMessage = '';

  try {
    const fuel = await fetchPetrolimexFuel();
    fuelMessage = formatFuelMessage(fuel);
  } catch (error) {
    console.error('Lỗi lấy giá xăng Petrolimex:', error.message);
    fuelMessage = '[⛽ Xăng RON 95-III]\n\nKhông lấy được giá xăng lúc này.';
  }

  const message = `${weatherMessage}\n\n--\n\n${goldMessage}\n\n--\n\n${fuelMessage}`;

  const now = new Date();
  const localTime = now.toLocaleString('vi-VN', { timeZone: config.timezone, hour12: false });
  const fullMessage = `${message}\n\n⏰ ${localTime}`;

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    text: fullMessage
  });

  console.log(`[${new Date().toISOString()}] Đã gửi thông báo đầy đủ thành công.`);
}

// Gửi theo MESSAGE_TYPE từ GitHub Actions
async function sendByMessageType() {
  const messageType = String(config.messageType || 'full').toLowerCase();

  console.log(`[${new Date().toISOString()}] MESSAGE_TYPE = ${messageType}`);

  if (messageType === 'morning') {
    await sendMorningGreeting();
    return;
  }

  if (messageType === 'night') {
    await sendNightGreeting();
    return;
  }

  if (messageType === 'full') {
    await sendDailyInfo();
    return;
  }

  console.warn(`MESSAGE_TYPE không hợp lệ: ${messageType}. Sẽ gửi thông tin đầy đủ mặc định.`);
  await sendDailyInfo();
}

async function main() {
  const isSendNow = process.argv.includes('--send-now');
  const now = new Date();
  const options = { timeZone: config.timezone, hour12: false };
  const localTime = now.toLocaleString('vi-VN', options);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[BOT START TIME] ${now.toISOString()}`);
  console.log(`[LOCAL TIME] ${localTime} (Timezone: ${config.timezone})`);
  console.log(`${'='.repeat(60)}\n`);

  if (!config.botToken || !config.chatId) {
    console.error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Hãy copy .env.example thành .env rồi điền thông tin.');
    process.exit(1);
  }

  // Dùng cho GitHub Actions hoặc test nhanh local:
  // npm run send -- --send-now
  if (isSendNow || config.sendOnStart) {
    console.log(`[SEND NOW MODE] Sending message type: ${config.messageType}`);
    await sendByMessageType();
    return;
  }

  // Phần dưới chỉ dùng khi bạn chạy app liên tục bằng local/VPS/PM2.
  // GitHub Actions không cần node-cron vì GitHub đã tự schedule bằng file .yml.
  if (!cron.validate(config.cronTime)) {
    console.error(`CRON_TIME không hợp lệ: ${config.cronTime}`);
    process.exit(1);
  }

  if (!cron.validate(config.cronGreetingMorning)) {
    console.error(`CRON_GREETING_MORNING không hợp lệ: ${config.cronGreetingMorning}`);
    process.exit(1);
  }

  if (!cron.validate(config.cronGreetingNight)) {
    console.error(`CRON_GREETING_NIGHT không hợp lệ: ${config.cronGreetingNight}`);
    process.exit(1);
  }

  // Lịch gửi thông tin đầy đủ: ví dụ 8:30 sáng và 18:30 tối
  console.log(`[CRON SETUP] Setting up full info schedule: ${config.cronTime} (${config.timezone})`);
  cron.schedule(
    config.cronTime,
    () => {
      const triggerTime = new Date();
      const triggerLocalTime = triggerTime.toLocaleString('vi-VN', { timeZone: config.timezone, hour12: false });
      console.log(`[CRON TRIGGERED] Full info at ${triggerTime.toISOString()} / ${triggerLocalTime}`);
      sendDailyInfo().catch((error) => {
        console.error('Gửi thông báo đầy đủ thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  // Lịch gửi lời chào buổi sáng
  console.log(`[CRON SETUP] Setting up morning greeting schedule: ${config.cronGreetingMorning} (${config.timezone})`);
  cron.schedule(
    config.cronGreetingMorning,
    () => {
      const triggerTime = new Date();
      const triggerLocalTime = triggerTime.toLocaleString('vi-VN', { timeZone: config.timezone, hour12: false });
      console.log(`[CRON TRIGGERED] Morning greeting at ${triggerTime.toISOString()} / ${triggerLocalTime}`);
      sendMorningGreeting().catch((error) => {
        console.error('Gửi lời chào sáng thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  // Lịch gửi lời chào buổi tối
  console.log(`[CRON SETUP] Setting up night greeting schedule: ${config.cronGreetingNight} (${config.timezone})`);
  cron.schedule(
    config.cronGreetingNight,
    () => {
      const triggerTime = new Date();
      const triggerLocalTime = triggerTime.toLocaleString('vi-VN', { timeZone: config.timezone, hour12: false });
      console.log(`[CRON TRIGGERED] Night greeting at ${triggerTime.toISOString()} / ${triggerLocalTime}`);
      sendNightGreeting().catch((error) => {
        console.error('Gửi lời chào tối thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  console.log(`Bot đang chạy. Lịch gửi (${config.timezone}):`);
  console.log(`  📋 Thông tin đầy đủ: ${config.cronTime}`);
  console.log(`  🌅 Chào buổi sáng:  ${config.cronGreetingMorning}`);
  console.log(`  🌙 Chào buổi tối:   ${config.cronGreetingNight}`);
  console.log(`\n[LOG READY] All cron jobs are scheduled. Waiting for triggers...`);
  console.log('Nhấn Ctrl + C để dừng.\n');
}

main().catch((error) => {
  console.error('Lỗi:', error.message);
  process.exit(1);
});