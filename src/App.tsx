import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
  type StampPreset,
} from './lib/stamp';
import { createFavorite, loadFavorites, saveFavorites, type FavoriteStamp } from './lib/storage';
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

const isDateFormat = (value: unknown): value is DateFormat => {
  return DATE_FORMAT_OPTIONS.some((option) => option.value === value);
};

const isStampPreset = (value: unknown): value is StampPreset => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    typeof item.topText === 'string' &&
    typeof item.bottomText === 'string' &&
    typeof item.color === 'string' &&
    isDateFormat(item.dateFormat)
  );
};

const applySavedProfile = (
  current: StampConfig,
  profile: Pick<StampPreset, 'topText' | 'bottomText' | 'color' | 'dateFormat'>,
): StampConfig => ({
  ...current,
  ...getTodayParts(),
  topText: profile.topText,
  bottomText: profile.bottomText,
  color: profile.color,
  dateFormat: profile.dateFormat,
});

function StampPreview({ svgMarkup }: { svgMarkup: string }) {
  return (
    <section className="previewPanel" aria-label="印影プレビュー">
      <div className="previewHalo" />
      <div className="stampSurface" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      <p className="previewHint">背景透過PNGとしてコピー・保存できます</p>
    </section>
  );
}

function App() {
  const [stamp, setStamp] = useState<StampConfig>(createInitialStamp);
  const [presets, setPresets] = useState<StampPreset[]>([]);
  const [favorites, setFavorites] = useState<FavoriteStamp[]>(loadFavorites);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [status, setStatus] = useState('印影を調整してください');
  const [isBusy, setIsBusy] = useState(false);

  const svgMarkup = useMemo(() => createStampSvg(stamp), [stamp]);
  const dateValue = toDateInputValue(stamp);

  useEffect(() => {
    let active = true;

    fetch(`${import.meta.env.BASE_URL}presets.json`, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('プリセットJSONを読み込めませんでした');
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        if (!active) return;
        setPresets(Array.isArray(data) ? data.filter(isStampPreset) : []);
      })
      .catch(() => {
        if (!active) return;
        setStatus('プリセットJSONを読み込めませんでした。手入力は利用できます。');
      });

    return () => {
      active = false;
    };
  }, []);

  const updateStamp = (patch: Partial<StampConfig>) => {
    setStamp((current) => ({ ...current, ...patch }));
  };

  const setToday = () => {
    updateStamp(getTodayParts());
    setStatus('日付を今日に更新しました');
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;

    setStamp((current) => applySavedProfile(current, preset));
    setStatus(`${preset.label} のプリセットを反映しました`);
  };

  const addFavorite = () => {
    const favorite = createFavorite(stamp);
    const nextFavorites = [favorite, ...favorites].slice(0, 30);
    setFavorites(nextFavorites);
    saveFavorites(nextFavorites);
    setStatus(`${favorite.label} をお気に入りに保存しました`);
  };

  const applyFavorite = (favorite: FavoriteStamp) => {
    setSelectedPresetId('');
    setStamp((current) => applySavedProfile(current, favorite));
    setStatus(`${favorite.label} を反映しました。日付は今日に更新済みです`);
  };

  const removeFavorite = (favoriteId: string) => {
    const nextFavorites = favorites.filter((favorite) => favorite.id !== favoriteId);
    setFavorites(nextFavorites);
    saveFavorites(nextFavorites);
    setStatus('お気に入りを削除しました');
  };

  const createPngBlob = async (size: number, dpi?: number) => {
    const exportSvg = createStampSvg(stamp, size);
    return svgToPngBlob(exportSvg, size, dpi);
  };

  const downloadPng = async () => {
    setIsBusy(true);
    try {
      const blob = await createPngBlob(DOWNLOAD_SIZE);
      downloadBlob(blob, createStampFileName(stamp));
      setStatus('PNGをダウンロードしました');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PNGダウンロードに失敗しました');
    } finally {
      setIsBusy(false);
    }
  };

  const copyPng = async () => {
    setIsBusy(true);
    try {
      const blob = await createPngBlob(CLIPBOARD_PIXEL_SIZE, CLIPBOARD_DPI);
      if (!canCopyPngToClipboard()) {
        downloadBlob(blob, createStampFileName(stamp));
        setStatus('このブラウザでは画像コピーに対応していないため、約2.4cmサイズのPNGをダウンロードしました');
        return;
      }

      try {
        await copyPngToClipboard(blob);
        setStatus('約2.4cmサイズの透過PNGをクリップボードへコピーしました');
      } catch {
        downloadBlob(blob, createStampFileName(stamp));
        setStatus('コピーに失敗したため、代替として約2.4cmサイズのPNGをダウンロードしました');
      }
    } catch (error) {
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
        <p className="lead">丸印の中に日付と上下テキストを入れた、背景透過の電子印影をブラウザだけで作成します。</p>
      </header>

      <StampPreview svgMarkup={svgMarkup} />

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

          <button className="ghostButton" type="button" onClick={setToday}>
            今日の日付にする
          </button>
        </div>

        <div className="controlCard">
          <div className="sectionTitle">
            <span>02</span>
            <h2>色とプリセット</h2>
          </div>

          <label className="field">
            <span>プリセット選択</span>
            <select value={selectedPresetId} onChange={(event) => handlePresetChange(event.currentTarget.value)}>
              <option value="">プリセットを選択</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>色プリセット</span>
            <div className="colorPresetGrid">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={stamp.color.toLowerCase() === preset.value.toLowerCase() ? 'colorButton active' : 'colorButton'}
                  style={{ '--stamp-color': preset.value } as CSSProperties}
                  onClick={() => updateStamp({ color: preset.value })}
                >
                  <span />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field colorPickerField">
            <span>自由色選択</span>
            <input type="color" value={stamp.color} onChange={(event) => updateStamp({ color: event.currentTarget.value })} />
          </label>
        </div>

        <div className="controlCard">
          <div className="sectionTitle">
            <span>03</span>
            <h2>お気に入り</h2>
          </div>

          <button className="primaryButton" type="button" onClick={addFavorite}>
            現在の設定をお気に入り登録
          </button>

          <div className="favoriteList" aria-label="お気に入り一覧">
            {favorites.length === 0 ? (
              <p className="emptyText">まだお気に入りはありません。</p>
            ) : (
              favorites.map((favorite) => (
                <article key={favorite.id} className="favoriteItem">
                  <div>
                    <strong>{favorite.label}</strong>
                    <small>{DATE_FORMAT_OPTIONS.find((option) => option.value === favorite.dateFormat)?.label}</small>
                  </div>
                  <div className="favoriteActions">
                    <button type="button" onClick={() => applyFavorite(favorite)}>
                      選択
                    </button>
                    <button type="button" className="dangerButton" onClick={() => removeFavorite(favorite.id)}>
                      削除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="controlCard actionCard">
          <div className="sectionTitle">
            <span>04</span>
            <h2>出力</h2>
          </div>

          <div className="actionButtons">
            <button className="primaryButton" type="button" disabled={isBusy} onClick={copyPng}>
              クリップボードにコピー
            </button>
            <button className="secondaryButton" type="button" disabled={isBusy} onClick={downloadPng}>
              PNGダウンロード
            </button>
          </div>

          <p className="status" role="status">
            {isBusy ? 'PNGを生成中です...' : status}
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
