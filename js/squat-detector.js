/**
 * squat-detector.js — MediaPipe Pose を使ったスクワット検出
 *
 * 検出アルゴリズム:
 * 1. 立った状態でキャリブレーション（腰のY座標を基準として記録）
 * 2. 腰が基準より bodyHeight * SQUAT_THRESHOLD 以上下がったら「スクワット中」
 * 3. 腰が基準付近に戻ったら「1回」カウント
 */

import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// MediaPipe のランドマーク番号
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
};

export class SquatDetector {
  constructor() {
    this.poseLandmarker = null;
    this.drawingUtils = null;
    this.running = false;
    this.lastVideoTime = -1;

    // スクワット検出の状態
    this.state = "standing"; // "standing" | "squatting"
    this.baselineHipY = null; // 立ち姿勢の腰Y座標（基準値）
    this.bodySegmentHeight = null; // 肩〜腰の距離（正規化の基準）
    this.calibrated = false;
    this.squatCount = 0;

    // 閾値（bodySegmentHeight に対する比率）
    this.SQUAT_DOWN_THRESHOLD = 0.28; // この割合だけ腰が下がったらスクワット開始
    this.STAND_UP_THRESHOLD = 0.08;   // この割合以内に戻ったらスクワット完了

    // 外部コールバック
    this.onSquat = null;       // スクワット1回完了時
    this.onPoseUpdate = null;  // フレームごとのランドマーク更新時
  }

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

  /** キャリブレーション：現在の腰の位置を「立ち姿勢の基準」として記録 */
  calibrate(landmarks) {
    const hipY = this._getHipY(landmarks);
    const shoulderY = this._getShoulderY(landmarks);

    this.baselineHipY = hipY;
    this.bodySegmentHeight = Math.abs(hipY - shoulderY);
    this.calibrated = true;
  }

  /** キャリブレーション状態のリセット */
  resetCalibration() {
    this.calibrated = false;
    this.baselineHipY = null;
    this.bodySegmentHeight = null;
    this.state = "standing";
    this.squatCount = 0;
  }

  /**
   * 動画フレームを処理してポーズを検出・スクワットを判定
   * @param {HTMLVideoElement} video
   * @param {HTMLCanvasElement} overlayCanvas - ポーズ描画先（省略可）
   */
  processFrame(video, overlayCanvas = null) {
    if (!this.poseLandmarker || !this.running) return;
    if (video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = video.currentTime;

    const result = this.poseLandmarker.detectForVideo(video, performance.now());

    // ポーズが検出された場合
    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];

      // オーバーレイ描画
      if (overlayCanvas) {
        this._drawOverlay(overlayCanvas, result);
      }

      // スクワット判定
      if (this.calibrated) {
        this._detectSquat(landmarks);
      }

      // 外部へのランドマーク通知
      if (this.onPoseUpdate) {
        this.onPoseUpdate(landmarks);
      }
    }
  }

  /** ポーズ検出の開始 */
  start() {
    this.running = true;
  }

  /** ポーズ検出の停止 */
  stop() {
    this.running = false;
  }

  // ──────────────────────────────────────────────
  // 内部メソッド
  // ──────────────────────────────────────────────

  /** スクワットの状態機械 */
  _detectSquat(landmarks) {
    const hipY = this._getHipY(landmarks);
    const dropRatio =
      (hipY - this.baselineHipY) / this.bodySegmentHeight;

    if (this.state === "standing" && dropRatio > this.SQUAT_DOWN_THRESHOLD) {
      // 立ち→スクワット
      this.state = "squatting";
    } else if (
      this.state === "squatting" &&
      dropRatio < this.STAND_UP_THRESHOLD
    ) {
      // スクワット→立ち（1回完了）
      this.state = "standing";
      this.squatCount++;
      if (this.onSquat) {
        this.onSquat(this.squatCount);
      }
    }
  }

  /** 腰のY座標の平均を返す */
  _getHipY(landmarks) {
    return (
      (landmarks[LM.LEFT_HIP].y + landmarks[LM.RIGHT_HIP].y) / 2
    );
  }

  /** 肩のY座標の平均を返す */
  _getShoulderY(landmarks) {
    return (
      (landmarks[LM.LEFT_SHOULDER].y + landmarks[LM.RIGHT_SHOULDER].y) / 2
    );
  }

  /** キャンバスにポーズのオーバーレイを描画 */
  _drawOverlay(canvas, result) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.drawingUtils) {
      this.drawingUtils = new DrawingUtils(ctx);
    }

    for (const landmark of result.landmarks) {
      // 骨格の線
      this.drawingUtils.drawConnectors(
        landmark,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: "rgba(0, 255, 128, 0.6)", lineWidth: 2 }
      );
      // 関節点
      this.drawingUtils.drawLandmarks(landmark, {
        color: "rgba(0, 255, 128, 0.9)",
        lineWidth: 1,
        radius: 3,
      });
    }

    // スクワット中のインジケーター
    if (this.state === "squatting") {
      ctx.save();
      ctx.fillStyle = "rgba(255, 200, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  /** 現在のスクワット状態（デバッグ用） */
  get status() {
    return {
      state: this.state,
      squatCount: this.squatCount,
      calibrated: this.calibrated,
      baselineHipY: this.baselineHipY,
    };
  }
}
