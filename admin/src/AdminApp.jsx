import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "jose.i.chavira.jr@gmail.com";
const CALENDLY    = "https://calendly.com/jose-i-chavira-jr/15-min-intro-call-palletbill";

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  green:"#1D9E75",greenL:"#E1F5EE",greenD:"#0F6E56",
  text:"#1a1a18",text2:"#5a5a56",text3:"#9a9a94",
  bg:"#f4f4f1",card:"#ffffff",bg2:"#eceae6",
  border:"rgba(0,0,0,0.09)",border2:"rgba(0,0,0,0.15)",
  red:"#B91C1C",redL:"#FEF2F2",
  blue:"#1D4ED8",blueL:"#EEF2FF",
  amber:"#92400E",amberL:"#FEF3C7",
  purple:"#5B21B6",purpleL:"#EDE9FE",
  sidebar:"#0F1923",sidebarText:"rgba(255,255,255,0.75)",sidebarActive:"rgba(255,255,255,0.12)",
};

// ─── MOCK DATA (replace with Supabase calls) ─────────────────────────────────
const MOCK_USERS = [
  { id:"u1", email:"jeffkogut@crossroads3pl.com",    company:"Crossroads 3PL Solutions",       plan:"trial",   trialDays:55, invoiceCount:1,  totalBilled:1188,  lastActive:"2026-06-23", status:"active",   signupDate:"2026-06-23", city:"Temple, TX",       health:"green" },
  { id:"u2", email:"oneclick3pl@gmail.com",           company:"One Click 3PL",                  plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"2026-06-23", status:"active",   signupDate:"2026-06-23", city:"Temple, TX",       health:"yellow" },
  { id:"u3", email:"info@brownboxninja.com",           company:"Brown Box Ninja",                plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"2026-06-22", status:"active",   signupDate:"2026-06-23", city:"Temple, TX",       health:"yellow" },
  { id:"u4", email:"hello@simplfulfillment.com",       company:"Simpl Fulfillment",              plan:"trial",   trialDays:53, invoiceCount:2,  totalBilled:2430,  lastActive:"2026-06-24", status:"active",   signupDate:"2026-06-20", city:"Austin, TX",       health:"green" },
  { id:"u5", email:"info@nationwideprestige3pl.com",   company:"Nationwide Prestige Warehousing",plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"2026-06-20", status:"idle",     signupDate:"2026-06-23", city:"Grand Prairie, TX",health:"yellow" },
  { id:"u6", email:"info@flufflefulfill.com",          company:"Fluffle Fulfillment",            plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"2026-06-19", status:"idle",     signupDate:"2026-06-23", city:"Buda, TX",         health:"red" },
  { id:"u7", email:"info@warehouse-pro.com",           company:"Warehouse-Pro",                  plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"never",      status:"inactive", signupDate:"2026-06-23", city:"Rockwall, TX",     health:"red" },
  { id:"u8", email:"info@3plbridge.com",               company:"3PL Bridge",                     plan:"trial",   trialDays:55, invoiceCount:0,  totalBilled:0,     lastActive:"2026-06-23", status:"active",   signupDate:"2026-06-23", city:"Dallas, TX",       health:"green" },
];

const MOCK_INVOICES = [
  { id:"inv1", userId:"u1", number:"INV-1001", client:"Crossroads 3PL Solutions", amount:1188, status:"sent",    date:"2026-06-23" },
  { id:"inv2", userId:"u4", number:"INV-1002", client:"Simpl Fulfillment",        amount:1242, status:"paid",    date:"2026-06-20" },
  { id:"inv3", userId:"u4", number:"INV-1003", client:"Simpl Fulfillment",        amount:1188, status:"overdue", date:"2026-06-01" },
];

const MOCK_SUPPORT = {
  u1:[], u2:[], u3:[], u4:[], u5:[], u6:[], u7:[], u8:[],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = n => "$" + Math.abs(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const fmtDate = v => { if(!v||v==="never") return v||"—"; try{ return new Date(v+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }catch{ return v; }};
const initials = name => name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const healthColor = h => ({ green:C.green, yellow:"#D97706", red:C.red }[h] || C.text3);
const healthLabel = h => ({ green:"Active", yellow:"Idle", red:"At risk" }[h] || "Unknown");
const statusColor = s => ({ active:C.green, idle:"#D97706", inactive:C.red }[s] || C.text3);

// ─── STYLE HELPERS ───────────────────────────────────────────────────────────
const btn = (v="ghost",sm=false) => {
  const base = { display:"inline-flex",alignItems:"center",gap:6,padding:sm?"5px 10px":"7px 14px",borderRadius:8,fontSize:sm?12:13,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",transition:"opacity 0.1s",whiteSpace:"nowrap" };
  if(v==="primary") return {...base,background:C.green,color:"#fff"};
  if(v==="danger")  return {...base,background:C.redL,color:C.red,border:`0.5px solid ${C.redL}`};
  if(v==="purple")  return {...base,background:C.purpleL,color:C.purple};
  return {...base,background:C.bg2,color:C.text2,border:`0.5px solid ${C.border2}`};
};
const card = (mb=14) => ({ background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:mb,boxShadow:"0 1px 3px rgba(0,0,0,0.05)" });
const inp = { fontFamily:"inherit",fontSize:13.5,color:C.text,background:C.card,border:`0.5px solid ${C.border2}`,borderRadius:8,padding:"8px 11px",outline:"none",width:"100%" };
const badge = (status) => {
  const map = { sent:[C.blueL,C.blue],paid:[C.greenL,C.greenD],overdue:[C.redL,C.red],draft:[C.bg2,C.text2],trial:[C.purpleL,C.purple],starter:[C.blueL,C.blue],growth:[C.greenL,C.greenD],pro:[C.amberL,C.amber] };
  const [bg,color] = map[status]||[C.bg2,C.text2];
  return { display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,background:bg,color,whiteSpace:"nowrap" };
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const Btn = ({onClick,variant="ghost",sm=false,children,style={}}) => (
  <button onClick={onClick} style={{...btn(variant,sm),...style}}>{children}</button>
);

const Badge = ({status}) => (
  <span style={badge(status)}>{status?.charAt(0).toUpperCase()+status?.slice(1)}</span>
);

const Avatar = ({name,size=36}) => {
  const colors = [C.greenL,C.blueL,C.amberL,C.purpleL,"#FCE7F3"];
  const bg = colors[(name||"").charCodeAt(0)%colors.length];
  const textColor = [C.greenD,C.blue,C.amber,C.purple,"#9D174D"][(name||"").charCodeAt(0)%5];
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.36,color:textColor,flexShrink:0}}>{initials(name||"?")}</div>;
};

const HealthDot = ({health,size=8}) => (
  <span style={{width:size,height:size,borderRadius:"50%",background:healthColor(health),display:"inline-block",flexShrink:0}} />
);

const Toast = ({msg,visible}) => (
  <div style={{position:"fixed",bottom:22,right:22,background:C.text,color:"#fff",padding:"11px 16px",borderRadius:10,fontSize:13.5,fontWeight:500,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",zIndex:9999,opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(12px)",transition:"all 0.25s",pointerEvents:"none",display:"flex",alignItems:"center",gap:8}}>
    <span style={{color:C.green,fontSize:16}}>✓</span>{msg}
  </div>
);

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
const LoginPage = ({onLogin}) => {
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [err,setErr]     = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if(!pass){setErr("Password required");return;}
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if(error){setErr(error.message);setLoading(false);return;}
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single();
    if(!profile?.is_admin){
      await supabase.auth.signOut();
      setErr("Access denied — admin only");
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin(data.session);
  };

  return (
    <div style={{minHeight:"100vh",background:C.sidebar,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.card,borderRadius:16,padding:"36px 32px",maxWidth:380,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,color:C.text}}>pallet<span style={{color:C.green}}>bill</span></div>
          <div style={{fontSize:13,color:C.text3,marginTop:4}}>Admin Panel</div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:C.text2,fontWeight:500,display:"block",marginBottom:5}}>Admin email</label>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jose.i.chavira.jr@gmail.com" />
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,color:C.text2,fontWeight:500,display:"block",marginBottom:5}}>Password</label>
          <input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••" />
        </div>
        {err && <div style={{background:C.redL,color:C.red,padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:14}}>{err}</div>}
        <Btn variant="primary" onClick={submit} style={{width:"100%",justifyContent:"center",padding:"10px 0",fontSize:14,opacity:loading?0.6:1}}>{loading?"Signing in...":"Sign in to admin"}</Btn>
        <div style={{fontSize:11,color:C.text3,textAlign:"center",marginTop:14}}>Admin access only — requires is_admin flag in Supabase</div>
      </div>
    </div>
  );
};

// ─── MAIN ADMIN APP ──────────────────────────────────────────────────────────
export default function AdminApp() {
  const [loggedIn,setLoggedIn]     = useState(false);
  const [authLoading,setAuthLoading] = useState(true);
  const [view,setView]             = useState("dashboard");
  const [selectedUser,setSelectedUser] = useState(null);
  const [users,setUsers]           = useState(MOCK_USERS);
  const [supportNotes,setSupportNotes] = useState(MOCK_SUPPORT);
  const [noteText,setNoteText]     = useState("");
  const [search,setSearch]         = useState("");
  const [healthFilter,setHealthFilter] = useState("");
  const [toast,setToast]           = useState({msg:"",visible:false});
  const [extendId,setExtendId]     = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
        if (profile?.is_admin) setLoggedIn(true);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setLoggedIn(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const showToast = msg => { setToast({msg,visible:true}); setTimeout(()=>setToast(t=>({...t,visible:false})),3000); };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.company.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchHealth = !healthFilter || u.health===healthFilter;
    return matchSearch && matchHealth;
  });

  const addSupportNote = (userId) => {
    if(!noteText.trim()) return;
    const note = { id:Date.now(), text:noteText, date:new Date().toISOString().split("T")[0], admin:ADMIN_EMAIL };
    setSupportNotes(prev=>({...prev,[userId]:[note,...(prev[userId]||[])]}));
    setNoteText("");
    showToast("Note saved");
  };

  const extendTrial = (userId, days) => {
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,trialDays:u.trialDays+days}:u));
    setExtendId(null);
    showToast(`Trial extended by ${days} days`);
  };

  const upgradePlan = (userId, plan) => {
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,plan}:u));
    showToast(`Plan updated to ${plan}`);
  };

  const totalRevenue  = users.reduce((s,u)=>s+u.totalBilled,0);
  const activeCount   = users.filter(u=>u.health==="green").length;
  const atRiskCount   = users.filter(u=>u.health==="red").length;
  const trialCount    = users.filter(u=>u.plan==="trial").length;
  const paidCount     = users.filter(u=>["starter","growth","pro"].includes(u.plan)).length;
  const totalInvoices = MOCK_INVOICES.length;
  const overdueInvs   = MOCK_INVOICES.filter(i=>i.status==="overdue");

  if(authLoading) return <div style={{minHeight:"100vh",background:C.sidebar,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"-apple-system,sans-serif"}}>Loading...</div>;
  if(!loggedIn) return <LoginPage onLogin={()=>setLoggedIn(true)} />;

  const navItems = [
    {id:"dashboard",  icon:"⬛", label:"Dashboard"},
    {id:"customers",  icon:"👥", label:"Customers", badge:users.length},
    {id:"invoices",   icon:"📄", label:"All invoices", badge:overdueInvs.length||null, badgeColor:C.red},
    {id:"health",     icon:"💚", label:"Health tracker"},
    {id:"signups",    icon:"✉️",  label:"Signups"},
    {id:"support",    icon:"🛟", label:"Support notes"},
  ];

  const renderDashboard = () => (
    <div style={{padding:24,flex:1,overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Total customers",   value:users.length,         sub:`${paidCount} paid · ${trialCount} trial`},
          {label:"Active (60-day %)", value:`${Math.round(activeCount/users.length*100)}%`, sub:`${activeCount} of ${users.length} active`},
          {label:"Total billed",      value:fmt(totalRevenue),    sub:"Across all customers"},
          {label:"At risk",           value:atRiskCount,          sub:"Need follow-up today", color:atRiskCount>0?C.red:C.text},
        ].map(({label,value,sub,color}) => (
          <div key={label} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:11,color:C.text3,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{label}</div>
            <div style={{fontSize:24,fontWeight:700,letterSpacing:-0.5,color:color||C.text}}>{value}</div>
            <div style={{fontSize:12,color:C.text3,marginTop:3}}>{sub}</div>
          </div>
        ))}
      </div>

      {atRiskCount > 0 && (
        <div style={{background:C.redL,border:`0.5px solid ${C.redL}`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>⚠️</span>
          <div style={{flex:1}}>
            <span style={{color:C.red,fontWeight:600,fontSize:13}}>{atRiskCount} customers haven't logged in recently. </span>
            <span style={{color:C.red,fontSize:13}}>Consider reaching out before they churn.</span>
          </div>
          <Btn sm onClick={()=>setView("health")}>View health →</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Recent customers</div>
          <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            {users.slice(0,5).map((u,i)=>(
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,padding:"12px 16px",borderBottom:i<4?`0.5px solid ${C.border}`:"none",alignItems:"center",cursor:"pointer"}} onClick={()=>{setSelectedUser(u);setView("customers")}}>
                <Avatar name={u.company} size={32} />
                <div style={{marginLeft:4}}>
                  <div style={{fontWeight:600,fontSize:13}}>{u.company}</div>
                  <div style={{fontSize:12,color:C.text2}}>{u.email}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <HealthDot health={u.health} />
                  <Badge status={u.plan} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Recent invoices</div>
          <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            {MOCK_INVOICES.map((inv,i)=>(
              <div key={inv.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,padding:"12px 16px",borderBottom:i<MOCK_INVOICES.length-1?`0.5px solid ${C.border}`:"none",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{inv.number}</div>
                  <div style={{fontSize:12,color:C.text2}}>{inv.client}</div>
                </div>
                <div style={{fontWeight:600,fontSize:13}}>{fmt(inv.amount)}</div>
                <Badge status={inv.status} />
              </div>
            ))}
          </div>

          <div style={{...card(0),marginTop:16}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Quick actions</div>
            {[
              {label:"Book onboarding call",   action:()=>window.open(CALENDLY,"_blank"),     icon:"📅"},
              {label:"View all customers",      action:()=>setView("customers"),               icon:"👥"},
              {label:"Check health tracker",    action:()=>setView("health"),                  icon:"💚"},
              {label:"Read support notes",      action:()=>setView("support"),                 icon:"🛟"},
            ].map(({label,action,icon})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer"}} onClick={action}>
                <span style={{fontSize:16}}>{icon}</span>
                <span style={{fontSize:13,color:C.text}}>{label}</span>
                <span style={{marginLeft:"auto",color:C.text3,fontSize:12}}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomers = () => {
    if(selectedUser) return renderCustomerDetail(selectedUser);
    return (
      <div style={{padding:24,flex:1,overflowY:"auto"}}>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <input style={{...inp,maxWidth:280,fontSize:13}} placeholder="Search customers..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select style={{fontFamily:"inherit",fontSize:13,color:C.text,background:C.card,border:`0.5px solid ${C.border2}`,borderRadius:8,padding:"7px 28px 7px 10px",outline:"none",appearance:"none"}} value={healthFilter} onChange={e=>setHealthFilter(e.target.value)}>
            <option value="">All health</option>
            <option value="green">Active</option>
            <option value="yellow">Idle</option>
            <option value="red">At risk</option>
          </select>
          <div style={{marginLeft:"auto",fontSize:13,color:C.text3,display:"flex",alignItems:"center"}}>{filteredUsers.length} customers</div>
        </div>

        <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{display:"grid",gridTemplateColumns:"auto 1.8fr 1.2fr 80px 80px 90px 100px 80px",gap:12,padding:"9px 18px",borderBottom:`0.5px solid ${C.border}`,background:C.bg2}}>
            <span/>{["Company","Email","Plan","Health","Invoices","Billed","Last active"].map(h=>(
              <span key={h} style={{fontSize:11,color:C.text3,textTransform:"uppercase",letterSpacing:0.6,fontWeight:500}}>{h}</span>
            ))}
          </div>
          {filteredUsers.map((u,i)=>(
            <div key={u.id} style={{display:"grid",gridTemplateColumns:"auto 1.8fr 1.2fr 80px 80px 90px 100px 80px",gap:12,padding:"12px 18px",borderBottom:i<filteredUsers.length-1?`0.5px solid ${C.border}`:"none",alignItems:"center",cursor:"pointer",transition:"background 0.1s"}}
              onClick={()=>setSelectedUser(u)}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Avatar name={u.company} size={30} />
              <div style={{marginLeft:6}}>
                <div style={{fontWeight:600,fontSize:13}}>{u.company}</div>
                <div style={{fontSize:12,color:C.text2}}>{u.city}</div>
              </div>
              <div style={{fontSize:12,color:C.text2}}>{u.email}</div>
              <Badge status={u.plan} />
              <div style={{display:"flex",alignItems:"center",gap:6}}><HealthDot health={u.health} /><span style={{fontSize:12,color:healthColor(u.health)}}>{healthLabel(u.health)}</span></div>
              <div style={{fontSize:13}}>{u.invoiceCount}</div>
              <div style={{fontSize:13,fontWeight:600}}>{fmt(u.totalBilled)}</div>
              <div style={{fontSize:12,color:C.text3}}>{u.lastActive==="never"?"Never":fmtDate(u.lastActive)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomerDetail = (u) => {
    const userInvoices = MOCK_INVOICES.filter(inv=>inv.userId===u.id);
    const notes = supportNotes[u.id]||[];
    return (
      <div style={{padding:24,flex:1,overflowY:"auto"}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20}}>
          <Btn sm onClick={()=>setSelectedUser(null)}>← Back</Btn>
          <div style={{flex:1}}/>
          <Btn sm onClick={()=>window.open(`mailto:${u.email}`,"_blank")}>✉ Email customer</Btn>
          <Btn sm onClick={()=>window.open(CALENDLY,"_blank")}>📅 Book call</Btn>
          <Btn sm variant="danger" onClick={()=>{if(confirm("Deactivate this account?"))showToast("Account deactivated")}}>Deactivate</Btn>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16,alignItems:"start"}}>
          {/* LEFT: Profile */}
          <div>
            <div style={card()}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",paddingBottom:16,borderBottom:`0.5px solid ${C.border}`,marginBottom:16}}>
                <Avatar name={u.company} size={52} />
                <div style={{marginTop:12,fontSize:16,fontWeight:700}}>{u.company}</div>
                <div style={{fontSize:12,color:C.text2,marginTop:2}}>{u.email}</div>
                <div style={{fontSize:12,color:C.text3}}>{u.city}</div>
                <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",justifyContent:"center"}}>
                  <Badge status={u.plan} />
                  <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,background:u.health==="green"?C.greenL:u.health==="red"?C.redL:C.amberL,color:healthColor(u.health)}}>
                    <HealthDot health={u.health} size={6} />{healthLabel(u.health)}
                  </span>
                </div>
              </div>

              {[["Signup date",fmtDate(u.signupDate)],["Last active",u.lastActive==="never"?"Never":fmtDate(u.lastActive)],["Trial days left",u.plan==="trial"?`${u.trialDays} days`:"N/A"],["Invoices sent",u.invoiceCount],["Total billed",fmt(u.totalBilled)]].map(([label,val])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                  <span style={{color:C.text2}}>{label}</span>
                  <span style={{fontWeight:500}}>{val}</span>
                </div>
              ))}
            </div>

            {/* Plan controls */}
            <div style={card()}>
              <div style={{fontSize:12,fontWeight:600,color:C.text2,marginBottom:10,textTransform:"uppercase",letterSpacing:0.6}}>Admin controls</div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:12,color:C.text2,marginBottom:6}}>Change plan</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["trial","starter","growth","pro"].map(p=>(
                    <button key={p} onClick={()=>upgradePlan(u.id,p)} style={{...btn("ghost",true),background:u.plan===p?C.greenL:C.bg2,color:u.plan===p?C.greenD:C.text2,border:`0.5px solid ${u.plan===p?C.green:C.border2}`}}>{p}</button>
                  ))}
                </div>
              </div>

              {u.plan==="trial" && (
                <div>
                  <div style={{fontSize:12,color:C.text2,marginBottom:6}}>Extend trial</div>
                  {extendId===u.id ? (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {[7,14,30,60].map(d=>(
                        <button key={d} onClick={()=>extendTrial(u.id,d)} style={btn("primary",true)}>+{d}d</button>
                      ))}
                      <button onClick={()=>setExtendId(null)} style={btn("ghost",true)}>Cancel</button>
                    </div>
                  ) : (
                    <Btn sm onClick={()=>setExtendId(u.id)}>Extend trial</Btn>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Detail tabs */}
          <div>
            {/* Invoices */}
            <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>Invoices ({userInvoices.length})</div>
            <div style={{...card(),marginBottom:16}}>
              {userInvoices.length===0 ? (
                <div style={{fontSize:13,color:C.text3,padding:"8px 0"}}>No invoices yet</div>
              ) : userInvoices.map((inv,i)=>(
                <div key={inv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<userInvoices.length-1?`0.5px solid ${C.border}`:"none"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{inv.number}</div>
                    <div style={{fontSize:12,color:C.text2}}>{fmtDate(inv.date)}</div>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontWeight:600,fontSize:13}}>{fmt(inv.amount)}</span>
                    <Badge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* Support notes */}
            <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>Support notes (internal)</div>
            <div style={card()}>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input style={{...inp,flex:1,fontSize:13}} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add a note about this customer..." onKeyDown={e=>e.key==="Enter"&&addSupportNote(u.id)} />
                <Btn variant="primary" sm onClick={()=>addSupportNote(u.id)}>Add note</Btn>
              </div>
              {notes.length===0 ? (
                <div style={{fontSize:13,color:C.text3}}>No notes yet. Add context about calls, issues, or feedback.</div>
              ) : notes.map(n=>(
                <div key={n.id} style={{padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:C.text3,fontWeight:500}}>{n.admin}</span>
                    <span style={{fontSize:11,color:C.text3}}>{fmtDate(n.date)}</span>
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInvoices = () => (
    <div style={{padding:24,flex:1,overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Total invoices",  value:MOCK_INVOICES.length},
          {label:"Total collected", value:fmt(MOCK_INVOICES.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0))},
          {label:"Overdue",         value:overdueInvs.length, color:overdueInvs.length>0?C.red:C.text},
        ].map(({label,value,color})=>(
          <div key={label} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:11,color:C.text3,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{label}</div>
            <div style={{fontSize:24,fontWeight:700,color:color||C.text}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"grid",gridTemplateColumns:"90px 1fr 1fr 90px 110px",gap:12,padding:"9px 18px",borderBottom:`0.5px solid ${C.border}`,background:C.bg2}}>
          {["Invoice","Customer","Company","Amount","Status"].map(h=>(
            <span key={h} style={{fontSize:11,color:C.text3,textTransform:"uppercase",letterSpacing:0.6,fontWeight:500}}>{h}</span>
          ))}
        </div>
        {MOCK_INVOICES.map((inv,i)=>{
          const user = users.find(u=>u.id===inv.userId);
          return (
            <div key={inv.id} style={{display:"grid",gridTemplateColumns:"90px 1fr 1fr 90px 110px",gap:12,padding:"13px 18px",borderBottom:i<MOCK_INVOICES.length-1?`0.5px solid ${C.border}`:"none",alignItems:"center",cursor:"pointer"}}
              onClick={()=>{setSelectedUser(user);setView("customers");}}>
              <span style={{fontWeight:600,fontSize:13}}>{inv.number}</span>
              <span style={{fontSize:12,color:C.text2}}>{user?.email||"—"}</span>
              <span style={{fontSize:13}}>{inv.client}</span>
              <span style={{fontWeight:600,fontSize:13}}>{fmt(inv.amount)}</span>
              <Badge status={inv.status} />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHealth = () => (
    <div style={{padding:24,flex:1,overflowY:"auto"}}>
      <div style={{marginBottom:20,fontSize:13,color:C.text2,lineHeight:1.6}}>
        Health is based on login activity, invoice creation, and engagement. <strong>Green</strong> = active last 3 days · <strong>Yellow</strong> = idle 4–7 days · <strong>Red</strong> = 7+ days or never logged in.
      </div>
      {["red","yellow","green"].map(h=>{
        const group = users.filter(u=>u.health===h);
        if(!group.length) return null;
        return (
          <div key={h} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <HealthDot health={h} size={10} />
              <div style={{fontWeight:600,fontSize:14,color:healthColor(h)}}>{healthLabel(h)} ({group.length})</div>
              {h==="red" && <span style={{fontSize:12,color:C.red,fontWeight:500}}>— reach out today</span>}
            </div>
            <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              {group.map((u,i)=>(
                <div key={u.id} style={{display:"grid",gridTemplateColumns:"auto 1.8fr 1fr 80px auto",gap:12,padding:"12px 18px",borderBottom:i<group.length-1?`0.5px solid ${C.border}`:"none",alignItems:"center"}}>
                  <Avatar name={u.company} size={30} />
                  <div style={{marginLeft:4}}>
                    <div style={{fontWeight:600,fontSize:13}}>{u.company}</div>
                    <div style={{fontSize:12,color:C.text2}}>{u.email}</div>
                  </div>
                  <div style={{fontSize:12,color:C.text3}}>Last active: {u.lastActive==="never"?"Never":fmtDate(u.lastActive)}</div>
                  <div style={{fontSize:12,color:C.text3}}>Trial: {u.trialDays}d left</div>
                  <div style={{display:"flex",gap:6}}>
                    <Btn sm onClick={()=>window.open(`mailto:${u.email}?subject=Checking in on PalletBill&body=Hi, just wanted to check in and see if you have any questions about PalletBill. I'm available for a quick call: ${CALENDLY}`,"_blank")}>✉ Email</Btn>
                    <Btn sm onClick={()=>{setSelectedUser(u);setView("customers");}}>View →</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSignups = () => (
    <div style={{padding:24,flex:1,overflowY:"auto"}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:14}}>Beta signups — {users.length} total</div>
      <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 80px 100px 80px",gap:12,padding:"9px 18px",borderBottom:`0.5px solid ${C.border}`,background:C.bg2}}>
          {["Company","Email","Plan","Signed up","Actions"].map(h=>(
            <span key={h} style={{fontSize:11,color:C.text3,textTransform:"uppercase",letterSpacing:0.6,fontWeight:500}}>{h}</span>
          ))}
        </div>
        {users.map((u,i)=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 80px 100px 80px",gap:12,padding:"12px 18px",borderBottom:i<users.length-1?`0.5px solid ${C.border}`:"none",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{u.company}</div>
              <div style={{fontSize:12,color:C.text2}}>{u.city}</div>
            </div>
            <div style={{fontSize:12,color:C.text2}}>{u.email}</div>
            <Badge status={u.plan} />
            <div style={{fontSize:12,color:C.text3}}>{fmtDate(u.signupDate)}</div>
            <Btn sm onClick={()=>{setSelectedUser(u);setView("customers");}}>View</Btn>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSupportNotes = () => (
    <div style={{padding:24,flex:1,overflowY:"auto"}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:14}}>All support notes</div>
      {users.map(u=>{
        const notes = supportNotes[u.id]||[];
        if(!notes.length) return null;
        return (
          <div key={u.id} style={{...card(),marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <Avatar name={u.company} size={30} />
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{u.company}</div>
                <div style={{fontSize:12,color:C.text2}}>{u.email}</div>
              </div>
              <Btn sm style={{marginLeft:"auto"}} onClick={()=>{setSelectedUser(u);setView("customers");}}>View customer →</Btn>
            </div>
            {notes.map(n=>(
              <div key={n.id} style={{padding:"8px 12px",background:C.bg2,borderRadius:8,marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:C.text3}}>{n.admin}</span>
                  <span style={{fontSize:11,color:C.text3}}>{fmtDate(n.date)}</span>
                </div>
                <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{n.text}</div>
              </div>
            ))}
          </div>
        );
      })}
      {Object.values(supportNotes).every(n=>n.length===0) && (
        <div style={{textAlign:"center",color:C.text3,padding:48,fontSize:13}}>No support notes yet. Open a customer record and add notes about calls, issues, or feedback.</div>
      )}
    </div>
  );

  const viewMap = { dashboard:renderDashboard, customers:renderCustomers, invoices:renderInvoices, health:renderHealth, signups:renderSignups, support:renderSupportNotes };
  const viewTitles = { dashboard:"Dashboard", customers:selectedUser?selectedUser.company:"Customers", invoices:"All invoices", health:"Health tracker", signups:"Beta signups", support:"Support notes" };

  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14,color:C.text,background:C.bg}}>
      {/* SIDEBAR */}
      <aside style={{background:C.sidebar,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0}}>
        <div style={{padding:"20px 18px 16px",borderBottom:"0.5px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:17,fontWeight:800,letterSpacing:-0.5,color:"#fff"}}>pallet<span style={{color:C.green}}>bill</span></div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Admin Panel</div>
        </div>
        <nav style={{padding:8,flex:1}}>
          {navItems.map(({id,icon,label,badge,badgeColor})=>(
            <div key={id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,cursor:"pointer",color:view===id?"#fff":C.sidebarText,background:view===id?C.sidebarActive:"transparent",fontWeight:view===id?600:400,fontSize:13,marginBottom:2,transition:"background 0.1s"}}
              onClick={()=>{setView(id);setSelectedUser(null);}}>
              <span style={{fontSize:14}}>{icon}</span>
              {label}
              {badge ? <span style={{marginLeft:"auto",background:badgeColor||C.green,color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99}}>{badge}</span> : null}
            </div>
          ))}
        </nav>
        <div style={{padding:"14px 16px",borderTop:"0.5px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Logged in as</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:500,marginBottom:10}}>jose.i.chavira.jr</div>
          <button onClick={()=>{supabase.auth.signOut();setLoggedIn(false);}} style={{...btn("ghost",true),width:"100%",justifyContent:"center",color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.1)"}}>Sign out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",overflow:"hidden"}}>
        <div style={{background:C.card,borderBottom:`0.5px solid ${C.border}`,padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:600}}>{viewTitles[view]||view}</div>
          <div style={{display:"flex",gap:8}}>
            <Btn sm onClick={()=>window.open(CALENDLY,"_blank")}>📅 Book call</Btn>
            <Btn sm onClick={()=>window.open(`mailto:?subject=PalletBill Update`,"_blank")}>✉ Email all</Btn>
          </div>
        </div>
        {(viewMap[view]||renderDashboard)()}
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
