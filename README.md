# Strange-Keigo-World

日本語学習者（N2レベル）向けの、敬語とビジネスマナーを学ぶアプリのたたき台です。

- `office-visit.html` … 3Dのビジネス敬語シミュレーター（全6話。第6話はロンドンの日本文化ショップでの接客）と、敬語の解説・単語帳・練習。日本語／英語の切り替えとふりがな付き。
- `index.html` … 最初に作ったクイズ形式の版。

どちらもブラウザで直接開けば動きます。

## ふりがなの更新

`office-visit.html` の日本語を書き換えたら、ふりがなを作り直してください。

```sh
npm install
npm run furigana
```

`tools/build-furigana.js` がページ内の日本語の文字列を kuromoji で解析し、`RUBY` の対応表を書き換えます。
読みが間違っている語は、同じファイルの `OVERRIDES` に追加して固定します。
