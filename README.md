# ⛏️ スクワット採掘 (SQUAT MINING)

カメラで体を認識し、スクワットをするたびに地面を掘り進むゲーム。  
深く掘るほど「人生の本質」に近づいていく…かもしれない。

## 遊び方

1. カメラに全身が映るように立つ
2. スクワットをするたびに 1m 掘れる
3. 特定の深さに達するとアイテムを発見
4. 深さ 50m（地球の中心）を目指せ！

## 技術スタック

- **ポーズ検出**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (Pose Landmarker)
- **ゲーム描画**: HTML Canvas
- **ランキング**: localStorage（ブラウザ保存）
- **フレームワーク**: バニラ JS（ES Modules）

## ローカル実行

MediaPipe は WASM を使うため、ローカルサーバーが必要です。

```bash
# Python 3
cd squat-mining
python3 -m http.server 8000

# または Node.js
npx serve .
```

ブラウザで `http://localhost:8000` を開く

## プロジェクト構成

```
squat-mining/
├── index.html              # ゲーム画面（全スクリーン）
├── css/
│   └── style.css           # 採掘テーマのスタイル
├── js/
│   ├── items.js            # アイテム定義（劇団ひとりユーモア）
│   ├── squat-detector.js   # MediaPipe スクワット検出
│   ├── ranking.js          # ランキング管理
│   └── game.js             # メインゲームロジック
└── README.md
```

## アイテムレアリティ

| レアリティ | 出現深度 | 備考 |
|-----------|---------|------|
| よくある  | 1-10m   | 日常のガラクタ層 |
| 珍しい    | 11-20m  | 仕事の地層 |
| レア      | 21-30m  | 恋愛の地層 |
| スーパーレア | 31-40m | 青春の地層 |
| レジェンド | 41-50m | 深淵の真実層 |
