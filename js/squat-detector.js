/**
 * squat-detector.js — MediaPipe Pose を使ったスクワット検出
 *
 * 検出アルゴリズム:
 * 1. 立った状態でキャリブレーション（腰のY座標を基準として記録）
 * 2. 腰が基準より bodyHeight * SQUAT_DOWN_THRESHOLD 以上下がったら「スクワット中」
 * 3. 腰が基準付近に戻ったら「1回」カウント
 *
 * オーバーレイ表示（常時）:
 * - 骨格ライン + 関節点
 * - 「ここまで下げる」目標ライン（腰の目標Y位置）
 * - 深度バー（右端・リアルタイム進捗）
 * - ガイドテキスト（下部）
 */

import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// MediaPipe のランドマーク番号
const LM = {
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_KNEE:      25,
  RIGHT_KNEE:     26,
};

export class SquatDetector {
  constructor() {
    this.poseLandmarker = null;
    this.drawingUtils  = null;
    this._overlayCtx   = null; // DrawingUtils が紐付いている ctx を記憶
    this.running       = false;
    this.lastVideoTime = -1;

    // スクワット検出の状態
    this.state              = "standing"; // "standing" | "squatting"
    this.baselineHipY       = null;
    this.bodySegmentHeight  = null;
    this.calibrated         = false;
    this.squatCount         = 0;
    this.lastDropRatio      = 0; // 現在フレームのドロップ比率（描画・UI用）

    // 閾値（bodySegmentHeight に対する比率）
    // 肩〜腰の距離を1として、腰がどれだけ下がったらスクワットとみなすか
    // 0.38 = 肩〜腰の距離の38%以上腰が下がること（ちゃんとしたスクワット）
    this.SQUAT_DOWN_THRESHOLD = 0.38;
    // 立ち上がり判定：腰が基準のほぼ近く（6%以内）まで戻ったら完了
    this.STAND_UP_THRESHOLD   = 0.06;

    // 外部コールバック
    this.onSquat      = null;
    this.onPoseUpdate = null;
  }

  // ──────────────────────────────────────────────
  // 公開メソッド
  // ──────────────────────────────────────────────

  /** MediaPipe の初期化 */
  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });

    return this;
  }

  /** キャリブレーション：立ち姿勢を基準として記録 */
  calibrate(landmarks) {
    const hipY     = this._getHipY(landmarks);
    const shoulderY = this._getShoulderY(landmarks);

    this.baselineHipY      = hipY;
    this.bodySegmentHeight = Math.abs(hipY - shoulderY);
    this.calibrated        = true;
  }

  /** リセット */
  resetCalibration() {
    this.calibrated        = false;
    this.baselineHipY      = null;
    this.bodySegmentHeight = null;
    this.state             = "standing";
    this.squatCount        = 0;
    this.lastDropRatio     = 0;
  }

  /**
   * 動画フレームを処理してポーズを検出・スクワットを判定
   * @param {HTMLVideoElement} video
   * @param {HTMLCanvasElement} overlayCanvas - 骨格・深度表示の描画先
   */
  processFrame(video, overlayCanvas = null) {
    if (!this.poseLandmarker || !this.running) return;

    // 動画がまだ準備できていない場合はスキップ
    if (video.readyState < 2) return;

    // 同一フレームの二重処理を防ぐ
    if (video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = video.currentTime;

    // キャンバスサイズを動画に合わせる（videoWidth が確定してから・0 にしない）
    if (overlayCanvas && video.videoWidth > 0) {
      if (overlayCanvas.width !== video.videoWidth || overlayCanvas.height !== video.videoHeight) {
        overlayCanvas.width  = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
      }
    }

    let result;
    try {
      result = this.poseLandmarker.detectForVideo(video, performance.now());
    } catch {
      return;
    }

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];

      if (this.calibrated) {
        this._detectSquat(landmarks);
      }

      if (overlayCanvas) {
        this._drawOverlay(overlayCanvas, result);
      }

      if (this.onPoseUpdate) {
        this.onPoseUpdate(landmarks);
      }
    } else {
      if (overlayCanvas) {
        this._drawNopose(overlayCanvas);
      }
    }
  }

  start() { this.running = true; }
  stop()  { this.running = false; }

  // ──────────────────────────────────────────────
  // 内部：スクワット判定
  // ──────────────────────────────────────────────

  _detectSquat(landmarks) {
    const hipY      = this._getHipY(landmarks);
    const dropRatio = (hipY - this.baselineHipY) / this.bodySegmentHeight;
    this.lastDropRatio = dropRatio;

    if (this.state === "standing" && dropRatio > this.SQUAT_DOWN_THRESHOLD) {
      this.state = "squatting";
    } else if (this.state === "squatting" && dropRatio < this.STAND_UP_THRESHOLD) {
      this.state = "standing";
      this.squatCount++;
      if (this.onSquat) this.onSquat(this.squatCount);
    }
  }

  _getHipY(landmarks) {
    return (landmarks[LM.LEFT_HIP].y + landmarks[LM.RIGHT_HIP].y) / 2;
  }

  _getShoulderY(landmarks) {
    return (landmarks[LM.LEFT_SHOULDER].y + landmarks[LM.RIGHT_SHOULDER].y) / 2;
  }

  // ──────────────────────────────────────────────
  // 内部：オーバーレイ描画
  // ──────────────────────────────────────────────

  _drawOverlay(canvas, result) {
    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;
    if (W === 0 || H === 0) return;
    ctx.clearRect(0, 0, W, H);

    // DrawingUtils はキャンバスの ctx に紐付くため、
    // キャンバスが切り替わったら（キャリブレーション→ゲーム等）必ず再作成する
    if (!this.drawingUtils || this._overlayCtx !== ctx) {
      this.drawingUtils = new DrawingUtils(ctx);
      this._overlayCtx  = ctx;
    }

    // ── 1. 骨格（常時表示）──
    for (const landmark of result.landmarks) {
      this.drawingUtils.drawConnectors(
        landmark,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: "rgba(0, 255, 128, 0.65)", lineWidth: 2 }
      );
      this.drawingUtils.drawLandmarks(landmark, {
        color: "rgba(0, 255, 128, 0.95)",
        lineWidth: 1,
        radius: 4,
      });
    }

    // キャリブレーション前はここで終了
    if (!this.calibrated) return;

    const progress = Math.max(0, Math.min(1.5, this.lastDropRatio / this.SQUAT_DOWN_THRESHOLD));
    const reached  = this.state === "squatting"; // 閾値到達済み

    // ── 2. 「ここまで下げる」目標ライン ──
    // 目標の腰Y位置（正規化座標 → ピクセル）
    const targetHipYPx = (this.baselineHipY + this.bodySegmentHeight * this.SQUAT_DOWN_THRESHOLD) * H;
    const lineColor     = reached ? "#3AE07A" : "#F4A927";

    ctx.save();
    ctx.setLineDash([10, 7]);
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(W * 0.05, targetHipYPx);
    ctx.lineTo(W * 0.82, targetHipYPx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // ラベル「↓ ここまで下げる」
    ctx.font      = "bold 13px sans-serif";
    ctx.fillStyle = lineColor;
    ctx.textAlign = "left";
    // テキスト背景
    const labelText = reached ? "✓ 到達！" : "↓ ここまで下げる";
    const labelW    = ctx.measureText(labelText).width + 12;
    ctx.fillStyle   = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(W * 0.05, targetHipYPx + 4, labelW, 22, 4);
    ctx.fill();
    ctx.fillStyle = lineColor;
    ctx.fillText(labelText, W * 0.05 + 6, targetHipYPx + 20);
    ctx.restore();

    // ── 3. 右端：スクワット深度バー ──
    const barW  = 30;
    const barH  = H * 0.55;
    const barX  = W - barW - 14;
    const barY  = (H - barH) / 2;
    const fillH = barH * Math.min(1, progress);
    const fillY = barY + barH - fillH;

    const barColor = reached
      ? "#3AE07A"
      : progress > 0.65
      ? "#F4A927"
      : "#555";

    // 外枠
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.beginPath();
    ctx.roundRect(barX - 3, barY - 3, barW + 6, barH + 6, 7);
    ctx.fill();

    // 塗り（下から伸びる）
    if (fillH > 0) {
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(barX, fillY, barW, fillH, 4);
      ctx.fill();
    }

    // 100% ラインとチェックマーク
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(barX - 5, barY);
    ctx.lineTo(barX + barW + 5, barY);
    ctx.stroke();

    // ラベル上
    ctx.fillStyle = "#CCC";
    ctx.font      = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("深さ", barX + barW / 2, barY - 9);

    // パーセント表示（下）
    const pctText = `${Math.round(Math.min(100, progress * 100))}%`;
    ctx.fillStyle = reached ? "#3AE07A" : "#FFF";
    ctx.font      = `bold ${reached ? 13 : 11}px sans-serif`;
    ctx.fillText(pctText, barX + barW / 2, barY + barH + 18);
    ctx.restore();

    // ── 4. 下部ガイドテキスト ──
    let guideText, guideColor;
    if (reached) {
      guideText  = "✓ OK！ 立ち上がって ↑";
      guideColor = "#3AE07A";
    } else if (progress >= 0.85) {
      guideText  = "あと少し！ もっと深く ↓";
      guideColor = "#F4A927";
    } else if (progress >= 0.4) {
      guideText  = "もっと深く ↓";
      guideColor = "#F4A927";
    } else {
      guideText  = "スクワット ↓";
      guideColor = "rgba(255,255,255,0.7)";
    }

    ctx.save();
    const gW = ctx.measureText(guideText).width + 32;
    const gX = (W - gW) / 2;
    const gY = H - 54;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.beginPath();
    ctx.roundRect(gX, gY, gW, 36, 10);
    ctx.fill();
    ctx.fillStyle = guideColor;
    ctx.font      = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(guideText, W / 2, gY + 24);
    ctx.restore();
  }

  /** ポーズが検出されなかったときの表示 */
  _drawNopose(canvas) {
    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;
    if (W === 0 || H === 0) return;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const msg = "カメラに全身を映してください";
    ctx.font      = "bold 16px sans-serif";
    ctx.textAlign = "center";
    const mW = ctx.measureText(msg).width + 24;
    ctx.beginPath();
    ctx.roundRect((W - mW) / 2, H / 2 - 24, mW, 36, 8);
    ctx.fill();
    ctx.fillStyle = "#FFD700";
    ctx.fillText(msg, W / 2, H / 2);
    ctx.restore();
  }

  get status() {
    return {
      state:        this.state,
      squatCount:   this.squatCount,
      calibrated:   this.calibrated,
      lastDropRatio: this.lastDropRatio,
    };
  }
}
