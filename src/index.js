import 'dotenv/config';
import cron from 'node-cron';
import { fetchHueWeather, formatWeatherMessage } from './weather.js';
import { sendTelegramMessage } from './telegram.js';
import { fetchDuyMongGold, formatGoldMessage } from './gold.js';
import { fetchPetrolimexFuel, formatFuelMessage } from './fuel.js';

const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID,
  cronTime: process.env.CRON_TIME || '30 8,18 * * *',
  cronGreetingMorning: process.env.CRON_GREETING_MORNING || '0 6 * * *',
  cronGreetingNight: process.env.CRON_GREETING_NIGHT || '30 22 * * *',
  timezone: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
  latitude: Number(process.env.LATITUDE || 16.4637),
  longitude: Number(process.env.LONGITUDE || 107.5909),
  locationName: process.env.LOCATION_NAME || 'Huế',
  sendOnStart: String(process.env.SEND_ON_START || 'false').toLowerCase() === 'true',
  accuWeatherApiKey: process.env.ACCUWEATHER_API_KEY,
  accuWeatherLocationKey: process.env.ACCUWEATHER_LOCATION_KEY || '356204'
};

// Gửi lời chào (chỉ 1 dòng chào, không kèm thông tin)
async function sendGreeting(message) {
  console.log(`[${new Date().toISOString()}] Đang gửi lời chào...`);

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    text: message
  });

  console.log(`[${new Date().toISOString()}] Đã gửi lời chào thành công.`);
}

// Gửi thông tin đầy đủ (Thời tiết + Vàng + Xăng), không kèm lời chào
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
    const formattedLocation = config.locationName.startsWith('TP.') ? config.locationName : `TP. ${config.locationName}`;
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

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    text: message
  });

  console.log(`[${new Date().toISOString()}] Đã gửi thông báo đầy đủ thành công.`);
}

async function main() {
  const isSendNow = process.argv.includes('--send-now');

  if (!config.botToken || !config.chatId) {
    console.error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Hãy copy .env.example thành .env rồi điền thông tin.');
    process.exit(1);
  }

  if (!cron.validate(config.cronTime)) {
    console.error(`CRON_TIME không hợp lệ: ${config.cronTime}`);
    process.exit(1);
  }

  if (isSendNow) {
    await sendDailyInfo();
    return;
  }

  if (config.sendOnStart) {
    await sendDailyInfo().catch((error) => {
      console.error('Gửi khi khởi động thất bại:', error.message);
    });
  }

  // Lịch gửi thông tin đầy đủ: 8:30 sáng và 18:30 tối
  cron.schedule(
    config.cronTime,
    () => {
      sendDailyInfo().catch((error) => {
        console.error('Gửi thông báo thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  // Lịch gửi lời chào buổi sáng: 6:00 sáng
  cron.schedule(
    config.cronGreetingMorning,
    () => {
      sendGreeting('🌅 Chào buổi sáng! Chúc bạn một ngày mới tràn đầy năng lượng.').catch((error) => {
        console.error('Gửi lời chào sáng thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  // Lịch gửi lời chào buổi tối: 22:30 tối
  cron.schedule(
    config.cronGreetingNight,
    () => {
      sendGreeting('🌙 Chúc bạn buổi tối vui vẻ và ngủ ngon.').catch((error) => {
        console.error('Gửi lời chào tối thất bại:', error.message);
      });
    },
    { timezone: config.timezone }
  );

  console.log(`Bot đang chạy. Lịch gửi (${config.timezone}):`);
  console.log(`  📋 Thông tin đầy đủ: ${config.cronTime}`);
  console.log(`  🌅 Chào buổi sáng:  ${config.cronGreetingMorning}`);
  console.log(`  🌙 Chào buổi tối:   ${config.cronGreetingNight}`);
  console.log('Nhấn Ctrl + C để dừng.');
}

main().catch((error) => {
  console.error('Lỗi:', error.message);
  process.exit(1);
});