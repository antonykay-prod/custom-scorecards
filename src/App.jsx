import React, { useState, useRef, useEffect } from "react";

const CALL_TYPES = ["Billing", "Clinical", "Confirmations", "Emergency", "Incomplete", "Insurance", "Others", "Product Order", "Recare", "Rescheduling", "Scheduling", "Vendor", "Verifications"];
const MAX_PER_CARD = 10;
const MAX_TOTAL = 45;
const EXISTING_QS = [
  "Did the agent greet the caller professionally?",
  "Was the caller's concern resolved in the first call?",
  "Did the agent confirm the patient's details correctly?",
  "Was the tone of the agent appropriate throughout?",
  "Did the agent follow the correct escalation procedure?",
  "Was the call summary accurate?",
  "Did the agent offer any follow-up action?",
  "Was hold time communicated to the caller?",
  "Did the agent verify insurance information accurately?",
  "Was the appointment confirmed with correct details?",
];

let _uid = 1;
const mkId = () => "q" + _uid++;

/* ── UI Components ── */
const Ico = ({ path, size = 16, stroke = "currentColor", sw = 2, fill = "none", vb = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const BtnPrimary = ({ children, onClick, disabled, full, icon }) => (
  <button 
    className="btn-primary"
    onClick={onClick} 
    disabled={disabled} 
    style={{ 
      display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
      width: full ? "100%" : "auto" 
    }}
  >
    {icon && <Ico path={icon} size={15} stroke="#fff" />}
    {children}
  </button>
);

const BtnGhost = ({ children, onClick, active }) => (
  <button 
    className="btn-ghost" 
    onClick={onClick}
    style={{
      background: active ? "var(--bg)" : "transparent",
      borderColor: active ? "var(--gray-300)" : "var(--gray-200)"
    }}
  >
    {children}
  </button>
);

const Section = ({ title, children }) => (
  <div className="card animate-slide-up" style={{ marginBottom: 20 }}>
    <div className="outfit" style={{ fontSize: 18, fontWeight: 700, color: "var(--dark-accent)", paddingBottom: 16, borderBottom: "1.5px solid var(--border)", marginBottom: 12 }}>
      {title}
    </div>
    {children}
  </div>
);

const Row = ({ label, children, last, alignTop }) => (
  <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", padding: "20px 0", borderBottom: last ? "none" : "1px solid var(--border)", gap: 24, flexWrap: "wrap" }}>
    <div style={{ width: 190, flexShrink: 0, fontSize: 13, fontWeight: 700, color: "var(--dark-accent)", paddingTop: alignTop ? 2 : 0 }}>{label}</div>
    <div style={{ flex: 1, minWidth: 220 }}>{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <div style={{ display: "flex", background: "var(--gray-100)", borderRadius: 60, padding: 4, width: 160, flexShrink: 0, border: "1px solid var(--gray-200)" }}>
    {["Yes", "No"].map(v => (
      <button 
        key={v} 
        onClick={() => onChange(v === "Yes")} 
        style={{ 
          flex: 1, border: "none", 
          background: (value && v === "Yes") || (!value && v === "No") ? "var(--primary)" : "transparent", 
          color: (value && v === "Yes") || (!value && v === "No") ? "var(--white)" : "var(--dark)", 
          fontSize: 13, fontWeight: (value && v === "Yes") || (!value && v === "No") ? 700 : 500, 
          padding: "8px 0", borderRadius: 60, transition: ".3s cubic-bezier(0.4, 0, 0.2, 1)" 
        }}
      >
        {v}
      </button>
    ))}
  </div>
);

const RadioCard = ({ value, current, onChange, label, desc }) => {
  const active = current === value;
  return (
    <label onClick={() => onChange(value)} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderRadius: 12, border: active ? "2px solid var(--primary)" : "1.5px solid var(--border)", background: active ? "var(--primary-light)" : "var(--white)", cursor: "pointer", transition: ".2s ease", boxShadow: active ? "0 4px 12px rgba(244, 137, 31, 0.08)" : "none" }}>
      <input type="radio" name="scMode" checked={active} onChange={() => onChange(value)} style={{ marginTop: 4, accentColor: "var(--primary)", transform: "scale(1.1)" }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--dark-accent)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </label>
  );
};

export default function App() {
  const [syncYes, setSyncYes]       = useState(true);
  const [taskMode, setTaskMode]     = useState("user");
  const [scMode, setScMode]         = useState("adit");
  const [modalOpen, setModalOpen]   = useState(false);
  const [cards, setCards]           = useState(() => Object.fromEntries(CALL_TYPES.map(t => [t, []])));
  const [activeType, setActiveType] = useState(CALL_TYPES[0]);
  const [tab, setTab]               = useState("new");
  const [newText, setNewText]       = useState("");
  const [mounted, setMounted]       = useState(false);
  const taRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const total      = Object.values(cards).reduce((s, qs) => s + qs.length, 0);
  const cardQs     = cards[activeType] || [];
  const atCard     = cardQs.length >= MAX_PER_CARD;
  const atTotal    = total >= MAX_TOTAL;
  const addBlocked = atCard || atTotal;
  const pct        = Math.min((total / MAX_TOTAL) * 100, 100);
  const barColor   = total >= MAX_TOTAL ? "var(--red)" : total >= 38 ? "var(--primary)" : "var(--green)";

  const doAdd = () => {
    const t = newText.trim();
    if (!t || addBlocked) return;
    setCards(p => ({ ...p, [activeType]: [...p[activeType], { id: mkId(), text: t, custom: true }] }));
    setNewText("");
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const addExisting = (text) => {
    if (addBlocked || cardQs.find(q => q.text === text)) return;
    setCards(p => ({ ...p, [activeType]: [...p[activeType], { id: mkId(), text, custom: false }] }));
  };

  const remove = (id) => setCards(p => ({ ...p, [activeType]: p[activeType].filter(q => q.id !== id) }));

  if (!mounted) return null;

  return (
    <div className="animate-fade-in" style={{ minHeight: "100vh" }}>

      {/* ── TOP BAR ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", zIndex: 100, borderBottom: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
        <div style={{ width: 70, height: "100%", background: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="outfit" style={{ color: "var(--primary)", fontSize: 28, fontWeight: 800 }}>A</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderRight: "1.5px solid var(--border)", height: "60%", cursor: "pointer", transition: ".2s" }}>
          <Ico path="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" size={18} stroke="var(--dark)" />
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--dark-accent)" }}>Houston Dental</span>
          <Ico path="M6 9l6 6 6-6" size={14} stroke="var(--dark)" sw={2.5} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--gray-100)", borderRadius: 10, padding: "8px 16px", width: 340, border: "1px solid transparent", transition: ".3s", "&:focus-within": { border: "1px solid var(--primary)", background: "#fff" } }}>
            <Ico path="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" size={16} stroke="var(--gray-500)" sw={2} />
            <input placeholder="Search Patient or Task" style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--dark-accent)", outline: "none", width: "100%", fontWeight: 500 }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px" }}>
          {[
            {bg: "var(--green)", sc: "#fff", p: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"},
            {bg: "#21aae0", sc: "#fff", p: "M12 5v14M5 12h14"},
            {bg: "var(--gray-100)", sc: "var(--dark)", p: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"},
            {bg: "var(--gray-100)", sc: "var(--dark)", p: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"},
          ].map((item, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: ".2s", "&:hover": { transform: "scale(1.1)" } }}>
              <Ico path={item.p} size={15} stroke={item.sc} sw={i === 1 ? 3 : 2} />
            </div>
          ))}
          <div style={{ width: 34, height: 34, borderRadius: "10px", background: "linear-gradient(135deg, #f9aaef 0%, #ff83b5 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--dark)", cursor: "pointer", boxShadow: "0 4px 10px rgba(249, 170, 239, 0.3)" }}>JG</div>
        </div>
      </div>

      {/* ── LEFT ICON NAV ── */}
      <div style={{ position: "fixed", left: 0, top: 60, width: 70, height: "calc(100vh - 60px)", background: "var(--dark)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 10, zIndex: 99 }}>
        {[
          "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
          "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
          "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
        ].map((d, i) => (
          <div key={i} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, cursor: "pointer", opacity: .4, transition: ".3s" }}>
            <Ico path={d} size={22} stroke="#fff" sw={1.7} />
          </div>
        ))}
        <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--primary-faded)", cursor: "pointer", border: "1px solid rgba(244,137,31,0.2)" }}>
          <Ico path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={22} stroke="var(--primary)" sw={2} />
        </div>
        {[
          "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
          "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
        ].map((d, i) => (
          <div key={i} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, cursor: "pointer", opacity: .4 }}>
            <Ico path={d} size={22} stroke="#fff" sw={1.7} />
          </div>
        ))}
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{ position: "fixed", left: 70, top: 60, width: 220, height: "calc(100vh - 60px)", background: "#fff", padding: "20px 0", zIndex: 98, borderRight: "1px solid var(--border)", boxShadow: "2px 0 10px rgba(0,0,0,0.02)", overflowY: "auto" }}>
        <div className="outfit" style={{ fontSize: 13, fontWeight: 700, color: "var(--dark-accent)", padding: "0 24px 16px", letterSpacing: "0.05em", opacity: 0.8 }}>MANAGEMENT</div>
        {["Summary", "Quick Search", "Calls", "Voicemails", "Fax", "Call Tasks", "AI Coaching", "AI Intelligence", "Legacy Insights", "Preferences"].map((item, i) => (
          <div key={item} 
            style={{ 
              fontSize: 13, 
              color: item === "Preferences" ? "var(--primary)" : "var(--dark)", 
              padding: "12px 24px", cursor: "pointer", fontWeight: item === "Preferences" ? 700 : 500, 
              borderLeft: item === "Preferences" ? "4px solid var(--primary)" : "4px solid transparent", 
              background: item === "Preferences" ? "var(--primary-light)" : "transparent",
              transition: ".2s"
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: 290, marginTop: 60, padding: "32px 48px", maxWidth: 1200 }}>
        


        {/* Score Cards */}
        <Section title="Evaluation Score Cards">
          <Row label="Analysis Mode" alignTop last>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <RadioCard value="adit" current={scMode} onChange={setScMode}
                label="Intelligent Default (Powered by Adit)"
                desc="Proprietary evaluation schemas optimized for diverse medical call scenarios and patient interactions." />
              <RadioCard value="customByType" current={scMode} onChange={setScMode}
                label="Tailored Evaluation per Call Type"
                desc="Define granular, role-specific metrics for incoming calls, product orders, scheduling, and more." />
              <RadioCard value="customAll" current={scMode} onChange={setScMode}
                label="Unified Custom Score Card"
                desc="Maintain consistent clinical and service standards across all patient communication types." />
            </div>
            <BtnPrimary onClick={() => setModalOpen(true)} icon="M9 12h6m-6 4h4M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
              Manage Score Card Logic
            </BtnPrimary>
          </Row>
        </Section>

      </div>

      {/* ═══ MODAL ═══ */}
      {modalOpen && (
        <div onClick={e => e.target === e.currentTarget && setModalOpen(false)}
          className="animate-fade-in"
          style={{ position: "fixed", inset: 0, background: "rgba(7, 43, 64, 0.7)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          
          <div className="animate-slide-up" style={{ 
            background: "#fff", borderRadius: 32, width: 1300, maxWidth: "98%", height: "94vh", 
            display: "flex", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 50px 120px rgba(0,0,0,0.4)"
          }}>

            {/* Pane 1: The Category Sidebar */}
            <div style={{ width: 280, background: "var(--dark)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: "32px 24px" }}>
                <div className="outfit" style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Practice Logic</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4, fontWeight: 500 }}>Call Scenarios</div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
                {CALL_TYPES.map(t => {
                  const cnt = cards[t].length;
                  const active = t === activeType;
                  return (
                    <div key={t} onClick={() => setActiveType(t)}
                      style={{ 
                        padding: "12px 16px", borderRadius: 16, marginBottom: 4, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: active ? "var(--primary)" : "transparent",
                        transition: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: active ? "scale(1.02)" : "scale(1)"
                      }}>
                      <span style={{ color: active ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: active ? 700 : 500 }}>{t}</span>
                      {cnt > 0 && (
                        <span style={{ 
                          background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", 
                          color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 800, padding: "2px 8px" 
                        }}>{cnt}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: "0.05em", marginBottom: 8 }}>PRACTICE CAPACITY</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                    <div style={{ height: 6, flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                      <div style={{ width: pct + "%", height: "100%", background: barColor, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{total}/{MAX_TOTAL}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pane 2 & 3 Container */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
              
              {/* Workspace Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 40px", background: "#fff", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h2 className="outfit" style={{ fontSize: 26, fontWeight: 800, color: "var(--dark-accent)" }}>{activeType} Scorecard</h2>
                    <div style={{ background: "var(--green-faded)", color: "var(--green)", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>EDITING MODE</div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--gray-500)", marginTop: 4, fontWeight: 500 }}>
                    Define evaluation criteria for <span style={{ color: "var(--dark)", fontWeight: 700 }}>{activeType}</span> calls.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "1.5px solid var(--border)", color: "var(--dark)", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 14, cursor: "pointer", "&:hover": { background: "var(--gray-50)" } }}>Discard</button>
                  <button onClick={() => setModalOpen(false)} className="btn-primary" style={{ padding: "10px 32px", fontSize: 14, borderRadius: 14, boxShadow: "0 10px 20px rgba(244,137,31,0.2)" }}>Apply Clinical Metrics</button>
                  <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 8px" }} />
                  <button onClick={() => setModalOpen(false)} style={{ background: "var(--gray-100)", border: "none", cursor: "pointer", color: "var(--gray-500)", padding: 8, borderRadius: "50%", display: "flex" }}>
                    <Ico path="M6 18L18 6M6 6l12 12" size={18} sw={3} />
                  </button>
                </div>
              </div>

              {/* Two Column Workspace */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                
                {/* Active Column: Current Metrics */}
                <div style={{ flex: 1.1, overflowY: "auto", padding: "32px 40px", borderRight: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gray-400)", letterSpacing: "0.08em", textTransform: "uppercase" }}>ACTIVE EVALUATION CRITERIA</div>
                    <div style={{ fontSize: 12, color: cardQs.length >= MAX_PER_CARD ? "var(--red)" : "var(--gray-500)", fontWeight: 800 }}>{cardQs.length} / {MAX_PER_CARD} SLOTS</div>
                  </div>

                  {cardQs.length === 0
                    ? <Empty />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {cardQs.map((q, i) => (
                          <div key={q.id} style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, border: "2px solid #fff", boxShadow: "0 10px 20px rgba(0,0,0,0.03)", transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)", animation: "slideUp 0.4s ease-out backwards", animationDelay: `${i * 0.05}s` }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: q.custom ? "var(--primary-light)" : "var(--gray-100)", color: q.custom ? "var(--primary)" : "var(--dark)", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, color: "var(--dark-accent)", fontWeight: 700, lineHeight: 1.5 }}>{q.text}</div>
                              <div style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 700, marginTop: 4, letterSpacing: "0.02em" }}>{q.custom ? "CUSTOM PRACTICE LOGIC" : "ADIT QUALITY STANDARD"}</div>
                            </div>
                            <button onClick={() => remove(q.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-300)", transition: ".2s", "&:hover": { color: "var(--red)" } }}>
                              <Ico path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Toolbox Column: Search & Add */}
                <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "32px 32px 20px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gray-400)", letterSpacing: "0.08em", marginBottom: 20 }}>QUESTION TOOLBOX</div>
                    <div style={{ background: "var(--gray-50)", borderRadius: 16, padding: "4px", display: "flex", gap: 4 }}>
                      {[
                        {id: "new", l: "Custom Entry", icon: "M12 4v16m8-8H4"},
                        {id: "existing", l: "Smart Library", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"}
                      ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          style={{ 
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            padding: "12px", border: "none", borderRadius: 12, cursor: "pointer",
                            background: tab === t.id ? "#fff" : "transparent",
                            boxShadow: tab === t.id ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                            color: tab === t.id ? "var(--dark)" : "var(--gray-500)",
                            fontWeight: 700, fontSize: 13, transition: ".2s"
                          }}>
                          <Ico path={t.icon} size={14} stroke={tab === t.id ? "var(--primary)" : "currentColor"} />
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 32px" }}>
                    {tab === "new" ? (
                      <div className="animate-fade-in" style={{ paddingTop: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--gray-400)", marginBottom: 10, letterSpacing: "0.05em" }}>DEFINE NEW CRITERIA</div>
                        <textarea ref={taRef} value={newText} onChange={e => setNewText(e.target.value)}
                          disabled={addBlocked} placeholder="Type evaluation criteria... (e.g. 'Did agent verify insurance info?')"
                          style={{ width: "100%", border: "2.5px solid var(--border)", borderRadius: 20, padding: "20px", fontSize: 15, color: "var(--dark-accent)", outline: "none", resize: "none", minHeight: 140, background: "var(--gray-50)", transition: ".3s", "&:focus": { borderColor: "var(--primary)", background: "#fff" }, fontWeight: 600, lineHeight: 1.5 }} />
                        <button onClick={doAdd} disabled={addBlocked || !newText.trim()} className="btn-primary" style={{ width: "100%", marginTop: 20, padding: "18px", borderRadius: 16, fontSize: 15, fontWeight: 700 }}>Add To Scorecard</button>
                      </div>
                    ) : (
                      <div className="animate-fade-in" style={{ paddingTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--gray-400)", letterSpacing: "0.05em" }}>SUGGESTED STANDARDS</div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{EXISTING_QS.length} Available</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {EXISTING_QS.map(q => {
                            const added = !!cardQs.find(c => c.text === q);
                            return (
                              <div key={q} onClick={() => !added && addExisting(q)}
                                style={{ 
                                  padding: "16px 20px", borderRadius: 16, border: added ? "2.5px solid var(--primary-light)" : "2.5px solid var(--border)",
                                  background: added ? "var(--primary-light)" : "transparent",
                                  cursor: added ? "default" : "pointer", transition: ".2s",
                                  "&:hover": { borderColor: added ? "var(--primary-light)" : "var(--primary)", background: added ? "var(--primary-light)" : "var(--gray-50)" }
                                }}>
                                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: added ? "var(--primary)" : "var(--dark-accent)", lineHeight: 1.4 }}>{q}</div>
                                  {added ? <Ico path="M5 13l4 4L19 7" size={20} stroke="var(--primary)" sw={3} /> : <Ico path="M12 4v16m8-8H4" size={18} stroke="var(--gray-300)" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Warn = ({ msg }) => (
  <div style={{ background: "rgba(244, 137, 31, 0.05)", border: "1.5px solid var(--primary)", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "var(--primary-hover)", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontWeight: 600 }}>
    <Ico path="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={16} />{msg}
  </div>
);

const Empty = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, color: "var(--gray-400)", gap: 20, background: "var(--gray-50)", borderRadius: 24, border: "2px dashed var(--gray-200)", margin: "10px 0" }}>
    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
      <Ico path="M9 12h6m-6 4h4M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={36} stroke="var(--primary)" sw={1.8} />
    </div>
    <div style={{ textAlign: "center" }}>
      <h3 className="outfit" style={{ fontSize: 18, fontWeight: 800, color: "var(--dark-accent)" }}>Empty Score Card</h3>
      <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>Configure evaluation metrics for this call type by creating a custom question or selecting from our library.</p>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ height: 4, width: 32, background: "var(--gray-200)", borderRadius: 99 }}></div>
      <div style={{ height: 4, width: 8, background: "var(--gray-200)", borderRadius: 99 }}></div>
      <div style={{ height: 4, width: 8, background: "var(--gray-200)", borderRadius: 99 }}></div>
    </div>
  </div>
);
