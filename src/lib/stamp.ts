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
  { label: '青', value: '#2563EB' },
  { label: '緑', value: '#12805C' },
  { label: '黒', value: '#202020' },
  { label: '紫', value: '#7C3AED' },
];

const DEFAULT_COLOR = '#EF454A';

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
  const topFontSize = fitFont(topText, 58, 292, 27);
  const bottomFontSize = fitFont(bottomText, 62, 308, 28);
  const dateFontSize = fitFont(dateText, 50, 310, 29);
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

export const svgToPngBlob = async (svgMarkup: string, size = 1024): Promise<Blob> => {
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

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG生成に失敗しました'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
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
