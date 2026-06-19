# Supabase 전환 + Google 로그인 / 내 방 목록 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드를 Firebase에서 Supabase로 전환하고 Google 로그인을 도입해, 방을 계정에 연결하고 "내 방 목록"에서 코드 없이 입장할 수 있게 한다.

**Architecture:** React(CRA) SPA. 데이터/인증 함수는 `src/supabase.js` 한곳에 모은다(기존 `firebase.js` 대체). `index.js`가 인증 세션을 구독해 Login / RoomList / App 세 화면을 라우팅한다. 방은 Postgres `rooms` 테이블(멤버 uuid 배열) + RLS + `join_room` RPC로 보호된다. 실시간 동기화는 Supabase Realtime.

**Tech Stack:** React 18, Create React App(react-scripts 5), `@supabase/supabase-js`, Jest(번들). Supabase(Postgres + Auth + Realtime).

## Global Constraints

- 로그인 필수. 미로그인 시 앱 기능 접근 불가.
- Supabase 자격증명은 코드에 하드코딩하지 않고 환경변수로:
  `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`.
  - URL: `https://esexnjuekeopfaentzvf.supabase.co`
  - anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZXhuanVla2VvcGZhZW50enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDE3NzcsImV4cCI6MjA5NzM3Nzc3N30.UIS51es8ln46AlGeP-jZZPmkGfl3cLAyCs5Y5pvMcyY`
- `.env`는 gitignore(커밋 금지), `.env.example`은 키 이름만 담아 커밋.
- `rooms` 컬럼명은 snake_case(`wedding_date`), 앱 내부 상태는 camelCase(`weddingDate`) — 경계(`supabase.js`)에서 변환한다.
- `join_room` RPC 파라미터명은 `room_code`(스키마와 일치), 코드는 항상 대문자.
- 데이터 모델/시드(47개 항목)는 기존 `constants.js`의 `seedItems()`를 그대로 사용.
- CRA는 `.env`를 **시작 시 1회** 읽으므로, `.env` 변경 후 dev 서버 재시작 필요.

---

## File Structure

- `src/supabase.js` — 신규. Supabase client + 인증/방 함수. `firebase.js` 대체.
- `src/constants.js` — `makeCode()`(6자리 코드 생성) 추가. 순수 함수라 여기서 테스트.
- `src/constants.test.js` — `makeCode` 테스트 추가.
- `src/Login.jsx` — 신규. Google 로그인 화면.
- `src/RoomList.jsx` — 신규. 내 방 목록 + 생성 + 코드 입장 + 로그아웃. `RoomGate.jsx` 대체.
- `src/index.js` — 인증 게이트 + 화면 라우팅으로 재작성.
- `src/App.jsx` — 데이터 함수 import를 supabase로 교체, 헤더에 "목록으로"·로그아웃 추가.
- `.env`(gitignore), `.env.example`, `.gitignore` — 환경변수.
- 삭제: `src/firebase.js`, `src/RoomGate.jsx`, `firestore.rules`.
- `package.json` — `firebase` 제거, `@supabase/supabase-js` 추가.
- `README.md` — Supabase 기준 갱신.

---

## Task 1: 기반 — 의존성·환경변수·supabase.js·코드 생성기(TDD)

**Files:**
- Modify: `package.json`(의존성), `.gitignore`
- Create: `.env`, `.env.example`
- Modify: `src/constants.js` (`makeCode` 추가)
- Test: `src/constants.test.js`
- Create: `src/supabase.js`

**Interfaces:**
- Produces:
  - `makeCode(): string` — `[A-Z0-9]` 6자리.
  - `supabase` (client), `signInWithGoogle()`, `signOut()`, `onAuth(cb): () => void`,
    `listMyRooms(): Promise<Room[]>`, `createRoom(title): Promise<string>`,
    `joinRoom(code): Promise<Room>`, `saveRoom(code, {items, weddingDate}): Promise<void>`,
    `subscribeRoom(code, cb): () => void`. `cb`는 `{ items, weddingDate }`를 받는다.

- [ ] **Step 1: 의존성 설치 / 제거**

Run:
```bash
npm install @supabase/supabase-js
```
(firebase 제거는 Task 3에서. 지금 제거하면 아직 firebase를 쓰는 App/index 빌드가 깨진다.)

Expected: `@supabase/supabase-js`가 `package.json` dependencies에 추가됨.

- [ ] **Step 2: 환경변수 파일 생성**

`.env` (gitignore 대상) 생성:
```
REACT_APP_SUPABASE_URL=https://esexnjuekeopfaentzvf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZXhuanVla2VvcGZhZW50enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDE3NzcsImV4cCI6MjA5NzM3Nzc3N30.UIS51es8ln46AlGeP-jZZPmkGfl3cLAyCs5Y5pvMcyY
```

`.env.example` (커밋 대상) 생성:
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

`.gitignore`에 `.env` 추가(기존 내용 유지):
```
node_modules
/build
.env
```

- [ ] **Step 3: `makeCode` 실패 테스트 추가**

`src/constants.test.js` 맨 아래에 추가:
```js
import { makeCode } from "./constants";

test("makeCode는 6자리 대문자/숫자 코드를 만든다", () => {
  for (let i = 0; i < 100; i++) {
    expect(makeCode()).toMatch(/^[A-Z0-9]{6}$/);
  }
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: FAIL — `makeCode is not a function`.

- [ ] **Step 5: `makeCode` 구현**

`src/constants.js`의 기존 `uid` 정의 아래에 추가:
```js
export const makeCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `CI=true npx react-scripts test src/constants.test.js`
Expected: PASS (기존 8개 + 1개 = 9 tests).

- [ ] **Step 7: `src/supabase.js` 생성**

```js
import { createClient } from "@supabase/supabase-js";
import { seedItems, makeCode } from "./constants";

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

/* ── 인증 ── */
export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

// 현재 세션 user를 즉시 전달하고 이후 변화도 구독. 해제 함수 반환.
export function onAuth(callback) {
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user ?? null);
  });
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => sub.subscription.unsubscribe();
}

/* ── 방 ── */
export async function listMyRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("code,title,wedding_date,items,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRoom(title) {
  const { data: { user } } = await supabase.auth.getUser();
  const code = makeCode();
  const { error } = await supabase.from("rooms").insert({
    code,
    title: title || "",
    members: [user.id],
    items: seedItems(),
    wedding_date: "",
  });
  if (error) throw error;
  return code;
}

export async function joinRoom(code) {
  const { data, error } = await supabase.rpc("join_room", {
    room_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  return data; // 방 행 (없는 코드면 RPC가 에러를 던짐)
}

export async function saveRoom(code, { items, weddingDate }) {
  const { error } = await supabase
    .from("rooms")
    .update({ items, wedding_date: weddingDate })
    .eq("code", code);
  if (error) throw error;
}

// 최초 상태 1회 + 이후 UPDATE 실시간. callback({ items, weddingDate }). 해제 함수 반환.
export function subscribeRoom(code, callback) {
  let active = true;
  supabase
    .from("rooms")
    .select("items,wedding_date")
    .eq("code", code)
    .single()
    .then(({ data }) => {
      if (active && data) callback({ items: data.items, weddingDate: data.wedding_date });
    });

  const channel = supabase
    .channel(`room:${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
      (payload) => callback({ items: payload.new.items, weddingDate: payload.new.wedding_date })
    )
    .subscribe();

  return () => { active = false; supabase.removeChannel(channel); };
}
```

- [ ] **Step 8: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`. (앱은 아직 firebase 경로로 동작; supabase.js는 어디서도 import되지 않아 부작용 없음.)

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json .gitignore .env.example src/constants.js src/constants.test.js src/supabase.js
git commit -m "feat: Supabase 클라이언트·인증/방 함수 + makeCode (firebase 미제거)"
```
(`.env`는 gitignore로 커밋되지 않음 — 정상.)

---

## Task 2: 진입 흐름 — Login·RoomList·index 라우팅

**Files:**
- Create: `src/Login.jsx`, `src/RoomList.jsx`
- Modify: `src/index.js`
- Delete: `src/RoomGate.jsx`

**Interfaces:**
- Consumes(Task 1): `onAuth`, `signInWithGoogle`, `signOut`, `listMyRooms`, `createRoom`, `joinRoom`.
- Produces: `<Login/>`, `<RoomList onEnter={(code)=>void} />`. `index.js`는 `App`에 `roomCode`와 `onLeave`를 넘긴다.

- [ ] **Step 1: `src/Login.jsx` 생성**

```jsx
import { useState } from "react";
import { signInWithGoogle } from "./supabase";
import { C } from "./constants";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await signInWithGoogle();
    if (error) { setError("로그인에 실패했어요. 다시 시도해 주세요."); setLoading(false); }
    // 성공 시 구글로 리디렉트됨
  }

  return (
    <div style={{
      maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#fff",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"32px 24px",
      fontFamily:'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",system-ui,sans-serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=swap');`}</style>
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:38, fontWeight:700, fontFamily:"'Playfair Display',Georgia,serif",
          fontStyle:"italic", letterSpacing:"-.5px", color:C.t900 }}>
          Wedding Checklist
        </div>
        <div style={{ fontSize:14, color:C.t400, marginTop:8, fontWeight:500 }}>
          커플이 함께 쓰는 결혼 준비 앱
        </div>
      </div>
      <button onClick={handleLogin} disabled={loading} style={{
        width:"100%", padding:"16px", background:C.green, color:"#fff", border:"none",
        borderRadius:14, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
      }}>
        {loading ? "이동 중…" : "Google로 시작하기"}
      </button>
      {error && <div style={{ color:C.red, fontSize:13, marginTop:12, fontWeight:600 }}>{error}</div>}
      <p style={{ fontSize:13, color:C.t400, marginTop:24, textAlign:"center", lineHeight:1.6 }}>
        로그인하면 만든 방이 계정에 저장돼<br/>코드를 잊어도 다시 들어올 수 있어요.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: `src/RoomList.jsx` 생성**

```jsx
import { useState, useEffect, useCallback } from "react";
import { listMyRooms, createRoom, joinRoom, signOut } from "./supabase";
import { C } from "./constants";

export default function RoomList({ onEnter }) {
  const [rooms, setRooms] = useState(null);
  const [mode, setMode]   = useState(null); // null | "create" | "join"
  const [title, setTitle] = useState("");
  const [code, setCode]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setRooms(await listMyRooms()); }
    catch { setRooms([]); setError("목록을 불러오지 못했어요."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setBusy(true); setError("");
    try { const c = await createRoom(title.trim()); onEnter(c); }
    catch { setError("방 생성에 실패했어요."); setBusy(false); }
  }

  async function handleJoin() {
    const t = code.trim().toUpperCase();
    if (t.length < 4) { setError("방 코드를 입력해 주세요."); return; }
    setBusy(true); setError("");
    try { await joinRoom(t); onEnter(t); }
    catch { setError("존재하지 않는 방 코드예요. 다시 확인해 주세요."); setBusy(false); }
  }

  const wrap = {
    maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#fff", padding:"28px 22px",
    fontFamily:'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",system-ui,sans-serif',
  };
  const btnGreen = { width:"100%", padding:"15px", background:C.green, color:"#fff", border:"none",
    borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:10 };
  const btnGrey  = { ...btnGreen, background:"#fff", color:C.t700, border:`1.5px solid ${C.line}` };
  const inp = { width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.line}`, borderRadius:14,
    padding:"14px 16px", fontSize:16, color:C.t900, outline:"none", fontFamily:"inherit", background:"#fff" };

  return (
    <div style={wrap}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:C.t900 }}>내 방 목록</div>
        <button onClick={() => signOut()} style={{ fontSize:13, fontWeight:600, color:C.t500,
          background:C.greyBg, border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer" }}>
          로그아웃
        </button>
      </div>

      {rooms === null ? (
        <div style={{ color:C.t500, fontSize:14, padding:"40px 0", textAlign:"center" }}>불러오는 중…</div>
      ) : rooms.length === 0 ? (
        <div style={{ color:C.t400, fontSize:14, padding:"32px 0", textAlign:"center", lineHeight:1.6 }}>
          아직 방이 없어요.<br/>새 방을 만들거나 코드로 입장해 보세요.
        </div>
      ) : (
        <div>
          {rooms.map((r) => {
            const total = (r.items || []).length;
            const done = (r.items || []).filter((i) => i.status === "done").length;
            return (
              <button key={r.code} onClick={() => onEnter(r.code)} style={{
                width:"100%", textAlign:"left", background:"#fff", border:`1px solid ${C.line}`,
                borderRadius:16, padding:"16px 18px", marginBottom:10, cursor:"pointer", fontFamily:"inherit",
              }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.t900 }}>{r.title || r.code}</div>
                <div style={{ fontSize:12.5, color:C.t500, marginTop:4 }}>
                  코드 {r.code} · {done}/{total} 완료{r.wedding_date ? ` · 예식 ${r.wedding_date}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!mode && (
        <>
          <button style={btnGreen} onClick={() => { setMode("create"); setError(""); }}>+ 새 방 만들기</button>
          <button style={btnGrey}  onClick={() => { setMode("join");   setError(""); }}>🔗 코드로 입장</button>
        </>
      )}

      {mode === "create" && (
        <div style={{ marginTop:16 }}>
          <input style={inp} autoFocus placeholder="방 이름 (예: 준서♥지윤 결혼준비)"
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} />
          <button style={btnGreen} onClick={handleCreate} disabled={busy}>
            {busy ? "생성 중…" : "만들기"}
          </button>
          <button style={btnGrey} onClick={() => { setMode(null); setTitle(""); setError(""); }}>← 뒤로</button>
        </div>
      )}

      {mode === "join" && (
        <div style={{ marginTop:16 }}>
          <input style={{ ...inp, textAlign:"center", letterSpacing:4, fontWeight:800, textTransform:"uppercase" }}
            autoFocus placeholder="AB1CD2" maxLength={6}
            value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }} />
          <button style={btnGreen} onClick={handleJoin} disabled={busy || !code.trim()}>
            {busy ? "확인 중…" : "입장하기"}
          </button>
          <button style={btnGrey} onClick={() => { setMode(null); setCode(""); setError(""); }}>← 뒤로</button>
        </div>
      )}

      {error && <div style={{ color:C.red, fontSize:13, marginTop:12, fontWeight:600, textAlign:"center" }}>{error}</div>}
    </div>
  );
}
```

- [ ] **Step 3: `src/index.js` 재작성**

```jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { onAuth } from "./supabase";
import { C } from "./constants";
import Login from "./Login";
import RoomList from "./RoomList";
import App from "./App";

function Splash() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh",
      fontFamily:"system-ui,sans-serif", color:C.t500, fontSize:15 }}>
      불러오는 중…
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem("weddingRoomCode"));

  useEffect(() => {
    const unsub = onAuth((u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) { localStorage.removeItem("weddingRoomCode"); setRoomCode(null); }
    });
    return unsub;
  }, []);

  const enterRoom = (code) => { localStorage.setItem("weddingRoomCode", code); setRoomCode(code); };
  const leaveRoom = () => { localStorage.removeItem("weddingRoomCode"); setRoomCode(null); };

  if (!authReady) return <Splash />;
  if (!user) return <Login />;
  if (!roomCode) return <RoomList onEnter={enterRoom} />;
  return <App roomCode={roomCode} onLeave={leaveRoom} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><Root /></React.StrictMode>);
```

- [ ] **Step 4: `src/RoomGate.jsx` 삭제**

```bash
git rm src/RoomGate.jsx
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`. (이 시점에서 App.jsx는 아직 `./firebase`를 import하지만 firebase.js는 남아 있어 빌드는 통과. 단, 생성된 방은 Supabase에 있고 App은 firebase를 읽으므로 **방 안 데이터는 Task 3 전까지 동작하지 않음** — 정상.)

- [ ] **Step 6: 부분 수동 확인 (선택, dashboard로 검증 가능)**

`.env` 설정 후 dev 서버 재시작 → `npm start`:
- 로그인 화면이 뜨고 Google 로그인 후 "내 방 목록"으로 이동.
- "새 방 만들기"로 방 생성 시 Supabase 대시보드 `rooms` 테이블에 행이 생기고 `members`에 내 uid가 들어가는지.
- (방 안 화면 데이터 동작은 Task 3에서 검증.)

- [ ] **Step 7: 커밋**

```bash
git add src/Login.jsx src/RoomList.jsx src/index.js
git rm --cached src/RoomGate.jsx 2>/dev/null; true
git commit -m "feat: Google 로그인 + 내 방 목록 화면, index 인증 라우팅 (RoomGate 제거)"
```

---

## Task 3: App 전환 + 정리

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/firebase.js`, `firestore.rules`
- Modify: `package.json`(firebase 제거), `README.md`

**Interfaces:**
- Consumes(Task 1): `saveRoom`, `subscribeRoom`, `signOut`.

- [ ] **Step 1: App.jsx의 데이터 import 교체**

`src/App.jsx:2`를 교체:
```js
import { saveRoom, subscribeRoom, signOut } from "./supabase";
```
(기존 `import { saveRoom, subscribeRoom } from "./firebase";` 대체. `signOut` 추가.)

- [ ] **Step 2: 구독 콜백 형태 확인 (변경 없음 확인)**

`App` 컴포넌트의 subscribe useEffect는 다음과 같아야 한다(이미 동일 형태). supabase의 `subscribeRoom`은 `{ items, weddingDate }`를 콜백으로 주고 해제 함수를 반환하므로 기존 코드와 호환된다. 그대로 둔다:
```js
  useEffect(() => {
    const unsub = subscribeRoom(roomCode, (data) => {
      if (skipNextSync.current) { skipNextSync.current = false; return; }
      setItems(data.items || seedItems());
      setWeddingDate(data.weddingDate || "");
      setSynced(true);
    });
    return unsub;
  }, [roomCode]);
```

- [ ] **Step 3: 헤더에 "목록으로" + 로그아웃 추가**

`src/App.jsx`의 `App({ roomCode })` 시그니처를 `App({ roomCode, onLeave })`로 바꾼다.

헤더의 코드 버튼 영역(`sx.codeBtn`이 있는 `headerSubRow`)에서, 기존 `🔗 {roomCode}` 버튼 옆에 "목록으로" 버튼을 추가한다. 현재:
```jsx
        <div style={sx.headerSubRow}>
          <button onClick={() => setShowCode(v=>!v)} style={sx.codeBtn}>
            🔗 {roomCode}
          </button>
```
를 다음으로 교체:
```jsx
        <div style={sx.headerSubRow}>
          <button onClick={() => onLeave && onLeave()} style={sx.codeBtn}>
            ← 목록
          </button>
          <button onClick={() => setShowCode(v=>!v)} style={sx.codeBtn}>
            🔗 {roomCode}
          </button>
          <button onClick={() => signOut()} style={sx.codeBtn}>
            로그아웃
          </button>
```
(나머지 `headerSubRow` 내용 — `ddayLabel` 등 — 은 그대로 유지.)

- [ ] **Step 4: firebase 잔재 삭제**

```bash
git rm src/firebase.js firestore.rules
npm uninstall firebase
```

- [ ] **Step 5: README 갱신**

`README.md`에서 Firebase 언급을 Supabase로 바꾸고, 로컬 실행에 `.env`(`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`)가 필요함을 명시한다. "파일 구조" 절의 `firebase.js`를 `supabase.js`로, `RoomGate.jsx`를 `Login.jsx`/`RoomList.jsx`로 갱신한다. (정확한 문구는 기존 README 톤을 따른다.)

- [ ] **Step 6: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`, firebase 참조로 인한 에러 없음.

- [ ] **Step 7: 전체 수동 검증**

`.env` 설정 후 dev 서버 재시작 → `npm start`, 브라우저에서:
1. Google 로그인 → 내 방 목록.
2. "새 방 만들기"(이름 입력) → 방 입장 → 체크리스트 47개, 11개 카테고리 표시.
3. 헤더 예식일 설정 → 일정 탭 시기 표시.
4. 항목 편집 후, **다른 브라우저(또는 시크릿)에서 다른 구글 계정 로그인 → "코드로 입장"** → 같은 방 진입, 한쪽 변경이 다른 쪽에 실시간 반영.
5. 헤더 "← 목록"으로 목록 복귀, "로그아웃" 후 재로그인 시 목록에 방 유지.

- [ ] **Step 8: 커밋**

```bash
git add src/App.jsx package.json package-lock.json README.md
git rm --cached src/firebase.js firestore.rules 2>/dev/null; true
git commit -m "feat: App 데이터 계층 Supabase 전환 + 방 전환/로그아웃, firebase 제거"
```

---

## Self-Review (작성자 점검 완료)

- **Spec coverage:** 로그인 필수(index 게이트) · Supabase 데이터/인증(`supabase.js`) · 내 방 목록(RoomList) · 코드 입장(joinRoom RPC) · App 실시간(subscribeRoom) · 방 전환/로그아웃(헤더) · env 관리 · firebase 제거 — 모두 태스크에 대응. 데이터 미이전은 의도(스펙 명시).
- **Placeholder scan:** 신규 파일은 전체 코드 포함. README만 "기존 톤을 따른다"로 문구 재량을 뒀으나 변경 대상(파일명 치환)은 구체화함.
- **Type consistency:** `subscribeRoom`/`saveRoom` 콜백·인자 형태(`{ items, weddingDate }`)가 Task 1 정의와 Task 3 사용처에서 일치. `joinRoom`은 `room_code` 파라미터로 RPC 호출(스키마 함수와 일치). `onAuth`/`signOut`/`signInWithGoogle` 시그니처가 Login/RoomList/index/App 사용처와 일치.
- **빌드 연속성:** Task 1·2 동안 `firebase.js`를 남겨 빌드가 깨지지 않게 했고, Task 3에서만 제거. Task 2 종료 시점엔 방 내부 데이터가 동작하지 않는 과도기임을 명시.
