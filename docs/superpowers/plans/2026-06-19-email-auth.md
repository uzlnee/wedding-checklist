# 이메일 회원가입/로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google 로그인에 더해 이메일/비밀번호 회원가입·로그인(확인 메일 요구)을 추가한다.

**Architecture:** 인증 함수는 `src/supabase.js`에, 진입 UI는 `src/Login.jsx`에 있다. 순수 입력 검증 함수는 `src/authValidate.js`로 분리해 단위 테스트한다. `index.js`/`App.jsx`/스키마는 변경하지 않는다 — 세션이 생기면 기존 `onAuth` 라우팅이 처리한다.

**Tech Stack:** React 18, CRA(react-scripts 5), `@supabase/supabase-js`, Jest(번들).

## Global Constraints

- 회원가입은 확인 메일 요구(Supabase "Confirm email" ON). 회원가입 성공 시 세션이 즉시 생기지 않을 수 있으므로 "확인 메일 안내"를 표시한다.
- 비밀번호 최소 6자(Supabase 기본 정책과 일치). 이메일은 `@` 포함.
- 기존 `signInWithGoogle`/`signOut`/`onAuth` 변경 금지. Google 버튼 유지.
- 비밀번호 재설정/매직링크는 범위 밖(구현하지 않음).
- supabase 호출은 `{ data, error }`를 반환하므로 throw하지 않고 `error`를 분기한다.

---

## File Structure

- `src/authValidate.js` — 신규. 순수 검증 함수 `validateCredentials`.
- `src/authValidate.test.js` — 신규. 검증 단위 테스트.
- `src/supabase.js` — 수정. `signUpWithEmail`, `signInWithEmail` 추가.
- `src/Login.jsx` — 수정. 이메일/비밀번호 폼 + 로그인/회원가입 토글 + Google 버튼.

---

## Task 1: 검증 헬퍼(TDD) + supabase 이메일 함수 2개

**Files:**
- Create: `src/authValidate.js`, `src/authValidate.test.js`
- Modify: `src/supabase.js`

**Interfaces:**
- Produces:
  - `validateCredentials(email: string, password: string): string | null` — 문제가 있으면 한국어 에러 문구, 정상이면 `null`.
  - `signUpWithEmail(email, password): Promise<{ data, error }>`
  - `signInWithEmail(email, password): Promise<{ data, error }>`

- [ ] **Step 1: 실패 테스트 작성**

`src/authValidate.test.js` 생성:
```js
import { validateCredentials } from "./authValidate";

test("정상 입력이면 null", () => {
  expect(validateCredentials("a@b.com", "secret1")).toBeNull();
});

test("이메일에 @가 없으면 에러 문구", () => {
  expect(validateCredentials("abc", "secret1")).toMatch(/이메일/);
});

test("빈 이메일이면 에러 문구", () => {
  expect(validateCredentials("", "secret1")).toMatch(/이메일/);
});

test("비밀번호가 6자 미만이면 에러 문구", () => {
  expect(validateCredentials("a@b.com", "123")).toMatch(/비밀번호/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `CI=true npx react-scripts test src/authValidate.test.js`
Expected: FAIL — `validateCredentials is not a function`.

- [ ] **Step 3: 검증 함수 구현**

`src/authValidate.js` 생성:
```js
export function validateCredentials(email, password) {
  if (!email || !email.includes("@")) return "올바른 이메일을 입력해 주세요.";
  if (!password || password.length < 6) return "비밀번호는 6자 이상이어야 해요.";
  return null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `CI=true npx react-scripts test src/authValidate.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: supabase.js에 이메일 함수 추가**

`src/supabase.js`의 인증 섹션(기존 `signOut` 아래)에 추가:
```js
export function signUpWithEmail(email, password) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
}

export function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}
```

- [ ] **Step 6: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`. (새 함수는 아직 미사용 — 부작용 없음.)

- [ ] **Step 7: 커밋**

```bash
git add src/authValidate.js src/authValidate.test.js src/supabase.js
git commit -m "feat: 이메일 검증 헬퍼 + supabase 이메일 가입/로그인 함수"
```

---

## Task 2: Login 화면에 이메일 폼 추가

**Files:**
- Modify: `src/Login.jsx`

**Interfaces:**
- Consumes(Task 1): `signInWithEmail`, `signUpWithEmail`, `validateCredentials`. 기존: `signInWithGoogle`.

- [ ] **Step 1: Login.jsx 전체 교체**

`src/Login.jsx`를 아래로 교체:
```jsx
import { useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "./supabase";
import { validateCredentials } from "./authValidate";
import { C } from "./constants";

function mapAuthError(msg = "") {
  if (/Invalid login credentials/i.test(msg)) return "이메일 또는 비밀번호를 확인해 주세요.";
  if (/Email not confirmed/i.test(msg)) return "메일 인증 후 로그인해 주세요.";
  if (/already registered|already been registered/i.test(msg)) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

export default function Login() {
  const [mode, setMode]         = useState("login"); // "login" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [notice, setNotice]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validateCredentials(email.trim(), password);
    if (v) { setError(v); setNotice(""); return; }
    setBusy(true); setError(""); setNotice("");

    if (mode === "signup") {
      const { error } = await signUpWithEmail(email.trim(), password);
      if (error) { setError(mapAuthError(error.message)); setBusy(false); return; }
      setNotice("확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.");
      setMode("login"); setPassword(""); setBusy(false);
    } else {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) { setError(mapAuthError(error.message)); setBusy(false); return; }
      // 성공 시 onAuth가 화면을 전환 → 별도 처리 불필요
    }
  }

  async function handleGoogle() {
    setBusy(true); setError(""); setNotice("");
    const { error } = await signInWithGoogle();
    if (error) { setError("Google 로그인에 실패했어요. 다시 시도해 주세요."); setBusy(false); }
  }

  const inp = {
    width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.line}`, borderRadius:14,
    padding:"14px 16px", fontSize:15, color:C.t900, outline:"none", fontFamily:"inherit",
    background:"#fff", marginTop:10,
  };
  const btnGreen = {
    width:"100%", padding:"16px", background:C.green, color:"#fff", border:"none",
    borderRadius:14, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:14,
  };
  const btnGoogle = {
    ...btnGreen, background:"#fff", color:C.t700, border:`1.5px solid ${C.line}`, marginTop:0,
  };

  return (
    <div style={{
      maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#fff",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"32px 24px",
      fontFamily:'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",system-ui,sans-serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=swap');`}</style>

      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:38, fontWeight:700, fontFamily:"'Playfair Display',Georgia,serif",
          fontStyle:"italic", letterSpacing:"-.5px", color:C.t900 }}>
          Wedding Checklist
        </div>
        <div style={{ fontSize:14, color:C.t400, marginTop:8, fontWeight:500 }}>
          커플이 함께 쓰는 결혼 준비 앱
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width:"100%" }}>
        <input style={inp} type="email" autoComplete="email" placeholder="이메일"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
        <input style={inp} type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="비밀번호 (6자 이상)"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
        <button type="submit" style={btnGreen} disabled={busy}>
          {busy ? "처리 중…" : mode === "signup" ? "회원가입" : "로그인"}
        </button>
      </form>

      {error  && <div style={{ color:C.red, fontSize:13, marginTop:12, fontWeight:600, textAlign:"center" }}>{error}</div>}
      {notice && <div style={{ color:C.green, fontSize:13, marginTop:12, fontWeight:600, textAlign:"center", lineHeight:1.5 }}>{notice}</div>}

      <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setNotice(""); }}
        style={{ background:"none", border:"none", color:C.t500, fontSize:13.5, fontWeight:600,
          cursor:"pointer", marginTop:16, fontFamily:"inherit" }}>
        {mode === "signup" ? "이미 계정이 있으신가요? 로그인" : "처음이신가요? 회원가입"}
      </button>

      <div style={{ display:"flex", alignItems:"center", width:"100%", margin:"22px 0 14px" }}>
        <div style={{ flex:1, height:1, background:C.line }} />
        <span style={{ fontSize:12, color:C.t400, padding:"0 12px", fontWeight:500 }}>또는</span>
        <div style={{ flex:1, height:1, background:C.line }} />
      </div>

      <button onClick={handleGoogle} disabled={busy} style={btnGoogle}>
        Google로 계속하기
      </button>

      <p style={{ fontSize:13, color:C.t400, marginTop:24, textAlign:"center", lineHeight:1.6 }}>
        로그인하면 만든 방이 계정에 저장돼<br/>코드를 잊어도 다시 들어올 수 있어요.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`, 에러 없음.

- [ ] **Step 3: 정적 스모크 점검**

브라우저 실행은 불가하므로 결과 `src/Login.jsx`에서 정적으로 확인:
- `signInWithEmail`/`signUpWithEmail`/`validateCredentials`/`signInWithGoogle`를 모두 import·사용.
- 회원가입 성공 경로에서 `notice`를 세팅하고 `mode`를 "login"으로 전환.
- Google 버튼이 그대로 존재.
사람이 할 수동 확인(브라우저 필요): 회원가입 → 확인 메일 안내 → 메일 링크 → 자동 로그인 → 로그아웃 후 로그인 → 틀린 비밀번호 오류 → Google 동작.

- [ ] **Step 4: 커밋**

```bash
git add src/Login.jsx
git commit -m "feat: 로그인 화면에 이메일 가입/로그인 폼 + 로그인/회원가입 토글"
```

---

## Self-Review (작성자 점검 완료)

- **Spec coverage:** 이메일 가입/로그인 함수(Task 1) · 입력 검증(Task 1, TDD) · Login 폼/토글/에러 매핑/확인메일 안내(Task 2) · Google 유지(Task 2) — 모두 대응. 비밀번호 재설정은 의도적 제외(스펙 명시).
- **Placeholder scan:** 신규 코드 전체 포함, TBD 없음.
- **Type consistency:** `validateCredentials`(string|null), `signInWithEmail`/`signUpWithEmail`(`{data,error}`) 시그니처가 Task 1 정의와 Task 2 사용처에서 일치. `mapAuthError`는 `error.message`를 받는다.
- **불변 영역:** `index.js`/`App.jsx`/`supabase.js`의 기존 함수/스키마는 손대지 않음.
