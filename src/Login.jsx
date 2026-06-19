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
