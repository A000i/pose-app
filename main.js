// ボタン中央寄せ用の関数
function centerVideoButtons() {
  const btnArea = document.getElementById('videoBtnArea');
  if (btnArea) btnArea.style.textAlign = 'center';
}

function leftVideoButtons() {
  const btnArea = document.getElementById('videoBtnArea');
  if (btnArea) btnArea.style.textAlign = 'left';
}
// 骨格推定開始ボタンで中央寄せ
const posePlayBtn = document.getElementById('posePlayBtn');
if (posePlayBtn) {
  posePlayBtn.addEventListener('click', () => {
    centerVideoButtons();
  });
}
// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCScgoBWjovuJA9a7M3upmWwXLE6GkZJTw",
  authDomain: "pose-comment-app.firebaseapp.com",
  projectId: "pose-comment-app",
  storageBucket: "pose-comment-app.firebasestorage.app",
  messagingSenderId: "495750776228",
  appId: "1:495750776228:web:ce8a8ed3fd33a671136d31",
  measurementId: "G-HWXSKN5P0S"
};

const app = initializeApp({
  ...firebaseConfig,
  storageBucket: "pose-comment-app.appspot.com"
});
const db = getFirestore(app);
const auth = getAuth(app);


// DOM要素
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const commentInput = document.getElementById('commentInput');
const sendComment = document.getElementById('sendComment');
const commentList = document.getElementById('commentList');
const videoUpload = document.getElementById('videoUpload');
const videoTitle = document.getElementById('videoTitle');
const uploadVideoBtn = document.getElementById('uploadVideoBtn');
const uploadStatus = document.getElementById('uploadStatus');
const videoList = document.getElementById('videoList');
const selectedVideo = document.getElementById('selectedVideo');
const selectedVideoTitle = document.getElementById('selectedVideoTitle');

const storage = getStorage(app, "gs://pose-comment-app.appspot.com");
const videosCollection = collection(db, 'videos');
let selectedVideoId = null;
// 動画アップロード処理
if (uploadVideoBtn) {
  uploadVideoBtn.addEventListener('click', async () => {
    const file = videoUpload.files[0];
    const title = videoTitle.value.trim();
    if (!file) {
      uploadStatus.textContent = '動画ファイルを選択してください';
      return;
    }
    if (!title) {
      uploadStatus.textContent = '動画タイトルを入力してください';
      return;
    }
    uploadStatus.textContent = 'アップロード中...';
    try {
      const storageRef = ref(storage, 'videos/' + Date.now() + '_' + file.name);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const videoDoc = await addDoc(videosCollection, {
        title,
        url,
        createdAt: new Date().toISOString(),
        userId: currentUser ? currentUser.uid : null,
        userName: currentUser ? currentUser.displayName : null
      });
      uploadStatus.textContent = 'アップロード完了！';
      videoUpload.value = '';
      videoTitle.value = '';
      loadVideoList();
    } catch (e) {
      uploadStatus.textContent = 'アップロード失敗: ' + e.message;
    }
  });
}

// 動画リストの表示
async function loadVideoList() {
  videoList.innerHTML = '';
  const q = query(videosCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement('div');
    div.style.border = '1px solid #aaa';
    div.style.padding = '0.5em';
    div.style.cursor = 'pointer';
    div.style.width = '180px';
    div.innerHTML = `<div style="font-weight:bold;">${data.title}</div><video src="${data.url}" style="width:100%;max-height:100px;object-fit:cover;" muted></video>`;
    div.onclick = () => selectVideo(docSnap.id, data);
    videoList.appendChild(div);
  });
}

// 動画選択時の処理
function selectVideo(videoId, data) {
  selectedVideoId = videoId;
  selectedVideo.src = data.url;
  selectedVideo.style.display = 'block';
  selectedVideoTitle.textContent = data.title;
  loadComments();
}

// 初回ロードで動画リスト表示
loadVideoList();
let currentUser = null;
// コメント保存時は選択中の動画IDを使う
// const VIDEO_ID = 'sample-video';
const commentsCollection = collection(db, 'comments');

// Googleログイン
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (userInfo) {
        userInfo.textContent = `ログイン中: ${user.displayName}`;
      }
      alert('ログイン成功: ' + user.displayName);
    } catch (e) {
      console.error(e);
      alert('ログインに失敗しました: ' + e.message);
    }
  });
}

// ログイン状態監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    userInfo.textContent = `ログイン中: ${user.displayName}`;
  if (loginBtn) loginBtn.style.display = 'none';
  } else {
    currentUser = null;
    userInfo.textContent = 'ログインしてください';
  if (loginBtn) loginBtn.style.display = 'inline-block';
  }
});

// コメント送信
sendComment.addEventListener('click', async () => {
  if (!currentUser) { alert('ログインしてください'); return; }
  const text = commentInput.value.trim();
  if (!text) return;
  if (!selectedVideoId) { alert('動画を選択してください'); return; }

  try {
    await addDoc(commentsCollection, {
      videoId: selectedVideoId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      text: text,
      timestamp: new Date().toISOString()
    });
    commentInput.value = '';
    loadComments();
    alert('コメントを送信しました');
  } catch (e) {
    alert('コメントの送信に失敗しました: ' + e.message);
  }
});


// コメント一覧表示
async function loadComments() {
  commentList.innerHTML = '';
  if (!selectedVideoId) return;
  const q = query(commentsCollection, orderBy('timestamp'));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.videoId === selectedVideoId) {
      const li = document.createElement('li');
      li.textContent = `${new Date(data.timestamp).toLocaleString()} - ${data.userName}: ${data.text}`;
      commentList.appendChild(li);
    }
  });
}

// 初回ロード
loadComments();

