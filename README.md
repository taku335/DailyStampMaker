# DailyStampMaker

日付入り名前印の電子印影を作成できる、GitHub Pages向けの静的Webアプリです。ブラウザ上で印影を生成し、背景透過PNGとしてクリップボードコピーまたはダウンロードできます。

## 主な機能

- 円形の印影プレビュー
- 上段テキスト、中央日付、下段テキストの編集
- 日付変更と「今日の日付にする」操作
- 日付フォーマット選択
- 色プリセットと自由色選択
- 背景透過PNGのダウンロード
- Clipboard API対応ブラウザでのPNGコピー
- Clipboard API非対応時のPNGダウンロード代替
- localStorageによるお気に入り登録
- JSONファイルによる部署メンバー用プリセット管理
- GitHub ActionsによるGitHub Pagesデプロイ

## ローカル起動

ローカルマシンにNode.js/npm依存をインストールせず、Dockerで起動します。

```bash
docker compose up --build
```

起動後、次のURLへアクセスしてください。

```text
http://localhost:5173/DailyStampMaker/
```

Viteの `base` を `/DailyStampMaker/` に設定しているため、ローカルでもGitHub Pagesと同じパス配下で表示されます。

## Dockerでのビルド

ローカルに依存を入れず、コンテナ内で静的ビルドを実行します。

```bash
docker compose run --rm app npm run build
```

ビルド成果物は `dist/` に出力されます。`dist/` はGit管理対象外です。

## Dockerでのプレビュー

```bash
docker compose run --rm --service-ports app npm run preview -- --host 0.0.0.0
```

プレビュー起動後、表示されたURLの `/DailyStampMaker/` 配下へアクセスしてください。

## プリセットの追加・変更

部署メンバーの印影プリセットは `public/presets.json` で管理します。

```json
{
  "id": "dept-soumu-yamada",
  "label": "総務 / 山田",
  "topText": "総務",
  "bottomText": "山田",
  "color": "#EF454A",
  "dateFormat": "slash"
}
```

`dateFormat` は次の値を指定できます。

- `slash`: `YYYY/MM/DD`
- `dot`: `YYYY.MM.DD`
- `dash`: `YYYY-MM-DD`
- `jp`: `YYYY年M月D日`
- `shortDot`: `2026.5.8` のようなゼロ埋めなし形式

プリセットを選択すると、上段テキスト、下段テキスト、色、日付フォーマットが反映されます。日付そのものは保存せず、選択時点の当日の日付になります。

## お気に入り仕様

お気に入りはブラウザの `localStorage` に保存されます。保存対象は次の項目です。

- 上段テキスト
- 下段テキスト
- 色
- 日付フォーマット

日付は保存しません。お気に入りを選択すると、日付だけ利用当日に更新されます。

## PNGコピーとダウンロード

印影はSVGで描画し、出力時にCanvasへ変換して透過PNGを生成します。

Clipboard APIでPNGコピーできるブラウザでは「クリップボードにコピー」から直接コピーできます。対応していないブラウザ、またはコピーに失敗した場合は、代替としてPNGをダウンロードします。

## GitHub Pagesデプロイ

`.github/workflows/deploy.yml` にGitHub Actionsワークフローを用意しています。GitHub Actions上ではCI環境内で依存関係をインストールしてビルドします。ローカルマシンへのNode.js/npm依存のインストールは不要です。

1. GitHubのリポジトリ設定で Pages の Source を `GitHub Actions` に設定します。
2. `main` ブランチへpushします。
3. `Deploy to GitHub Pages` ワークフローが実行されます。
4. デプロイ完了後、GitHub PagesのURLへアクセスします。

Viteの `base` は `/DailyStampMaker/` に設定済みです。

## 実装タスクIssue

次のIssueを作成済みです。

- [#1 基本UIと印影プレビュー](https://github.com/taku335/DailyStampMaker/issues/1)
- [#2 Canvas/SVGによる印影描画](https://github.com/taku335/DailyStampMaker/issues/2)
- [#3 日付変更とフォーマット選択](https://github.com/taku335/DailyStampMaker/issues/3)
- [#4 色プリセットと自由色選択](https://github.com/taku335/DailyStampMaker/issues/4)
- [#5 透過PNG出力](https://github.com/taku335/DailyStampMaker/issues/5)
- [#6 クリップボードコピー](https://github.com/taku335/DailyStampMaker/issues/6)
- [#7 お気に入り登録](https://github.com/taku335/DailyStampMaker/issues/7)
- [#8 JSONプリセット読み込み](https://github.com/taku335/DailyStampMaker/issues/8)
- [#9 GitHub Pages デプロイ](https://github.com/taku335/DailyStampMaker/issues/9)
- [#10 README整備](https://github.com/taku335/DailyStampMaker/issues/10)
