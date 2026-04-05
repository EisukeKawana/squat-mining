/**
 * game.js — メインゲームコントローラー
 *
 * 画面遷移: start → calibrate → playing → result → (ranking)
 * スクワット1回 → 深さ1m → 特定の深さでアイテム発見
 */

import { ITEMS, BONUS_ITEMS, RARITY_COLORS, EARTH_LAYERS } from "./items.js";
import { SquatDetector } from "./squat-detector.js";
import { Ranking } from "./ranking.js";

const MAX_DEPTH = 50;
const BONUS_ITEM_CHANCE = 0.2; // 固定アイテム以外の深さでの出現率

class Game {
  constructor() {
    this.detector = new SquatDetector();
    this.ranking = new Ranking();

    // ゲーム状態
    this.depth = 0;
    this.squatCount = 0;
    this.foundItems = [];
    this.totalItemPoints = 0;
    this.triggeredDepths = new Set(); // すでにアイテムを出したDepth
    this.animFrame = null;
    this.stream = null;

    // mine キャンバスのアニメーション用
    this.particles = [];
    this.mineCanvas = null;
    this.mineCtx = null;

    this._bindUI();
    this._showScreen("start");
  }

  // ──────────────────────────────────────────────
  // 画面バインディング
  // ──────────────────────────────────────────────

  _bindUI() {
    // 開始画面
    document.getElementById("btn-start").onclick = () => this._startCamera();
    document.getElementById("btn-ranking").onclick = () => this._showRanking();

    // キャリブレーション画面（自動で進む）

    // ゲーム中
    document.getElementById("btn-end-game").onclick = () => this._endGame();

    // 結果画面
    document.getElementById("btn-register").onclick = () => this._registerScore();
    document.getElementById("btn-play-again").onclick = () => {
      this._stopCamera();
      this._showScreen("start");
    };

    // ランキング画面
    document.getElementById("btn-back-from-ranking").onclick = () =>
      this._showScreen("start");
  }

  // ──────────────────────────────────────────────
  // カメラ起動 & キャリブレーション
  // ──────────────────────────────────────────────

  async _startCamera() {
    this._showScreen("calibrate");
    document.getElementById("calibrate-status").textContent =
      "MediaPipe を読み込み中...";

    try {
      // カメラ取得
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      const videoCalib = document.getElementById("video-calibrate");
      videoCalib.srcObject = this.stream;
      await videoCalib.play();

      // キャンバスサイズを動画に合わせる
      videoCalib.onloadedmetadata = () => {
        const c = document.getElementById("canvas-calibrate");
        c.width = videoCalib.videoWidth;
        c.height = videoCalib.videoHeight;
      };

      // MediaPipe 初期化
      await this.detector.init();
      this.detector.start();

      document.getElementById("calibrate-status").textContent =
        "カメラに全身が映るように立ってください";

      // ポーズ検出ループを開始してキャリブレーション待ち
      this._runCalibrationLoop(videoCalib);
    } catch (err) {
      document.getElementById("calibrate-status").textContent =
        "カメラのアクセスに失敗しました: " + err.message;
    }
  }

  _runCalibrationLoop(video) {
    let poseDetectedCount = 0;
    let countdown = 3;
    let countdownStarted = false;
    let lastCountdownTime = 0;

    const loop = () => {
      this.detector.processFrame(
        video,
        document.getElementById("canvas-calibrate")
      );

      // ポーズが安定して検出されたらカウントダウン開始
      if (this.detector.calibrated === false) {
        // onPoseUpdate で calibrate を呼ぶ
        this.detector.onPoseUpdate = (landmarks) => {
          poseDetectedCount++;
          if (poseDetectedCount === 15 && !countdownStarted) {
            // 15フレーム安定したらキャリブレーション実行
            this.detector.calibrate(landmarks);
            countdownStarted = true;
            document.getElementById("calibrate-status").textContent = "";
            document.getElementById("calibrate-countdown").classList.remove("hidden");
            document.getElementById("calibrate-countdown").textContent =
              "3 秒後にスタート...";
            lastCountdownTime = performance.now();
          }
        };
      }

      if (countdownStarted) {
        const now = performance.now();
        if (now - lastCountdownTime > 1000) {
          countdown--;
          lastCountdownTime = now;
          if (countdown > 0) {
            document.getElementById("calibrate-countdown").textContent =
              `${countdown} 秒後にスタート...`;
          } else {
            // ゲーム開始
            this._startGame(video);
            return;
          }
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────
  // ゲーム開始
  // ──────────────────────────────────────────────

  _startGame(calibVideo) {
    // 状態リセット
    this.depth = 0;
    this.squatCount = 0;
    this.foundItems = [];
    this.totalItemPoints = 0;
    this.triggeredDepths = new Set();
    this.particles = [];
    this.detector.squatCount = 0;
    this.detector.state = "standing";

    // ゲーム画面のビデオに同じストリームを使う
    const videoGame  = document.getElementById("video-game");
    const canvasGame = document.getElementById("canvas-game");
    videoGame.srcObject = this.stream;
    videoGame.play();

    // 動画メタが読み込まれたらキャンバスサイズを合わせる
    // （processFrame 内でも毎フレーム確認するが、初期化として明示的に実行）
    videoGame.onloadedmetadata = () => {
      canvasGame.width  = videoGame.videoWidth;
      canvasGame.height = videoGame.videoHeight;
    };

    // Mine キャンバス初期化（表示後にサイズを取得するため requestAnimationFrame で遅延）
    this._showScreen("game");
    this._updateStats();

    requestAnimationFrame(() => {
      this.mineCanvas = document.getElementById("canvas-mine");
      this.mineCtx    = this.mineCanvas.getContext("2d");
      // offsetWidth/Height はレイアウト後に確定する
      this.mineCanvas.width  = this.mineCanvas.offsetWidth  || 300;
      this.mineCanvas.height = this.mineCanvas.offsetHeight || 500;
      this._drawMine();
    });

    // スクワットのコールバック登録
    this.detector.onSquat      = (count) => this._onSquat(count);
    this.detector.onPoseUpdate = null; // キャリブレーション用を外す

    // ゲームループ
    this._gameLoop(videoGame, canvasGame);
  }

  _gameLoop(video, canvas) {
    // 骨格オーバーレイ + スクワット判定
    this.detector.processFrame(video, canvas);
    // 採掘ビジュアル
    this._drawMine();
    // スクワット深度 % をステータスバーにリアルタイム反映
    this._updateSquatDepthUI();
    this.animFrame = requestAnimationFrame(() => this._gameLoop(video, canvas));
  }

  /** スクワット深度をリアルタイムでステータスバーに表示 */
  _updateSquatDepthUI() {
    const el = document.getElementById("squat-depth-pct");
    if (!el || !this.detector.calibrated) return;

    const ratio    = this.detector.lastDropRatio;
    const threshold = this.detector.SQUAT_DOWN_THRESHOLD;
    const progress  = Math.max(0, Math.min(1, ratio / threshold));
    const pct       = Math.round(progress * 100);

    if (this.detector.state === "squatting") {
      el.textContent      = "✓ OK!";
      el.dataset.level    = "done";
    } else {
      el.textContent      = `${pct}%`;
      el.dataset.level    = pct >= 85 ? "high" : pct >= 40 ? "mid" : "low";
    }
  }

  // ──────────────────────────────────────────────
  // スクワット処理
  // ──────────────────────────────────────────────

  _onSquat(count) {
    if (this.depth >= MAX_DEPTH) return;

    this.depth++;
    this.squatCount = count;

    // 掘削パーティクル
    this._spawnParticles();

    // スクワット表示アニメーション
    const indicator = document.getElementById("squat-indicator");
    indicator.classList.remove("hidden");
    indicator.classList.add("flash");
    setTimeout(() => {
      indicator.classList.add("hidden");
      indicator.classList.remove("flash");
    }, 600);

    // UI 更新
    this._updateStats();

    // アイテム判定
    this._checkItems();

    // クリア判定
    if (this.depth >= MAX_DEPTH) {
      setTimeout(() => this._endGame(), 1500);
    }
  }

  _checkItems() {
    // 固定アイテムのチェック
    const fixedItem = ITEMS.find(
      (item) => item.triggerDepth === this.depth && !this.triggeredDepths.has(this.depth)
    );

    if (fixedItem) {
      this.triggeredDepths.add(this.depth);
      this._showItemPopup(fixedItem);
      this._collectItem(fixedItem);
      return;
    }

    // ボーナスアイテムのランダム判定
    if (
      !this.triggeredDepths.has(this.depth) &&
      Math.random() < BONUS_ITEM_CHANCE
    ) {
      this.triggeredDepths.add(this.depth);
      const bonus = BONUS_ITEMS[Math.floor(Math.random() * BONUS_ITEMS.length)];
      this._showItemPopup(bonus);
      this._collectItem(bonus);
    }
  }

  _collectItem(item) {
    this.foundItems.push(item);
    this.totalItemPoints += item.points;
    document.getElementById("item-count").textContent = this.foundItems.length;
  }

  // ──────────────────────────────────────────────
  // UI 更新
  // ──────────────────────────────────────────────

  _updateStats() {
    document.getElementById("squat-count").textContent = this.squatCount;
    document.getElementById("depth-display").textContent = `${this.depth}m`;
    document.getElementById("mine-depth-label").textContent = `深さ ${this.depth}m`;

    // 深さゲージ
    const pct = (this.depth / MAX_DEPTH) * 100;
    document.getElementById("depth-progress").style.height = `${pct}%`;
  }

  _showItemPopup(item) {
    const popup = document.getElementById("item-popup");
    const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

    document.getElementById("popup-emoji").textContent = item.emoji;
    document.getElementById("popup-name").textContent = item.name;
    document.getElementById("popup-desc").textContent = item.description;
    document.getElementById("popup-rarity").textContent = item.rarityLabel;
    document.getElementById("popup-rarity").style.color = colors.text;
    document.getElementById("popup-rarity").style.borderColor = colors.border;
    popup.style.borderColor = colors.border;

    popup.classList.remove("hidden");
    popup.classList.add("show");

    setTimeout(() => {
      popup.classList.remove("show");
      popup.classList.add("hidden");
    }, 3500);
  }

  // ──────────────────────────────────────────────
  // Mine キャンバス描画
  // ──────────────────────────────────────────────

  _drawMine() {
    const ctx = this.mineCtx;
    const W = this.mineCanvas.width;
    const H = this.mineCanvas.height;

    ctx.clearRect(0, 0, W, H);

    // 地層を描画
    let prevMaxDepth = 0;
    for (const layer of EARTH_LAYERS) {
      const yStart = (prevMaxDepth / MAX_DEPTH) * H;
      const yEnd = (layer.maxDepth / MAX_DEPTH) * H;
      const layerH = yEnd - yStart;

      // 地層のベース
      ctx.fillStyle = layer.color;
      ctx.fillRect(0, yStart, W, layerH);

      // テクスチャ（石ころ風）
      ctx.fillStyle = layer.darkColor;
      for (let i = 0; i < 15; i++) {
        const x = ((prevMaxDepth * 7 + i * 37) % (W - 10)) + 5;
        const y = yStart + ((i * 31) % (layerH - 10)) + 5;
        const r = 2 + (i % 4);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.7, (i * 0.5) % Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // 地層名ラベル（掘っている層のみ表示）
      if (this.depth >= prevMaxDepth && this.depth < layer.maxDepth) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px sans-serif";
        ctx.fillText(layer.name, 5, yStart + 14);
      }

      prevMaxDepth = layer.maxDepth;
    }

    // 掘削済み部分（シャフト）
    const dugY = (this.depth / MAX_DEPTH) * H;
    const shaftW = W * 0.35;
    const shaftX = (W - shaftW) / 2;

    // シャフトの背景（暗い穴）
    ctx.fillStyle = "#0D0D0D";
    ctx.fillRect(shaftX, 0, shaftW, dugY);

    // シャフトの輪郭（木枠風）
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 3;
    ctx.strokeRect(shaftX, 0, shaftW, dugY);

    // キャラクター（掘削位置に表示）
    if (this.depth < MAX_DEPTH) {
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.fillText("⛏️", W / 2, Math.max(dugY - 5, 20));
    } else {
      // クリア演出
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.fillText("🌟", W / 2, H - 15);
    }

    // 発見済みアイテムのマーカー（小さくサイドに表示）
    for (const item of this.foundItems) {
      const depthForItem = item.triggerDepth || 0;
      const yPos = (depthForItem / MAX_DEPTH) * H;
      ctx.font = "12px serif";
      ctx.textAlign = "left";
      ctx.fillText(item.emoji, W - 18, yPos);
    }
    ctx.textAlign = "left";

    // パーティクルの更新・描画
    this._updateParticles(ctx);
  }

  // ──────────────────────────────────────────────
  // パーティクル（掘削エフェクト）
  // ──────────────────────────────────────────────

  _spawnParticles() {
    const W = this.mineCanvas.width;
    const dugY = (this.depth / MAX_DEPTH) * this.mineCanvas.height;
    const shaftX = (W - W * 0.35) / 2;
    const shaftW = W * 0.35;

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: shaftX + Math.random() * shaftW,
        y: dugY,
        vx: (Math.random() - 0.5) * 3,
        vy: -(Math.random() * 4 + 2),
        life: 1.0,
        size: Math.random() * 4 + 2,
        color: `hsl(${30 + Math.random() * 30}, 70%, ${40 + Math.random() * 30}%)`,
      });
    }
  }

  _updateParticles(ctx) {
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // 重力
      p.life -= 0.04;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ──────────────────────────────────────────────
  // ゲーム終了
  // ──────────────────────────────────────────────

  _endGame() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.detector.stop();

    // スコア計算
    const score = this.ranking.calcScore(
      this.squatCount,
      this.depth,
      this.totalItemPoints
    );

    // 結果画面の更新
    document.getElementById("result-depth").textContent = `${this.depth}m`;
    document.getElementById("result-squats").textContent = `${this.squatCount}回`;
    document.getElementById("result-score").textContent = score.toLocaleString();

    // 発見アイテム一覧
    const grid = document.getElementById("items-grid");
    grid.innerHTML = "";
    if (this.foundItems.length === 0) {
      grid.innerHTML = "<p class='no-items'>何も発見できなかった…<br>もっと深く掘れ！</p>";
    } else {
      for (const item of this.foundItems) {
        const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
        const div = document.createElement("div");
        div.className = "item-card";
        div.style.borderColor = colors.border;
        div.style.background = colors.bg;
        div.innerHTML = `
          <span class="item-card-emoji">${item.emoji}</span>
          <span class="item-card-name" style="color:${colors.text}">${item.name}</span>
          <span class="item-card-rarity">${item.rarityLabel}</span>
        `;
        grid.appendChild(div);
      }
    }

    this._showScreen("result");
  }

  _registerScore() {
    const name = document.getElementById("player-name").value;
    const score = this.ranking.add(
      name,
      this.squatCount,
      this.depth,
      this.totalItemPoints
    );

    document.getElementById("btn-register").textContent = `登録完了！${score}位`;
    document.getElementById("btn-register").disabled = true;
  }

  // ──────────────────────────────────────────────
  // ランキング表示
  // ──────────────────────────────────────────────

  _showRanking() {
    const list = document.getElementById("ranking-list");
    const entries = this.ranking.getAll();

    if (entries.length === 0) {
      list.innerHTML = "<p class='no-rank'>まだ記録がありません。<br>最初の採掘者になろう！</p>";
    } else {
      list.innerHTML = entries
        .map((e, i) => {
          const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
          return `
            <div class="rank-entry ${i === 0 ? "rank-first" : ""}">
              <span class="rank-medal">${medal}</span>
              <span class="rank-name">${e.name}</span>
              <span class="rank-depth">深さ ${e.depth}m</span>
              <span class="rank-score">${e.score.toLocaleString()}pt</span>
              <span class="rank-date">${e.date}</span>
            </div>
          `;
        })
        .join("");
    }

    this._showScreen("ranking");
  }

  // ──────────────────────────────────────────────
  // カメラ停止・画面切り替え
  // ──────────────────────────────────────────────

  _stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.detector.stop();
    this.detector.resetCalibration();
    // 登録ボタンをリセット
    const btn = document.getElementById("btn-register");
    btn.textContent = "登録する";
    btn.disabled = false;
  }

  _showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.remove("active");
    });
    document.getElementById(`screen-${name}`).classList.add("active");
  }
}

// ゲーム起動
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
