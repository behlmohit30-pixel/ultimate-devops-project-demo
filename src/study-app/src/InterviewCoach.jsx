import { useState, useEffect, useRef } from "react";
 
// ─── CONSTANTS ────────────────────────────────────────────────────────────────
 
const SIT_PHASES = [
  { id: 1, label: "Phase 1", sub: "Low Threat", color: "#2dd4bf", timer: false, hostile: false,
    desc: "No timer. Explain concepts aloud in a calm state. Rewire the anxiety-to-articulation conditioning — connect calm to technical fluency." },
  { id: 2, label: "Phase 2", sub: "Timed Pressure", color: "#f59e0b", timer: true, hostile: false,
    desc: "Visible countdown. Rising heart rate = energy mobilisation, not failure. Practice arousal reappraisal every time you feel the spike." },
  { id: 3, label: "Phase 3", sub: "High Threat", color: "#f43f5e", timer: true, hostile: true,
    desc: "Hostile mode. No hints. If you blank: Pause → Sigh → Recover. The recovery is the skill being trained — not the perfect answer." },
  { id: 4, label: "Phase 4", sub: "Peak & Taper", color: "#a78bfa", timer: true, hostile: false,
    desc: "Trust your preparation. The exam/interview is just another practice session. Taper — no cramming, only consolidation." },
];
 
const PROTOCOL_ITEMS = [
  { id: "a", time: "07:00", label: "Zone 2 Cardio", sub: "30–45 min at conversational pace — BDNF synthesis, hippocampal repair", icon: "🏃" },
  { id: "b", time: "08:30", label: "Deep Work Block 1", sub: "Feynman Technique + spaced repetition flashcards", icon: "🧠" },
  { id: "c", time: "14:00", label: "NSDR", sub: "20 min Non-Sleep Deep Rest — cortisol and dopamine reset", icon: "🧘" },
  { id: "d", time: "15:00", label: "Deep Work Block 2", sub: "kubectl drills, YAML practice, architecture sketches", icon: "⌨️" },
  { id: "e", time: "19:00", label: "SIT Session", sub: "Timed mock interview using this app — tonight's focus", icon: "🎯" },
  { id: "f", time: "21:30", label: "Evidence Ledger", sub: "Write 3 objective proofs of competence into the ledger", icon: "📒" },
  { id: "g", time: "22:30", label: "Sleep Protocol", sub: "Cognitive shuffle: spell K-U-B-E-R-N-E-T-E-S visually", icon: "🌙" },
];
 
const QS = {
  cka: [
    { q: "A pod in namespace 'production' is stuck in CrashLoopBackOff. Walk me through your full diagnostic process — commands and reasoning.", topic: "Troubleshooting", d: "medium" },
    { q: "A Node shows NotReady. List the 3 most likely causes and your investigation steps for each. Which do you check first and why?", topic: "Troubleshooting", d: "medium" },
    { q: "Explain Deployment vs StatefulSet vs DaemonSet. Give a concrete production use case for each — not textbook definitions.", topic: "Workloads", d: "easy" },
    { q: "A PVC is stuck in Pending. What are all possible causes? Walk me through your complete debugging sequence.", topic: "Storage", d: "medium" },
    { q: "A Service isn't routing traffic to its pods. The pods are Running. What do you check, in what order?", topic: "Networking", d: "medium" },
    { q: "Explain RBAC in Kubernetes. What's the difference between Role and ClusterRole? Write YAML granting a ServiceAccount read-only pod access in one namespace.", topic: "Security", d: "medium" },
    { q: "Walk me through the exact etcd backup and restore procedure. What happens to the cluster during restore? What could go wrong?", topic: "Cluster Admin", d: "hard" },
    { q: "Explain Gateway API. How does it replace the deprecated Ingress resource? What are its three core object types?", topic: "Networking", d: "medium" },
    { q: "Before running 'helm install' on a production cluster, what do you do? What flags are non-negotiable?", topic: "Helm", d: "medium" },
    { q: "Write a NetworkPolicy allowing pods labelled app=api to receive traffic ONLY from pods labelled app=frontend in the same namespace, on port 8080.", topic: "Networking", d: "hard" },
    { q: "A pod keeps getting OOMKilled despite having resource limits. How do you investigate? Explain requests vs limits vs actual memory pressure.", topic: "Resources", d: "medium" },
    { q: "Explain the kube-scheduler process. How do taints/tolerations interact with node affinity? Give a real scenario using both together.", topic: "Scheduling", d: "hard" },
  ],
  devops: [
    { q: "Describe a CI/CD pipeline you designed or significantly improved. What were the specific bottlenecks and how did you solve them?", topic: "CI/CD", d: "medium" },
    { q: "How do you manage secrets in a Kubernetes production environment? Compare at least two approaches and explain the tradeoffs.", topic: "Security", d: "medium" },
    { q: "Blue-green vs canary deployment — when would you choose each? What are the specific infrastructure requirements in a Kubernetes environment?", topic: "Deployment", d: "medium" },
    { q: "Your terraform apply fails halfway through a complex multi-resource deployment. State is now partially applied. What do you do, step by step?", topic: "Terraform", d: "hard" },
    { q: "A microservice shows increased latency in production. Nothing was recently deployed. Walk me through your investigation — tools, signals, steps.", topic: "Observability", d: "hard" },
    { q: "It's 3am. Severity-1 incident. Production degraded for 10,000 users. Walk me through your full incident response process.", topic: "SRE", d: "hard" },
    { q: "What is GitOps? Explain push-based vs pull-based deployment models. What are the specific failure modes of each?", topic: "GitOps", d: "medium" },
    { q: "How do you implement least-privilege IAM for a Terraform deployment pipeline in AWS or Azure? Walk me through your actual design.", topic: "Security", d: "medium" },
    { q: "Your Kubernetes cluster has 3 nodes, deployment with 10 replicas. One node goes down. What happens? What had you done to prepare?", topic: "Reliability", d: "medium" },
    { q: "Explain your observability stack. What's the real difference between logs, metrics, and traces — and when does each actually help you find a problem?", topic: "Observability", d: "medium" },
  ],
  vmware: [
    { q: "Explain CAPI v1beta2 in VMware VKS. How does it differ from the deprecated TKC API? What CRDs are involved in provisioning a new workload cluster?", topic: "VKS/CAPI", d: "hard" },
    { q: "Walk me through enabling vSphere Supervisor for VKS on VCF. What are the NSX prerequisites and the most common configuration gotchas?", topic: "VKS Setup", d: "hard" },
    { q: "What are VKr releases? How does a VKS cluster upgrade work mechanically? What happens to running workloads during the rolling upgrade?", topic: "VKS Lifecycle", d: "medium" },
    { q: "Compare Antrea and Calico CNI in the VKS 3.6.x context. Which is default? In what scenario would you switch to Calico?", topic: "Networking", d: "medium" },
    { q: "Explain vSphere HA vs FT vs DRS. Be specific about what actual failure scenarios each handles and their real limitations in 2025.", topic: "vSphere HA", d: "medium" },
    { q: "A vMotion is failing consistently for a specific VM. Walk me through your diagnostic process and the most common blockers.", topic: "Troubleshooting", d: "medium" },
    { q: "Your vSAN cluster shows degraded health after a disk failure. How do you assess the impact and recover to a healthy state?", topic: "vSAN", d: "hard" },
    { q: "Explain NSX-T micro-segmentation. How would you implement zero-trust networking for a VKS workload cluster in practice?", topic: "NSX", d: "hard" },
  ],
  behavioral: [
    { q: "Tell me about a production issue you'd never seen before that you debugged under significant time pressure. What did you do?", topic: "Problem Solving", d: "medium" },
    { q: "Describe a disagreement with a senior colleague's technical decision. How did you handle it? What was the outcome?", topic: "Influence", d: "medium" },
    { q: "Your team's deployment pipeline takes 45 minutes per release. The business wants it under 10. Limited time budget. Where do you start?", topic: "Ownership", d: "medium" },
    { q: "Tell me about the most complex infrastructure you've owned. What made it complex? What would you do differently now?", topic: "Technical Depth", d: "medium" },
    { q: "How do you stay current with cloud-native infrastructure? Give me a specific example of something you learned in the last 6 months.", topic: "Learning", d: "easy" },
    { q: "You join a new team. Infrastructure is undocumented, fragile. No runbooks, no IaC, mixed tools. What's your 90-day plan?", topic: "Leadership", d: "hard" },
  ],
};
 
const SEED_LEDGER = [
  { id: 1, text: "7.5 years managing vSphere at enterprise scale — ESXi, vCenter, vSAN, DRS, HA in live production environments", cat: "Experience" },
  { id: 2, text: "MSc Cybersecurity, Griffith College — rigorous academic credential, completed while working full-time", cat: "Academic" },
  { id: 3, text: "VMware by Broadcom professional support — enterprise-level virtualisation at the world's leading infrastructure vendor", cat: "Experience" },
  { id: 4, text: "Tesco enterprise IT support — high-availability, business-critical environment at significant scale", cat: "Experience" },
  { id: 5, text: "Self-directed Kind cluster lab for hands-on Kubernetes practice — personal initiative beyond job scope", cat: "Initiative" },
  { id: 6, text: "KodeKloud CKA/CKS training — certification-standard, lab-driven study on exact exam curriculum", cat: "Learning" },
];
 
const SIGH = [
  { label: "First Inhale", ms: 2500, text: "Deep breath in through the nose...", scale: 1.45, c: "#2dd4bf" },
  { label: "Top-off Inhale", ms: 1200, text: "Sharp second inhale — fill completely...", scale: 1.85, c: "#60a5fa" },
  { label: "Hold", ms: 500, text: "Hold...", scale: 1.85, c: "#a78bfa" },
  { label: "Long Exhale", ms: 5000, text: "Slow, complete exhale through the mouth...", scale: 0.7, c: "#f59e0b" },
  { label: "Rest", ms: 1800, text: "Rest. Feel the shift.", scale: 0.7, c: "#2dd4bf" },
];
 
const TIM = { easy: 420, medium: 300, hard: 180 };
const CAT_C = { Experience: "#2dd4bf", Academic: "#60a5fa", Initiative: "#f59e0b", Learning: "#a78bfa", Achievement: "#f43f5e", Other: "#94a3b8" };
 
// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const sg = async (k) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const ss = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} };
 
// ─── API HELPER ───────────────────────────────────────────────────────────────
const callClaude = async (sys, msg) => {
  const r = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys, messages: [{ role: "user", content: msg }] }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content[0].text;
};
 
// ─── MICRO-COMPONENTS ─────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.62rem", letterSpacing: 2.5, color: "#334155", marginBottom: 8, textTransform: "uppercase" }}>{children}</div>
);
 
const Dots = ({ score, color }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {[1,2,3,4,5].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: i <= score ? color : "rgba(255,255,255,0.08)", transition: `background 0.3s ${i * 60}ms` }} />)}
  </div>
);
 
const Panel = ({ accent, title, items = [] }) => (
  <div style={{ padding: "13px 14px", borderRadius: 10, background: `${accent}05`, border: `1px solid ${accent}18` }}>
    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: accent, marginBottom: 8 }}>{title}</div>
    {items.map((x, i) => <div key={i} style={{ fontSize: "0.73rem", color: "#475569", marginBottom: 6, lineHeight: 1.55, paddingLeft: 8, borderLeft: `2px solid ${accent}25` }}>{x}</div>)}
  </div>
);
 
const InfoBlock = ({ accent, title, text, mb = 10 }) => (
  <div style={{ padding: "13px 16px", borderRadius: 10, background: `${accent}05`, border: `1px solid ${accent}15`, marginBottom: mb }}>
    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: accent, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: "0.77rem", color: "#475569", lineHeight: 1.65 }}>{text}</div>
  </div>
);
 
const Spinner = ({ color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px" }}>
    <div style={{ width: 38, height: 38, border: `2px solid ${color}18`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  </div>
);
 
// ─── PANIC MODAL ──────────────────────────────────────────────────────────────
function PanicModal({ onClose }) {
  const steps = [
    { n: "01", t: "STOP", b: "Do not speak. Pause 3 full seconds. Say internally: \"This is a neurochemical bottleneck — not a reflection of my competence.\"" },
    { n: "02", t: "PHYSIOLOGICAL SIGH", b: "Double inhale through the nose. Long, slow, complete exhale through the mouth. One cycle is enough. This forces parasympathetic activation in seconds." },
    { n: "03", t: "EXTERNALISE", b: "Write the question on paper or the whiteboard. This offloads working memory and physically restores prefrontal cortex access." },
    { n: "04", t: "REAPPRAISE", b: "\"My heart rate is mobilising glucose and oxygen for peak performance. This is not panic — this is fuel.\"" },
    { n: "05", t: "CONTINUE", b: "Say aloud: \"Let me think through this step by step.\" Start with what you know. Momentum restores access to the rest." },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 460, width: "100%", background: "#0d0f18", border: "1px solid rgba(244,63,94,0.22)", borderRadius: 16, padding: "26px 22px" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🛑</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#f43f5e", letterSpacing: 2 }}>PANIC PROTOCOL</div>
          <div style={{ fontSize: "0.7rem", color: "#334155", marginTop: 5 }}>Your prefrontal cortex is temporarily offline. Execute this sequence now.</div>
        </div>
        {steps.map(s => (
          <div key={s.n} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: "#f43f5e", paddingTop: 2, flexShrink: 0, minWidth: 18 }}>{s.n}</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#f43f5e", letterSpacing: 1, marginBottom: 3 }}>{s.t}</div>
              <div style={{ fontSize: "0.71rem", color: "#475569", lineHeight: 1.65 }}>{s.b}</div>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 8, border: "1px solid rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.06)", color: "#2dd4bf", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.82rem", letterSpacing: 2, cursor: "pointer" }}>
          ✓ I AM READY — CLOSE
        </button>
      </div>
    </div>
  );
}
 
// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ phase, setPhase, checked, setChecked, stats, avgScore, ledger, setView, curPhase }) {
  const doneCount = Object.values(checked).filter(Boolean).length;
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <section style={{ marginBottom: 22 }}>
        <Lbl>Stress Inoculation Training — select your phase</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 9 }}>
          {SIT_PHASES.map(p => (
            <button key={p.id} onClick={() => setPhase(p.id)} style={{ padding: "11px 8px", borderRadius: 9, border: `1px solid ${phase === p.id ? p.color : "rgba(255,255,255,0.05)"}`, background: phase === p.id ? `${p.color}0e` : "rgba(255,255,255,0.02)", textAlign: "left", cursor: "pointer", transition: "all 0.18s" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.78rem", fontWeight: 700, color: phase === p.id ? p.color : "#1e293b", letterSpacing: 0.3 }}>{p.label}</div>
              <div style={{ fontSize: "0.62rem", color: phase === p.id ? "#475569" : "#0f172a", marginTop: 2 }}>{p.sub}</div>
            </button>
          ))}
        </div>
        {curPhase && <div style={{ padding: "9px 13px", borderRadius: 7, background: `${curPhase.color}07`, border: `1px solid ${curPhase.color}18`, fontSize: "0.71rem", color: "#475569", lineHeight: 1.65 }}>{curPhase.desc}</div>}
      </section>
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 22 }}>
        {[{ l: "Questions answered", v: stats.total, c: "#2dd4bf" }, { l: "Average score", v: `${avgScore}/5`, c: "#f59e0b" }, { l: "Evidence votes", v: ledger.length, c: "#a78bfa" }].map(s => (
          <div key={s.l} style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: "#1e293b", marginBottom: 6, textTransform: "uppercase" }}>{s.l}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "1.7rem", color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
 
      <section style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <Lbl>Today's neurobiological protocol</Lbl>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: doneCount === PROTOCOL_ITEMS.length ? "#2dd4bf" : "#334155" }}>{doneCount}/{PROTOCOL_ITEMS.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {PROTOCOL_ITEMS.map(item => (
            <button key={item.id} onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, background: checked[item.id] ? "rgba(45,212,191,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${checked[item.id] ? "rgba(45,212,191,0.18)" : "rgba(255,255,255,0.04)"}`, textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${checked[item.id] ? "#2dd4bf" : "#0f172a"}`, background: checked[item.id] ? "#2dd4bf" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.55rem", color: "#000", transition: "all 0.15s" }}>{checked[item.id] ? "✓" : ""}</div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: "#1e293b", flexShrink: 0, minWidth: 34 }}>{item.time}</span>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 500, color: checked[item.id] ? "#64748b" : "#334155" }}>{item.label}</div>
                <div style={{ fontSize: "0.61rem", color: "#0f172a", marginTop: 1 }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {[
          { v: "interview", label: "Mock Interview", sub: "Timed · Graded · Stress training", icon: "🎯", c: "#f59e0b" },
          { v: "feynman", label: "Feynman Lab", sub: "Explain it · Find your gaps", icon: "🔬", c: "#60a5fa" },
          { v: "ledger", label: "Evidence Ledger", sub: `${ledger.length} votes for competence`, icon: "📒", c: "#a78bfa" },
          { v: "breathwork", label: "Breathwork", sub: "Physiological sigh · 3 cycles", icon: "🌬", c: "#2dd4bf" },
        ].map(b => (
          <button key={b.v} onClick={() => setView(b.v)} style={{ padding: "14px", borderRadius: 11, border: `1px solid ${b.c}20`, background: `${b.c}05`, textAlign: "left", cursor: "pointer", transition: "all 0.18s" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: b.c, letterSpacing: 0.3 }}>{b.label}</div>
            <div style={{ fontSize: "0.65rem", color: "#0f172a", marginTop: 3 }}>{b.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
 
// ─── INTERVIEW VIEW ───────────────────────────────────────────────────────────
function InterviewView({ curPhase, onScore }) {
  const [domain, setDomain] = useState("cka");
  const [screen, setScreen] = useState("setup");
  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [grade, setGrade] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  const ansRef = useRef("");
 
  useEffect(() => { ansRef.current = answer; }, [answer]);
 
  const startQ = () => {
    const pool = QS[domain];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setQ(picked); setAnswer(""); ansRef.current = ""; setGrade(null); setError("");
    if (curPhase.timer) setTimeLeft(TIM[picked.d] || 300);
    setScreen("question");
  };
 
  useEffect(() => {
    if (screen !== "question" || !curPhase.timer) return;
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, curPhase.timer]);
 
  const submit = async () => {
    clearInterval(timerRef.current);
    setScreen("grading");
    try {
      const sys = `You are a demanding senior DevOps interviewer with 15+ years experience. Grade this answer accurately and return ONLY valid JSON (no markdown, no backticks):
{"score":<1-5 integer>,"verdict":"<one direct sentence>","strong":["<specific strength>","<specific strength>"],"gaps":["<specific gap>","<specific gap>"],"expert_note":"<what top-5% answer adds — max 2 sentences>","follow_up":"<one sharp follow-up question>"}
Scoring: 1=wrong 2=partial 3=adequate 4=strong 5=excellent. Be direct, don't inflate scores.${curPhase.hostile ? " HOSTILE MODE: Surface every gap. Be demanding." : ""}`;
      const msg = `Domain:${domain.toUpperCase()} Topic:${q.topic} Difficulty:${q.d.toUpperCase()}\nQuestion: ${q.q}\nAnswer: ${ansRef.current.trim() || "[No answer — time expired]"}`;
      const raw = await callClaude(sys, msg);
      const clean = raw.replace(/```json|```/g, "").trim();
      const res = JSON.parse(clean);
      setGrade(res); await onScore(res.score); setScreen("result");
    } catch (e) { setError(e.message); setScreen("question"); }
  };
 
  if (screen === "setup") {
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <Lbl>Select domain</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 18 }}>
          {[{ id:"cka",l:"CKA",s:"K8s Admin",i:"☸️",c:"#60a5fa"},{id:"devops",l:"DevOps",s:"Irish market",i:"🔧",c:"#2dd4bf"},{id:"vmware",l:"VMware/VKS",s:"vSphere+CAPI",i:"🟢",c:"#00b373"},{id:"behavioral",l:"Behavioral",s:"STAR method",i:"💬",c:"#a78bfa"}].map(d => (
            <button key={d.id} onClick={() => setDomain(d.id)} style={{ padding: "12px 7px", borderRadius: 9, border: `1px solid ${domain===d.id?d.c:"rgba(255,255,255,0.05)"}`, background: domain===d.id?`${d.c}0e`:"rgba(255,255,255,0.02)", textAlign: "center", cursor: "pointer", transition: "all 0.18s" }}>
              <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{d.i}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.77rem", color: domain===d.id?d.c:"#1e293b" }}>{d.l}</div>
              <div style={{ fontSize: "0.59rem", color: "#0f172a", marginTop: 2 }}>{d.s}</div>
            </button>
          ))}
        </div>
        <div style={{ padding: "11px 13px", borderRadius: 8, background: `${curPhase.color}07`, border: `1px solid ${curPhase.color}18`, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: "#1e293b", textTransform: "uppercase" }}>Active SIT phase</div>
            <div style={{ fontSize: "0.8rem", color: curPhase.color, fontWeight: 600, marginTop: 2 }}>{curPhase.label}: {curPhase.sub}</div>
          </div>
          <div style={{ fontSize: "0.63rem", color: "#1e293b", fontFamily: "'DM Mono',monospace" }}>{curPhase.timer ? `⏱${curPhase.hostile?" · Hostile":""}` : "No timer"}</div>
        </div>
        <button onClick={startQ} style={{ width: "100%", padding: "14px", borderRadius: 11, border: `1px solid ${curPhase.color}30`, background: `${curPhase.color}08`, color: curPhase.color, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.95rem", letterSpacing: 2, cursor: "pointer" }}>
          ▶ GENERATE QUESTION
        </button>
      </div>
    );
  }
 
  if (screen === "question") {
    const tc = timeLeft > 60 ? "#2dd4bf" : timeLeft > 30 ? "#f59e0b" : "#f43f5e";
    const tp = q ? (timeLeft / (TIM[q.d] || 300)) * 100 : 100;
    const mm = Math.floor(timeLeft / 60), ss = timeLeft % 60;
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[domain.toUpperCase(), q.topic, q.d.toUpperCase()].map((tag, i) => (
              <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", padding: "2px 7px", borderRadius: 4, background: i===2 ? (q.d==="hard"?"rgba(244,63,94,0.12)":q.d==="medium"?"rgba(245,158,11,0.12)":"rgba(45,212,191,0.12)") : "rgba(255,255,255,0.05)", color: i===2 ? (q.d==="hard"?"#f43f5e":q.d==="medium"?"#f59e0b":"#2dd4bf") : "#475569" }}>{tag}</span>
            ))}
          </div>
          {curPhase.timer && (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "1.3rem", color: tc, textAlign: "right", animation: timeLeft <= 30 ? "pulse 0.9s infinite" : "none" }}>{mm}:{ss.toString().padStart(2,"0")}</div>
              <div style={{ width: 62, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginTop: 3, marginLeft: "auto" }}>
                <div style={{ width: `${tp}%`, height: "100%", background: tc, borderRadius: 1, transition: "width 1s linear" }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 18px", borderRadius: 11, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 14, fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.75 }}>{q.q}</div>
        {curPhase.hostile && <div style={{ padding: "7px 11px", borderRadius: 6, background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.12)", marginBottom: 12, fontSize: "0.65rem", color: "#f43f5e", fontFamily: "'DM Mono',monospace" }}>⚠ HOSTILE MODE — Blank? Pause → sigh → say what you know → keep going.</div>}
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer. Show your reasoning process, not just the conclusion..." style={{ width: "100%", height: 185, padding: "13px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0", fontSize: "0.8rem", lineHeight: 1.7, outline: "none", marginBottom: 12, resize: "none", fontFamily: "'Outfit',sans-serif" }} autoFocus />
        {error && <div style={{ fontSize: "0.7rem", color: "#f43f5e", marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={submit} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.08))", borderTop: "1px solid rgba(245,158,11,0.22)", color: "#f59e0b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: 1.5, cursor: "pointer" }}>SUBMIT FOR GRADING →</button>
          <button onClick={() => setScreen("setup")} style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#1e293b", fontSize: "0.75rem", fontFamily: "'Barlow Condensed',sans-serif", cursor: "pointer" }}>SKIP</button>
        </div>
      </div>
    );
  }
 
  if (screen === "grading") return <Spinner color="#f59e0b" />;
 
  if (screen === "result" && grade) {
    const sc = grade.score;
    const sc_c = sc >= 4 ? "#2dd4bf" : sc >= 3 ? "#f59e0b" : "#f43f5e";
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", gap: 16, padding: "16px 18px", borderRadius: 11, background: `${sc_c}07`, border: `1px solid ${sc_c}18`, marginBottom: 14, alignItems: "center" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "2.8rem", color: sc_c, lineHeight: 1 }}>{sc}</div>
            <div style={{ fontSize: "0.5rem", color: "#1e293b", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" }}>out of 5</div>
            <div style={{ marginTop: 6 }}><Dots score={sc} color={sc_c} /></div>
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: "#1e293b", marginBottom: 4, textTransform: "uppercase" }}>Verdict</div>
            <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.65 }}>{grade.verdict}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 10 }}>
          <Panel accent="#2dd4bf" title="✓ STRONG POINTS" items={grade.strong} />
          <Panel accent="#f43f5e" title="✗ GAPS" items={grade.gaps} />
        </div>
        <InfoBlock accent="#f59e0b" title="💡 EXPERT NOTE" text={grade.expert_note} mb={9} />
        <InfoBlock accent="#a78bfa" title="→ FOLLOW-UP QUESTION" text={grade.follow_up} mb={18} />
        <button onClick={() => setScreen("setup")} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.18)", background: "rgba(245,158,11,0.04)", color: "#f59e0b", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: 1.5, cursor: "pointer" }}>NEXT QUESTION →</button>
      </div>
    );
  }
  return null;
}
 
// ─── FEYNMAN LAB ──────────────────────────────────────────────────────────────
function FeynmanView() {
  const [concept, setConcept] = useState("");
  const [domain, setDomain] = useState("cka");
  const [exp, setExp] = useState("");
  const [screen, setScreen] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
 
  const submit = async () => {
    if (!concept.trim() || !exp.trim()) return;
    setScreen("grading"); setError("");
    try {
      const sys = `Grade a technical concept explanation using the Feynman Technique. Return ONLY valid JSON (no markdown):
{"accuracy":<1-5>,"simplicity":<1-5>,"correct":["<what was right>"],"gaps":["<inaccuracy or missing key point>"],"expert_version":"<expert explains this in 2-3 sentences>","drill":"<one deep follow-up question to probe true understanding>"}`;
      const raw = await callClaude(sys, `Concept: ${concept}\nDomain: ${domain.toUpperCase()}\nExplanation:\n${exp}`);
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      setScreen("result");
    } catch (e) { setError(e.message); setScreen("input"); }
  };
 
  if (screen === "grading") return <Spinner color="#60a5fa" />;
 
  if (screen === "result" && result) return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.62rem", letterSpacing: 2, color: "#334155", marginBottom: 10, textTransform: "uppercase" }}>Feynman score — {concept}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[{ l: "Accuracy", s: result.accuracy }, { l: "Simplicity", s: result.simplicity }].map(m => {
          const c = m.s >= 4 ? "#2dd4bf" : m.s >= 3 ? "#f59e0b" : "#f43f5e";
          return (
            <div key={m.l} style={{ padding: "16px", borderRadius: 11, background: `${c}07`, border: `1px solid ${c}18`, textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.58rem", letterSpacing: 2, color: "#1e293b", marginBottom: 8, textTransform: "uppercase" }}>{m.l}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "2rem", color: c, marginBottom: 8 }}>{m.s}/5</div>
              <Dots score={m.s} color={c} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 10 }}>
        <Panel accent="#2dd4bf" title="✓ CORRECT" items={result.correct} />
        <Panel accent="#f43f5e" title="✗ GAPS" items={result.gaps} />
      </div>
      <InfoBlock accent="#60a5fa" title="💡 EXPERT VERSION" text={result.expert_version} mb={9} />
      <InfoBlock accent="#a78bfa" title="→ DRILL QUESTION" text={result.drill} mb={18} />
      <button onClick={() => { setScreen("input"); setResult(null); setConcept(""); setExp(""); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.18)", background: "rgba(96,165,250,0.04)", color: "#60a5fa", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: 1.5, cursor: "pointer" }}>TRY ANOTHER CONCEPT →</button>
    </div>
  );
 
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)", marginBottom: 18, fontSize: "0.73rem", color: "#334155", lineHeight: 1.7 }}>
        <span style={{ color: "#60a5fa", fontWeight: 600 }}>Feynman Technique:</span> If you can't explain it simply, you don't fully understand it. Explain the concept as if to your 12-year-old cousin. Claude grades accuracy and simplicity — and shows you exactly what's missing.
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
        <select value={domain} onChange={e => setDomain(e.target.value)} style={{ padding: "9px 11px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: "0.74rem", outline: "none", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
          {["cka","devops","vmware"].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="e.g. etcd, CAPI v1beta2, Terraform state locking, vSAN FTT..." style={{ flex: 1, padding: "9px 13px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.79rem", outline: "none", fontFamily: "'Outfit',sans-serif" }} />
      </div>
      <textarea value={exp} onChange={e => setExp(e.target.value)} placeholder="Explain it simply. Use an analogy. Avoid jargon. Imagine your 12-year-old cousin just asked what this is..." style={{ width: "100%", height: 195, padding: "13px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0", fontSize: "0.8rem", lineHeight: 1.7, outline: "none", marginBottom: 12, resize: "none", fontFamily: "'Outfit',sans-serif" }} />
      {error && <div style={{ fontSize: "0.7rem", color: "#f43f5e", marginBottom: 8 }}>{error}</div>}
      <button onClick={submit} disabled={!concept.trim() || !exp.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${concept&&exp?"rgba(96,165,250,0.22)":"rgba(255,255,255,0.04)"}`, background: concept&&exp?"rgba(96,165,250,0.08)":"rgba(255,255,255,0.015)", color: concept&&exp?"#60a5fa":"#0f172a", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: 1.5, cursor: concept&&exp?"pointer":"default" }}>GRADE MY UNDERSTANDING →</button>
    </div>
  );
}
 
// ─── EVIDENCE LEDGER ──────────────────────────────────────────────────────────
function LedgerView({ ledger, updateLedger }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("Experience");
  const add = () => {
    if (!text.trim()) return;
    updateLedger([...ledger, { id: Date.now(), text: text.trim(), cat, date: new Date().toLocaleDateString("en-IE", { day: "numeric", month: "short" }) }]);
    setText("");
  };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ textAlign: "center", padding: "22px", borderRadius: 13, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.1)", marginBottom: 22 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "3.8rem", color: "#a78bfa", lineHeight: 1 }}>{ledger.length}</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.65rem", letterSpacing: 3, color: "#1e293b", marginTop: 7, textTransform: "uppercase" }}>Votes cast for Competent Engineer</div>
        <div style={{ fontSize: "0.68rem", color: "#1e293b", marginTop: 9, maxWidth: 340, margin: "10px auto 0", lineHeight: 1.65 }}>Not affirmations — documented facts. The anxious brain cannot argue with a concrete evidence ledger.</div>
      </div>
      <div style={{ padding: "14px", borderRadius: 11, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 18 }}>
        <Lbl>Add evidence</Lbl>
        <div style={{ display: "flex", gap: 7 }}>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: "0.72rem", outline: "none", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
            {Object.keys(CAT_C).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Describe something concrete you did, know, or achieved..." style={{ flex: 1, padding: "8px 12px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.76rem", outline: "none", fontFamily: "'Outfit',sans-serif" }} />
          <button onClick={add} style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.78rem", cursor: "pointer" }}>ADD</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ledger.map((e, i) => (
          <div key={e.id} style={{ display: "flex", gap: 9, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start", animation: "slideIn 0.2s ease" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.56rem", color: "#0f172a", minWidth: 20, paddingTop: 2 }}>{String(i+1).padStart(2,"0")}</div>
            <div style={{ flex: 1, fontSize: "0.75rem", color: "#475569", lineHeight: 1.6 }}>{e.text}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "0.57rem", padding: "2px 7px", borderRadius: 20, background: `${CAT_C[e.cat]||"#94a3b8"}14`, color: CAT_C[e.cat]||"#94a3b8" }}>{e.cat}</span>
              {e.id > 6 && <button onClick={() => updateLedger(ledger.filter(x => x.id !== e.id))} style={{ background: "none", border: "none", color: "#0f172a", fontSize: "0.8rem", cursor: "pointer", padding: "0 2px" }}>×</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
// ─── BREATHWORK ───────────────────────────────────────────────────────────────
function BreathworkView() {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [step, setStep] = useState(SIGH[0]);
  const stepIdxRef = useRef(0);
  const cycleRef = useRef(0);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
 
  const runNext = () => {
    if (!activeRef.current) return;
    const nIdx = (stepIdxRef.current + 1) % SIGH.length;
    stepIdxRef.current = nIdx;
    if (nIdx === 0) {
      cycleRef.current += 1;
      setCycles(cycleRef.current);
      if (cycleRef.current >= 3) { activeRef.current = false; setActive(false); setDone(true); return; }
    }
    const s = SIGH[nIdx];
    setStep(s);
    timerRef.current = setTimeout(runNext, s.ms);
  };
 
  const start = () => {
    clearTimeout(timerRef.current);
    stepIdxRef.current = 0; cycleRef.current = 0; activeRef.current = true;
    setCycles(0); setDone(false); setActive(true);
    setStep(SIGH[0]);
    timerRef.current = setTimeout(runNext, SIGH[0].ms);
  };
 
  const stop = () => {
    clearTimeout(timerRef.current);
    activeRef.current = false; setActive(false); setDone(false);
    setCycles(0); cycleRef.current = 0; stepIdxRef.current = 0;
    setStep(SIGH[0]);
  };
 
  useEffect(() => () => clearTimeout(timerRef.current), []);
 
  const sc = active ? step.scale : 1;
  const cc = active ? step.c : "#2dd4bf";
  const tms = active ? step.ms : 400;
 
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", animation: "fadeIn 0.3s ease" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.63rem", letterSpacing: 3, color: "#1e293b", marginBottom: 5, textTransform: "uppercase" }}>Physiological Sigh — Stanford-validated protocol</div>
      <div style={{ fontSize: "0.7rem", color: "#0f172a", textAlign: "center", maxWidth: 360, marginBottom: 38, lineHeight: 1.75 }}>
        Double inhale pops collapsed alveoli. Long exhale activates the vagus nerve. Forces parasympathetic dominance faster than any other breathwork at reducing acute anxiety.
      </div>
      <div style={{ width: 175, height: 175, marginBottom: 32, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `1.5px solid ${cc}`, background: `radial-gradient(circle, ${cc}10, transparent 70%)`, transform: `scale(${sc})`, transition: `transform ${tms}ms ease-in-out, border-color 0.5s ease`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.64rem", color: active ? cc : "#1e293b", letterSpacing: 0.5, textAlign: "center", maxWidth: 100 }}>{active ? step.label : done ? "COMPLETE" : "READY"}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {[1,2,3].map(i => <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${cycles >= i ? "#2dd4bf" : "rgba(255,255,255,0.08)"}`, background: cycles >= i ? "rgba(45,212,191,0.1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.63rem", color: cycles >= i ? "#2dd4bf" : "#1e293b", transition: "all 0.3s" }}>{cycles >= i ? "✓" : i}</div>)}
      </div>
      <div style={{ textAlign: "center", fontSize: "0.8rem", color: done ? "#2dd4bf" : active ? cc : "#334155", maxWidth: 340, lineHeight: 1.7, marginBottom: 30, minHeight: 50, transition: "color 0.5s" }}>
        {done ? "✓ 3 cycles complete. Parasympathetic dominant. Return to practice." : active ? step.text : "Press start. Run all 3 cycles. Then return to the interview."}
      </div>
      <button onClick={active ? stop : start} style={{ padding: "12px 44px", borderRadius: 50, border: `1px solid ${active ? "rgba(244,63,94,0.22)" : "rgba(45,212,191,0.22)"}`, background: active ? "rgba(244,63,94,0.05)" : "rgba(45,212,191,0.05)", color: active ? "#f43f5e" : "#2dd4bf", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: 2, cursor: "pointer", transition: "all 0.2s" }}>
        {active ? "STOP" : "BEGIN 3 CYCLES"}
      </button>
    </div>
  );
}
 
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function InterviewCoach() {
  const [view, setView] = useState("dashboard");
  const [phase, setPhase] = useState(2);
  const [checked, setChecked] = useState({});
  const [ledger, setLedger] = useState(SEED_LEDGER);
  const [stats, setStats] = useState({ total: 0, sumScore: 0 });
  const [panic, setPanic] = useState(false);
 
  useEffect(() => {
    (async () => {
      const [l, s, p] = await Promise.all([sg("ic_ledger"), sg("ic_stats"), sg("ic_phase")]);
      if (l) setLedger(l);
      if (s) setStats(s);
      if (p) setPhase(p);
    })();
  }, []);
 
  const updateLedger = async (e) => { setLedger(e); await ss("ic_ledger", e); };
  const updateStats = async (score) => {
    const n = { total: stats.total + 1, sumScore: stats.sumScore + score };
    setStats(n); await ss("ic_stats", n);
  };
  const updatePhase = async (p) => { setPhase(p); await ss("ic_phase", p); };
 
  const avgScore = stats.total > 0 ? (stats.sumScore / stats.total).toFixed(1) : "—";
  const curPhase = SIT_PHASES.find(p => p.id === phase) || SIT_PHASES[1];
 
  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "interview", label: "Interview", icon: "🎯" },
    { id: "feynman", label: "Feynman Lab", icon: "🔬" },
    { id: "ledger", label: "Ledger", icon: "📒" },
    { id: "breathwork", label: "Breathwork", icon: "🌬" },
  ];
 
  return (
    <div style={{ minHeight: "100vh", background: "#08090e", fontFamily: "'Outfit',sans-serif", color: "#e2e8f0", backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)", backgroundSize: "48px 48px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
        textarea{resize:none}button,select,input{font-family:'Outfit',sans-serif}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
 
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,9,14,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 14px", display: "flex", alignItems: "center", gap: 2, height: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 14, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: 1.5, color: "#f1f5f9", whiteSpace: "nowrap" }}>INTERVIEW COACH</span>
        </div>
        <div style={{ display: "flex", gap: 1, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: view === t.id ? "rgba(245,158,11,0.1)" : "transparent", color: view === t.id ? "#f59e0b" : "#334155", fontSize: "0.72rem", fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0, alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", padding: "2px 7px", borderRadius: 20 }}>⏰ MAY '26</div>
          <button onClick={() => setPanic(true)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.06)", color: "#f43f5e", fontSize: "0.65rem", fontWeight: 600, letterSpacing: 0.5, cursor: "pointer" }}>🛑 PANIC</button>
        </div>
      </nav>
 
      {panic && <PanicModal onClose={() => setPanic(false)} />}
 
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "22px 14px" }}>
        {view === "dashboard" && <DashboardView phase={phase} setPhase={updatePhase} checked={checked} setChecked={setChecked} stats={stats} avgScore={avgScore} ledger={ledger} setView={setView} curPhase={curPhase} />}
        {view === "interview" && <InterviewView curPhase={curPhase} onScore={updateStats} />}
        {view === "feynman" && <FeynmanView />}
        {view === "ledger" && <LedgerView ledger={ledger} updateLedger={updateLedger} />}
        {view === "breathwork" && <BreathworkView />}
      </div>
    </div>
  );
}
 
