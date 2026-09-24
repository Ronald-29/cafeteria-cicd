import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
//  BASE DE DATOS — localStorage
// ═══════════════════════════════════════════════════════════
const DB = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error(e); } },

  seed() {
    if (DB.get("caf_seeded")) return;

    const productos = [
      { id: 1, nombre: "Espresso", categoria: "Café", precio: 12, descripcion: "Café concentrado, intenso y aromático.", imagen: "☕", disponible: true },
      { id: 2, nombre: "Cappuccino", categoria: "Café", precio: 18, descripcion: "Espresso con leche espumada y un toque de cacao.", imagen: "☕", disponible: true },
      { id: 3, nombre: "Latte Vainilla", categoria: "Café", precio: 20, descripcion: "Café con leche y jarabe de vainilla.", imagen: "☕", disponible: true },
      { id: 4, nombre: "Mocaccino", categoria: "Café", precio: 22, descripcion: "Espresso, chocolate y leche cremosa.", imagen: "☕", disponible: true },
      { id: 5, nombre: "Croissant", categoria: "Repostería", precio: 10, descripcion: "Croissant de mantequilla recién horneado.", imagen: "🥐", disponible: true },
      { id: 6, nombre: "Muffin de Arándanos", categoria: "Repostería", precio: 13, descripcion: "Suave muffin relleno de arándanos frescos.", imagen: "🧁", disponible: true },
      { id: 7, nombre: "Cheesecake", categoria: "Repostería", precio: 16, descripcion: "Porción de cheesecake con coulis de frutos rojos.", imagen: "🍰", disponible: true },
      { id: 8, nombre: "Sandwich de Pollo", categoria: "Salado", precio: 25, descripcion: "Pollo a la plancha, lechuga y mayonesa en pan artesanal.", imagen: "🥪", disponible: true },
      { id: 9, nombre: "Wrap Vegetariano", categoria: "Salado", precio: 23, descripcion: "Vegetales frescos, hummus y queso en tortilla integral.", imagen: "🌯", disponible: true },
      { id: 10, nombre: "Limonada de Menta", categoria: "Bebidas frías", precio: 14, descripcion: "Limonada refrescante con hojas de menta.", imagen: "🥤", disponible: true },
      { id: 11, nombre: "Frappé de Café", categoria: "Bebidas frías", precio: 19, descripcion: "Café helado batido con hielo y crema.", imagen: "🧊", disponible: true },
      { id: 12, nombre: "Té Helado", categoria: "Bebidas frías", precio: 12, descripcion: "Té negro helado con un toque de limón.", imagen: "🧊", disponible: true },
    ];

    DB.set("caf_productos", productos);
    DB.set("caf_clientes", []);
    DB.set("caf_pedidos", []);
    DB.set("caf_detalle_pedido", []);
    DB.set("caf_seeded", true);
  },

  getProductos: () => DB.get("caf_productos") || [],
  getClientes: () => DB.get("caf_clientes") || [],
  getPedidos: () => DB.get("caf_pedidos") || [],
  getDetallePedido: () => DB.get("caf_detalle_pedido") || [],

  registrarCliente(datos) {
    const cs = DB.getClientes();
    if (cs.find(c => c.email === datos.email)) return { error: "Email ya registrado" };
    const nuevo = { ...datos, id: Date.now() };
    DB.set("caf_clientes", [...cs, nuevo]);
    return { ok: true, cliente: nuevo };
  },

  login(email, password) {
    const c = DB.getClientes().find(c => c.email === email && c.password === password);
    return c ? { ok: true, cliente: c } : { error: "Credenciales incorrectas" };
  },

  crearPedido(cliente_id, items, tipoEntrega, direccion, notas) {
    const pedidos = DB.getPedidos();
    const detalles = DB.getDetallePedido();
    const id = Date.now();
    const total = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);

    const pedido = {
      id, cliente_id, fecha: new Date().toISOString(),
      tipo_entrega: tipoEntrega, direccion: direccion || null,
      notas: notas || "", total, estado: "pendiente"
    };

    const nuevosDetalles = items.map((it, i) => ({
      id: id + i + 1, pedido_id: id, producto_id: it.id,
      cantidad: it.cantidad, precio_unitario: it.precio, subtotal: it.precio * it.cantidad
    }));

    DB.set("caf_pedidos", [...pedidos, pedido]);
    DB.set("caf_detalle_pedido", [...detalles, ...nuevosDetalles]);
    return { ok: true, pedido };
  },

  getPedidoCompleto(pedido_id) {
    const pedido = DB.getPedidos().find(p => p.id === pedido_id);
    if (!pedido) return null;
    const productos = DB.getProductos();
    const detalles = DB.getDetallePedido().filter(d => d.pedido_id === pedido_id)
      .map(d => ({ ...d, producto: productos.find(p => p.id === d.producto_id) }));
    return { ...pedido, detalles };
  },

  getPedidosCliente(cliente_id) {
    return DB.getPedidos().filter(p => p.cliente_id === cliente_id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .map(p => DB.getPedidoCompleto(p.id));
  },

  actualizarEstadoPedido(pedido_id, estado) {
    DB.set("caf_pedidos", DB.getPedidos().map(p => p.id === pedido_id ? { ...p, estado } : p));
  },

  getStats() {
    const pedidos = DB.getPedidos();
    return {
      productos: DB.getProductos().length,
      clientes: DB.getClientes().length,
      pedidos: pedidos.length,
      ventas: pedidos.reduce((a, p) => a + p.total, 0),
    };
  }
};

// ═══════════════════════════════════════════════════════════
//  ESTILOS
// ═══════════════════════════════════════════════════════════
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #fbf6ef; --white: #ffffff; --ink: #2c1810;
    --coffee: #6f4e37; --coffee2: #8a5e3c; --cream2: #f1e4d3;
    --orange: #e08e45; --green: #4d7c4a; --red: #c0392b;
    --muted: #8b7868; --border: #e8d9c5;
    --shadow: 0 3px 18px rgba(44,24,16,.10);
    --radius: 14px;
  }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; }

  nav { background: var(--ink); height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; position: sticky; top: 0; z-index: 100; }
  .brand { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 700; color: var(--cream2); display: flex; align-items: center; gap: .5rem; }
  .brand span { color: var(--orange); }
  .nav-links { display: flex; gap: .35rem; align-items: center; }
  .nb { background: none; border: none; color: #d8c3ab; font-size: .85rem; font-weight: 500; padding: .45rem .9rem; border-radius: 7px; cursor: pointer; transition: all .2s; font-family: inherit; position: relative; }
  .nb:hover, .nb.act { background: rgba(255,255,255,.08); color: #fff; }
  .nb.prim { background: var(--orange); color: #fff; }
  .nb.prim:hover { background: #ec9d57; }
  .cart-badge { position: absolute; top: 0; right: 2px; background: var(--red); color: #fff; font-size: .65rem; width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }

  .page { max-width: 1140px; margin: 0 auto; padding: 2.5rem 1.5rem; }
  .pg-title { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 700; margin-bottom: .35rem; }
  .pg-sub { color: var(--muted); margin-bottom: 2rem; }

  .hero { background: linear-gradient(135deg, #2c1810 0%, #4a2c1c 100%); padding: 4.5rem 2rem; text-align: center; color: #fff; }
  .hero h1 { font-family: 'Fraunces', serif; font-size: 2.9rem; margin-bottom: 1rem; }
  .hero h1 span { color: var(--orange); }
  .hero p { color: #e0cdb8; max-width: 500px; margin: 0 auto 2rem; line-height: 1.7; }
  .hero-btn { background: var(--orange); color: #fff; padding: .8rem 2rem; border-radius: 50px; font-size: .95rem; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all .2s; }
  .hero-btn:hover { background: #ec9d57; transform: translateY(-2px); }

  .stats-bar { display: flex; justify-content: center; gap: 3rem; padding: 1.4rem 0; background: var(--cream2); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .stat { text-align: center; }
  .stat-n { font-family: 'Fraunces', serif; font-size: 1.6rem; color: var(--coffee); }
  .stat-l { font-size: .73rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

  .cat-tabs { display: flex; gap: .5rem; margin-bottom: 1.75rem; overflow-x: auto; padding-bottom: .25rem; }
  .cat-tab { padding: .5rem 1.1rem; border-radius: 50px; font-size: .85rem; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: var(--white); color: var(--muted); white-space: nowrap; transition: all .2s; font-family: inherit; }
  .cat-tab.act, .cat-tab:hover { background: var(--coffee); color: #fff; border-color: var(--coffee); }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.25rem; }
  .pcard { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border); transition: transform .2s, box-shadow .2s; }
  .pcard:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(44,24,16,.15); }
  .pcard-img { height: 130px; background: linear-gradient(135deg, var(--cream2), #e9d3b5); display: flex; align-items: center; justify-content: center; font-size: 3.6rem; }
  .pcard-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: .3rem; }
  .pcard-cat { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--orange); }
  .pcard-title { font-weight: 700; font-size: .98rem; }
  .pcard-desc { font-size: .8rem; color: var(--muted); line-height: 1.4; }
  .pcard-footer { padding: .85rem 1rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .price { font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.1rem; color: var(--coffee); }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .55rem 1.1rem; border-radius: 8px; font-size: .85rem; font-weight: 700; cursor: pointer; border: none; transition: all .2s; font-family: inherit; }
  .btn-coffee { background: var(--coffee); color: #fff; }
  .btn-coffee:hover { background: var(--coffee2); }
  .btn-coffee:disabled { background: #c9bcae; cursor: not-allowed; }
  .btn-orange { background: var(--orange); color: #fff; }
  .btn-orange:hover { background: #ec9d57; }
  .btn-outline { background: transparent; border: 1.5px solid var(--coffee); color: var(--coffee); }
  .btn-outline:hover { background: var(--coffee); color: #fff; }
  .btn-sm { padding: .35rem .8rem; font-size: .78rem; }
  .btn-full { width: 100%; }
  .qty-btn { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--white); cursor: pointer; font-weight: 700; font-size: 1rem; color: var(--coffee); display:flex; align-items:center; justify-content:center; }
  .qty-btn:hover { background: var(--cream2); }

  /* CARRITO */
  .cart-row { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--white); border-radius: 10px; border: 1px solid var(--border); margin-bottom: .75rem; }
  .cart-emoji { font-size: 2.2rem; width: 56px; height: 56px; background: var(--cream2); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cart-info { flex: 1; }
  .cart-name { font-weight: 700; font-size: .95rem; }
  .cart-unit { font-size: .8rem; color: var(--muted); }
  .cart-qty { display: flex; align-items: center; gap: .6rem; }
  .cart-subtotal { font-weight: 700; min-width: 65px; text-align: right; font-family: 'Fraunces', serif; }
  .remove-btn { background: none; border: none; color: var(--red); cursor: pointer; font-size: 1rem; padding: .25rem; }

  .summary-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 1.5rem; border: 1px solid var(--border); position: sticky; top: 80px; }
  .summary-row { display: flex; justify-content: space-between; padding: .5rem 0; font-size: .9rem; }
  .summary-row.total { border-top: 2px solid var(--border); margin-top: .5rem; padding-top: .85rem; font-weight: 700; font-size: 1.15rem; font-family: 'Fraunces', serif; color: var(--coffee); }

  .form-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 2rem; max-width: 460px; margin: 0 auto; border: 1px solid var(--border); }
  .form-title { font-family: 'Fraunces', serif; font-size: 1.55rem; font-weight: 700; margin-bottom: 1.5rem; }
  .fg { margin-bottom: 1rem; }
  label { display: block; font-size: .82rem; font-weight: 600; margin-bottom: .35rem; }
  input, select, textarea { width: 100%; padding: .65rem .9rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: .9rem; outline: none; font-family: inherit; background: var(--bg); color: var(--ink); }
  input:focus, select:focus, textarea:focus { border-color: var(--coffee); }
  textarea { resize: vertical; min-height: 70px; }
  .frow { display: flex; gap: 1rem; }
  .frow .fg { flex: 1; }
  .fmsg { margin-top: 1rem; padding: .7rem 1rem; border-radius: 8px; font-size: .87rem; }
  .fmsg.err { background: #fdecea; color: var(--red); }
  .fmsg.ok { background: #eaf4ea; color: var(--green); }

  .delivery-opts { display: flex; gap: .75rem; margin-bottom: 1.25rem; }
  .delivery-opt { flex: 1; padding: .9rem; border-radius: 10px; border: 1.5px solid var(--border); cursor: pointer; text-align: center; transition: all .2s; background: var(--white); }
  .delivery-opt.sel { border-color: var(--coffee); background: var(--cream2); }
  .delivery-opt .ic { font-size: 1.6rem; }
  .delivery-opt .lb { font-size: .82rem; font-weight: 600; margin-top: .25rem; }

  .empty { text-align: center; padding: 3rem 1rem; color: var(--muted); }
  .empty span { font-size: 2.5rem; display: block; margin-bottom: .75rem; }

  .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999; padding: .85rem 1.5rem; border-radius: 9px; font-weight: 600; font-size: .88rem; box-shadow: 0 4px 24px rgba(0,0,0,.2); color: #fff; }
  .toast.ok { background: var(--green); }
  .toast.err { background: var(--red); }

  .order-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 1.25rem; border: 1px solid var(--border); margin-bottom: 1rem; }
  .order-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .75rem; }
  .chip { display: inline-block; padding: .2rem .65rem; border-radius: 99px; font-size: .72rem; font-weight: 700; }
  .chip-pendiente { background: #fff4e5; color: var(--orange); }
  .chip-preparando { background: #fff9db; color: #b8860b; }
  .chip-listo { background: #eaf4ea; color: var(--green); }
  .chip-entregado { background: #e7eef9; color: #2c5d9b; }
  .order-items { font-size: .85rem; color: var(--muted); line-height: 1.6; }

  .confirm-box { text-align: center; padding: 3rem 1.5rem; background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); max-width: 500px; margin: 0 auto; border: 1px solid var(--border); }
  .confirm-icon { font-size: 4rem; margin-bottom: 1rem; }

  @media (max-width: 640px) {
    .hero h1 { font-size: 2.1rem; }
    .frow { flex-direction: column; gap: 0; }
    .delivery-opts { flex-direction: column; }
  }
`;

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2600); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}>{msg}</div>;
}
function fmtFecha(s) { return s ? new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }
function fmtMoneda(n) { return `Bs ${n.toFixed(2)}`; }

// ═══════════════════════════════════════════════════════════
//  VISTAS
// ═══════════════════════════════════════════════════════════
function ViewInicio({ onIrMenu }) {
  const stats = DB.getStats();
  return (
    <>
      <div className="hero">
        <h1>Café recién hecho, <span>a tu puerta</span></h1>
        <p>Explora nuestro menú, agrega tus favoritos al carrito y elige recoger en tienda o recibir delivery.</p>
        <button className="hero-btn" onClick={onIrMenu}>Ver el menú ☕</button>
      </div>
      <div className="stats-bar">
        <div className="stat"><div className="stat-n">{stats.productos}</div><div className="stat-l">Productos</div></div>
        <div className="stat"><div className="stat-n">{stats.pedidos}</div><div className="stat-l">Pedidos realizados</div></div>
        <div className="stat"><div className="stat-n">{stats.clientes}</div><div className="stat-l">Clientes</div></div>
      </div>
    </>
  );
}

function ProductCard({ p, onAgregar }) {
  return (
    <div className="pcard">
      <div className="pcard-img">{p.imagen}</div>
      <div className="pcard-body">
        <div className="pcard-cat">{p.categoria}</div>
        <div className="pcard-title">{p.nombre}</div>
        <div className="pcard-desc">{p.descripcion}</div>
      </div>
      <div className="pcard-footer">
        <span className="price">{fmtMoneda(p.precio)}</span>
        <button className="btn btn-coffee btn-sm" onClick={() => onAgregar(p)}>+ Agregar</button>
      </div>
    </div>
  );
}

function ViewMenu({ onAgregar }) {
  const productos = DB.getProductos();
  const cats = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const filtrados = productos.filter(p =>
    (cat === "Todos" || p.categoria === cat) &&
    (!q || p.nombre.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="page">
      <h1 className="pg-title">Nuestro Menú</h1>
      <p className="pg-sub">Café de especialidad, repostería artesanal y bebidas frías.</p>
      <input placeholder="Buscar producto..." value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300, marginBottom: "1.25rem" }} />
      <div className="cat-tabs">
        {cats.map(c => <button key={c} className={`cat-tab ${cat === c ? "act" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {filtrados.length === 0 ? <div className="empty"><span>☕</span>Sin resultados.</div> : (
        <div className="grid">
          {filtrados.map(p => <ProductCard key={p.id} p={p} onAgregar={onAgregar} />)}
        </div>
      )}
    </div>
  );
}

// --- CARRITO ---
function ViewCarrito({ carrito, onActualizar, onQuitar, onIrPedido, onIrMenu }) {
  const total = carrito.reduce((a, it) => a + it.precio * it.cantidad, 0);
  if (carrito.length === 0) {
    return (
      <div className="page">
        <div className="empty"><span>🛒</span>Tu carrito está vacío.
          <div style={{ marginTop: "1rem" }}><button className="btn btn-coffee" onClick={onIrMenu}>Ir al menú</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <h1 className="pg-title">Tu Carrito</h1>
      <p className="pg-sub">Revisa tu pedido antes de continuar.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        <div>
          {carrito.map(it => (
            <div className="cart-row" key={it.id}>
              <div className="cart-emoji">{it.imagen}</div>
              <div className="cart-info">
                <div className="cart-name">{it.nombre}</div>
                <div className="cart-unit">{fmtMoneda(it.precio)} c/u</div>
              </div>
              <div className="cart-qty">
                <button className="qty-btn" onClick={() => onActualizar(it.id, it.cantidad - 1)}>−</button>
                <strong>{it.cantidad}</strong>
                <button className="qty-btn" onClick={() => onActualizar(it.id, it.cantidad + 1)}>+</button>
              </div>
              <div className="cart-subtotal">{fmtMoneda(it.precio * it.cantidad)}</div>
              <button className="remove-btn" onClick={() => onQuitar(it.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="summary-card">
          <div className="summary-row"><span>Subtotal</span><span>{fmtMoneda(total)}</span></div>
          <div className="summary-row"><span>Envío</span><span>Según tipo de entrega</span></div>
          <div className="summary-row total"><span>Total</span><span>{fmtMoneda(total)}</span></div>
          <button className="btn btn-orange btn-full" style={{ marginTop: "1rem" }} onClick={onIrPedido}>Continuar pedido →</button>
        </div>
      </div>
    </div>
  );
}

// --- PEDIDO (checkout) ---
function ViewPedido({ carrito, cliente, onLogin, onPedidoCreado }) {
  const [tipo, setTipo] = useState("recoger");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [msg, setMsg] = useState(null);
  const total = carrito.reduce((a, it) => a + it.precio * it.cantidad, 0);

  const handleConfirmar = () => {
    if (!cliente) { onLogin(); return; }
    if (tipo === "delivery" && !direccion.trim()) { setMsg("Ingresa una dirección de entrega."); return; }
    const r = DB.crearPedido(cliente.id, carrito, tipo, direccion, notas);
    if (r.ok) onPedidoCreado(r.pedido.id);
  };

  return (
    <div className="page">
      <h1 className="pg-title">Finalizar Pedido</h1>
      <p className="pg-sub">Elige cómo quieres recibir tu pedido.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        <div>
          <div className="delivery-opts">
            <div className={`delivery-opt ${tipo === "recoger" ? "sel" : ""}`} onClick={() => setTipo("recoger")}>
              <div className="ic">🏬</div><div className="lb">Recoger en tienda</div>
            </div>
            <div className={`delivery-opt ${tipo === "delivery" ? "sel" : ""}`} onClick={() => setTipo("delivery")}>
              <div className="ic">🛵</div><div className="lb">Delivery a domicilio</div>
            </div>
          </div>
          {tipo === "delivery" && (
            <div className="fg"><label>Dirección de entrega</label>
              <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, número, referencia..." />
            </div>
          )}
          <div className="fg"><label>Notas adicionales (opcional)</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: sin azúcar, extra caliente..." />
          </div>
          {!cliente && <div className="fmsg err">Debes iniciar sesión para confirmar el pedido.</div>}
          {msg && <div className="fmsg err">{msg}</div>}
        </div>
        <div className="summary-card">
          <div style={{ fontWeight: 700, marginBottom: ".75rem" }}>Resumen</div>
          {carrito.map(it => (
            <div className="summary-row" key={it.id}><span>{it.cantidad}x {it.nombre}</span><span>{fmtMoneda(it.precio * it.cantidad)}</span></div>
          ))}
          <div className="summary-row total"><span>Total</span><span>{fmtMoneda(total)}</span></div>
          <button className="btn btn-orange btn-full" style={{ marginTop: "1rem" }} onClick={handleConfirmar}>
            {cliente ? "Confirmar pedido" : "Iniciar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CONFIRMACIÓN ---
function ViewConfirmacion({ pedidoId, onIrMenu, onIrPedidos }) {
  const pedido = DB.getPedidoCompleto(pedidoId);
  if (!pedido) return null;
  return (
    <div className="page">
      <div className="confirm-box">
        <div className="confirm-icon">✅</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem", marginBottom: ".5rem" }}>¡Pedido confirmado!</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          Tu pedido #{pedido.id.toString().slice(-6)} fue recibido y está <strong>pendiente de preparación</strong>.
        </p>
        <div style={{ textAlign: "left", background: "var(--cream2)", borderRadius: 10, padding: "1rem", marginBottom: "1.5rem" }}>
          {pedido.detalles.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", padding: ".3rem 0" }}>
              <span>{d.cantidad}x {d.producto?.nombre}</span><span>{fmtMoneda(d.subtotal)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--border)", marginTop: ".5rem", paddingTop: ".5rem" }}>
            <span>Total</span><span>{fmtMoneda(pedido.total)}</span>
          </div>
        </div>
        <p style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
          {pedido.tipo_entrega === "delivery" ? `🛵 Delivery a: ${pedido.direccion}` : "🏬 Recoger en tienda"}
        </p>
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
          <button className="btn btn-outline" onClick={onIrMenu}>Seguir comprando</button>
          <button className="btn btn-coffee" onClick={onIrPedidos}>Ver mis pedidos</button>
        </div>
      </div>
    </div>
  );
}

// --- MIS PEDIDOS ---
function ViewMisPedidos({ cliente }) {
  const pedidos = DB.getPedidosCliente(cliente.id);
  return (
    <div className="page">
      <h1 className="pg-title">Mis Pedidos</h1>
      <p className="pg-sub">Historial y estado de tus pedidos.</p>
      {pedidos.length === 0 ? <div className="empty"><span>📭</span>Aún no has realizado pedidos.</div> : (
        pedidos.map(p => (
          <div className="order-card" key={p.id}>
            <div className="order-head">
              <div>
                <strong>Pedido #{p.id.toString().slice(-6)}</strong>
                <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>{fmtFecha(p.fecha)} · {p.tipo_entrega === "delivery" ? "🛵 Delivery" : "🏬 Recoger"}</div>
              </div>
              <span className={`chip chip-${p.estado}`}>{p.estado}</span>
            </div>
            <div className="order-items">
              {p.detalles.map(d => <div key={d.id}>{d.cantidad}x {d.producto?.nombre}</div>)}
            </div>
            <div style={{ textAlign: "right", fontWeight: 700, marginTop: ".5rem", fontFamily: "'Fraunces', serif" }}>{fmtMoneda(p.total)}</div>
          </div>
        ))
      )}
    </div>
  );
}

// --- LOGIN ---
function ViewLogin({ onLogin, onIrRegistro }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [msg, setMsg] = useState(null);
  const handleSubmit = () => { const r = DB.login(email, pass); if (r.ok) onLogin(r.cliente); else setMsg(r.error); };
  return (
    <div className="page">
      <div className="form-card">
        <div className="form-title">Iniciar sesión</div>
        <div className="fg"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="fg"><label>Contraseña</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} /></div>
        {msg && <div className="fmsg err">{msg}</div>}
        <button className="btn btn-coffee btn-full" style={{ marginTop: "1.25rem" }} onClick={handleSubmit}>Entrar</button>
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: ".83rem", color: "var(--muted)" }}>
          ¿Sin cuenta? <button onClick={onIrRegistro} style={{ background: "none", border: "none", color: "var(--coffee)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Regístrate</button>
        </p>
      </div>
    </div>
  );
}

// --- REGISTRO ---
function ViewRegistro({ onRegistrado }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [msg, setMsg] = useState(null);
  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = () => {
    if (!form.nombre || !form.email || !form.password) { setMsg({ type: "err", text: "Completa los campos obligatorios." }); return; }
    if (form.password.length < 6) { setMsg({ type: "err", text: "La contraseña debe tener al menos 6 caracteres." }); return; }
    const r = DB.registrarCliente(form);
    if (r.ok) onRegistrado(r.cliente); else setMsg({ type: "err", text: r.error });
  };
  return (
    <div className="page">
      <div className="form-card">
        <div className="form-title">Crear cuenta</div>
        <div className="fg"><label>Nombre completo</label><input name="nombre" value={form.nombre} onChange={hc} /></div>
        <div className="fg"><label>Email</label><input name="email" type="email" value={form.email} onChange={hc} /></div>
        <div className="fg"><label>Teléfono</label><input name="telefono" value={form.telefono} onChange={hc} /></div>
        <div className="fg"><label>Contraseña</label><input name="password" type="password" value={form.password} onChange={hc} /></div>
        {msg && <div className={`fmsg ${msg.type}`}>{msg.text}</div>}
        <button className="btn btn-coffee btn-full" style={{ marginTop: "1.25rem" }} onClick={handleSubmit}>Crear cuenta</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista] = useState("inicio");
  const [cliente, setCliente] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [pedidoId, setPedidoId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { DB.seed(); }, []);
  const showToast = (msg, type = "ok") => setToast({ msg, type });

  const handleAgregar = (p) => {
    setCarrito(c => {
      const ex = c.find(it => it.id === p.id);
      if (ex) return c.map(it => it.id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it);
      return [...c, { ...p, cantidad: 1 }];
    });
    showToast(`${p.nombre} agregado al carrito 🛒`, "ok");
  };
  const handleActualizar = (id, cant) => {
    if (cant < 1) { handleQuitar(id); return; }
    setCarrito(c => c.map(it => it.id === id ? { ...it, cantidad: cant } : it));
  };
  const handleQuitar = (id) => setCarrito(c => c.filter(it => it.id !== id));

  const handleLogin = u => { setCliente(u); setVista(carrito.length ? "pedido" : "menu"); showToast(`Bienvenido/a, ${u.nombre} 👋`, "ok"); };
  const handleRegistrado = u => { setCliente(u); setVista(carrito.length ? "pedido" : "menu"); showToast("¡Cuenta creada! 🎉", "ok"); };
  const handleLogout = () => { setCliente(null); setVista("inicio"); showToast("Sesión cerrada", "ok"); };
  const handlePedidoCreado = id => { setPedidoId(id); setCarrito([]); setVista("confirmacion"); };

  const totalItems = carrito.reduce((a, it) => a + it.cantidad, 0);

  return (
    <>
      <style>{S}</style>
      <nav>
        <div className="brand">☕ <span>Aroma</span>Café V1</div>
        <div className="nav-links">
          <button className={`nb ${vista === "inicio" ? "act" : ""}`} onClick={() => setVista("inicio")}>Inicio</button>
          <button className={`nb ${vista === "menu" ? "act" : ""}`} onClick={() => setVista("menu")}>Menú</button>
          <button className={`nb ${vista === "carrito" ? "act" : ""}`} onClick={() => setVista("carrito")} style={{ position: "relative" }}>
            🛒 Carrito {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          {cliente ? (
            <>
              <button className={`nb ${vista === "mis-pedidos" ? "act" : ""}`} onClick={() => setVista("mis-pedidos")}>Mis pedidos</button>
              <button className="nb" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <>
              <button className={`nb ${vista === "login" ? "act" : ""}`} onClick={() => setVista("login")}>Ingresar</button>
              <button className="nb prim" onClick={() => setVista("registro")}>Registrarse</button>
            </>
          )}
        </div>
      </nav>

      {vista === "inicio" && <ViewInicio onIrMenu={() => setVista("menu")} />}
      {vista === "menu" && <ViewMenu onAgregar={handleAgregar} />}
      {vista === "carrito" && (
        <ViewCarrito carrito={carrito} onActualizar={handleActualizar} onQuitar={handleQuitar}
          onIrPedido={() => setVista("pedido")} onIrMenu={() => setVista("menu")} />
      )}
      {vista === "pedido" && (
        carrito.length === 0
          ? <div className="page"><div className="empty"><span>🛒</span>Tu carrito está vacío.</div></div>
          : <ViewPedido carrito={carrito} cliente={cliente} onLogin={() => setVista("login")} onPedidoCreado={handlePedidoCreado} />
      )}
      {vista === "confirmacion" && pedidoId && (
        <ViewConfirmacion pedidoId={pedidoId} onIrMenu={() => setVista("menu")} onIrPedidos={() => setVista("mis-pedidos")} />
      )}
      {vista === "mis-pedidos" && cliente && <ViewMisPedidos cliente={cliente} />}
      {vista === "login" && <ViewLogin onLogin={handleLogin} onIrRegistro={() => setVista("registro")} />}
      {vista === "registro" && <ViewRegistro onRegistrado={handleRegistrado} />}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}