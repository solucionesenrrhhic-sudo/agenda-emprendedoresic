import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ekhjtklgzpxpjnlmsaom.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraGp0a2xnenB4cGpubG1zYW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTYyOTMsImV4cCI6MjA5NzUzMjI5M30.cSRMQYWpvxvaq3zDTOjdSrddYNe6pv_3Ac2rOAnwD_8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const C = {
  primary:"#C97A52", primaryDark:"#A85E38", primaryLight:"#DFA080",
  warm1:"#FDF8F4", warm2:"#F5EDE4", warm3:"#EDD9C8",
  text:"#3D2B1F", textLight:"#8C6E5C",
  success:"#5A9E7A", successBg:"#EDF6F1",
  danger:"#C06060", dangerBg:"#F9EAEA",
  warning:"#B89040", warningBg:"#FBF5E0",
  card:"#FFFCF9", border:"#EDD9C8",
};

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmt = (n) => `$${Number(n||0).toLocaleString("es-AR")}`;
const fmtF = (s) => { if(!s) return ""; const [y,m,d]=s.split("-"); return `${d}/${m}`; };
const isoD = (d) => d.toISOString().slice(0,10);
const todayISO = () => new Date().toISOString().slice(0,10);
const totalP = (p) => (p.productos||[]).reduce((a,b)=>a+b.cantidad*b.precio,0);
const saldoP = (p) => Math.max(0, totalP(p)-(p.senia||0));

const ESTADOS = ["pendiente","señado","listo","cobrado"];
const estadoCfg = {
  pendiente: { color:C.danger,  bg:C.dangerBg,  label:"⏳ Pendiente", icon:"⏳" },
  señado:    { color:C.warning, bg:C.warningBg, label:"🤝 Señado",    icon:"🤝" },
  listo:     { color:"#5A7EA0", bg:"#EBF2F8",   label:"📦 Listo",     icon:"📦" },
  cobrado:   { color:C.success, bg:C.successBg, label:"✅ Cobrado",   icon:"✅" },
};

function getWeek(ref) {
  const dow = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate()-(dow===0?6:dow-1));
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function getMonthGrid(ref) {
  const y=ref.getFullYear(), m=ref.getMonth();
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const grid=[];
  const startDow=(first.getDay()+6)%7;
  for(let i=0;i<startDow;i++) grid.push(null);
  for(let d=1;d<=last.getDate();d++) grid.push(new Date(y,m,d));
  return grid;
}

function Tag({ color, bg, children }) {
  return <span style={{ background:bg, color, borderRadius:10, padding:"3px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>;
}

function InputF({ label, value, onChange, type="text", placeholder }) {
  return (
    <div style={{ marginBottom:11 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:C.textLight, display:"block", marginBottom:4 }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"10px 13px", borderRadius:11, border:`1.5px solid ${C.border}`, fontSize:13, color:C.text, background:C.warm1, boxSizing:"border-box", outline:"none" }} />
    </div>
  );
}

function Btn({ children, onClick, color=C.primary, full, small, ghost, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:ghost?"transparent":disabled?"#ccc":color,
      color:ghost?color:"#fff",
      border:ghost?`1.5px solid ${color}`:"none",
      borderRadius:small?10:14, padding:small?"6px 13px":"12px 18px",
      fontWeight:700, fontSize:small?12:14, cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":"auto", display:"flex", alignItems:"center", justifyContent:"center", gap:5, opacity:disabled?0.6:1,
    }}>{children}</button>
  );
}

// ══════════════════════════════════════════
// PANTALLA DE LOGIN
// ══════════════════════════════════════════
const CODIGO_ACCESO = "EMPRENDIC2026";

function LoginScreen() {
  const [paso, setPaso] = useState("inicio");
  const [codigo, setCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const verificarCodigo = () => {
    if(codigo.trim().toUpperCase() === CODIGO_ACCESO) {
      setPaso("registro"); setError("");
    } else {
      setError("Código incorrecto. Contactá a Cintia para obtenerlo.");
    }
  };

  const handleRegistro = async () => {
    if(!email||!pass||!nombre) { setError("Completá todos los campos"); return; }
    if(pass.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { nombre, negocio } }
    });
    if(error) {
      if(error.message.includes("already")) setError("Este email ya tiene cuenta. Ingresá con tu contraseña.");
      else setError("Error al crear la cuenta. Intentá de nuevo.");
    } else {
      setMsg("¡Cuenta creada! Ya podés ingresar.");
      setPaso("login");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if(!email||!pass) { setError("Completá email y contraseña"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if(error) setError("Email o contraseña incorrectos");
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, ${C.primaryDark} 0%, ${C.primary} 60%, ${C.primaryLight} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:380, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>

        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:36 }}>💼</div>
          <div style={{ fontSize:10, color:C.textLight, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Agenda</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.primary }}>EmprendedoresIC</div>
          <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>CI · Soluciones.IC</div>
        </div>

        {msg && <div style={{ background:C.successBg, border:`1px solid ${C.success}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.success, fontWeight:600, marginBottom:14 }}>{msg}</div>}
        {error && <div style={{ background:C.dangerBg, border:`1px solid ${C.danger}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.danger, fontWeight:600, marginBottom:14 }}>{error}</div>}

        {/* INICIO */}
        {paso==="inicio" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              <button onClick={()=>{ setPaso("codigo"); setError(""); }}
                style={{ flex:1, background:C.warm2, color:C.text, border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                🆕 Primera vez
              </button>
              <button onClick={()=>{ setPaso("login"); setError(""); }}
                style={{ flex:1, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                🔑 Ya tengo cuenta
              </button>
            </div>
            <div style={{ background:C.warm1, borderRadius:14, padding:"16px", textAlign:"center" }}>
              <div style={{ fontSize:12, color:C.textLight, fontWeight:600, marginBottom:8 }}>¿Todavía no tenés tu agenda?</div>
              <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:6 }}>Contactá a Cintia 🧡</div>
              <div style={{ fontSize:12, color:C.primary, fontWeight:700, marginBottom:4 }}>📱 341 247 7797</div>
              <div style={{ fontSize:12, color:C.primary, fontWeight:700 }}>📲 @soluciones.ic</div>
            </div>
          </>
        )}

        {/* CÓDIGO DE ACCESO */}
        {paso==="codigo" && (
          <>
            <div style={{ background:C.warningBg, borderRadius:12, padding:"10px 14px", marginBottom:16, fontSize:12, color:C.warning, fontWeight:600 }}>
              🔑 Ingresá el código que te dio Cintia
            </div>
            <InputF label="Código de acceso" value={codigo} onChange={setCodigo} placeholder="Ej: EMPRENDIC2026" />
            <Btn onClick={verificarCodigo} color={C.primary} full>Verificar →</Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <span onClick={()=>{ setPaso("inicio"); setError(""); }} style={{ fontSize:12, color:C.primary, fontWeight:700, cursor:"pointer" }}>← Volver</span>
            </div>
          </>
        )}

        {/* REGISTRO */}
        {paso==="registro" && (
          <>
            <div style={{ background:C.successBg, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:12, color:C.success, fontWeight:600 }}>
              ✅ Código correcto. Completá tus datos.
            </div>
            <InputF label="👤 Tu nombre *" value={nombre} onChange={setNombre} placeholder="Ej: María García" />
            <InputF label="🏪 Nombre de tu negocio" value={negocio} onChange={setNegocio} placeholder="Ej: Taller Creativo" />
            <InputF label="📧 Email *" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
            <InputF label="🔑 Contraseña *" type="password" value={pass} onChange={setPass} placeholder="Mínimo 6 caracteres" />
            <Btn onClick={handleRegistro} color={C.primary} full disabled={loading}>
              {loading?"Creando cuenta...":"Crear mi agenda 🎉"}
            </Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <span onClick={()=>{ setPaso("inicio"); setError(""); }} style={{ fontSize:12, color:C.primary, fontWeight:700, cursor:"pointer" }}>← Volver</span>
            </div>
          </>
        )}

        {/* LOGIN */}
        {paso==="login" && (
          <>
            <InputF label="📧 Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
            <InputF label="🔑 Contraseña" type="password" value={pass} onChange={setPass} placeholder="Tu contraseña" />
            <Btn onClick={handleLogin} color={C.primary} full disabled={loading}>
              {loading?"Ingresando...":"Ingresar →"}
            </Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <span onClick={()=>{ setPaso("inicio"); setError(""); }} style={{ fontSize:12, color:C.primary, fontWeight:700, cursor:"pointer" }}>← Volver</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if(loadingAuth) return (
    <div style={{ minHeight:"100vh", background:C.warm1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:36 }}>💼</div>
      <div style={{ fontSize:14, color:C.textLight, fontWeight:600 }}>Cargando...</div>
    </div>
  );

  if(!session) return <LoginScreen />;
  return <AgendaApp session={session} />;
}

// ══════════════════════════════════════════
// AGENDA (usuario logueado)
// ══════════════════════════════════════════
function AgendaApp({ session }) {
  const user = session.user;
  const userName = user.user_metadata?.nombre || user.email.split("@")[0];
  const userNegocio = user.user_metadata?.negocio || "Mi negocio";

  const [tab, setTab] = useState("semana");
  const [pedidos, setPedidos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pf, setPf] = useState(null);
  const [showDet, setShowDet] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [nuevoInsumo, setNuevoInsumo] = useState("");

  const TODAY = new Date();
  const ISO_TODAY = todayISO();
  const WEEK_DAYS = getWeek(TODAY);
  const MONTH_GRID = getMonthGrid(TODAY);

  const showT = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2400); };

  // ── Cargar datos ──
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from("pedidos").select("*").eq("user_id", user.id).order("entrega", { ascending: true }),
      supabase.from("insumos").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    ]);
    setPedidos(p||[]);
    setInsumos(i||[]);
    setLoading(false);
  };

  // ── Pedido CRUD ──
  const emptyPf = () => ({ cliente:"", telefono:"", nota:"", senia:"", entrega:"", retira:true, estado:"pendiente", productos:[{nombre:"",cantidad:1,precio:""}] });
  const openNew = () => { setPf(emptyPf()); setEditId(null); setShowForm(true); };
  const openEdit = (p) => { setPf({...p, senia:String(p.senia), entrega:p.entrega?.slice(0,10)||"", productos:p.productos.map(x=>({...x,precio:String(x.precio)}))}); setEditId(p.id); setShowForm(true); };

  const savePedido = async () => {
    if(!pf.cliente||!pf.entrega||pf.productos.some(x=>!x.nombre||!x.precio)) { showT("Completá cliente, productos y fecha","err"); return; }
    const datos = {
      ...pf, user_id: user.id,
      senia: parseFloat(pf.senia)||0,
      productos: pf.productos.map(x=>({...x, cantidad:parseInt(x.cantidad)||1, precio:parseFloat(x.precio)||0})),
    };
    delete datos.id;
    if(editId) {
      const { error } = await supabase.from("pedidos").update(datos).eq("id", editId);
      if(error) { showT("Error al guardar","err"); return; }
      showT("Pedido actualizado ✔");
    } else {
      const { error } = await supabase.from("pedidos").insert(datos);
      if(error) { showT("Error al guardar","err"); return; }
      showT("¡Pedido registrado! 🎉");
    }
    await loadData();
    setShowForm(false); setPf(null); setEditId(null);
  };

  const delPedido = async (id) => {
    await supabase.from("pedidos").delete().eq("id", id);
    setPedidos(v=>v.filter(x=>x.id!==id));
    showT("Pedido eliminado");
  };

  const setEstado = async (id, estado) => {
    await supabase.from("pedidos").update({ estado }).eq("id", id);
    setPedidos(v=>v.map(x=>x.id===id?{...x,estado}:x));
    if(showDet?.id===id) setShowDet(p=>({...p,estado}));
  };

  // ── Insumos CRUD ──
  const addInsumo = async () => {
    if(!nuevoInsumo.trim()) return;
    const { data } = await supabase.from("insumos").insert({ texto:nuevoInsumo.trim(), hecho:false, user_id:user.id }).select().single();
    if(data) setInsumos(v=>[...v,data]);
    setNuevoInsumo("");
  };

  const toggleInsumo = async (id, hecho) => {
    await supabase.from("insumos").update({ hecho:!hecho }).eq("id", id);
    setInsumos(v=>v.map(x=>x.id===id?{...x,hecho:!x.hecho}:x));
  };

  const delInsumo = async (id) => {
    await supabase.from("insumos").delete().eq("id", id);
    setInsumos(v=>v.filter(x=>x.id!==id));
  };

  const limpiarComprados = async () => {
    const ids = insumos.filter(x=>x.hecho).map(x=>x.id);
    await supabase.from("insumos").delete().in("id", ids);
    setInsumos(v=>v.filter(x=>!x.hecho));
  };

  // ── Helpers ──
  const pedidosDia = (fecha) => pedidos.filter(p=>p.entrega?.slice(0,10)===fecha);
  const pedidosSemana = WEEK_DAYS.flatMap(d=>pedidosDia(isoD(d)));
  const diasOcupados = WEEK_DAYS.filter(d=>pedidosDia(isoD(d)).length>0).length;
  const totalSemana = pedidosSemana.reduce((a,p)=>a+totalP(p),0);
  const pedidosMes = pedidos.filter(p=>p.entrega?.startsWith(`${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,"0")}`));
  const pedidosFiltrados = pedidos.filter(p=>filtro==="todos"||p.estado===filtro);

  if(loading) return (
    <div style={{ minHeight:"100vh", background:C.warm1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:36 }}>📋</div>
      <div style={{ fontSize:14, color:C.textLight, fontWeight:600 }}>Cargando tus pedidos...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:C.warm1, minHeight:"100vh", maxWidth:430, margin:"0 auto", paddingBottom:80 }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.type==="err"?C.danger:C.success,color:"#fff",padding:"9px 22px",borderRadius:24,fontWeight:700,fontSize:13,boxShadow:"0 4px 18px rgba(0,0,0,0.15)",whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg,${C.primaryDark} 0%,${C.primary} 65%,${C.primaryLight} 100%)`, padding:"16px 18px 13px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Agenda</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>EmprendedoresIC 💼</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:700 }}>{userName}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>{userNegocio}</div>
            <button onClick={()=>supabase.auth.signOut()} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"3px 8px", color:"rgba(255,255,255,0.7)", fontSize:10, cursor:"pointer", marginTop:3, fontWeight:600 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 14px 0" }}>

        {/* ══ SEMANA ══ */}
        {tab==="semana" && (
          <div>
            <div style={{ fontSize:12, color:C.textLight, fontWeight:700, marginBottom:10 }}>
              {MESES[TODAY.getMonth()].toUpperCase()} {TODAY.getFullYear()} · Esta semana
            </div>

            {/* Tira 7 días */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5, marginBottom:12 }}>
              {WEEK_DAYS.map((d,i) => {
                const fecha=isoD(d), esHoy=fecha===ISO_TODAY, vv=pedidosDia(fecha), esPasado=fecha<ISO_TODAY;
                const bg = esHoy?C.primary:vv.length>0?"#6A9E58":esPasado?"#C0B8B0":"#7090C0";
                return (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:C.textLight, marginBottom:4 }}>{DIAS[d.getDay()]}</div>
                    <div style={{ background:bg, borderRadius:10, padding:"7px 2px" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>{d.getDate()}</div>
                      {vv.length>0
                        ? <div style={{ background:"rgba(255,255,255,0.9)", borderRadius:5, margin:"3px 3px 0", fontSize:10, fontWeight:800, color:bg }}>{vv.length}</div>
                        : <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginTop:2 }}>—</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
              {[{c:"#6A9E58",l:"Con pedidos"},{c:"#7090C0",l:"Libre"},{c:C.primary,l:"Hoy"},{c:"#C0B8B0",l:"Pasado"}].map((x,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.textLight }}>
                  <div style={{ width:10,height:10,borderRadius:3,background:x.c }}/>{x.l}
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div style={{ background:C.warm2, borderRadius:13, padding:"11px 14px", marginBottom:14, display:"flex", justifyContent:"space-around", alignItems:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:C.primary }}>{pedidosSemana.length}</div>
                <div style={{ fontSize:10, color:C.textLight, fontWeight:600 }}>pedidos</div>
              </div>
              <div style={{ width:1, height:28, background:C.border }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:C.text }}>{diasOcupados}</div>
                <div style={{ fontSize:10, color:C.textLight, fontWeight:600 }}>días ocupados</div>
              </div>
              <div style={{ width:1, height:28, background:C.border }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.success }}>{fmt(totalSemana)}</div>
                <div style={{ fontSize:10, color:C.textLight, fontWeight:600 }}>facturado</div>
              </div>
            </div>

            <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
              Pedidos pendientes esta semana
            </div>

            {WEEK_DAYS.filter(d=>isoD(d)>=ISO_TODAY).map((d,i)=>{
              const fecha=isoD(d), esHoy=fecha===ISO_TODAY, vv=pedidosDia(fecha), esFinde=d.getDay()===0||d.getDay()===6;
              const borderColor=esHoy?C.primary:vv.length>0?"#8FB87A":"#C8D8F0";
              const bgCard=esHoy?`${C.primary}10`:vv.length>0?"#F2F8EE":"#EEF3FB";
              const bgCirc=esHoy?C.primary:vv.length>0?"#6A9E58":"#7090C0";
              return (
                <div key={i} style={{ background:bgCard, borderRadius:14, marginBottom:8, border:`1.5px solid ${borderColor}`, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ background:bgCirc, borderRadius:10, width:40, height:40, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{DIAS[d.getDay()]}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{d.getDate()}</div>
                      </div>
                      <div>
                        {vv.length>0
                          ?<div style={{ fontSize:13, fontWeight:700, color:"#3A5E2E" }}>{vv.length} pedido{vv.length>1?"s":""} · {fmt(vv.reduce((a,p)=>a+totalP(p),0))}</div>
                          :<div style={{ fontSize:12, color:"#4A6090", fontWeight:600 }}>{esFinde?"Fin de semana 🌟":"Día libre 🌿"}</div>}
                        {esHoy&&<div style={{ fontSize:10, color:C.primary, fontWeight:700 }}>HOY</div>}
                      </div>
                    </div>
                    {vv.length>0&&(
                      <div style={{ display:"flex", gap:3, flexWrap:"wrap", justifyContent:"flex-end" }}>
                        {ESTADOS.map(e=>{
                          const cnt=vv.filter(p=>p.estado===e).length;
                          return cnt>0?<div key={e} style={{ background:estadoCfg[e].bg, borderRadius:7, padding:"2px 5px", fontSize:10, fontWeight:700, color:estadoCfg[e].color }}>{estadoCfg[e].icon}{cnt}</div>:null;
                        })}
                      </div>
                    )}
                  </div>
                  {vv.map(p=>(
                    <div key={p.id} onClick={()=>setShowDet(p)} style={{ margin:"0 10px 8px", background:estadoCfg[p.estado]?.bg||C.warm1, borderRadius:10, padding:"8px 11px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{p.cliente}</div>
                        <div style={{ fontSize:11, color:C.textLight }}>{p.productos?.length===1?p.productos[0].nombre:`${p.productos?.length} productos`} · {p.retira?"Retira":"Envío"}</div>
                        {saldoP(p)>0&&<div style={{ fontSize:11, color:C.danger, fontWeight:700 }}>Debe: {fmt(saldoP(p))}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:estadoCfg[p.estado]?.color }}>{estadoCfg[p.estado]?.icon}</div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{fmt(totalP(p))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {WEEK_DAYS.filter(d=>isoD(d)>=ISO_TODAY&&pedidosDia(isoD(d)).length>0).length===0&&(
              <div style={{ textAlign:"center", padding:24, color:C.textLight }}>
                <div style={{ fontSize:32 }}>🌿</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:6 }}>Sin pedidos pendientes esta semana</div>
                <button onClick={openNew} style={{ marginTop:12, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  ＋ Cargar primer pedido
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ MES ══ */}
        {tab==="mes" && (
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.text, marginBottom:8, textAlign:"center" }}>
              {MESES[TODAY.getMonth()]} {TODAY.getFullYear()}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              <div style={{ background:C.primary, borderRadius:14, padding:"11px 8px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{pedidosMes.length}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>pedidos</div>
              </div>
              <div style={{ background:C.successBg, borderRadius:14, padding:"11px 8px", textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.success }}>{fmt(pedidosMes.filter(p=>p.estado==="cobrado").reduce((a,p)=>a+totalP(p),0))}</div>
                <div style={{ fontSize:10, color:C.success, fontWeight:700 }}>cobrado</div>
              </div>
              <div style={{ background:C.dangerBg, borderRadius:14, padding:"11px 8px", textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.danger }}>{fmt(pedidosMes.filter(p=>p.estado!=="cobrado").reduce((a,p)=>a+saldoP(p),0))}</div>
                <div style={{ fontSize:10, color:C.danger, fontWeight:700 }}>por cobrar</div>
              </div>
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:12, border:`1px solid ${C.border}`, marginBottom:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:6 }}>
                {["L","M","M","J","V","S","D"].map((d,i)=>(
                  <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.textLight, padding:"3px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                {MONTH_GRID.map((d,i) => {
                  if(!d) return <div key={i}/>;
                  const fecha=isoD(d), esHoy=fecha===ISO_TODAY, vv=pedidosDia(fecha);
                  const bg=esHoy?C.primary:vv.length>0?"#6A9E58":"#C8D8F0";
                  return (
                    <div key={i} onClick={()=>vv.length>0&&setShowDet(vv[0])}
                      style={{ background:bg, borderRadius:9, padding:"5px 2px", textAlign:"center", minHeight:40, cursor:vv.length>0?"pointer":"default" }}>
                      <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{d.getDate()}</div>
                      {vv.length>0&&<div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{vv.length}📦</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
              Pedidos de {MESES_C[TODAY.getMonth()]}
            </div>
            {pedidosMes.sort((a,b)=>a.entrega?.localeCompare(b.entrega)).map(p=>(
              <div key={p.id} onClick={()=>setShowDet(p)} style={{ background:C.card, borderRadius:13, padding:"11px 13px", marginBottom:8, border:`1.5px solid ${estadoCfg[p.estado]?.color||C.border}`, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{p.cliente}</div>
                    <div style={{ fontSize:11, color:C.textLight }}>🗓 {fmtF(p.entrega)} · {p.productos?.length===1?p.productos[0].nombre:`${p.productos?.length} prod.`}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <Tag color={estadoCfg[p.estado]?.color} bg={estadoCfg[p.estado]?.bg}>{estadoCfg[p.estado]?.label}</Tag>
                    <div style={{ fontSize:12, fontWeight:800, color:C.text, marginTop:3 }}>{fmt(totalP(p))}</div>
                  </div>
                </div>
              </div>
            ))}
            {pedidosMes.length===0&&<div style={{ textAlign:"center", color:C.textLight, fontSize:13, padding:20 }}>Sin pedidos este mes</div>}
          </div>
        )}

        {/* ══ PEDIDOS ══ */}
        {tab==="pedidos" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.text }}>📋 Todos los pedidos</div>
              <button onClick={openNew} style={{ background:C.primary, color:"#fff", border:"none", borderRadius:20, padding:"7px 14px", fontWeight:700, fontSize:13, cursor:"pointer" }}>＋ Nuevo</button>
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
              {["todos",...ESTADOS].map(f=>(
                <button key={f} onClick={()=>setFiltro(f)}
                  style={{ background:filtro===f?C.primary:C.warm2, color:filtro===f?"#fff":C.textLight, border:"none", borderRadius:20, padding:"5px 12px", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                  {f==="todos"?"Todos":estadoCfg[f]?.label}
                </button>
              ))}
            </div>

            {pedidosFiltrados.map(p=>{
              const total=totalP(p), saldo=saldoP(p);
              return (
                <div key={p.id} style={{ background:C.card, borderRadius:15, marginBottom:11, border:`1.5px solid ${estadoCfg[p.estado]?.color||C.border}`, overflow:"hidden" }}>
                  <div style={{ padding:"12px 13px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:C.text }}>👤 {p.cliente}</div>
                        {p.telefono&&<div style={{ fontSize:11, color:C.textLight }}>📞 {p.telefono}</div>}
                      </div>
                      <Tag color={estadoCfg[p.estado]?.color} bg={estadoCfg[p.estado]?.bg}>{estadoCfg[p.estado]?.label}</Tag>
                    </div>
                    <div style={{ background:C.warm1, borderRadius:10, padding:"8px 10px", marginBottom:8 }}>
                      {(p.productos||[]).map((pr,i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0", borderBottom:i<p.productos.length-1?`1px solid ${C.border}`:"none" }}>
                          <span style={{ color:C.text }}>{pr.cantidad}× {pr.nombre}</span>
                          <span style={{ color:C.textLight, fontWeight:600 }}>{fmt(pr.cantidad*pr.precio)}</span>
                        </div>
                      ))}
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, paddingTop:5, borderTop:`1.5px solid ${C.border}` }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Total</span>
                        <span style={{ fontSize:13, fontWeight:800, color:C.primary }}>{fmt(total)}</span>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
                      <div style={{ background:C.successBg, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:C.textLight, fontWeight:600 }}>SEÑA</div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.success }}>{p.senia>0?fmt(p.senia):"—"}</div>
                      </div>
                      <div style={{ background:saldo>0?C.dangerBg:C.successBg, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:C.textLight, fontWeight:600 }}>SALDO</div>
                        <div style={{ fontSize:12, fontWeight:800, color:saldo>0?C.danger:C.success }}>{saldo>0?fmt(saldo):"✓"}</div>
                      </div>
                      <div style={{ background:C.warm2, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:C.textLight, fontWeight:600 }}>ENTREGA</div>
                        <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{fmtF(p.entrega)}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
                      <Tag color={p.retira?C.primary:"#5A7EA0"} bg={p.retira?C.warm2:"#EBF2F8"}>{p.retira?"🏪 Retira":"🚚 Envío"}</Tag>
                      {p.nota&&<span style={{ fontSize:11, color:C.textLight }}>📝 {p.nota}</span>}
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      {ESTADOS.map(e=>(
                        <button key={e} onClick={()=>setEstado(p.id,e)}
                          style={{ flex:1, background:p.estado===e?estadoCfg[e].color:estadoCfg[e].bg, color:p.estado===e?"#fff":estadoCfg[e].color, border:"none", borderRadius:9, padding:"6px 2px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {estadoCfg[e].icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding:"8px 12px", background:C.warm1, borderTop:`1px solid ${C.border}`, display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(p)} style={{ flex:1, background:C.warm2, border:"none", borderRadius:9, padding:"7px", fontSize:12, cursor:"pointer", fontWeight:700, color:C.text }}>✏️ Editar</button>
                    <button onClick={()=>delPedido(p.id)} style={{ background:C.dangerBg, border:"none", borderRadius:9, padding:"7px 12px", fontSize:12, cursor:"pointer", color:C.danger }}>🗑</button>
                  </div>
                </div>
              );
            })}
            {pedidosFiltrados.length===0&&(
              <div style={{ textAlign:"center", padding:40, color:C.textLight }}>
                <div style={{ fontSize:38 }}>📭</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:8 }}>Sin pedidos{filtro!=="todos"?" en este estado":""}</div>
                {filtro==="todos"&&<button onClick={openNew} style={{ marginTop:12, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer" }}>＋ Cargar primer pedido</button>}
              </div>
            )}
          </div>
        )}

        {/* ══ COMPRAS ══ */}
        {tab==="insumos" && (
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.text, marginBottom:4 }}>🛒 Lista de compras</div>
            <div style={{ fontSize:12, color:C.textLight, marginBottom:14 }}>Anotá lo que necesitás. Tachalo cuando lo tengas.</div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input value={nuevoInsumo} onChange={e=>setNuevoInsumo(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addInsumo()}
                placeholder="Ej: Hilo de algodón, papel tissue..."
                style={{ flex:1, padding:"11px 13px", borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13, color:C.text, background:C.warm1, outline:"none" }} />
              <button onClick={addInsumo} style={{ background:C.primary, border:"none", borderRadius:12, padding:"0 16px", color:"#fff", fontWeight:800, fontSize:18, cursor:"pointer" }}>＋</button>
            </div>
            {insumos.length===0&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}><div style={{ fontSize:36 }}>🛍️</div><div style={{ fontSize:13, fontWeight:600, marginTop:8 }}>La lista está vacía</div></div>}
            {insumos.filter(x=>!x.hecho).length>0&&(
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Por comprar</div>
                {insumos.filter(x=>!x.hecho).map(ins=>(
                  <div key={ins.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:12, padding:"11px 13px", marginBottom:7, border:`1px solid ${C.border}` }}>
                    <div onClick={()=>toggleInsumo(ins.id, ins.hecho)} style={{ width:22,height:22,borderRadius:7,border:`2px solid ${C.border}`,background:"#fff",cursor:"pointer",flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:C.text }}>{ins.texto}</span>
                    <button onClick={()=>delInsumo(ins.id)} style={{ background:"none",border:"none",color:C.textLight,fontSize:16,cursor:"pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {insumos.filter(x=>x.hecho).length>0&&(
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Comprado ✓</div>
                {insumos.filter(x=>x.hecho).map(ins=>(
                  <div key={ins.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.successBg, borderRadius:12, padding:"10px 13px", marginBottom:7 }}>
                    <div onClick={()=>toggleInsumo(ins.id, ins.hecho)} style={{ width:22,height:22,borderRadius:7,background:C.success,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:800 }}>✓</div>
                    <span style={{ flex:1, fontSize:13, color:C.textLight, textDecoration:"line-through" }}>{ins.texto}</span>
                    <button onClick={()=>delInsumo(ins.id)} style={{ background:"none",border:"none",color:C.textLight,fontSize:16,cursor:"pointer" }}>✕</button>
                  </div>
                ))}
                <button onClick={limpiarComprados} style={{ background:C.warm2,border:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,color:C.textLight,cursor:"pointer",marginTop:4 }}>
                  🗑 Limpiar comprados
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL DETALLE ══ */}
      {showDet&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600,display:"flex",alignItems:"flex-end" }}>
          <div style={{ background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"85vh",overflowY:"auto",padding:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:16,color:C.text }}>Detalle del pedido</div>
              <button onClick={()=>setShowDet(null)} style={{ background:C.warm2,border:"none",borderRadius:50,width:30,height:30,fontSize:15,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}>
              <div>
                <div style={{ fontSize:16,fontWeight:800,color:C.text }}>👤 {showDet.cliente}</div>
                {showDet.telefono&&<div style={{ fontSize:12,color:C.textLight }}>📞 {showDet.telefono}</div>}
              </div>
              <Tag color={estadoCfg[showDet.estado]?.color} bg={estadoCfg[showDet.estado]?.bg}>{estadoCfg[showDet.estado]?.label}</Tag>
            </div>
            <div style={{ background:C.warm1,borderRadius:12,padding:12,marginBottom:12 }}>
              {(showDet.productos||[]).map((pr,i)=>(
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<showDet.productos.length-1?`1px solid ${C.border}`:"none",fontSize:13 }}>
                  <span>{pr.cantidad}× {pr.nombre}</span>
                  <span style={{ fontWeight:700 }}>{fmt(pr.cantidad*pr.precio)}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:7,borderTop:`2px solid ${C.border}` }}>
                <span style={{ fontWeight:800,fontSize:14 }}>TOTAL</span>
                <span style={{ fontWeight:800,fontSize:16,color:C.primary }}>{fmt(totalP(showDet))}</span>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
              <div style={{ background:C.successBg,borderRadius:11,padding:"9px 12px" }}>
                <div style={{ fontSize:10,color:C.textLight,fontWeight:600 }}>SEÑA</div>
                <div style={{ fontSize:15,fontWeight:800,color:C.success }}>{showDet.senia>0?fmt(showDet.senia):"Sin seña"}</div>
              </div>
              <div style={{ background:saldoP(showDet)>0?C.dangerBg:C.successBg,borderRadius:11,padding:"9px 12px" }}>
                <div style={{ fontSize:10,color:C.textLight,fontWeight:600 }}>SALDO</div>
                <div style={{ fontSize:15,fontWeight:800,color:saldoP(showDet)>0?C.danger:C.success }}>{saldoP(showDet)>0?fmt(saldoP(showDet)):"✓ Saldado"}</div>
              </div>
              <div style={{ background:C.warm2,borderRadius:11,padding:"9px 12px" }}>
                <div style={{ fontSize:10,color:C.textLight,fontWeight:600 }}>ENTREGA</div>
                <div style={{ fontSize:14,fontWeight:800,color:C.text }}>{fmtF(showDet.entrega)}</div>
              </div>
              <div style={{ background:C.warm2,borderRadius:11,padding:"9px 12px" }}>
                <div style={{ fontSize:10,color:C.textLight,fontWeight:600 }}>RETIRO</div>
                <div style={{ fontSize:14,fontWeight:800,color:C.text }}>{showDet.retira?"🏪 Retira":"🚚 Envío"}</div>
              </div>
            </div>
            {showDet.nota&&<div style={{ background:C.warm1,borderRadius:11,padding:"9px 13px",marginBottom:12,fontSize:13,color:C.text }}>📝 {showDet.nota}</div>}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.textLight,marginBottom:8 }}>CAMBIAR ESTADO</div>
              <div style={{ display:"flex",gap:6 }}>
                {ESTADOS.map(e=>(
                  <button key={e} onClick={()=>setEstado(showDet.id,e)}
                    style={{ flex:1,background:showDet.estado===e?estadoCfg[e].color:estadoCfg[e].bg,color:showDet.estado===e?"#fff":estadoCfg[e].color,border:`1.5px solid ${estadoCfg[e].color}`,borderRadius:10,padding:"8px 4px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                    {estadoCfg[e].icon}<br/><span style={{ fontSize:9 }}>{e}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>{ openEdit(showDet); setShowDet(null); }} style={{ flex:1,background:"transparent",color:C.primary,border:`1.5px solid ${C.primary}`,borderRadius:14,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer" }}>✏️ Editar</button>
              <button onClick={()=>setShowDet(null)} style={{ flex:1,background:C.primary,color:"#fff",border:"none",borderRadius:14,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL FORM ══ */}
      {showForm&&pf&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:700,display:"flex",alignItems:"flex-end" }}>
          <div style={{ background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"93vh",overflowY:"auto",padding:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:16,color:C.text }}>{editId?"✏️ Editar pedido":"➕ Nuevo pedido"}</div>
              <button onClick={()=>setShowForm(false)} style={{ background:C.warm2,border:"none",borderRadius:50,width:30,height:30,fontSize:15,cursor:"pointer" }}>✕</button>
            </div>
            <InputF label="👤 Cliente *" value={pf.cliente} onChange={v=>setPf(f=>({...f,cliente:v}))} placeholder="Nombre del cliente" />
            <InputF label="📞 Teléfono" value={pf.telefono||""} onChange={v=>setPf(f=>({...f,telefono:v}))} placeholder="Opcional" />
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.textLight,display:"block",marginBottom:6 }}>📦 Productos / Servicios *</label>
              {pf.productos.map((pr,i)=>(
                <div key={i} style={{ background:C.warm1,borderRadius:12,padding:10,marginBottom:8 }}>
                  <div style={{ display:"flex",gap:6,marginBottom:6 }}>
                    <input value={pr.nombre} onChange={e=>{ const p=[...pf.productos]; p[i].nombre=e.target.value; setPf(f=>({...f,productos:p})); }}
                      placeholder="Nombre del producto" style={{ flex:1,padding:"9px 11px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:"#fff",outline:"none" }} />
                    {pf.productos.length>1&&<button onClick={()=>setPf(f=>({...f,productos:f.productos.filter((_,j)=>j!==i)}))} style={{ background:C.dangerBg,border:"none",borderRadius:9,padding:"0 10px",color:C.danger,cursor:"pointer",fontWeight:700 }}>✕</button>}
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9,color:C.textLight,fontWeight:700,marginBottom:3 }}>CANT.</div>
                      <input type="number" value={pr.cantidad} onChange={e=>{ const p=[...pf.productos]; p[i].cantidad=e.target.value; setPf(f=>({...f,productos:p})); }}
                        style={{ width:"100%",padding:"9px 10px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:"#fff",outline:"none",boxSizing:"border-box" }} />
                    </div>
                    <div style={{ flex:2 }}>
                      <div style={{ fontSize:9,color:C.textLight,fontWeight:700,marginBottom:3 }}>PRECIO $</div>
                      <input type="number" value={pr.precio} onChange={e=>{ const p=[...pf.productos]; p[i].precio=e.target.value; setPf(f=>({...f,productos:p})); }}
                        placeholder="0" style={{ width:"100%",padding:"9px 10px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:"#fff",outline:"none",boxSizing:"border-box" }} />
                    </div>
                  </div>
                  {pr.cantidad&&pr.precio&&<div style={{ fontSize:11,color:C.primary,fontWeight:700,marginTop:5 }}>Subtotal: {fmt((parseFloat(pr.cantidad)||1)*(parseFloat(pr.precio)||0))}</div>}
                </div>
              ))}
              <button onClick={()=>setPf(f=>({...f,productos:[...f.productos,{nombre:"",cantidad:1,precio:""}]}))}
                style={{ background:C.warm2,border:`1.5px dashed ${C.border}`,borderRadius:11,padding:"8px",width:"100%",fontSize:12,fontWeight:700,color:C.textLight,cursor:"pointer" }}>
                ＋ Agregar producto
              </button>
            </div>
            {pf.productos.some(x=>x.precio)&&(
              <div style={{ background:C.warm2,borderRadius:11,padding:"9px 14px",marginBottom:11,display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:12,fontWeight:700,color:C.textLight }}>TOTAL DEL PEDIDO</span>
                <span style={{ fontSize:15,fontWeight:800,color:C.primary }}>{fmt(pf.productos.reduce((a,x)=>a+(parseFloat(x.cantidad)||1)*(parseFloat(x.precio)||0),0))}</span>
              </div>
            )}
            <InputF label="🤝 Seña recibida ($)" type="number" value={pf.senia} onChange={v=>setPf(f=>({...f,senia:v}))} placeholder="0 si no hubo seña" />
            {parseFloat(pf.senia)>0&&(
              <div style={{ background:C.dangerBg,borderRadius:10,padding:"7px 12px",marginBottom:11,fontSize:12,color:C.danger,fontWeight:700 }}>
                Saldo a cobrar: {fmt(Math.max(0,pf.productos.reduce((a,x)=>a+(parseFloat(x.cantidad)||1)*(parseFloat(x.precio)||0),0)-parseFloat(pf.senia)))}
              </div>
            )}
            <InputF label="🗓 Fecha de entrega *" type="date" value={pf.entrega} onChange={v=>setPf(f=>({...f,entrega:v}))} />
            <div style={{ marginBottom:11 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.textLight,display:"block",marginBottom:6 }}>¿Cómo retira?</label>
              <div style={{ display:"flex",gap:8 }}>
                {[{v:true,l:"🏪 Retira"},{v:false,l:"🚚 Envío"}].map(op=>(
                  <button key={String(op.v)} onClick={()=>setPf(f=>({...f,retira:op.v}))}
                    style={{ flex:1,background:pf.retira===op.v?C.primary:C.warm2,color:pf.retira===op.v?"#fff":C.textLight,border:"none",borderRadius:11,padding:"10px 6px",fontWeight:700,fontSize:13,cursor:"pointer" }}>
                    {op.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.textLight,display:"block",marginBottom:6 }}>Estado</label>
              <div style={{ display:"flex",gap:6 }}>
                {ESTADOS.map(e=>(
                  <button key={e} onClick={()=>setPf(f=>({...f,estado:e}))}
                    style={{ flex:1,background:pf.estado===e?estadoCfg[e].color:estadoCfg[e].bg,color:pf.estado===e?"#fff":estadoCfg[e].color,border:`1.5px solid ${estadoCfg[e].color}`,borderRadius:10,padding:"8px 3px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                    {estadoCfg[e].icon}<br/><span style={{ fontSize:9 }}>{e}</span>
                  </button>
                ))}
              </div>
            </div>
            <InputF label="📝 Nota" value={pf.nota||""} onChange={v=>setPf(f=>({...f,nota:v}))} placeholder="Color, talla, detalles..." />
            <button onClick={savePedido} style={{ width:"100%",background:C.primary,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer" }}>
              {editId?"Guardar cambios ✓":"Registrar pedido 🎉"}
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:200,boxShadow:"0 -3px 14px rgba(0,0,0,0.07)" }}>
        {[
          { id:"semana", icon:"📆", label:"Semana" },
          { id:"mes",    icon:"🗓", label:"Mes" },
          { id:"pedidos",icon:"📋", label:"Pedidos" },
          { id:"insumos",icon:"🛒", label:"Compras" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1,background:"none",border:"none",padding:"10px 0 7px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10,fontWeight:700,color:tab===t.id?C.primary:C.textLight }}>{t.label}</span>
            {tab===t.id&&<div style={{ width:4,height:4,borderRadius:2,background:C.primary }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
