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
