let detector;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('playBtn');

let running = false; // 推定が動作中かどうか
let rafId = null;    // requestAnimationFrame のID

// detector 初期化
async function initDetector() {
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
  detector = await poseDetection.createDetector(model, detectorConfig);
}
initDetector();

// 動画選択
document.getElementById('videoUpload').addEventListener('change', (event) => {
  const videoFile = event.target.files[0];
  if (!videoFile) return;

  video.src = URL.createObjectURL(videoFile);
  stopPoseDetection(); // 新しい動画を選んだら一旦停止
});

// 再生 / 停止ボタン
playBtn.addEventListener('click', async () => {
  if (!detector) {
    alert("モデルを読み込み中です。少し待ってから再生してください。");
    return;
  }

  if (!running) {
    // ▶ 再生開始
    await video.play();
    startPoseDetection();
    playBtn.textContent = "⏸ 停止";
  } else {
    // ⏸ 停止
    video.pause();
    stopPoseDetection();
    playBtn.textContent = "▶ 再生";
  }
});

// 推定ループ開始
function startPoseDetection() {
  running = true;

  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  async function poseDetectionFrame() {
    if (!running) return; // 停止したら抜ける

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const poses = await detector.estimatePoses(video);

    for (const pose of poses) {
      if (pose.keypoints) {
        drawKeypoints(pose.keypoints, ctx);
        drawBodyLines(pose.keypoints, ctx);
      }
    }

    rafId = requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

// 推定ループ停止
function stopPoseDetection() {
  running = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// --- 描画関数（ダミー）---
function drawKeypoints(keypoints, ctx) {
  for (const kp of keypoints) {
    if (kp.score > 0.3) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  }
}

function drawBodyLines(keypoints, ctx) {
  // 接続線を描く処理（任意）
}
