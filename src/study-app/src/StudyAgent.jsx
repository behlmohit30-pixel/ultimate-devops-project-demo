import { useState, useRef, useEffect } from "react";
 
const DOMAINS = [
  { id: "all", label: "All Domains", icon: "⚡", color: "#00d4ff" },
  { id: "cka", label: "CKA", icon: "☸️", color: "#326ce5" },
  { id: "cks", label: "CKS", icon: "🔒", color: "#e53935" },
  { id: "vks", label: "VMware VKS", icon: "🟢", color: "#00b373" },
  { id: "vsphere", label: "vSphere", icon: "🔷", color: "#0f7dc2" },
  { id: "vcp", label: "VCP", icon: "🏅", color: "#f5a623" },
];
 
const QUICK_ACTIONS = [
  { id: "quiz", label: "Quiz Me", icon: "🎯", prompt: "Give me a challenging exam-style question on the current domain. After I answer, tell me if I'm right, explain the correct answer in detail, and give me one follow-up concept to study." },
  { id: "explain", label: "Explain a Concept", icon: "💡", prompt: "Search for and explain a key concept from the current domain that I should know for the exam. Include official documentation references." },
  { id: "compare", label: "Compare & Contrast", icon: "⚖️", prompt: "Pick two related concepts from the current domain that candidates often confuse, search for the official definitions, and clearly explain the difference with examples." },
  { id: "scenario", label: "Real-World Scenario", icon: "🏗️", prompt: "Give me a real-world troubleshooting or architecture scenario from the current domain. Search for relevant official docs or known issues and walk me through how an expert would approach it." },
  { id: "checklist", label: "Exam Checklist", icon: "✅", prompt: "Search for the latest official exam curriculum and give me a concise checklist for the current domain — must-know topics, commands, and gotchas I cannot miss." },
  { id: "plan", label: "Study Plan", icon: "📅", prompt: "Search for the latest CKA, CKS, and VMware VCP/VKS exam curricula and build me a focused week-by-week study plan with a deadline of end of May 2026. I use KodeKloud for CKA, Kind cluster for practice, and have 7.5 years vSphere experience." },
];
 
const VKS_QUICK_ACTIONS = [
  { id: "vks-capi", label: "CAPI Deep Dive", icon: "🔧", prompt: "Explain CAPI v1beta2 in VMware VKS 3.6.x — how it differs from the deprecated TKC API, key CRDs, and how to provision clusters using the new API. Search for official Broadcom TechDocs." },
  { id: "vks-supervisor", label: "Supervisor Setup", icon: "🖥️", prompt: "Walk me through enabling and configuring vSphere Supervisor for VKS on VCF. Cover prerequisites, NSX requirements, storage policies, and common gotchas. Search techdocs.broadcom.com." },
  { id: "vks-packages", label: "Standard Packages", icon: "📦", prompt: "Explain VKS Standard Packages — Istio, Contour, Antrea, Calico. How are they installed, managed, and updated in VKS 3.6.x? What are the differences between Antrea and Calico CNI in this context?" },
  { id: "vks-upgrade", label: "Cluster Upgrades", icon: "⬆️", prompt: "Explain how to upgrade VKS workload clusters using VKr releases. What is the VKr lifecycle, how does rolling upgrade work, and what should I watch out for? Search official Broadcom docs." },
];
 
const SYSTEM_PROMPT = `You are an elite technical study agent and exam coach with live web search capability. You specialise in:
 
1. **CKA (Certified Kubernetes Administrator)** — Feb 2025 updated curriculum. Key topics: Troubleshooting (30%), Cluster Architecture, Gateway API (replacing Ingress), Helm, Kustomize, CRDs & Operators, Storage (dynamic provisioning, PVs, PVCs), Services & Networking. Exam is on Kubernetes v1.34.
 
2. **CKS (Certified Kubernetes Security Specialist)** — Requires active CKA. Topics: cluster hardening, system hardening, supply chain security (OPA/Gatekeeper, Falco, image scanning), network policies, RBAC, Pod Security Standards, secrets management.
 
3. **VMware VKS (vSphere Kubernetes Service)** — Formerly TKGs (renamed March 2025). VKS 3.6.x, K8s 1.35 support, CAPI v1beta2 as default (TKC API deprecated), vSphere Supervisor, VKr releases, Standard Packages (Istio, Contour, Antrea/Calico), runs on VCF 9.x/8.x.
 
4. **vSphere** — ESXi, vCenter, vSAN, NSX-T/NSX, DRS, HA, FT, vMotion, storage policies, VM lifecycle, vDS networking, resource pools, Workload Management/Supervisor.
 
5. **VCP (VMware Certified Professional)** — VCP-DCV and VCP-VKS pathways.
 
**Student context:**
- Mohit — 7.5 years vSphere experience (vCenter, VMs, ESXi). MSc Cybersecurity at Griffith College Limerick.
- KodeKloud for CKA, Kind cluster for hands-on. Hard deadline: End of May 2026.
- Don't over-explain VMware basics — connect K8s concepts to VMware equivalents instead.
 
**Web Search behaviour:**
- USE web search proactively for: latest exam curriculum, official docs, recent VKS/K8s release notes, KodeKloud community tips
- Prefer: kubernetes.io, techdocs.broadcom.com, training.linuxfoundation.org, kodekloud.com
- After searching, cite your sources clearly so Mohit can bookmark them
- Flag if info is from official docs vs community content
 
**Response style:**
- Direct, technical, precise
- kubectl commands, YAML snippets, CLI flags where relevant
- Correct Broadcom terminology: VKr not TKr, VKS not TKGs, CAPI not TKC API
- When quizzing: one question at a time, wait for answer, then grade and explain
- Flag exam traps and gotchas`;
 
export default function StudyAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [activeDomain, setActiveDomain] = useState("all");
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchStatus]);
 
  const getDomainContext = () => {
    if (activeDomain === "all") return "Cover across all domains: CKA, CKS, VMware VKS, vSphere, and VCP.";
    const domain = DOMAINS.find(d => d.id === activeDomain);
    return `Current domain focus: ${domain.label}. Tailor your response specifically to this domain.`;
  };
 
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;
    setShowWelcome(false);
 
    const userMsg = {
      role: "user",
      displayContent: messageText,
      content: `[Domain: ${activeDomain.toUpperCase()}] ${getDomainContext()}\n\n${messageText}`,
    };
 
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setSearchStatus("");
 
    try {
      let conversationMessages = newMessages.map(m => ({
        role: m.role,
        content: m.apiContent ?? m.content,
      }));
 
      let finalText = "";
      let allSearchQueries = [];
      let iterations = 0;
 
      while (iterations < 6) {
        iterations++;
 
        const res = await fetch("/api/anthropic/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages: conversationMessages,
          }),
        });
 
        const data = await res.json();
        if (data.error) { finalText = `⚠️ API Error: ${data.error.message}`; break; }
 
        const content = data.content || [];
 
        content.filter(b => b.type === "tool_use" && b.name === "web_search").forEach(b => {
          const q = b.input?.query || "";
          if (q) { allSearchQueries.push(q); setSearchStatus(`🔍 Searching: "${q}"`); }
        });
 
        const texts = content.filter(b => b.type === "text").map(b => b.text);
        if (texts.length) finalText = texts.join("\n");
 
        if (data.stop_reason === "end_turn") break;
 
        if (data.stop_reason === "tool_use") {
          conversationMessages = [...conversationMessages, { role: "assistant", content }];
          const toolResults = content
            .filter(b => b.type === "tool_use")
            .map(b => ({ type: "tool_result", tool_use_id: b.id, content: "Search completed." }));
          conversationMessages = [...conversationMessages, { role: "user", content: toolResults }];
          continue;
        }
        break;
      }
 
      setSearchStatus("");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: finalText || "No response received.",
        searchQueries: allSearchQueries,
        apiContent: conversationMessages.at(-1)?.content,
      }]);
    } catch (err) {
      setSearchStatus("");
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}`, searchQueries: [] }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };
 
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
 
  const activeDomainObj = DOMAINS.find(d => d.id === activeDomain);
 
  const inlineStyles = (html) =>
    html
      .replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong style="color:#e0eeff">${m}</strong>`)
      .replace(/`(.*?)`/g, (_, m) => `<code style="background:rgba(0,212,255,0.1);padding:1px 5px;border-radius:3px;font-family:'Space Mono',monospace;font-size:0.73rem;color:#7fffd4">${m}</code>`);
 
  const renderText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    const out = [];
    let codeLines = [], inCode = false;
 
    lines.forEach((line, i) => {
      if (line.startsWith("```")) {
        if (inCode) {
          out.push(
            <pre key={`c${i}`} style={{
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(0,212,255,0.18)",
              borderLeft: "3px solid #00d4ff", padding: "10px 13px", borderRadius: "0 6px 6px 0",
              fontFamily: "'Space Mono',monospace", fontSize: "0.74rem", color: "#7fffd4",
              overflowX: "auto", margin: "7px 0", lineHeight: 1.6,
            }}>{codeLines.join("\n")}</pre>
          );
          codeLines = []; inCode = false;
        } else { inCode = true; }
        return;
      }
      if (inCode) { codeLines.push(line); return; }
 
      if (line.startsWith("# ")) out.push(<h2 key={i} style={{ color: "#00d4ff", fontSize: "0.92rem", fontWeight: 700, margin: "12px 0 5px", fontFamily: "'Space Mono',monospace" }}>{line.slice(2)}</h2>);
      else if (line.startsWith("## ")) out.push(<h3 key={i} style={{ color: "#00d4ff", fontSize: "0.85rem", fontWeight: 700, margin: "10px 0 4px", fontFamily: "'Space Mono',monospace" }}>{line.slice(3)}</h3>);
      else if (line.startsWith("### ")) out.push(<h4 key={i} style={{ color: "#a0cfff", fontSize: "0.8rem", fontWeight: 700, margin: "8px 0 3px", fontFamily: "'Space Mono',monospace" }}>{line.slice(4)}</h4>);
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        out.push(
          <div key={i} style={{ display: "flex", gap: 7, margin: "3px 0", fontSize: "0.81rem", color: "#c5d8f0" }}>
            <span style={{ color: "#00d4ff", flexShrink: 0, marginTop: 2 }}>›</span>
            <span dangerouslySetInnerHTML={{ __html: inlineStyles(line.slice(2)) }} />
          </div>
        );
      } else if (/^\d+\./.test(line)) {
        const num = line.match(/^\d+\./)[0];
        out.push(
          <div key={i} style={{ display: "flex", gap: 7, margin: "3px 0", fontSize: "0.81rem", color: "#c5d8f0" }}>
            <span style={{ color: "#f5a623", flexShrink: 0, minWidth: 18, fontFamily: "'Space Mono',monospace", fontSize: "0.73rem" }}>{num}</span>
            <span dangerouslySetInnerHTML={{ __html: inlineStyles(line.replace(/^\d+\.\s*/, "")) }} />
          </div>
        );
      } else if (line.startsWith("> ")) {
        out.push(<div key={i} style={{ borderLeft: "3px solid #f5a623", paddingLeft: 10, margin: "5px 0", fontSize: "0.79rem", color: "#f5c842", fontStyle: "italic" }}>{line.slice(2)}</div>);
      } else if (line.trim() === "---") {
        out.push(<hr key={i} style={{ border: "none", borderTop: "1px solid rgba(0,212,255,0.13)", margin: "9px 0" }} />);
      } else if (line.trim() === "") {
        out.push(<div key={i} style={{ height: 5 }} />);
      } else {
        out.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineStyles(line) }} style={{ margin: "2px 0", fontSize: "0.81rem", color: "#c5d8f0", lineHeight: 1.65 }} />);
      }
    });
    return out;
  };
 
  const showVksActions = activeDomain === "vks";
 
  return (
    <div style={{ minHeight: "100vh", background: "#050b18", fontFamily: "'IBM Plex Sans',sans-serif", display: "flex", flexDirection: "column", color: "#c5d8f0", backgroundImage: "radial-gradient(ellipse at 20% 20%,rgba(0,30,80,0.4) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(0,60,40,0.2) 0%,transparent 60%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.2);border-radius:2px}
        textarea:focus{outline:none}textarea{resize:none}*{box-sizing:border-box}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes livepulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vksPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,179,115,0.4)}50%{box-shadow:0 0 0 6px rgba(0,179,115,0)}}
      `}</style>
 
      {/* Header */}
      <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(0,212,255,0.12)", background: "rgba(5,11,24,0.97)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#00d4ff22,#326ce522)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.8rem", fontWeight: 700, color: "#00d4ff", letterSpacing: 1 }}>STUDY AGENT</div>
            <div style={{ fontSize: "0.62rem", color: "#4a7fa5", letterSpacing: 2, textTransform: "uppercase" }}>CKA · CKS · VKS · vSphere · VCP</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <div style={{ fontSize: "0.62rem", color: "#00b373", fontFamily: "'Space Mono',monospace", background: "rgba(0,179,115,0.1)", border: "1px solid rgba(0,179,115,0.25)", padding: "3px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00b373", animation: "livepulse 2s infinite" }} />
            LIVE SEARCH
          </div>
          <div style={{ fontSize: "0.62rem", color: "#f5a623", fontFamily: "'Space Mono',monospace", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", padding: "3px 8px", borderRadius: 20 }}>⏳ MAY 2026</div>
        </div>
      </div>
 
      {/* Domain Selector */}
      <div style={{ display: "flex", gap: 5, padding: "7px 13px", borderBottom: "1px solid rgba(0,212,255,0.08)", overflowX: "auto", background: "rgba(0,0,0,0.2)", scrollbarWidth: "none" }}>
        {DOMAINS.map(d => (
          <button key={d.id} onClick={() => setActiveDomain(d.id)} style={{ padding: "4px 11px", borderRadius: 20, border: `1px solid ${activeDomain === d.id ? d.color : "rgba(255,255,255,0.07)"}`, background: activeDomain === d.id ? `${d.color}18` : "transparent", color: activeDomain === d.id ? d.color : "#4a7fa5", fontSize: "0.68rem", fontWeight: activeDomain === d.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", fontFamily: "'IBM Plex Sans',sans-serif" }}>
            {d.icon} {d.label}
          </button>
        ))}
      </div>
 
      {/* VKS Banner — shown only when VKS domain is active */}
      {activeDomain === "vks" && (
        <div style={{ padding: "7px 13px", background: "rgba(0,179,115,0.06)", borderBottom: "1px solid rgba(0,179,115,0.15)", display: "flex", alignItems: "center", gap: 10, animation: "fadeSlideIn 0.3s ease" }}>
          <div style={{ fontSize: "0.65rem", color: "#00b373", fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>VKS MODE</div>
          <div style={{ height: 1, flex: 1, background: "rgba(0,179,115,0.2)" }} />
          <div style={{ fontSize: "0.62rem", color: "#4a9a7a", fontFamily: "'Space Mono',monospace" }}>CAPI v1beta2 · VKS 3.6.x · K8s 1.35 · VCF 9.x</div>
        </div>
      )}
 
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "13px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
 
          {showWelcome && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <div style={{ textAlign: "center", padding: "22px 18px 16px", background: "linear-gradient(135deg,rgba(0,212,255,0.04),rgba(50,108,229,0.04))", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 14, marginBottom: 14 }}>
                <div style={{ fontSize: "1.7rem", marginBottom: 7 }}>☸️</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.88rem", color: "#00d4ff", fontWeight: 700, marginBottom: 5 }}>Your Personal Study Agent</div>
                <div style={{ fontSize: "0.76rem", color: "#4a7fa5", lineHeight: 1.7 }}>
                  Powered by <span style={{ color: "#00b373", fontWeight: 600 }}>live web search</span> — pulls from official Kubernetes docs,<br />Broadcom TechDocs, Linux Foundation, KodeKloud & more in real time.
                </div>
              </div>
 
              {/* VKS-specific quick actions when VKS domain selected */}
              {showVksActions ? (
                <>
                  <div style={{ fontSize: "0.63rem", color: "#00b373", fontFamily: "'Space Mono',monospace", letterSpacing: 2, marginBottom: 7, paddingLeft: 2 }}>VKS QUICK ACTIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                    {VKS_QUICK_ACTIONS.map(a => (
                      <button key={a.id} onClick={() => sendMessage(a.prompt)} style={{ padding: "9px 11px", borderRadius: 10, border: "1px solid rgba(0,179,115,0.2)", background: "rgba(0,179,115,0.04)", color: "#a0cfff", cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'IBM Plex Sans',sans-serif", display: "flex", flexDirection: "column", gap: 3 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,179,115,0.5)"; e.currentTarget.style.background = "rgba(0,179,115,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,179,115,0.2)"; e.currentTarget.style.background = "rgba(0,179,115,0.04)"; }}>
                        <span style={{ fontSize: "0.95rem" }}>{a.icon}</span>
                        <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "#c5d8f0" }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.63rem", color: "#4a7fa5", fontFamily: "'Space Mono',monospace", letterSpacing: 2, marginBottom: 7, paddingLeft: 2 }}>GENERAL ACTIONS</div>
                </>
              ) : null}
 
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.i
