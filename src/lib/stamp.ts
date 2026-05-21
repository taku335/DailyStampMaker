export type DateFormat = 'slash' | 'dot' | 'dash' | 'jp' | 'shortDot';

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type StampConfig = DateParts & {
  topText: string;
  bottomText: string;
  color: string;
  dateFormat: DateFormat;
};

export type StampPreset = {
  id: string;
  label: string;
  topText: string;
  bottomText: string;
  color: string;
  dateFormat: DateFormat;
};

export const DATE_FORMAT_OPTIONS: Array<{ value: DateFormat; label: string }> = [
  { value: 'slash', label: 'YYYY/MM/DD' },
  { value: 'dot', label: 'YYYY.MM.DD' },
  { value: 'dash', label: 'YYYY-MM-DD' },
  { value: 'jp', label: 'YYYY年M月D日' },
  { value: 'shortDot', label: '2026.5.8' },
];

export const COLOR_PRESETS = [
  { label: '赤', value: '#EF454A' },
  { label: '黒', value: '#202020' },
];

const DEFAULT_COLOR = '#EF454A';
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_DENSITY_UNIT_METER = 1;
const INCHES_PER_METER = 39.37007874015748;
const textEncoder = new TextEncoder();

const pad2 = (value: number) => String(value).padStart(2, '0');
const countChars = (value: string) => Array.from(value.trim()).length;

export const getTodayParts = (): DateParts => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

export const formatDate = (date: DateParts, format: DateFormat): string => {
  switch (format) {
    case 'slash':
      return `${date.year}/${pad2(date.month)}/${pad2(date.day)}`;
    case 'dot':
      return `${date.year}.${pad2(date.month)}.${pad2(date.day)}`;
    case 'dash':
      return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
    case 'jp':
      return `${date.year}年${date.month}月${date.day}日`;
    case 'shortDot':
      return `${date.year}.${date.month}.${date.day}`;
  }
};

export const toDateInputValue = (date: DateParts): string => {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
};

export const parseDateInputValue = (value: string): DateParts | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const escapeXml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const normalizeColor = (value: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_COLOR;
};

const fitFont = (text: string, baseSize: number, maxWidth: number, minimumSize: number) => {
  const length = Math.max(countChars(text), 1);
  const estimatedWidth = length * baseSize * 0.92;
  if (estimatedWidth <= maxWidth) return baseSize;
  return Math.max(minimumSize, Math.floor(maxWidth / (length * 0.92)));
};

export const createStampSvg = (config: StampConfig, size = 512): string => {
  const color = normalizeColor(config.color);
  const topText = config.topText.trim() || '上段';
  const bottomText = config.bottomText.trim() || '名前';
  const dateText = formatDate(config, config.dateFormat);
  const topFontSize = fitFont(topText, 88, 360, 40);
  const bottomFontSize = fitFont(bottomText, 92, 370, 42);
  const dateFontSize = fitFont(dateText, 78, 420, 44);
  const topLetterSpacing = countChars(topText) > 5 ? 1 : 4;
  const bottomLetterSpacing = countChars(bottomText) > 5 ? 1 : 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="日付入り名前印">
  <defs>
    <filter id="stamp-rough" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="2" seed="8" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" />
    </filter>
    <style>
      .stampText { font-family: "Yuji Syuku", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif; text-anchor: middle; dominant-baseline: middle; font-weight: 700; }
    </style>
  </defs>
  <g filter="url(#stamp-rough)" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="256" cy="256" r="221" stroke-width="17" opacity="0.96" />
    <circle cx="256" cy="256" r="195" stroke-width="4" opacity="0.82" />
    <line x1="120" y1="211" x2="392" y2="211" stroke-width="8" />
    <line x1="120" y1="302" x2="392" y2="302" stroke-width="8" />
    <path d="M 83 256 C 83 161, 161 83, 256 83" stroke-width="2" opacity="0.28" />
    <path d="M 429 256 C 429 351, 351 429, 256 429" stroke-width="2" opacity="0.28" />
  </g>
  <g filter="url(#stamp-rough)" fill="${color}">
    <text class="stampText" x="256" y="143" font-size="${topFontSize}" letter-spacing="${topLetterSpacing}">${escapeXml(topText)}</text>
    <text class="stampText" x="256" y="259" font-size="${dateFontSize}" letter-spacing="1">${escapeXml(dateText)}</text>
    <text class="stampText" x="256" y="384" font-size="${bottomFontSize}" letter-spacing="${bottomLetterSpacing}">${escapeXml(bottomText)}</text>
  </g>
</svg>`;
};

const createCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
};

const crc32Table = createCrc32Table();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createPngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = textEncoder.encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  const crcInput = new Uint8Array(typeBytes.length + data.length);

  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);

  crcInput.set(typeBytes);
  crcInput.set(data, typeBytes.length);
  view.setUint32(8 + data.length, crc32(crcInput));

  return chunk;
};

const createPngDensityChunk = (dpi: number): Uint8Array => {
  const pixelsPerMeter = Math.round(dpi * INCHES_PER_METER);
  const data = new Uint8Array(9);
  const view = new DataView(data.buffer);

  view.setUint32(0, pixelsPerMeter);
  view.setUint32(4, pixelsPerMeter);
  view.setUint8(8, PNG_DENSITY_UNIT_METER);

  return createPngChunk('pHYs', data);
};

const hasPngSignature = (bytes: Uint8Array): boolean => {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
};

const withPngDensity = async (blob: Blob, dpi?: number): Promise<Blob> => {
  if (!dpi || dpi <= 0) return blob;

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < PNG_SIGNATURE.length || !hasPngSignature(bytes)) return blob;

  const densityChunk = createPngDensityChunk(dpi);
  const chunks: Uint8Array[] = [bytes.slice(0, PNG_SIGNATURE.length)];
  let offset = PNG_SIGNATURE.length;
  let inserted = false;

  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, bytes.byteLength - offset);
    const dataLength = view.getUint32(0);
    const chunkLength = 12 + dataLength;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

    if (offset + chunkLength > bytes.length) return blob;

    if (type !== 'pHYs') {
      chunks.push(bytes.slice(offset, offset + chunkLength));
    }

    offset += chunkLength;

    if (type === 'IHDR' && !inserted) {
      chunks.push(densityChunk);
      inserted = true;
    }
  }

  if (!inserted) return blob;

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let outputOffset = 0;

  for (const chunk of chunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.length;
  }

  return new Blob([output.buffer], { type: 'image/png' });
};

export const svgToPngBlob = async (svgMarkup: string, size = 1024, dpi?: number): Promise<Blob> => {
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('SVG画像の読み込みに失敗しました'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvasを初期化できませんでした');

    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG生成に失敗しました'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });

    return withPngDensity(pngBlob, dpi);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const canCopyPngToClipboard = (): boolean => {
  return typeof navigator !== 'undefined' && Boolean(navigator.clipboard) && typeof ClipboardItem !== 'undefined';
};

export const copyPngToClipboard = async (blob: Blob): Promise<void> => {
  if (!canCopyPngToClipboard()) {
    throw new Error('このブラウザではPNGのクリップボードコピーに対応していません');
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilePart = (value: string): string => {
  return (value.trim() || 'blank')
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 32);
};

export const createStampFileName = (config: StampConfig): string => {
  return `stamp_${sanitizeFilePart(config.topText)}_${sanitizeFilePart(config.bottomText)}_${sanitizeFilePart(
    formatDate(config, config.dateFormat),
  )}.png`;
};
