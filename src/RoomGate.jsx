import { useState } from "react";
import { roomExists, saveRoom } from "./firebase";
import { seedItems, C } from "./constants";

const uid6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function RoomGate({ onEnter }) {
  const [mode, setMode]     = useState(null); // "create" | "join"
  const [code, setCode]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleCreate() {
    setLoading(true);
    setError("");
    const newCode = uid6();
    await saveRoom(newCode, {
      items: seedItems(),
      weddingDate: "",
      createdAt: Date.now(),
    });
    localStorage.setItem("weddingRoomCode", newCode);
    onEnter(newCode);
  }

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) { setError("방 코드를 입력해 주세요."); return; }
    setLoading(true);
    setError("");
    const exists = await roomExists(trimmed);
    if (!exists) {
      setError("존재하지 않는 방 코드예요. 다시 확인해 주세요.");
      setLoading(false);
      return;
    }
    localStorage.setItem("weddingRoomCode", trimmed);
    onEnter(trimmed);
  }

  const inp = {
    width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.line}`,
    borderRadius:14, padding:"15px 16px", fontSize:20, fontWeight:800,
    textAlign:"center", letterSpacing:4, color:C.t900, outline:"none",
    fontFamily:"inherit", background:"#fff", textTransform:"uppercase",
  };
  const btnGreen = {
    width:"100%", padding:"16px", background:C.green, color:"#fff",
    border:"none", borderRadius:14, fontSize:16, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit", marginTop:10,
  };
  const btnGrey = {
    ...btnGreen, background:"#fff", color:C.t700,
    border:`1.5px solid ${C.line}`, marginTop:8,
  };

  return (
    <div style={{
      maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#fff",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"32px 24px",
      fontFamily:'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",system-ui,sans-serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=swap');`}</style>

      {/* logo */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:38, fontWeight:700, fontFamily:"'Playfair Display',Georgia,serif",
          fontStyle:"italic", letterSpacing:"-.5px", color:C.t900 }}>
          Wedding Checklist
        </div>
        <div style={{ fontSize:14, color:C.t400, marginTop:8, fontWeight:500 }}>
          커플이 함께 쓰는 결혼 준비 앱
        </div>
      </div>

      {!mode && (
        <>
          <button style={btnGreen} onClick={() => setMode("create")}>
            ✨ 새 체크리스트 만들기
          </button>
          <button style={btnGrey} onClick={() => setMode("join")}>
            🔗 기존 방 코드로 입장하기
          </button>
          <p style={{ fontSize:13, color:C.t400, marginTop:24, textAlign:"center", lineHeight:1.6 }}>
            방을 만들면 6자리 코드가 생성돼요.<br/>
            상대방에게 코드를 공유하면 같이 쓸 수 있어요.
          </p>
        </>
      )}

      {mode === "create" && (
        <>
          <div style={{ width:"100%", background:C.greenBg, borderRadius:16,
            padding:"20px", textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.green, fontWeight:700 }}>새 방을 만들면</div>
            <div style={{ fontSize:14, color:C.t700, marginTop:6, lineHeight:1.6 }}>
              고유한 6자리 코드가 생성돼요.<br/>
              파트너에게 코드를 공유하면<br/>
              같은 체크리스트를 함께 쓸 수 있어요.
            </div>
          </div>
          <button style={btnGreen} onClick={handleCreate} disabled={loading}>
            {loading ? "생성 중…" : "방 만들기"}
          </button>
          <button style={btnGrey} onClick={() => setMode(null)}>← 뒤로</button>
        </>
      )}

      {mode === "join" && (
        <>
          <div style={{ width:"100%", marginBottom:8 }}>
            <div style={{ fontSize:13, color:C.t500, fontWeight:600, marginBottom:8 }}>
              파트너에게 받은 방 코드를 입력해 주세요
            </div>
            <input
              style={inp}
              maxLength={6}
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="AB1CD2"
              autoFocus
            />
            {error && <div style={{ color:C.red, fontSize:13, marginTop:8, fontWeight:600 }}>{error}</div>}
          </div>
          <button style={btnGreen} onClick={handleJoin} disabled={loading || !code.trim()}>
            {loading ? "확인 중…" : "입장하기"}
          </button>
          <button style={btnGrey} onClick={() => { setMode(null); setCode(""); setError(""); }}>← 뒤로</button>
        </>
      )}
    </div>
  );
}
