# DailyStampMaker

日付入り名前印の電子印影を作成できる、GitHub Pages向けの静的Webアプリです。ブラウザ上で印影を生成し、背景透過PNGとしてクリップボードコピーまたはダウンロードできます。

## 主な機能

- 円形の印影プレビュー
- 上段テキスト、中央日付、下段テキストの編集
- 日付変更と日付フォーマット選択
- 赤、黒、自由選択による印影色の指定
- 背景透過PNGのダウンロード
- Clipboard API対応ブラウザでのPNGコピー
- Clipboard API非対応時やコピー失敗時のPNGダウンロード代替
- コピーまたはダウンロード成功時の履歴保存
- 履歴の選択、削除、星付き保存
- GitHub ActionsによるGitHub Pagesデプロイ

## ローカル起動

Dockerで起動する場合は次のコマンドを実行します。

```bash
docker compose up --build
```

Node.js/npmを利用する場合は、依存関係をインストールしてViteを起動します。

```bash
npm install
npm run dev -- --host 127.0.0.1
```

起動後、次のURLへアクセスしてください。

```text
http://localhost:5173/DailyStampMaker/
```

Viteの `base` を `/DailyStampMaker/` に設定しているため、ローカルでもGitHub Pagesと同じパス配下で表示されます。

## ビルド

Dockerで静的ビルドを実行する場合:

```bash
docker compose run --rm app npm run build
```

Node.js/npmで静的ビルドを実行する場合:

```bash
npm run build
```

ビルド成果物は `dist/` に出力されます。`dist/` はGit管理対象外です。

## プレビュー

Dockerでプレビューする場合:

```bash
docker compose run --rm --service-ports app npm run preview -- --host 0.0.0.0
```

Node.js/npmでプレビューする場合:

```bash
npm run preview -- --host 127.0.0.1
```

プレビュー起動後、表示されたURLの `/DailyStampMaker/` 配下へアクセスしてください。

## 入力仕様

上段テキスト、下段テキスト、日付、日付フォーマット、印影色を入力すると、印影プレビューへ即時反映されます。

日付フォーマットは次の値から選択できます。

- `YYYY/MM/DD`
- `YYYY.MM.DD`
- `YYYY-MM-DD`
- `YYYY年M月D日`
- `2026.5.8` のようなゼロ埋めなし形式

印影色は赤、黒、自由選択の3種類です。自由選択ではブラウザ標準のカラーピッカーを使います。

## 履歴仕様

履歴はブラウザの `localStorage` に保存されます。保存されるのは、クリップボードコピーまたはPNGダウンロードが成功したタイミングだけです。入力を変更しただけでは保存されません。

保存対象は次の項目です。

- 上段テキスト
- 下段テキスト
- 色
- 星付き状態

日付、日付フォーマット、作成日時は保存しません。履歴を選択すると、上段テキスト、下段テキスト、色だけが反映されます。

履歴は最大10件です。通常の履歴と星付き履歴の合計で10件まで保存します。同じ上段テキスト、下段テキスト、色の履歴は重複せず、最新の履歴として扱います。ページ読み込み時は星付き履歴が上に表示されます。

保存キーは次の値です。

```text
daily-stamp-maker:history:v1
```

旧バージョンの `daily-stamp-maker:favorites:v1` が存在する場合は、初回読み込み時に星付き履歴として移行します。

ブラウザの開発者ツールから確認できます。

1. アプリを開きます。
2. ブラウザの開発者ツールを開きます。
3. `Application` タブを開きます。
4. `Local Storage` から対象のoriginを選択します。
5. `daily-stamp-maker:history:v1` の値を確認します。

Consoleから確認する場合は次のコードを実行します。

```js
localStorage.getItem('daily-stamp-maker:history:v1')
```

`localStorage` はorigin単位で分離されます。GitHub Pages上の本番URLと、ローカル開発用の `http://localhost:5173` や `http://127.0.0.1:5173` は別の保存領域になります。

## PNGコピーとダウンロード

印影はSVGで描画し、出力時にCanvasへ変換して透過PNGを生成します。

「クリップボードにコピー」では、Clipboard APIでPNGコピーできるブラウザなら約2.4cmサイズ相当のPNGをコピーします。対応していないブラウザ、またはコピーに失敗した場合は、代替としてPNGをダウンロードします。

「PNGダウンロード」では、背景透過PNGをファイルとして保存します。

## GitHub Pagesデプロイ

`.github/workflows/deploy.yml` にGitHub Actionsワークフローを用意しています。GitHub Actions上ではCI環境内で依存関係をインストールしてビルドします。

1. GitHubのリポジトリ設定で Pages の Source を `GitHub Actions` に設定します。
2. `main` ブランチへpushします。
3. `Deploy to GitHub Pages` ワークフローが実行されます。
4. デプロイ完了後、GitHub PagesのURLへアクセスします。

Viteの `base` は `/DailyStampMaker/` に設定済みです。
