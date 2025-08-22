let detector;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

const videoPlayBtn = document.getElementById('videoPlayBtn');
const posePlayBtn  = document.getElementById('posePlayBtn');

let running = false;
let rafId = null;


// ====== TFJS/Detector 初期化 ======
(async () => {
  try {
    if (tf.getBackend() !== 'webgl') {
      await tf.setBackend('webgl');
    }
    await tf.ready();

    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
    detector = await poseDetection.createDetector(model, detectorConfig);
    console.log('Detector ready');
  } catch (e) {
    console.error('Detector init failed', e);
    alert('モデル初期化に失敗しました（コンソールを確認してください）');
  }
})();

// ====== ファイル選択 ======
document.getElementById('videoUpload').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  stopPoseDetection();
  video.src = URL.createObjectURL(file);

  // 動画の実寸が取れたタイミングでcanvasを合わせる（最重要）
  video.addEventListener('loadedmetadata', () => {
    canvas.width  = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    console.log('Sized canvas to', canvas.width, canvas.height);
  }, { once: true });
});

// ====== 動画 再生/停止 ======
videoPlayBtn.addEventListener('click', async () => {
  if (video.paused) {
    await video.play();
    videoPlayBtn.textContent = '⏸ 動画停止';
  } else {
    video.pause();
    videoPlayBtn.textContent = '▶ 動画再生';
  }
});

// ====== 骨格推定 開始/停止 ======
posePlayBtn.addEventListener('click', () => {
  if (!detector) {
    alert('モデルを読み込み中です。数秒後にお試しください。');
    return;
  }
  if (!video.src) {
    alert('先に動画ファイルを選択してください。');
    return;
  }
  if (!running) {
    startPoseDetection();
    posePlayBtn.textContent = '⏸ 骨格推定停止';
  } else {
    stopPoseDetection();
    posePlayBtn.textContent = '▶ 骨格推定開始';
  }
});

function startPoseDetection() {
  running = true;

  const loop = async () => {
    if (!running) return;

    // 背景として動画をそのまま実寸で描く
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const poses = await detector.estimatePoses(video, { flipHorizontal: false });
      // 推定が空でもエラーにはしない
      if (poses && poses.length > 0) {
        const kp = poses[0].keypoints;
        drawKeypoints(kp, ctx);
        drawBodyLines(kp, ctx);
      }
    } catch (err) {
      console.error('estimatePoses error', err);
    }

    rafId = requestAnimationFrame(loop);
  };

  // 動画が一時停止中なら再生ボタンを押させる（自動再生はブロックされがち）
  if (video.paused) {
    console.warn('動画が停止中です。先に「動画再生」を押してください。');
  }
  loop();
}

function stopPoseDetection() {
  running = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ====== 描画ユーティリティ ======
function drawKeypoints(keypoints, ctx) {
  for (const kp of keypoints) {
    if (kp?.score >= 0.3) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff2d2d';
      ctx.fill();
    }
  }
}

function drawBodyLines(keypoints, ctx) {
  // MoveNetの代表的な接続
  const C = (a, b) => [a, b];
  const edges = [
    C(5,7), C(7,9),    // 左腕
    C(6,8), C(8,10),   // 右腕
    C(11,13), C(13,15),// 左脚
    C(12,14), C(14,16),// 右脚
    C(5,6), C(11,12),  // 肩/腰
    C(5,11), C(6,12)   // 体幹
  ];
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#20c997';
  for (const [i, j] of edges) {
    const a = keypoints[i], b = keypoints[j];
    if (a?.score >= 0.3 && b?.score >= 0.3) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}
