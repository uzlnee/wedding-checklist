import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import RoomGate from "./RoomGate";
import App from "./App";

function Root() {
  const [roomCode, setRoomCode] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("weddingRoomCode");
    if (saved) setRoomCode(saved);
  }, []);

  const handleEnter = (code) => setRoomCode(code);

  const handleLeave = () => {
    localStorage.removeItem("weddingRoomCode");
    setRoomCode(null);
  };

  if (!roomCode) return <RoomGate onEnter={handleEnter} />;
  return <App roomCode={roomCode} onLeave={handleLeave} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><Root /></React.StrictMode>);
