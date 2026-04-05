/**
 * items.js — アイテム定義
 *
 * 劇団ひとりスタイルのユーモア：
 * 日常の微妙な悲しさ、社会人あるある、恋愛のしくじり、
 * 青春の傷跡、そして人生の本質をクスッと笑えるテキストで。
 */

// 特定の深さで必ず出現するアイテム
export const ITEMS = [
  // ──────────────────────────────
  // 地表のガラクタ層（1〜10m）
  // ──────────────────────────────
  {
    id: 1,
    triggerDepth: 2,
    name: "コンビニのレシート",
    description:
      "770円のサラダチキンとビール350ml缶が記録されている。\n健康に気を遣っているのか、そうでないのか、本人にも分からない。",
    rarity: "common",
    rarityLabel: "よくある",
    emoji: "🧾",
    points: 10,
  },
  {
    id: 2,
    triggerDepth: 4,
    name: "絡まったままのイヤホン",
    description:
      "ポケットに入れた瞬間から絡まる、この世の理。\nほどこうとするほど深みにはまる。人間関係に似ている。",
    rarity: "common",
    rarityLabel: "よくある",
    emoji: "🎧",
    points: 10,
  },
  {
    id: 3,
    triggerDepth: 6,
    name: "期限切れのジム会員証",
    description:
      "3ヶ月で解約した。行ったのは最初の2週間だけ。\nしかし「いつか再開する」という気持ちだけは、まだ有効期限内だ。",
    rarity: "common",
    rarityLabel: "よくある",
    emoji: "🏋️",
    points: 10,
  },
  {
    id: 4,
    triggerDepth: 9,
    name: "謎のUSBメモリ",
    description:
      "中身が気になるが、怖くて見られない。もう6年経つ。\nそろそろ何が入っているか分からなくなってきた。それでいい気がしてきた。",
    rarity: "uncommon",
    rarityLabel: "珍しい",
    emoji: "💾",
    points: 25,
  },

  // ──────────────────────────────
  // 仕事の地層（11〜20m）
  // ──────────────────────────────
  {
    id: 5,
    triggerDepth: 11,
    name: "誰も笑わなかったジョーク（化石）",
    description:
      "会議で言ったジョーク。シーンとした空気が化石になったもの。\n発掘してみると、確かに面白くなかった。",
    rarity: "uncommon",
    rarityLabel: "珍しい",
    emoji: "😶",
    points: 25,
  },
  {
    id: 6,
    triggerDepth: 13,
    name: "3回書き直したメールの下書き",
    description:
      "部長へのメール。最初は「ご確認いただけますでしょうか」。\n次は「ご確認いただければ幸いです」。\n最終的に送ったのは全部消してシンプルにしたもの。",
    rarity: "uncommon",
    rarityLabel: "珍しい",
    emoji: "📧",
    points: 25,
  },
  {
    id: 7,
    triggerDepth: 16,
    name: "上司のゴルフ自慢話（結晶）",
    description:
      "「先週バーディ出てさ〜」から始まる20分の話が結晶化したもの。\n表面に「へぇ〜すごいですね」という文字が光り輝いている。",
    rarity: "rare",
    rarityLabel: "レア",
    emoji: "⛳",
    points: 50,
  },
  {
    id: 8,
    triggerDepth: 19,
    name: "誰も見ていなかったプレゼン資料",
    description:
      "3日かけて作った。グラフも入れた。アニメーションも入れた。\n発表中、全員スマホを見ていた。\n資料は圧縮されて重たい石になっていた。",
    rarity: "rare",
    rarityLabel: "レア",
    emoji: "📊",
    points: 50,
  },

  // ──────────────────────────────
  // 恋愛の地層（21〜30m）
  // ──────────────────────────────
  {
    id: 9,
    triggerDepth: 22,
    name: "既読無視されたLINEの化石",
    description:
      "「今週末ひまだったりします？」\n既読がついたのは見えた。\n2年前に化石になっていた。\n発掘してみると、送るべきじゃなかったと思う。",
    rarity: "rare",
    rarityLabel: "レア",
    emoji: "💬",
    points: 50,
  },
  {
    id: 10,
    triggerDepth: 25,
    name: "元カノに返せなかった傘",
    description:
      "別れたあの日、なぜか傘を持って帰ってしまった。\nもう7年経つ。今でも彼女のことより傘のことを思い出す。\n傘は今どこにあるか分からない。",
    rarity: "rare",
    rarityLabel: "レア",
    emoji: "☂️",
    points: 50,
  },
  {
    id: 11,
    triggerDepth: 28,
    name: "「脈あり」と勘違いしていた3ヶ月",
    description:
      "「ありがとう！」のあとに「！」がついていたことを根拠にしていた。\n化石を解析すると、相手は全員にそう送っていた。",
    rarity: "superRare",
    rarityLabel: "スーパーレア",
    emoji: "💘",
    points: 100,
  },
  {
    id: 12,
    triggerDepth: 30,
    name: "「また今度ね」の本当の意味（結晶体）",
    description:
      "「また今度」が「絶対にない」という意味だと学んだのは、\n何度目の「また今度」からだっただろうか。\n結晶の内部は、空洞だった。",
    rarity: "superRare",
    rarityLabel: "スーパーレア",
    emoji: "⏰",
    points: 100,
  },

  // ──────────────────────────────
  // 青春の地層（31〜40m）
  // ──────────────────────────────
  {
    id: 13,
    triggerDepth: 33,
    name: "夏休み最終日の絵日記",
    description:
      "「7月21日：晴れ、楽しかった」\n「7月22日〜8月30日：晴れ、楽しかった」\n8月31日に全部書いた。その日だけ筆圧が違う。",
    rarity: "superRare",
    rarityLabel: "スーパーレア",
    emoji: "📓",
    points: 100,
  },
  {
    id: 14,
    triggerDepth: 36,
    name: "ドッジボールで最初に当たった瞬間の記憶",
    description:
      "試合開始3秒。「あいつに当てれば面白い」という\nクラス全員の意志が一致した瞬間が結晶化している。\nなぜか今でも少し痛い。",
    rarity: "superRare",
    rarityLabel: "スーパーレア",
    emoji: "🏀",
    points: 100,
  },
  {
    id: 15,
    triggerDepth: 39,
    name: "卒業文集の「将来の夢」",
    description:
      "「宇宙飛行士になりたい」と書いた。なれなかった。\nでも今スクワットをしながら地面を掘っている。\n近いのか遠いのか、もう分からない。",
    rarity: "legendary",
    rarityLabel: "レジェンド",
    emoji: "🚀",
    points: 200,
  },

  // ──────────────────────────────
  // 深淵の真実層（41〜50m）
  // ──────────────────────────────
  {
    id: 16,
    triggerDepth: 42,
    name: "20代にやるはずだったことリスト",
    description:
      "「海外バックパック旅行」「バンド」「小説を書く」「ジム通い」\nスクワットだけは今やっている。\nリストに書いていなかったが。",
    rarity: "legendary",
    rarityLabel: "レジェンド",
    emoji: "📋",
    points: 200,
  },
  {
    id: 17,
    triggerDepth: 45,
    name: "自分の本当の性格（直視注意）",
    description:
      "「優しい」と思っていた自分は、実は「断れないだけ」だった。\n「真面目」だと思っていたのは「心配性」だった。\nまあ、人間みんなそんなものだ。",
    rarity: "legendary",
    rarityLabel: "レジェンド",
    emoji: "🪞",
    points: 200,
  },
  {
    id: 18,
    triggerDepth: 48,
    name: "宇宙が始まった本当の理由",
    description:
      "ビッグバンより前に何があったか。\nこの石に刻まれているが、解読できる言語が宇宙に存在しない。\nそういうことにしておこう。",
    rarity: "legendary",
    rarityLabel: "レジェンド",
    emoji: "🌌",
    points: 200,
  },
  {
    id: 19,
    triggerDepth: 50,
    name: "なぜスクワットをしているのかという問い",
    description:
      "地球の中心に到達した。ここに答えがある。\n石を割ると中に「もう少し頑張ったら分かる」と書いてあった。\n次も来てください。",
    rarity: "legendary",
    rarityLabel: "レジェンド",
    emoji: "❓",
    points: 500,
  },
];

// ランダムに出現するボーナスアイテム（特定の深さ以外で低確率で出る）
export const BONUS_ITEMS = [
  {
    name: "1円玉（なぜか32枚）",
    description:
      "なぜ33枚でなく32枚なのか、誰も知らない。\n重い割に役に立たない。人生にも似たようなものがある。",
    emoji: "🪙",
    points: 5,
    rarity: "common",
    rarityLabel: "よくある",
  },
  {
    name: "折り畳まれたエコバッグ",
    description:
      "使った記憶がない。でも捨てられない。\nレジ袋有料化に対応した証拠として保管されている。",
    emoji: "🛍️",
    points: 5,
    rarity: "common",
    rarityLabel: "よくある",
  },
  {
    name: "「今度飲みましょう」が具現化したお守り",
    description:
      "言った側も言われた側も忘れている。\n毎年300個くらい量産されている日本特産の鉱石。",
    emoji: "🍺",
    points: 15,
    rarity: "uncommon",
    rarityLabel: "珍しい",
  },
  {
    name: "有給休暇を使い切れなかった後悔",
    description:
      "「来月こそ」が12回繰り返されると年末になる。\n次の年もきっと同じことを言う。",
    emoji: "📅",
    points: 15,
    rarity: "uncommon",
    rarityLabel: "珍しい",
  },
  {
    name: "友達の名前が書いてあるボールペン",
    description:
      "何年前に借りたか分からない。\n返すタイミングを永遠に逃し続けた結果、自分のものになった。",
    emoji: "🖊️",
    points: 8,
    rarity: "common",
    rarityLabel: "よくある",
  },
  {
    name: "残業代がつかなかった残業時間の化石",
    description:
      "「みんなそうだから」という言葉で地層に埋まった時間の塊。\n触るとなんとなく疲れる。",
    emoji: "⌚",
    points: 30,
    rarity: "rare",
    rarityLabel: "レア",
  },
  {
    name: "「承知いたしました」の使い過ぎ警告",
    description:
      "年間3,000回を超えると発動する自動警告。\nこれを見つけたあなたは間違いなく社会人だ。",
    emoji: "📨",
    points: 20,
    rarity: "uncommon",
    rarityLabel: "珍しい",
  },
  {
    name: "押してない「送信」ボタンの夢",
    description:
      "送ろうとしたのに送れなかった夢。\n何の夢だったかは覚えていない。",
    emoji: "💭",
    points: 35,
    rarity: "rare",
    rarityLabel: "レア",
  },
];

// レアリティの色
export const RARITY_COLORS = {
  common:    { bg: "#4A4A4A", text: "#CCCCCC", border: "#777777" },
  uncommon:  { bg: "#1A3A2A", text: "#5DDE9A", border: "#2ECC71" },
  rare:      { bg: "#1A2A4A", text: "#6EB4FF", border: "#3498DB" },
  superRare: { bg: "#3A1A4A", text: "#D88AFF", border: "#9B59B6" },
  legendary: { bg: "#4A3A00", text: "#FFD700", border: "#F39C12" },
};

// 地層の定義（深さ帯と色）
export const EARTH_LAYERS = [
  { maxDepth: 10, color: "#8B5E3C", darkColor: "#6B4226", name: "日常のガラクタ層" },
  { maxDepth: 20, color: "#6B4226", darkColor: "#4A2E18", name: "仕事の地層" },
  { maxDepth: 30, color: "#4A4A4A", darkColor: "#333333", name: "恋愛の地層" },
  { maxDepth: 40, color: "#2C3E50", darkColor: "#1A2635", name: "青春の地層" },
  { maxDepth: 50, color: "#1A0A2E", darkColor: "#0D0518", name: "深淵の真実層" },
];
