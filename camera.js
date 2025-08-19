let videoPlayer;
let detector;
let overlayCanvas;
let overlayCtx;

const adjacentPairs = [
    [0, 1], [1, 3], [0, 2], [2, 4],    // 顔まわり
    [5, 7], [7, 9],                    // 左腕
    [6, 8], [8, 10],                   // 右腕
    [5, 6],                            // 肩
    [5, 11], [6, 12],                  // 胴体上部
    [11, 12],                          // 腰
    [11, 13], [13, 15],               // 左脚
    [12, 14], [14, 16]                // 右脚
];

// MoveNetモデル読み込み
async function loadMoveNet() {
    await tf.setBackend('webgl');
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
}

// カメラ起動
async function loadCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
    });
    videoPlayer.srcObject = stream;

    return new Promise((resolve) => {
        videoPlayer.onloadedmetadata = () => {
            resolve();
        };
    });
}

// ポーズ推定
async function estimatePoses(video) {
    try {
        return await detector.estimatePoses(video);
    } catch (error) {
        console.error('姿勢推定エラー:', error);
        return [];
    }
}

// 点と線を描画
function drawKeypointsAndSkeleton(poses) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    poses.forEach((pose) => {
        const keypoints = pose.keypoints;

        // 点（キーポイント）
        keypoints.forEach((keypoint) => {
            if (keypoint.score > 0.3) {
                overlayCtx.beginPath();
                overlayCtx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
                overlayCtx.fillStyle = 'red';
                overlayCtx.fill();
            }
        });

        // 線（骨格）
        adjacentPairs.forEach(([i, j]) => {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];

            if (kp1.score > 0.3 && kp2.score > 0.3) {
                overlayCtx.beginPath();
                overlayCtx.moveTo(kp1.x, kp1.y);
                overlayCtx.lineTo(kp2.x, kp2.y);
                overlayCtx.strokeStyle = 'green';
                overlayCtx.lineWidth = 3;
                overlayCtx.stroke();
            }
        });
    });
}

// 検出ループ
async function detect() {
    if (videoPlayer.readyState === 4) {
        const poses = await estimatePoses(videoPlayer);
        drawKeypointsAndSkeleton(poses);
    }
    requestAnimationFrame(detect);
}

// ページ読み込み時
window.onload = async () => {
    videoPlayer = document.getElementById('videoPlayer');
    overlayCanvas = document.getElementById('overlayCanvas');
    overlayCtx = overlayCanvas.getContext('2d');

    await loadMoveNet();
    await loadCamera();

    // 映像とcanvasサイズをピクセル単位で一致させる
    overlayCanvas.width = videoPlayer.videoWidth;
    overlayCanvas.height = videoPlayer.videoHeight;

    detect();
};
