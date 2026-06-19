import { useState, useEffect, useCallback } from "react";
import { listMyRooms, createRoom, joinRoom, renameRoom, deleteRoom, leaveRoom, signOut } from "./supabase";
import { C } from "./constants";

export default function RoomList({ onEnter }) {
  const [rooms, setRooms] = useState(null);
  const [mode, setMode]   = useState(null); // null | "create" | "join"
  const [title, setTitle] = useState("");
  const [code, setCode]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");
  const [menuFor, setMenuFor]             = useState(null); // 액션 메뉴가 열린 방 code
  const [confirmDelete, setConfirmDelete] = useState(null); // 삭제 확인 단계인 방 code
  const [renaming, setRenaming]           = useState(null); // 이름 변경 중인 방 code
  const [renameTitle, setRenameTitle]     = useState("");
  const [actionBusy, setActionBusy]       = useState(false);
  const [actionErr, setActionErr]         = useState("");

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

  function closeMenu() { setMenuFor(null); setConfirmDelete(null); setRenaming(null); setActionErr(""); }

  async function doRename(c) {
    const t = renameTitle.trim();
    setActionBusy(true); setActionErr("");
    try {
      await renameRoom(c, t);
      setRooms((rs) => (rs || []).map((r) => (r.code === c ? { ...r, title: t } : r)));
      closeMenu();
    } catch { setActionErr("이름 변경에 실패했어요. 다시 시도해 주세요."); }
    finally { setActionBusy(false); }
  }

  async function doLeave(c) {
    setActionBusy(true); setActionErr("");
    try { await leaveRoom(c); setRooms((rs) => (rs || []).filter((r) => r.code !== c)); closeMenu(); }
    catch { setActionErr("처리에 실패했어요. 다시 시도해 주세요."); }
    finally { setActionBusy(false); }
  }

  async function doDelete(c) {
    setActionBusy(true); setActionErr("");
    try { await deleteRoom(c); setRooms((rs) => (rs || []).filter((r) => r.code !== c)); closeMenu(); }
    catch { setActionErr("삭제에 실패했어요. 다시 시도해 주세요."); }
    finally { setActionBusy(false); }
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
            const open = menuFor === r.code;
            const confirming = confirmDelete === r.code;
            const smallBtn = { flex:1, padding:"10px 0", border:"none", borderRadius:10,
              fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" };
            return (
              <div key={r.code} style={{ background:"#fff", border:`1px solid ${C.line}`,
                borderRadius:16, padding:"16px 18px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div onClick={() => onEnter(r.code)} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                    <div style={{ fontSize:16, fontWeight:800, color:C.t900 }}>{r.title || r.code}</div>
                    <div style={{ fontSize:12.5, color:C.t500, marginTop:4 }}>
                      코드 {r.code} · {done}/{total} 완료{r.wedding_date ? ` · 예식 ${r.wedding_date}` : ""}
                    </div>
                  </div>
                  <button aria-label="방 관리"
                    onClick={() => { setMenuFor(open ? null : r.code); setConfirmDelete(null); setRenaming(null); setActionErr(""); }}
                    style={{ flexShrink:0, width:34, height:34, borderRadius:9, border:"none",
                      background:open ? C.greyBg : "#fff", color:C.t500, fontSize:18, fontWeight:800,
                      cursor:"pointer", lineHeight:1 }}>
                    ⋯
                  </button>
                </div>

                {open && (
                  <div style={{ marginTop:12, borderTop:`1px solid ${C.line}`, paddingTop:12 }}>
                    {renaming === r.code ? (
                      <>
                        <input autoFocus value={renameTitle} maxLength={30}
                          onChange={(e) => { setRenameTitle(e.target.value); setActionErr(""); }}
                          placeholder="방 이름"
                          style={{ width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.line}`,
                            borderRadius:10, padding:"11px 13px", fontSize:15, color:C.t900,
                            outline:"none", fontFamily:"inherit", background:"#fff", marginBottom:10 }} />
                        <div style={{ display:"flex", gap:8 }}>
                          <button disabled={actionBusy || !renameTitle.trim()} onClick={() => doRename(r.code)}
                            style={{ ...smallBtn, background:C.green, color:"#fff", opacity:(actionBusy||!renameTitle.trim())?.5:1 }}>
                            {actionBusy ? "저장 중…" : "저장"}
                          </button>
                          <button disabled={actionBusy} onClick={() => { setRenaming(null); setActionErr(""); }}
                            style={{ ...smallBtn, background:C.greyBg, color:C.t700 }}>
                            취소
                          </button>
                        </div>
                      </>
                    ) : confirming ? (
                      <>
                        <div style={{ fontSize:12.5, color:C.t700, fontWeight:600, lineHeight:1.5, marginBottom:10 }}>
                          완전 삭제할까요? 파트너도 못 쓰게 되고 되돌릴 수 없어요.
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button disabled={actionBusy} onClick={() => doDelete(r.code)}
                            style={{ ...smallBtn, background:C.red, color:"#fff" }}>
                            {actionBusy ? "삭제 중…" : "삭제"}
                          </button>
                          <button disabled={actionBusy} onClick={() => setConfirmDelete(null)}
                            style={{ ...smallBtn, background:C.greyBg, color:C.t700 }}>
                            취소
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display:"flex", gap:8 }}>
                        <button disabled={actionBusy} onClick={() => { setRenaming(r.code); setRenameTitle(r.title || ""); setActionErr(""); }}
                          style={{ ...smallBtn, background:C.greyBg, color:C.t700 }}>
                          이름 변경
                        </button>
                        <button disabled={actionBusy} onClick={() => doLeave(r.code)}
                          style={{ ...smallBtn, background:C.greyBg, color:C.t700 }}>
                          {actionBusy ? "처리 중…" : "나가기"}
                        </button>
                        <button disabled={actionBusy} onClick={() => setConfirmDelete(r.code)}
                          style={{ ...smallBtn, background:"#fff", color:C.red, border:`1.5px solid ${C.line}` }}>
                          삭제
                        </button>
                      </div>
                    )}
                    {actionErr && <div style={{ color:C.red, fontSize:12.5, marginTop:8, fontWeight:600 }}>{actionErr}</div>}
                  </div>
                )}
              </div>
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
