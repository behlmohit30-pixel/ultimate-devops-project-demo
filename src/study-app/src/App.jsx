import { useState } from "react";
import StudyAgent from "./StudyAgent";
import InterviewCoach from "./InterviewCoach";

export default function App() {
  const [app, setApp] = useState("study");

  return (
    <>
      {/* App switcher bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        display: "flex", justifyContent: "center", gap: 4,
        background: "rgba(5,11,24,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)",
        padding: "6px 12px",
      }}>
        {[
          { id: "study", label: "⚡ Study Agent", sub: "CKA · CKS · VKS · vSphere" },
          { id: "interview", label: "🎯 Interview Coach", sub: "SIT · Feynman · Breathwork" },
        ].map(a => (
          <button key={a.id} onClick={() => setApp(a.id)} style={{
            padding: "5px 14px", borderRadius: 20, cursor: "pointer", transition: "all 0.2s",
            border: `1px solid ${app === a.id ? "#00d4ff" : "rgba(255,255,255,0.08)"}`,
            background: app === a.id ? "rgba(0,212,255,0.1)" : "transparent",
            color: app === a.id ? "#00d4ff" : "#4a7fa5",
            fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "0.72rem", fontWeight: 600,
          }}>
            {a.label}
            <span style={{ fontSize: "0.58rem", opacity: 0.6, marginLeft: 6 }}>{a.sub}</span>
          </button>
        ))}
      </div>

      {/* Top padding so switcher bar doesn't overlap app content */}
      <div style={{ paddingTop: 38 }}>
        {app === "study" ? <StudyAgent /> : <InterviewCoach />}
      </div>
    </>
  );
}
