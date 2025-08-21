// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCScgoBWjovuJA9a7M3upmWwXLE6GkZJTw",
  authDomain: "pose-comment-app.firebaseapp.com",
  projectId: "pose-comment-app",
  storageBucket: "pose-comment-app.firebasestorage.app",
  messagingSenderId: "495750776228",
  appId: "1:495750776228:web:ce8a8ed3fd33a671136d31",
  measurementId: "G-HWXSKN5P0S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM要素
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const commentInput = document.getElementById('commentInput');
const sendComment = document.getElementById('sendComment');
const commentList = document.getElementById('commentList');

let currentUser = null;
const VIDEO_ID = 'sample-video';
const commentsCollection = collection(db, 'comments');

// Googleログイン
loginBtn.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    alert('ログインに失敗しました');
  }
});

// ログイン状態監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    userInfo.textContent = `ログイン中: ${user.displayName}`;
    loginBtn.style.display = 'none';
  } else {
    currentUser = null;
    userInfo.textContent = 'ログインしてコメントしてください';
    loginBtn.style.display = 'inline-block';
  }
});

// コメント送信
sendComment.addEventListener('click', async () => {
  if (!currentUser) { alert('ログインしてください'); return; }
  const text = commentInput.value.trim();
  if (!text) return;

  await addDoc(commentsCollection, {
    videoId: VIDEO_ID,
    userId: currentUser.uid,
    userName: currentUser.displayName,
    text: text,
    timestamp: new Date().toISOString()
  });

  commentInput.value = '';
  loadComments();
});

// コメント一覧表示
async function loadComments() {
  commentList.innerHTML = '';
  const q = query(commentsCollection, orderBy('timestamp'));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.videoId === VIDEO_ID) {
      const li = document.createElement('li');
      li.textContent = `${new Date(data.timestamp).toLocaleString()} - ${data.userName}: ${data.text}`;
      commentList.appendChild(li);
    }
  });
}

// 初回ロード
loadComments();
