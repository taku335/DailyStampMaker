import { useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  COLOR_PRESETS,
  DATE_FORMAT_OPTIONS,
  canCopyPngToClipboard,
  copyPngToClipboard,
  createStampFileName,
  createStampSvg,
  downloadBlob,
  getTodayParts,
  parseDateInputValue,
  svgToPngBlob,
  toDateInputValue,
  type DateFormat,
  type StampConfig,
} from './lib/stamp';
import {
  getHistoryLabel,
  loadHistory,
  recordHistory,
  removeHistoryEntry,
  saveHistory,
  toggleHistoryPin,
  type StampHistoryEntry,
} from './lib/storage';
import './styles.css';

const DOWNLOAD_SIZE = 1024;
const CLIPBOARD_PIXEL_SIZE = 284;
const CLIPBOARD_DPI = 300;

const createInitialStamp = (): StampConfig => ({
  topText: '伊',
  bottomText: '藤',
  color: '#EF454A',
  dateFormat: 'shortDot',
  ...getTodayParts(),
});

const applyHistoryEntry = (current: StampConfig, entry: StampHistoryEntry): StampConfig => ({
  ...current,
  topText: entry.topText,
  bottomText: entry.bottomText,
  color: entry.color,
});

function StampPreview({
  svgMarkup,
  isBusy,
  status,
  tooltipText,
  onCopy,
  onDownload,
}: {
  svgMarkup: string;
  isBusy: boolean;
  status: string;
  tooltipText: string;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section className="previewPanel" aria-label="印影プレビュー">
      <div className="previewHalo" />
      <div className="stampSurface" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      <div className="actionButtons previewActions">
        <button className="primaryButton" type="button" disabled={isBusy} onClick={onCopy}>
          クリップボードにコピー
        </button>
        <button className="secondaryButton" type="button" disabled={isBusy} onClick={onDownload}>
          PNGダウンロード
        </button>
        {tooltipText && <span className="actionTooltip">{tooltipText}</span>}
      </div>
      {status && (
        <p className="status previewStatus" role="status">
          {status}
        </p>
      )}
    </section>
  );
}

function App() {
  const [stamp, setStamp] = useState<StampConfig>(createInitialStamp);
  const [history, setHistory] = useState<StampHistoryEntry[]>(loadHistory);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const tooltipTimerRef = useRef<number | null>(null);

  const svgMarkup = useMemo(() => createStampSvg(stamp), [stamp]);
  const dateValue = toDateInputValue(stamp);
  const normalizedColor = stamp.color.toLowerCase();
  const isCustomColorActive = !COLOR_PRESETS.some((preset) => preset.value.toLowerCase() === normalizedColor);

  const updateStamp = (patch: Partial<StampConfig>) => {
    setStamp((current) => ({ ...current, ...patch }));
  };

  const recordCurrentHistory = () => {
    setHistory((current) => {
      const nextHistory = recordHistory(current, stamp);
      saveHistory(nextHistory);
      return nextHistory;
    });
  };

  const clearTooltip = () => {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltipText('');
  };

  const showTooltip = (text: string, duration = 1400) => {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    setTooltipText(text);
    if (duration > 0) {
      tooltipTimerRef.current = window.setTimeout(() => {
        setTooltipText('');
        tooltipTimerRef.current = null;
      }, duration);
    }
  };

  const applyHistory = (entry: StampHistoryEntry) => {
    setStamp((current) => applyHistoryEntry(current, entry));
    setStatus(`${getHistoryLabel(entry)} を履歴から反映しました`);
  };

  const togglePinned = (historyId: string) => {
    setHistory((current) => {
      const nextHistory = toggleHistoryPin(current, historyId);
      saveHistory(nextHistory);
      return nextHistory;
    });
  };

  const removeHistory = (historyId: string) => {
    setHistory((current) => {
      const nextHistory = removeHistoryEntry(current, historyId);
      saveHistory(nextHistory);
      return nextHistory;
    });
    setStatus('履歴を削除しました');
  };

  const createPngBlob = async (size: number, dpi?: number) => {
    const exportSvg = createStampSvg(stamp, size);
    return svgToPngBlob(exportSvg, size, dpi);
  };

  const downloadPng = async () => {
    setIsBusy(true);
    setStatus('');
    showTooltip('generating', 0);
    try {
      const blob = await createPngBlob(DOWNLOAD_SIZE);
      downloadBlob(blob, createStampFileName(stamp));
      recordCurrentHistory();
      showTooltip('downloaded');
    } catch (error) {
      clearTooltip();
      setStatus(error instanceof Error ? error.message : 'PNGダウンロードに失敗しました');
    } finally {
      setIsBusy(false);
    }
  };

  const copyPng = async () => {
    setIsBusy(true);
    setStatus('');
    showTooltip('generating', 0);
    try {
      const blob = await createPngBlob(CLIPBOARD_PIXEL_SIZE, CLIPBOARD_DPI);
      if (!canCopyPngToClipboard()) {
        downloadBlob(blob, createStampFileName(stamp));
        recordCurrentHistory();
        clearTooltip();
        setStatus('このブラウザでは画像コピーに対応していないため、約2.4cmサイズのPNGをダウンロードしました');
        return;
      }

      try {
        await copyPngToClipboard(blob);
        recordCurrentHistory();
        setStatus('');
        showTooltip('copied');
      } catch {
        downloadBlob(blob, createStampFileName(stamp));
        recordCurrentHistory();
        clearTooltip();
        setStatus('コピーに失敗したため、代替として約2.4cmサイズのPNGをダウンロードしました');
      }
    } catch (error) {
      clearTooltip();
      setStatus(error instanceof Error ? error.message : 'PNGコピーに失敗しました');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="appShell">
      <header className="appHeader">
        <p className="eyebrow">Daily Stamp Maker</p>
        <h1>日付入り名前印ジェネレーター</h1>
      </header>

      <StampPreview
        svgMarkup={svgMarkup}
        isBusy={isBusy}
        status={status}
        tooltipText={tooltipText}
        onCopy={copyPng}
        onDownload={downloadPng}
      />

      <section className="workspace" aria-label="印影設定">
        <div className="controlCard mainControls">
          <div className="sectionTitle">
            <span>01</span>
            <h2>入力</h2>
          </div>

          <div className="formGrid">
            <label className="field">
              <span>上段テキスト</span>
              <input
                value={stamp.topText}
                maxLength={12}
                onChange={(event) => updateStamp({ topText: event.currentTarget.value })}
                placeholder="部署名・略称"
              />
            </label>

            <label className="field">
              <span>下段テキスト</span>
              <input
                value={stamp.bottomText}
                maxLength={12}
                onChange={(event) => updateStamp({ bottomText: event.currentTarget.value })}
                placeholder="名前"
              />
            </label>

            <div className="dateControls">
              <label className="field">
                <span>日付</span>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(event) => {
                    const nextDate = parseDateInputValue(event.currentTarget.value);
                    if (nextDate) updateStamp(nextDate);
                  }}
                />
              </label>

              <label className="field">
                <span>日付フォーマット</span>
                <select
                  value={stamp.dateFormat}
                  onChange={(event) => updateStamp({ dateFormat: event.currentTarget.value as DateFormat })}
                >
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field colorField">
              <span>印影色</span>
              <div className="colorPresetGrid">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={normalizedColor === preset.value.toLowerCase() ? 'colorButton active' : 'colorButton'}
                    style={{ '--stamp-color': preset.value } as CSSProperties}
                    aria-label={preset.label}
                    onClick={() => updateStamp({ color: preset.value })}
                  >
                    <span />
                  </button>
                ))}
                <input
                  className={isCustomColorActive ? 'customColorInput active' : 'customColorInput'}
                  type="color"
                  value={stamp.color}
                  aria-label="自由色"
                  onChange={(event) => updateStamp({ color: event.currentTarget.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="controlCard historyCard">
          <div className="sectionTitle">
            <span>02</span>
            <h2>履歴</h2>
          </div>

          <div className="historyList" aria-label="履歴一覧">
            {history.length === 0 ? (
              <p className="emptyText">履歴はまだありません。</p>
            ) : (
              history.map((entry) => (
                <article key={entry.id} className={entry.pinned ? 'historyItem pinned' : 'historyItem'}>
                  <button
                    className="historySummaryButton"
                    type="button"
                    aria-label={`${getHistoryLabel(entry)} を選択`}
                    onClick={() => applyHistory(entry)}
                  >
                    <span className="historyColor" style={{ '--stamp-color': entry.color } as CSSProperties} />
                    <strong>{getHistoryLabel(entry)}</strong>
                  </button>
                  <div className="historyActions">
                    <button
                      type="button"
                      className={entry.pinned ? 'iconButton starButton active' : 'iconButton starButton'}
                      aria-label={entry.pinned ? '星を外す' : '星を付ける'}
                      onClick={() => togglePinned(entry.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5 6.8 19.2l1-5.8-4.2-4.1 5.8-.8L12 3.2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="iconButton trashButton"
                      aria-label="履歴を削除"
                      onClick={() => removeHistory(entry.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6.5 6l1 14h9l1-14" />
                        <path d="M10 10v6" />
                        <path d="M14 10v6" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

      </section>
    </main>
  );
}

export default App;
