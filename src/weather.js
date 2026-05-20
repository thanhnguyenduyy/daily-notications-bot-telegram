const WEATHER_CODE_TEXT = {
  0: 'Trời quang',
  1: 'Ít mây',
  2: 'Mây rải rác',
  3: 'Nhiều mây',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày',
  56: 'Mưa phùn lạnh nhẹ',
  57: 'Mưa phùn lạnh dày',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  66: 'Mưa lạnh nhẹ',
  67: 'Mưa lạnh to',
  71: 'Tuyết nhẹ',
  73: 'Tuyết vừa',
  75: 'Tuyết dày',
  77: 'Hạt tuyết',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào mạnh',
  85: 'Mưa tuyết nhẹ',
  86: 'Mưa tuyết mạnh',
  95: 'Dông',
  96: 'Dông kèm mưa đá nhẹ',
  99: 'Dông kèm mưa đá mạnh'
};

function weatherCodeToText(code) {
  return WEATHER_CODE_TEXT[code] || `Mã thời tiết ${code}`;
}

function round(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(digits).replace(/\.0$/, '');
}

function getWeatherAdvice(weather) {
  const rainChance = Number(weather.precipitationProbabilityMax || 0);
  const rainSum = Number(weather.precipitationSum || 0);
  const tempMax = Number(weather.tempMax || 0);
  const windSpeed = Number(weather.windSpeed || 0);
  const weatherText = String(weather.currentText || '').toLowerCase();

  if (
    weatherText.includes('dông') ||
    weatherText.includes('mưa to') ||
    weatherText.includes('mưa rào mạnh')
  ) {
    return 'Nên hạn chế ra ngoài, nếu đi nhớ mang áo mưa.';
  }

  if (rainChance >= 70 || rainSum >= 5) {
    return 'Nên mang áo mưa/ô khi ra ngoài.';
  }

  if (rainChance >= 40 || rainSum > 0) {
    return 'Có thể mưa, nên chuẩn bị áo mưa mỏng.';
  }

  if (tempMax >= 35) {
    return 'Trời nóng, nên uống đủ nước và hạn chế ra nắng lâu.';
  }

  if (tempMax >= 32) {
    return 'Trời hơi nóng, nên mang nước nếu đi lâu ngoài trời.';
  }

  if (windSpeed >= 30) {
    return 'Gió mạnh, chạy xe chú ý an toàn.';
  }

  return 'Thời tiết khá ổn, ra ngoài bình thường.';
}

export async function fetchHueWeather({ latitude, longitude, timezone }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'sunrise',
      'sunset'
    ].join(','),
    forecast_days: '1'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo lỗi ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};

  return {
    currentTime: current.time,
    currentTemp: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    rain: current.rain,
    windSpeed: current.wind_speed_10m,
    currentCode: current.weather_code,
    currentText: weatherCodeToText(current.weather_code),
    todayCode: daily.weather_code?.[0],
    todayText: weatherCodeToText(daily.weather_code?.[0]),
    tempMax: daily.temperature_2m_max?.[0],
    tempMin: daily.temperature_2m_min?.[0],
    precipitationProbabilityMax: daily.precipitation_probability_max?.[0],
    precipitationSum: daily.precipitation_sum?.[0],
    sunrise: daily.sunrise?.[0],
    sunset: daily.sunset?.[0],
    raw: data
  };
}

export function formatWeatherMessage(weather, locationName = 'Huế') {
  const advice = getWeatherAdvice(weather);
  const formattedLocation = locationName.startsWith('TP.') ? locationName : `TP. ${locationName}`;

  const lines = [
    `[🌤️ Thời tiết ${formattedLocation}] - Hiện tại`,
    `🌡️ ${round(weather.currentTemp)}°C${weather.feelsLike ? ` – ${round(weather.feelsLike)}°C` : ''} | 🌧️ Mưa ${round(weather.precipitationProbabilityMax, 0)}%`,
    `💧 Ẩm ${round(weather.humidity, 0)}% | 🌬️ Gió ${round(weather.windSpeed)} km/h`,
    `⚠️ ${advice}`
  ];

  return lines.join('\n');
}