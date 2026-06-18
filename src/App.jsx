import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { saveRoom, subscribeRoom } from "./firebase";
import { C, STATUS, CATS, PHASES, phaseDate, won, uid, seedItems } from "./constants";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: #fff; }
button { font-family: inherit; -webkit-tap-highlight-color: transparent; }
.press { transition: transform .08s ease, opacity .12s ease; }
.press:active { transform: scale(.97); opacity: .85; }
.row-btn:active { transform: scale(.99); }
.noscroll::-webkit-scrollbar { display: none; }
.noscroll { -ms-overflow-style: none; scrollbar-width: none; }
input:focus, textarea:focus { border-color: #16A34A !important; outline: none; }
button:focus-visible { outline: 2px solid #16A34A; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

/* ─── debounce save ─────────────────────────────────────── */
function useDebouncedSave(roomCode, items, weddingDate, ready) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready || !items) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveRoom(roomCode, { items, weddingDate }).catch(console.error);
    }, 800);
    return () => clearTimeout(timer.current);
  }, [roomCode, items, weddingDate, ready]);
}

/* ─── root ──────────────────────────────────────────────── */
export default function App({ roomCode }) {
  const [items, setItems]             = useState(null);
  const [weddingDate, setWeddingDate] = useState("");
  const [synced, setSynced]           = useState(false);
  const [tab, setTab]                 = useState("checklist");
  const [filter, setFilter]           = useState("all");
  const [editing, setEditing]         = useState(null);
  const [showCode, setShowCode]       = useState(false);
  const skipNextSync = useRef(false);

  /* ── realtime subscribe ── */
  useEffect(() => {
    const unsub = subscribeRoom(roomCode, (data) => {
      if (skipNextSync.current) { skipNextSync.current = false; return; }
      setItems(data.items || seedItems());
      setWeddingDate(data.weddingDate || "");
      setSynced(true);
    });
    return unsub;
  }, [roomCode]);

  /* ── debounced save ── */
  useDebouncedSave(roomCode, items, weddingDate, synced);

  const mutate = useCallback((fn) => {
    skipNextSync.current = true;
    setItems(fn);
  }, []);

  const counts = useMemo(() => {
    const c = { done:0, inprogress:0, todo:0, total:0 };
    (items||[]).forEach(i => { c[i.status]++; c.total++; });
    return c;
  }, [items]);

  const percent     = counts.total ? Math.round(counts.done/counts.total*100) : 0;
  const totalBudget = useMemo(() => (items||[]).reduce((a,i)=>a+(parseInt(i.budget,10)||0),0), [items]);
  const dday        = useMemo(() => {
    if (!weddingDate) return null;
    const t = new Date(); t.setHours(0,0,0,0);
    return Math.round((new Date(weddingDate+"T00:00:00")-t)/86400000);
  }, [weddingDate]);

  const saveItem   = (next) => mutate(p => p.map(i => i.id===next.id ? next : i));
  const addItem    = (next) => mutate(p => [...p, next]);
  const removeItem = (id)   => mutate(p => p.filter(i => i.id!==id));

  if (!synced || !items) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",
      fontFamily:'system-ui,sans-serif', color:C.t500, fontSize:15}}>
      불러오는 중…
    </div>
  );

  const tabViews = {
    checklist: <ChecklistView items={items} filter={filter} setFilter={setFilter}
                  weddingDate={weddingDate} setWeddingDate={v=>{skipNextSync.current=true;setWeddingDate(v);}}
                  dday={dday} counts={counts} percent={percent} onEdit={setEditing} />,
    timeline:  <TimelineView  items={items} weddingDate={weddingDate} onEdit={setEditing} />,
    budget:    <BudgetView    items={items} totalBudget={totalBudget} onEdit={setEditing} />,
  };

  return (
    <div style={sx.app}>
      <style>{css}</style>

      {/* header */}
      <header style={sx.header}>
        <div style={sx.headerTitle}>Wedding Checklist</div>
        <div style={sx.headerSubRow}>
          <button onClick={() => setShowCode(v=>!v)} style={sx.codeBtn}>
            🔗 {roomCode}
          </button>
          <label style={sx.ddayLabel}>
            <input type="date" value={weddingDate}
              onChange={e => { skipNextSync.current=true; setWeddingDate(e.target.value); }}
              style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",zIndex:1}}
              aria-label="예식일 선택" />
            {weddingDate
              ? <><span style={sx.ddayD}>D</span>
                  <span style={sx.ddayNum}>{dday>0?`-${dday}`:dday===0?"-DAY":`+${-dday}`}</span></>
              : <span style={sx.ddayEmpty}>예식일 설정 ›</span>}
          </label>
        </div>

        {showCode && (
          <div style={sx.codeBanner}>
            <div style={{fontSize:13,color:C.t700,fontWeight:600}}>파트너에게 이 코드를 공유하세요</div>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:4,color:C.green,margin:"6px 0"}}>{roomCode}</div>
            <button onClick={() => { navigator.clipboard?.writeText(roomCode); setShowCode(false); }}
              style={{fontSize:13,fontWeight:700,color:C.green,background:"none",border:"none",cursor:"pointer",padding:0}}>
              복사하기 →
            </button>
          </div>
        )}
      </header>

      {/* view */}
      <main style={sx.main} key={tab}>
        {tabViews[tab]}
        <div style={{height:100}} />
      </main>

      {/* bottom nav */}
      <nav style={sx.bottomNav}>
        {[
          ["checklist","체크리스트",
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>
            </svg>],
          ["timeline","일정",
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="7" r="2"/><circle cx="6" cy="17" r="2"/>
              <path d="M6 9v6"/><path d="M11 7h7"/><path d="M11 17h7"/>
            </svg>],
          ["budget","예산",
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="3"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
            </svg>],
        ].map(([key, label, icon]) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              background:"transparent", border:"none", cursor:"pointer", padding:"10px 0 4px",
              color: active ? C.green : C.t400, transition:"color .15s",
            }}>
              <span style={{display:"flex", transition:"transform .15s", transform: active?"scale(1.12)":"scale(1)"}}>
                {icon}
              </span>
              <span style={{fontSize:11, fontWeight: active?800:600}}>{label}</span>
            </button>
          );
        })}
      </nav>

      {editing && (
        <EditSheet key={editing.id} item={editing} isNew={!!editing.isNew}
          onClose={() => setEditing(null)}
          onCommit={next => { editing.isNew ? addItem(next) : saveItem(next); setEditing(null); }}
          onDelete={id   => { removeItem(id); setEditing(null); }} />
      )}
    </div>
  );
}

/* ─── ChecklistView ─────────────────────────────────────── */
function ChecklistView({ items, filter, setFilter, weddingDate, setWeddingDate, dday, counts, percent, onEdit }) {
  const grouped = useMemo(() => {
    const f = filter==="all" ? items : items.filter(i=>i.status===filter);
    return CATS.map(cat=>({cat, list:f.filter(i=>i.cat===cat)})).filter(g=>g.list.length);
  }, [items, filter]);

  return (
    <>
      <section style={{...sx.card, marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={sx.cardLabel}>준비 현황</span>
          <span style={{fontSize:13,color:C.t500,fontWeight:600}}>전체 {counts.total}개</span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,marginTop:6}}>
          <span style={sx.percentNum}>{percent}</span>
          <span style={sx.percentSign}>%</span>
          <span style={{marginLeft:"auto",fontSize:13,color:C.t700,fontWeight:600}}>{counts.done}개 확정</span>
        </div>
        <div style={sx.bar}>
          {[["done",C.green],["inprogress",C.amber],["todo",C.greyBg]].map(([k,col]) => {
            const w = counts.total ? counts[k]/counts.total*100 : 0;
            return w>0 ? <div key={k} style={{width:`${w}%`,background:col,height:"100%"}} /> : null;
          })}
        </div>
        <div style={sx.legendRow}>
          {[["done","확정",C.green],["inprogress","진행중",C.amber],["todo","미정",C.grey]].map(([k,l,col])=>(
            <div key={k} style={sx.legendItem}>
              <span style={{...sx.dot,background:col}}/>
              <span style={{color:C.t700,fontWeight:600}}>{l}</span>
              <span style={{color:C.t900,fontWeight:700,marginLeft:4}}>{counts[k]}</span>
            </div>
          ))}
        </div>
        {percent===100 && (
          <div style={{marginTop:14,background:C.greenBg,color:C.green,borderRadius:12,
            padding:"11px 14px",fontSize:14,fontWeight:700,textAlign:"center"}}>
            🎉 모든 준비를 마쳤어요!
          </div>
        )}
      </section>

      <div style={sx.filterRow} className="noscroll">
        {[["all","전체",counts.total],["done","확정",counts.done],
          ["inprogress","진행중",counts.inprogress],["todo","미정",counts.todo]].map(([k,l,n])=>(
          <button key={k} onClick={()=>setFilter(k)} className="press"
            style={{...sx.chip, background:filter===k?C.t900:"#fff",
              color:filter===k?"#fff":C.t700, borderColor:filter===k?C.t900:C.line}}>
            {l}<span style={{opacity:.55,marginLeft:5}}>{n}</span>
          </button>
        ))}
      </div>

      {grouped.length===0
        ? <div style={sx.empty}>해당하는 항목이 없어요</div>
        : grouped.map(({cat,list})=>(
          <section key={cat} style={{marginTop:20}}>
            <div style={sx.groupHead}>
              <span style={{fontWeight:700,color:C.t900,fontSize:15}}>{cat}</span>
              {list.every(i=>i.status==="done") && filter==="all" &&
                <span style={{fontSize:12,color:C.green,fontWeight:700}}>완료 ✓</span>}
            </div>
            <div style={sx.card}>
              {list.map((it,idx)=><ItemRow key={it.id} it={it} idx={idx} onEdit={onEdit}/>)}
            </div>
          </section>
        ))
      }

      <button className="press" onClick={()=>onEdit({
          isNew:true,id:uid(),cat:CATS[0],emoji:"📌",
          title:"",value:"",status:"todo",budget:"",memo:"",phase:"p5",tip:""})}
        style={sx.addBtn}>
        + 항목 직접 추가
      </button>
    </>
  );
}

/* ─── TimelineView ──────────────────────────────────────── */
function TimelineView({ items, weddingDate, onEdit }) {
  const today = new Date(); today.setHours(0,0,0,0);
  return (
    <>
      <div style={{...sx.card,marginBottom:12,padding:"14px 16px"}}>
        <div style={{fontSize:13,color:C.t500,fontWeight:500,lineHeight:1.6}}>
          {weddingDate
            ? "예식일 기준으로 단계별 추천 시기를 계산했어요."
            : "헤더에서 예식일을 설정하면 각 단계의 실제 시기가 표시돼요."}
        </div>
      </div>
      {PHASES.map((phase,idx)=>{
        const its    = items.filter(i=>i.phase===phase.id);
        const doneCnt= its.filter(i=>i.status==="done").length;
        const allDone= its.length>0 && doneCnt===its.length;
        let calLabel=null, calStyle={};
        if (weddingDate) {
          const pd = phaseDate(weddingDate, phase);
          const label = phase.d != null
            ? `${pd.getMonth()+1}월 ${pd.getDate()}일`
            : `${pd.getFullYear()}년 ${pd.getMonth()+1}월`;
          if (allDone)       { calLabel=`✓ 완료`;                    calStyle={background:C.greenBg,color:C.green}; }
          else if (today>pd) { calLabel=`⏳ ${label} · 지금 챙겨요`;  calStyle={background:C.amberBg,color:C.amber}; }
          else               { calLabel=`🗓 ${label}부터`;            calStyle={background:C.greyBg, color:C.t700};  }
        }
        return (
          <div key={phase.id} style={{display:"flex",gap:0,marginBottom:4}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:40,flexShrink:0}}>
              <div style={{width:28,height:28,borderRadius:999,flexShrink:0,
                background:allDone?C.green:"#fff", border:`2px solid ${allDone?C.green:C.line}`,
                color:allDone?"#fff":C.t500, display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:800,zIndex:1}}>
                {allDone?"✓":idx+1}
              </div>
              {idx<PHASES.length-1 && <div style={{flex:1,width:2,background:C.line,margin:"4px 0"}}/>}
            </div>
            <div style={{...sx.card,flex:1,marginLeft:10,marginBottom:16,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.t400,letterSpacing:1,textTransform:"uppercase"}}>{phase.when}</div>
              <div style={{fontSize:16,fontWeight:800,color:C.t900,marginTop:3}}>{phase.sub}</div>
              <div style={{fontSize:13,color:C.t500,marginTop:2,fontWeight:500}}>{doneCnt}/{its.length} 완료</div>
              {calLabel && (
                <div style={{display:"inline-flex",alignItems:"center",fontSize:12,fontWeight:700,
                  borderRadius:8,padding:"5px 10px",marginTop:10,...calStyle}}>{calLabel}</div>
              )}
              {its.length>0 && (
                <div style={{marginTop:12,borderTop:`1px solid ${C.line}`}}>
                  {its.map(it=>{
                    const s=STATUS[it.status];
                    return (
                      <button key={it.id} onClick={()=>onEdit(it)} className="row-btn"
                        style={{width:"100%",display:"flex",alignItems:"center",gap:10,
                          padding:"12px 0",background:"transparent",border:"none",
                          borderTop:`1px solid ${C.line}`,cursor:"pointer"}}>
                        <span style={{fontSize:18,width:24,textAlign:"center",flexShrink:0}}>{it.emoji}</span>
                        <div style={{flex:1,textAlign:"left",minWidth:0}}>
                          <div style={{fontSize:14.5,fontWeight:700,color:C.t900}}>{it.title}</div>
                          <div style={{fontSize:12,color:C.t500,marginTop:2,lineHeight:1.4}}>{it.tip}</div>
                        </div>
                        <span style={{fontSize:11.5,fontWeight:700,padding:"4px 9px",
                          borderRadius:7,background:s.bg,color:s.color,flexShrink:0}}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── BudgetView ────────────────────────────────────────── */
function BudgetView({ items, totalBudget, onEdit }) {
  const catTotals = CATS.map(cat=>({
    cat, sum:items.filter(i=>i.cat===cat).reduce((a,i)=>a+(parseInt(i.budget,10)||0),0),
  })).filter(x=>x.sum>0);
  const maxSum = Math.max(1,...catTotals.map(x=>x.sum));
  const withBudget = items.filter(i=>parseInt(i.budget,10)>0);

  return (
    <>
      <div style={{...sx.card,textAlign:"center",padding:"28px 20px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:C.t400,letterSpacing:2,textTransform:"uppercase"}}>Total Budget</div>
        <div style={{fontSize:44,fontWeight:800,color:C.green,letterSpacing:"-1.5px",marginTop:6,lineHeight:1}}>
          ₩ {won(totalBudget)}
        </div>
        <div style={{fontSize:13,color:C.t400,marginTop:8,fontWeight:500}}>항목별 예산을 입력하면 자동으로 합산돼요</div>
      </div>

      {catTotals.length>0 && (
        <section style={{...sx.card,marginBottom:12}}>
          <div style={sx.cardLabel}>분류별 지출</div>
          <div style={{marginTop:16}}>
            {catTotals.map(x=>(
              <div key={x.cat} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,fontWeight:700,marginBottom:7}}>
                  <span>{x.cat}</span><span style={{color:C.t700}}>₩ {won(x.sum)}</span>
                </div>
                <div style={{height:8,borderRadius:999,background:C.greyBg,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:999,background:C.green,
                    width:`${Math.round(x.sum/maxSum*100)}%`,transition:"width .6s ease"}}/>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {withBudget.length>0 ? (
        <section style={{marginTop:8}}>
          <div style={sx.groupHead}><span style={{fontWeight:700,color:C.t900,fontSize:15}}>입력된 항목</span></div>
          <div style={sx.card}>{withBudget.map((it,idx)=><ItemRow key={it.id} it={it} idx={idx} onEdit={onEdit}/>)}</div>
        </section>
      ) : (
        <div style={sx.empty}>
          <div style={{fontSize:32,marginBottom:8}}>💰</div>
          아직 입력한 예산이 없어요
          <div style={{fontSize:13,color:C.t400,marginTop:4,fontWeight:500}}>각 항목을 눌러 예상 비용을 적어보세요</div>
        </div>
      )}
    </>
  );
}

/* ─── ItemRow ───────────────────────────────────────────── */
function ItemRow({ it, idx, onEdit }) {
  const s = STATUS[it.status];
  return (
    <button onClick={()=>onEdit(it)} className="row-btn press"
      style={{width:"100%",display:"flex",alignItems:"center",gap:12,
        padding:"15px 6px",background:"transparent",border:"none",cursor:"pointer",
        borderTop: idx ? `1px solid ${C.line}` : "none"}}>
      <span style={sx.emoji}>{it.emoji}</span>
      <span style={{flex:1,minWidth:0,textAlign:"left"}}>
        <span style={sx.rowTitle}>{it.title}</span>
        <span style={{...sx.rowValue,color:it.value?C.t500:C.t400}}>
          {it.value||"미정"}{it.budget?`  ·  ₩${won(parseInt(it.budget,10))}`:""}
        </span>
      </span>
      <span style={{...sx.pill,background:s.bg,color:s.color}}>{s.label}</span>
      <span style={sx.chev}>›</span>
    </button>
  );
}

/* ─── EditSheet ─────────────────────────────────────────── */
function EditSheet({ item, isNew, onClose, onCommit, onDelete }) {
  const [draft, setDraft] = useState(item);
  const [vis, setVis]     = useState(false);
  useEffect(()=>{ const t=requestAnimationFrame(()=>setVis(true)); return()=>cancelAnimationFrame(t); },[]);
  const close = () => { setVis(false); setTimeout(onClose,270); };
  const set   = (k,v) => setDraft(d=>({...d,[k]:v}));
  const valid = draft.title.trim().length>0;

  return (
    <div style={{...sx.overlay,opacity:vis?1:0}} onClick={close}>
      <div style={{...sx.sheet,transform:vis?"translateY(0)":"translateY(100%)"}} onClick={e=>e.stopPropagation()}>
        <div style={sx.grabber}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <span style={{fontSize:26}}>{draft.emoji}</span>
          {isNew
            ? <input autoFocus value={draft.title} onChange={e=>set("title",e.target.value)}
                placeholder="항목 이름"
                style={{...sx.input,fontSize:18,fontWeight:800,border:"none",
                  borderBottom:`2px solid ${C.line}`,borderRadius:0,padding:"6px 0"}}/>
            : <span style={{fontSize:19,fontWeight:800,color:C.t900}}>{draft.title}</span>}
        </div>

        {draft.tip && (
          <div style={{background:C.greenBg,borderRadius:12,padding:"11px 13px",
            fontSize:13,color:"#1a6b2e",fontWeight:600,lineHeight:1.5,marginBottom:16}}>
            💡 {draft.tip}
          </div>
        )}

        {isNew && (
          <Field label="분류">
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}} className="noscroll">
              {CATS.map(c=>(
                <button key={c} onClick={()=>set("cat",c)} className="press"
                  style={{flexShrink:0,border:"none",borderRadius:999,padding:"9px 13px",
                    fontSize:12.5,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",
                    background:draft.cat===c?C.greenBg:C.greyBg,
                    color:draft.cat===c?C.green:C.t700,
                    fontWeight:draft.cat===c?700:500}}>
                  {c}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="상태">
          <div style={{display:"flex",background:C.greyBg,borderRadius:12,padding:4,gap:4}}>
            {["todo","inprogress","done"].map(k=>{
              const on=draft.status===k; const s=STATUS[k];
              return (
                <button key={k} onClick={()=>set("status",k)}
                  style={{flex:1,padding:"10px 0",border:"none",borderRadius:9,fontSize:14,
                    cursor:"pointer",fontFamily:"inherit",
                    background:on?"#fff":"transparent",
                    color:on?s.color:C.t500, fontWeight:on?700:600,
                    boxShadow:on?"0 1px 3px rgba(0,0,0,.12)":"none"}}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="업체·내용">
          <input value={draft.value} onChange={e=>set("value",e.target.value)}
            placeholder="예: 더베르G" style={sx.input}/>
        </Field>

        <Field label="예상 비용">
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
              color:C.t500,fontWeight:700,fontSize:15}}>₩</span>
            <input inputMode="numeric"
              value={draft.budget?won(parseInt(draft.budget,10)):""}
              onChange={e=>set("budget",e.target.value.replace(/[^0-9]/g,""))}
              placeholder="0" style={{...sx.input,paddingLeft:30}}/>
          </div>
        </Field>

        <Field label="메모">
          <textarea value={draft.memo} onChange={e=>set("memo",e.target.value)}
            placeholder="가격, 일정, 비교 업체 등 자유롭게 적어 두세요"
            rows={3} style={{...sx.input,resize:"none",lineHeight:1.5}}/>
        </Field>

        <div style={{display:"flex",gap:10,marginTop:6}}>
          {!isNew && (
            <button className="press" onClick={()=>onDelete(draft.id)}
              style={{flex:"0 0 auto",padding:"15px 20px",background:C.greyBg,
                color:C.red,border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              삭제
            </button>
          )}
          <button className="press" disabled={!valid} onClick={()=>onCommit(draft)}
            style={{flex:1,padding:"15px",background:C.green,color:"#fff",border:"none",
              borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer",opacity:valid?1:.4}}>
            {isNew?"추가하기":"완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:17}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t500,marginBottom:8}}>{label}</div>
      {children}
    </div>
  );
}

/* ─── styles ────────────────────────────────────────────── */
const sx = {
  app: { maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#fff",
    fontFamily:'-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",system-ui,sans-serif',
    color:C.t900 },
  header: { padding:"24px 20px 12px", background:"#fff", position:"sticky", top:0, zIndex:6,
    textAlign:"center", borderBottom:`1px solid ${C.line}` },
  headerTitle: { fontSize:30, fontWeight:700, letterSpacing:"-.5px",
    fontFamily:"'Playfair Display',Georgia,serif", fontStyle:"italic" },
  headerSubRow: { display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:6 },
  codeBtn: { fontSize:12, fontWeight:700, color:C.t500, background:C.greyBg,
    border:"none", borderRadius:7, padding:"4px 10px", cursor:"pointer" },
  ddayLabel: { position:"relative", display:"inline-flex", alignItems:"center", cursor:"pointer" },
  ddayD:    { fontSize:12, fontWeight:800, color:C.green, background:C.greenBg,
    borderRadius:"7px 0 0 7px", padding:"4px 6px 4px 9px" },
  ddayNum:  { fontSize:12, fontWeight:800, color:C.green, background:C.greenBg,
    borderRadius:"0 7px 7px 0", padding:"4px 9px 4px 5px" },
  ddayEmpty:{ fontSize:12, fontWeight:600, color:C.t400, background:C.greyBg,
    borderRadius:7, padding:"4px 10px" },
  codeBanner: { margin:"10px 0 0", background:C.greenBg, borderRadius:14,
    padding:"14px 16px", textAlign:"center" },
  main: { padding:"16px 16px 0" },
  bottomNav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
    width:"100%", maxWidth:480, display:"flex", alignItems:"stretch",
    background:"rgba(255,255,255,.95)", backdropFilter:"blur(16px)",
    WebkitBackdropFilter:"blur(16px)", borderTop:`1px solid ${C.line}`,
    paddingBottom:"env(safe-area-inset-bottom,8px)", zIndex:20 },
  card: { background:"#fff", borderRadius:20, padding:"18px",
    boxShadow:"0 2px 12px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.05)",
    border:"1px solid rgba(0,0,0,.04)" },
  cardLabel: { fontSize:15, fontWeight:700, color:C.t900 },
  percentNum:{ fontSize:46, fontWeight:800, color:C.green, lineHeight:1, letterSpacing:"-2px" },
  percentSign:{ fontSize:22, fontWeight:800, color:C.green, marginBottom:3 },
  bar: { display:"flex", height:9, borderRadius:999, overflow:"hidden", background:C.greyBg, marginTop:14 },
  legendRow: { display:"flex", gap:18, marginTop:13 },
  legendItem:{ display:"flex", alignItems:"center", fontSize:13 },
  dot: { width:8, height:8, borderRadius:999, display:"inline-block", marginRight:6 },
  filterRow: { display:"flex", gap:8, marginTop:0, marginBottom:4,
    overflowX:"auto", paddingBottom:2, WebkitOverflowScrolling:"touch" },
  chip: { flex:"0 0 auto", border:"1px solid", borderRadius:999,
    padding:"9px 16px", fontSize:13.5, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" },
  groupHead: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 4px 8px" },
  emoji: { width:40, height:40, flex:"0 0 auto", borderRadius:12, background:C.greyBg,
    display:"flex", alignItems:"center", justifyContent:"center", fontSize:19 },
  rowTitle: { display:"block", fontSize:15, fontWeight:700, color:C.t900 },
  rowValue: { display:"block", fontSize:12.5, marginTop:2,
    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  pill: { flex:"0 0 auto", fontSize:12, fontWeight:700, padding:"5px 10px", borderRadius:8 },
  chev: { color:C.t400, fontSize:20, fontWeight:700, marginLeft:2 },
  addBtn: { width:"100%", marginTop:16, padding:"15px", background:"#fff",
    border:`1px dashed ${C.line}`, borderRadius:16, color:C.t500, fontSize:14.5, fontWeight:700, cursor:"pointer" },
  empty: { textAlign:"center", color:C.t500, fontSize:14, padding:"52px 0 20px", fontWeight:500 },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:50,
    display:"flex", alignItems:"flex-end", justifyContent:"center", transition:"opacity .26s ease" },
  sheet: { width:"100%", maxWidth:480, background:"#fff", borderRadius:"24px 24px 0 0",
    padding:"10px 22px 28px", transition:"transform .3s cubic-bezier(.32,.72,0,1)",
    maxHeight:"92vh", overflowY:"auto" },
  grabber: { width:40, height:4, borderRadius:999, background:C.line, margin:"6px auto 16px" },
  input: { width:"100%", boxSizing:"border-box", border:`1px solid ${C.line}`,
    borderRadius:12, padding:"13px 14px", fontSize:15, color:C.t900,
    background:"#fff", fontWeight:500, outline:"none", fontFamily:"inherit" },
};
