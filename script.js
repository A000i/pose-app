let detector;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

// detector 初期化
async function initDetector() {
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
  detector = await poseDetection.createDetector(model, detectorConfig);
}
initDetector();

// 動画を選択したとき
document.getElementById('videoUpload').addEventListener('change', (event) => {
  const videoFile = event.target.files[0];
  if (!videoFile) return;

  video.src = URL.createObjectURL(videoFile);
});

// 再生ボタン
document.getElementById('playBtn').addEventListener('click', async () => {
  if (!detector) {
    alert("モデルを読み込み中です。少し待ってから再生してください。");
    return;
  }

  await video.play();

  // キャンバスサイズを設定
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // 推定ループ
  async function poseDetectionFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const poses = await detector.estimatePoses(video);

    for (const pose of poses) {
      if (pose.keypoints) {
        drawKeypoints(pose.keypoints, ctx);
        drawBodyLines(pose.keypoints, ctx);
      }
    }

    if (!video.paused && !video.ended) {
      requestAnimationFrame(poseDetectionFrame);
    }
  }

  poseDetectionFrame();
});

// --- 描画関数（ダミー。既に定義済みなら不要）---
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
  // ここに接続線の描画処理を書く
}
