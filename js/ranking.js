/**
 * ranking.js — ランキング管理（localStorage ベース）
 *
 * スコア計算:
 *   スクワット数 × 10 + 深さ × 5 + アイテムポイント合計
 */

const STORAGE_KEY = "squatMiningRanking";
const MAX_ENTRIES = 10;

export class Ranking {
  constructor() {
    this.entries = this._load();
  }

  /**
   * エントリーを追加する
   * @param {string} name     - プレイヤー名
   * @param {number} squats   - スクワット数
   * @param {number} depth    - 最終深度（m）
   * @param {number} itemPoints - アイテムポイント合計
   * @returns {number} ランキング順位（1始まり）
   */
  add(name, squats, depth, itemPoints) {
    const score = squats * 10 + depth * 5 + itemPoints;
    const entry = {
      name: name.trim() || "名無しの採掘者",
      squats,
      depth,
      itemPoints,
      score,
      date: new Date().toLocaleDateString("ja-JP"),
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);

    // 上位 MAX_ENTRIES 件のみ保存
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this._save();

    return this.entries.findIndex((e) => e === entry) + 1;
  }

  /**
   * ランキング一覧を返す
   * @returns {Array} ランキング配列
   */
  getAll() {
    return this.entries;
  }

  /**
   * スコアを計算して返す（保存は行わない）
   */
  calcScore(squats, depth, itemPoints) {
    return squats * 10 + depth * 5 + itemPoints;
  }

  // ──────────────────────────────
  // 内部
  // ──────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
  }
}
