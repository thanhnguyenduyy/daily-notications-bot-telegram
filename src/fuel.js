import * as cheerio from 'cheerio';

const PETROLIMEX_URL = 'https://webgia.com/gia-xang-dau/petrolimex/';
const TARGET_FUEL_NAME = 'Xăng RON 95-III';

function cleanText(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function findUpdateTime(text = '') {
  const match = text.match(/Cập nhật lúc\s+(\d{2}:\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4})/i);
  return match ? match[1] : '';
}

function normalizePrice(text = '') {
  const match = cleanText(text).match(/[\d.,]+/);
  return match ? match[0] : '';
}

export async function fetchPetrolimexFuel() {
  const response = await fetch(PETROLIMEX_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 HueWeatherTelegramBot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Không lấy được giá xăng Petrolimex. HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const pageText = cleanText($('body').text());

  const updatedAt = findUpdateTime(pageText);
  const items = [];

  $('tr').each((_, row) => {
    const cells = $(row)
      .find('td, th')
      .map((_, cell) => cleanText($(cell).text()))
      .get()
      .filter(Boolean);

    if (cells.length < 3) return;

    const name = cells[0];
    const region1Price = normalizePrice(cells[1]);
    const region2Price = normalizePrice(cells[2]);

    const isRon95 =
      name.toLowerCase().includes('ron 95-iii') &&
      region1Price &&
      region2Price;

    if (!isRon95) return;

    items.push({
      name: TARGET_FUEL_NAME,
      region1Price,
      region2Price
    });
  });

  // Fallback nếu WebGia render text không đúng dạng table
  if (!items.length) {
    const escapedName = TARGET_FUEL_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedName}\\s*([\\d.]+)\\s*([\\d.]+)`, 'i');
    const match = pageText.match(regex);

    if (match) {
      items.push({
        name: TARGET_FUEL_NAME,
        region1Price: match[1],
        region2Price: match[2]
      });
    }
  }

  if (!items.length) {
    throw new Error('Không tìm thấy giá Xăng RON 95-III trên trang.');
  }

  return {
    source: 'Petrolimex / WebGia',
    updatedAt,
    unit: 'đ/lít',
    items
  };
}

function formatFuelDate(dateStr) {
  if (!dateStr) return 'không rõ thời gian';
  const match = dateStr.match(/(\d{2}):(\d{2})(?::\d{2})?\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, hour, minute, day, month, year] = match;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
  return dateStr;
}

export function formatFuelMessage(fuel) {
  const ron95 = fuel.items[0];

  if (!ron95) {
    return '⛽ [Xăng RON 95-III]\n\nKhông tìm thấy giá Xăng RON 95-III.';
  }

  const formattedTime = formatFuelDate(fuel.updatedAt);

  return [
    `[⛽ Xăng RON 95-III] - ${formattedTime}`,
    '📍 TP. Huế – Vùng 2',
    `Giá: ${ron95.region2Price} ${fuel.unit}`
  ].join('\n');
}