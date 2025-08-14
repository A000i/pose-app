let detector;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

document.getElementById('videoUpload').addEventListener('change', async (event) => {
  const videoFile = event.target.files[0];
  if (!videoFile) return;

  video.src = URL.createObjectURL(videoFile);
  await video.play();

  // 表示サイズを取得してcanvasに設定
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

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

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
});
