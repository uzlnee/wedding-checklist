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
