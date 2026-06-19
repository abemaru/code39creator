# code39creator

Code 39 のバーコードを生成し、PNG として保存できるシンプルな Web アプリです。TypeScript と Vitest を使う構成へ移行してあり、今後の機能追加に合わせてロジックと UI を分割して拡張できます。

## 仕様

- Code 39 文字列を入力するとプレビューを生成
- PNG ダウンロード対応
- TypeScript ベースのモジュール構成
- Vitest + jsdom によるテスト対応
- GitHub Pages へ `dist/` を自動デプロイ

## 開発

```bash
npm install
npm run dev
```

## テスト

```bash
npm run test:run
```

## ビルド

```bash
npm run build
```

## GitHub Pages

GitHub Actions でテストとビルドを実行し、`dist/` を GitHub Pages へデプロイします。
