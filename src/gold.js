import * as cheerio from 'cheerio';

const DUY_MONG_URL = 'https://giavangduymong.com/';

function cleanText(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function normalizePrice(text = '') {
  const cleaned = cleanText(text);

  const match = cleaned.match(/[\d.,]+/);
  if (!match) return '';

  return match[0];
}

function findUpdateTime(text) {
  const match = text.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
  return match ? match[0] : '';
}

export async function fetchDuyMongGold() {
  const response = await fetch(DUY_MONG_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 HueWeatherTelegramBot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Không lấy được giá vàng Duy Mong. HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const pageText = cleanText($('body').text());

  const updatedAt = findUpdateTime(pageText);

  let goldName = '';
  let buyPrice = '';
  let sellPrice = '';

  $('tr').each((_, row) => {
    const cells = $(row)
      .find('td, th')
      .map((_, cell) => cleanText($(cell).text()))
      .get()
      .filter(Boolean);

    const rowText = cells.join(' ');

    if (
      !goldName &&
      rowText.toLowerCase().includes('rồng vàng') &&
      rowText.includes('99.99')
    ) {
      goldName = cells[0] || 'Vàng Rồng Vàng Duy Mong 99.99';

      const priceCells = cells
        .slice(1)
        .map(normalizePrice)
        .filter(Boolean);

      buyPrice = priceCells[0] || '';
      sellPrice = priceCells[1] || '';
    }
  });

  if (!goldName || !buyPrice || !sellPrice) {
    const regex = /(Vàng\s+Rồng\s+Vàng\s+Duy\s+Mong\s+99\.99).*?([\d.]{5,}).*?([\d.]{5,})/i;
    const match = pageText.match(regex);

    if (match) {
      goldName = cleanText(match[1]);
      buyPrice = normalizePrice(match[2]);
      sellPrice = normalizePrice(match[3]);
    }
  }

  if (!goldName || !buyPrice || !sellPrice) {
    throw new Error('Không tìm thấy dòng Vàng Rồng Vàng Duy Mong 99.99 trên trang.');
  }

  return {
    source: 'Duy Mong Huế',
    updatedAt,
    name: goldName,
    buyPrice,
    sellPrice,
    unit: 'đ/chỉ'
  };
}

function formatGoldDate(dateStr) {
  if (!dateStr) return 'không rõ thời gian';
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
  return dateStr;
}

export function formatGoldMessage(gold) {
  const formattedTime = formatGoldDate(gold.updatedAt);
  return [
    `[🥇 Giá vàng Duy Mong 99.99] - ${formattedTime}`,
    `Bán ra: ${gold.sellPrice} ${gold.unit}`,
    `Mua vào: ${gold.buyPrice} ${gold.unit}`
  ].join('\n');
}