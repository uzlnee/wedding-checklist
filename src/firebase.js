import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZJgMKM6wLnoXGAju0ZrlbwWsggYt4gzc",
  authDomain: "wedding-checklist-4343d.firebaseapp.com",
  projectId: "wedding-checklist-4343d",
  storageBucket: "wedding-checklist-4343d.firebasestorage.app",
  messagingSenderId: "225102495900",
  appId: "1:225102495900:web:af4cafcff038448bc3ad59",
  measurementId: "G-3XJYB0VJRG",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 방 코드로 Firestore 문서 경로 결정
export const roomRef = (roomCode) =>
  doc(db, "rooms", roomCode.toUpperCase());

// 방 존재 여부 확인
export async function roomExists(roomCode) {
  const snap = await getDoc(roomRef(roomCode));
  return snap.exists();
}

// 방 데이터 저장
export async function saveRoom(roomCode, data) {
  await setDoc(roomRef(roomCode), data, { merge: true });
}

// 방 데이터 실시간 구독
export function subscribeRoom(roomCode, callback) {
  return onSnapshot(roomRef(roomCode), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}
