# code39creator

Code 39 のバーコードを生成し、PNG として保存できるだけのシンプルな静的 Web アプリです。

## 仕様

- Code 39 文字列を入力するとプレビューを生成
- PNG ダウンロード対応
- GitHub Pages でそのまま配信できるビルド不要構成
- `vendor/JsBarcode.all.min.js` を同梱しているため CDN 依存なし

## ローカル確認

静的ファイルなので任意の HTTP サーバーで確認できます。

```bash
npx serve .
```

## GitHub Pages

このリポジトリにはビルド工程がないため、`main` ブランチのルートを GitHub Pages の配信元に指定すれば公開できます。
