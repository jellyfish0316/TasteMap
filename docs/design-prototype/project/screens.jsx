// screens.jsx — Login, Map home, Collections sheet, Search, Add-place, Import modals
const S = {
  B: window.TMC.Btn, SB: window.TMC.SearchBar, Av: window.TMC.Avatar, Rt: window.TMC.Rating,
  SL: window.TMC.SectionLabel, StatusChip: window.TMC.StatusChip,
  PlaceHead: window.TMC2.PlaceHead, ListCard: window.TMC2.ListCard, MapPin: window.TMC2.MapPin,
  Sheet: window.TMO.Sheet, Modal: window.TMO.Modal, EmptyState: window.TMO.EmptyState, Toast: window.TMO.Toast,
};
const D = window.TM_DATA;

// ════════════════════════════════════════════════════════
// LOGIN / REGISTER — welcoming first impression
// ════════════════════════════════════════════════════════
function LoginScreen({ onAuth }) {
  const [mode, setMode] = React.useState('login');
  const reg = mode === 'register';
  return (
    <div className="tm-app" style={{ background: 'var(--bg)' }}>
      {/* hero */}
      <div style={{ position: 'relative', flexShrink: 0, paddingTop: 64, paddingBottom: 26, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, transform: 'scale(1.4) translateY(-8%)', filter: 'saturate(.9)' }}>
          <MapArt />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(246,243,237,.2), var(--bg) 86%)' }} />
        {/* floating sample pins */}
        {[['ddf',.2,.36],['simple',.7,.3],['yong',.46,.6]].map(([id,x,y],i)=>(
          <div key={id} style={{ position: 'absolute', left: `${x*100}%`, top: `${y*100}%` }}>
            <div style={{ filter: 'drop-shadow(0 4px 6px rgba(146,64,14,.3))' }}>
              <svg width="34" height="42" viewBox="0 0 38 46"><path d="M19 45C19 45 35 27 35 16A16 16 0 1 0 3 16C3 27 19 45 19 45Z" fill="var(--accent)" stroke="#fff" strokeWidth="2.5"/></svg>
            </div>
          </div>
        ))}
        <div className="col" style={{ position: 'relative', alignItems: 'center', gap: 16, paddingTop: 30 }}>
          <div className="row gap-2" style={{ background: 'var(--surface)', padding: '10px 18px 10px 12px', borderRadius: 'var(--r-pill)', boxShadow: 'var(--sh-2)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <Icon name="pin-fill" size={20} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5 }}>TasteMap</span>
          </div>
        </div>
      </div>

      {/* copy + form */}
      <div className="tm-scroll grow" style={{ padding: '0 26px' }}>
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 8, marginBottom: 26 }}>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.2 }}>把美食推薦<br/>收進<span style={{ color: 'var(--accent)' }}>一張地圖</span></h1>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 300, textWrap: 'pretty' }}>
            貼上一則 IG、YouTube 或 Threads 連結，TasteMap 幫你把餐廳釘上地圖，連<b style={{color:'var(--ink)'}}>「是誰推薦、吃什麼」</b>都一起留下。
          </p>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {reg && <Field icon="user" placeholder="顯示名稱 · Display name" />}
          {reg && <Field icon="sparkle" placeholder="帳號 · @username" />}
          <Field icon="inbox" placeholder="Email" type="email" />
          <Field icon="lock" placeholder="密碼 · Password" type="password" />
          <S.B kind="primary" size="lg" full onClick={onAuth} style={{ marginTop: 4 }}>
            {reg ? '建立帳號' : '登入'}
          </S.B>
        </div>

        <div className="row gap-3" style={{ margin: '20px 0' }}>
          <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--ink-4)', fontWeight: 600 }}>或</span>
          <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
        </div>
        <S.B kind="neutral" size="lg" full onClick={onAuth}>
          <span style={{ fontWeight: 800, color: '#4285F4' }}>G</span>&nbsp;繼續使用 Google
        </S.B>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)', marginTop: 22, paddingBottom: 30 }}>
          {reg ? '已經有帳號了？' : '還沒有帳號？'}{' '}
          <button onClick={() => setMode(reg ? 'login' : 'register')} style={{ color: 'var(--accent-deep)', fontWeight: 800 }}>
            {reg ? '登入' : '免費註冊'}
          </button>
        </p>
      </div>
    </div>
  );
}
function Field({ icon, placeholder, type = 'text' }) {
  return (
    <div className="row gap-2" style={{ height: 52, padding: '0 16px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--line-2)' }}>
      <Icon name={icon} size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      <input type={type} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 15.5, fontWeight: 500 }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAP HOME
// ════════════════════════════════════════════════════════
const FILTERS = [
  { id: 'all',     label: '全部' },
  { id: 'mine',    label: '我的收藏' },
  { id: 'circle',  label: '追蹤中' },
  { id: 'want',    label: '想去' },
  { id: 'visited', label: '去過' },
];

function MapScreen({ onOpenPlace, onOpenImport, onOpenSearch, onOpenCollections, panRef, version }) {
  const [filter, setFilter] = React.useState('all');
  const [sel, setSel] = React.useState(null);
  const cards = D.getCards();

  // build pins: one pin per place (dedup), colored by ownership
  const byPlace = {};
  cards.forEach(c => {
    const pl = D.PLACES[c.placeId]; if (!pl || pl.x == null) return;
    const mine = c.savedBy === 'me';
    if (filter === 'mine' && !mine) return;
    if (filter === 'circle' && mine) return;
    if (filter === 'want' && !(mine && c.user?.status === 'want')) return;
    if (filter === 'visited' && !(mine && c.user?.status === 'visited')) return;
    if (!byPlace[c.placeId]) byPlace[c.placeId] = { place: pl, mine: false, owner: c.savedBy };
    if (mine) byPlace[c.placeId].mine = true;
    else if (!byPlace[c.placeId].mine) byPlace[c.placeId].owner = c.savedBy;
  });
  const pinList = Object.values(byPlace);

  const pins = pinList.map((p, i) => (
    <S.MapPin key={p.place.id} x={p.place.x} y={p.place.y} place={p.place} index={i}
      circle={!p.mine} owner={p.owner} selected={sel === p.place.id}
      onClick={() => { setSel(p.place.id); onOpenPlace(p.place.id); }} />
  ));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <MapView pins={pins} panRef={panRef} onBackgroundTap={() => setSel(null)} />

      {/* top: search + filter chips */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '52px 14px 8px', background: 'linear-gradient(180deg, rgba(246,243,237,.92), rgba(246,243,237,.4) 70%, transparent)' }}>
        <div className="row gap-2">
          <div className="grow" onClick={onOpenSearch}>
            <S.SB value="" placeholder="搜尋餐廳、地點…" onChange={()=>{}} />
          </div>
          <button onClick={onOpenSearch} style={{ width: 48, height: 48, borderRadius: 'var(--r-pill)', background: 'var(--surface)', boxShadow: 'var(--sh-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}>
            <Icon name="filter" size={20} />
          </button>
        </div>
        <div className="row gap-2 tm-scroll" style={{ marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flexShrink: 0, height: 36, padding: '0 15px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700,
              background: filter === f.id ? 'var(--ink)' : 'var(--surface)',
              color: filter === f.id ? '#fff' : 'var(--ink-2)',
              boxShadow: filter === f.id ? 'none' : 'var(--sh-1)', border: '1px solid var(--line)',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* legend */}
      <div className="col gap-1" style={{ position: 'absolute', right: 14, top: 150, zIndex: 25, background: 'var(--surface)', padding: '8px 11px', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-2)', border: '1px solid var(--line)', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)' }}>
        <span className="row gap-1"><span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)' }} />我的收藏</span>
        <span className="row gap-1"><span style={{ width: 11, height: 11, borderRadius: '50%', background: '#0e7490' }} />追蹤的人</span>
      </div>

      {/* import FAB */}
      <button onClick={onOpenImport} style={{
        position: 'absolute', right: 16, bottom: 150, zIndex: 35, height: 52, padding: '0 18px 0 16px', borderRadius: 'var(--r-pill)',
        background: 'var(--accent)', color: '#fff', boxShadow: '0 6px 18px rgba(146,64,14,.4)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14.5,
      }}>
        <Icon name="link" size={19} stroke={2.4} />貼連結匯入
      </button>

      {/* collections peek bar */}
      <button onClick={onOpenCollections} style={{
        position: 'absolute', left: 12, right: 12, bottom: 80, zIndex: 30, padding: '12px 14px', borderRadius: 'var(--r-lg)',
        background: 'var(--surface)', boxShadow: 'var(--sh-3)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-tint)', display: 'grid', placeItems: 'center', color: 'var(--accent-deep)', flexShrink: 0 }}><Icon name="layers" size={20} /></div>
        <div className="grow col" style={{ gap: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>你的地圖</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{pinList.length} 個地點 · 4 個清單</span>
        </div>
        <Icon name="chevron-down" size={20} style={{ color: 'var(--ink-4)', transform: 'rotate(180deg)' }} />
      </button>
    </div>
  );
}

window.TM_SCREENS = { LoginScreen, MapScreen };
