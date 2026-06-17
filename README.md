# Wedding Checklist 🌿

커플이 함께 쓰는 결혼 준비 체크리스트 웹앱.  
Firebase Firestore 실시간 동기화 + Vercel 배포.

---

## 로컬 실행

```bash
npm install
npm start
```

---

## Vercel 배포 방법

### 1. GitHub에 올리기

```bash
git init
git add .
git commit -m "first commit"
```

GitHub에서 새 repository 만들고 (예: `wedding-checklist`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/wedding-checklist.git
git branch -M main
git push -u origin main
```

### 2. Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. "Add New Project" → 위에서 만든 repo 선택
3. Framework: **Create React App** 자동 감지됨
4. "Deploy" 클릭
5. 완료! `https://wedding-checklist-xxx.vercel.app` 주소 생성

---

## 사용법

1. 접속하면 **"새 체크리스트 만들기"** 클릭 → 6자리 방 코드 생성
2. 파트너에게 방 코드 공유
3. 파트너는 **"기존 방 코드로 입장"** → 코드 입력
4. 이제 두 사람이 같은 체크리스트를 실시간으로 공유!

---

## 파일 구조

```
src/
  firebase.js     # Firebase 설정 및 Firestore 함수
  constants.js    # 색상, 데이터, 상수
  RoomGate.jsx    # 방 만들기 / 입장 화면
  App.jsx         # 메인 앱 (체크리스트, 일정, 예산 탭)
  index.js        # 진입점
```
