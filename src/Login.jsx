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
