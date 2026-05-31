// flows.jsx — Collections sheet, Search overlay, Add-place modal, Import modal
const F = {
  B: window.TMC.Btn, SB: window.TMC.SearchBar, Av: window.TMC.Avatar, Rt: window.TMC.Rating,
  SL: window.TMC.SectionLabel, StatusChip: window.TMC.StatusChip,
  PlaceHead: window.TMC2.PlaceHead,
  Sheet: window.TMO.Sheet, Modal: window.TMO.Modal, EmptyState: window.TMO.EmptyState,
};
const FD = window.TM_DATA;

// ── Collections sheet (the mobile "sidebar") ───────────
function CollectionsSheet({ open, onClose, onOpenImport, onOpenList }) {
  const myLists = Object.values(FD.LISTS).filter(l => l.owner === 'me');
  const following = FD.getFollowing();
  const followLists = Object.values(FD.LISTS).filter(l => l.owner !== 'me' && following.includes(l.owner) && l.public);
  return (
    <F.Sheet open={open} onClose={onClose} maxH={0.84}>
      {/* import box */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent-wash), #fff)', border: '1px solid var(--accent-tint)', borderRadius: 'var(--r-lg)', padding: 14, marginBottom: 20 }}>
        <div className="row gap-2" style={{ marginBottom: 10 }}>
          <Icon name="sparkle" size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 800, fontSize: 15 }}>從連結匯入</span>
        </div>
        <div onClick={onOpenImport} className="row gap-2" style={{ height: 46, padding: '0 14px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--ink-4)', fontSize: 14.5, cursor: 'pointer', marginBottom: 10 }}>
          <Icon name="link" size={17} />貼上 IG / YouTube / Threads 連結…
        </div>
        <F.B kind="primary" full size="md" icon="plus" onClick={onOpenImport}>匯入餐廳</F.B>
      </div>

      <F.SL>我的清單 · My collections</F.SL>
      <div className="col gap-2" style={{ marginBottom: 22 }}>
        {myLists.map(l => <ListRow key={l.id} list={l} onClick={() => onOpenList(l.id)} />)}
      </div>

      <F.SL>追蹤中 · Following</F.SL>
      <div className="col gap-2">
        {followLists.map(l => <ListRow key={l.id} list={l} showOwner onClick={() => onOpenList(l.id)} />)}
      </div>
    </F.Sheet>
  );
}

function ListRow({ list, showOwner, onClick }) {
  const owner = FD.PEOPLE[list.owner];
  return (
    <button onClick={onClick} className="row gap-3" style={{ padding: 12, borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'left', width: '100%' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 21, flexShrink: 0 }}>{list.emoji}</div>
      <div className="grow col" style={{ gap: 2, minWidth: 0 }}>
        <span className="row gap-1" style={{ fontWeight: 700, fontSize: 14.5 }}>
          <span className="ellipsis">{list.name}</span>
          <Icon name={list.public ? 'globe' : 'lock'} size={12.5} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
        </span>
        <span className="row gap-1" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
          {showOwner && <><F.Av person={owner} size={15} />by @{owner.handle} ·</>}{list.cards.length} 個地點
        </span>
      </div>
      <Icon name="chevron-right" size={18} style={{ color: 'var(--ink-4)' }} />
    </button>
  );
}

// ── Search overlay (manual capture) ────────────────────
function SearchOverlay({ open, onClose, onPick }) {
  const [q, setQ] = React.useState('');
  React.useEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const all = Object.values(FD.PLACES);
  const res = q.trim() ? all.filter(p => (p.name + p.en + p.area).toLowerCase().includes(q.toLowerCase())) : all.slice(0, 6);
  return (
    <div className="tm-app" style={{ position: 'absolute', inset: 0, zIndex: 92, background: 'var(--bg)' }}>
      <div className="row gap-2" style={{ padding: '54px 14px 10px' }}>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 'var(--r-pill)', background: 'var(--surface)', boxShadow: 'var(--sh-1)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid var(--line)' }}><Icon name="arrow-left" size={20} /></button>
        <div className="grow"><F.SB value={q} onChange={setQ} onClear={() => setQ('')} autoFocus placeholder="搜尋地點以新增…" /></div>
      </div>
      <div className="tm-scroll grow" style={{ padding: '6px 14px 20px' }}>
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, padding: '0 4px 8px' }}>
          {q.trim() ? `搜尋「${q}」` : '熱門地點'} · Google Places
        </p>
        <div className="col gap-2">
          {res.map(p => (
            <button key={p.id} onClick={() => onPick(p)} className="row gap-3" style={{ padding: 13, borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'left' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-tint)', display: 'grid', placeItems: 'center', color: 'var(--accent-deep)', flexShrink: 0 }}><Icon name="map-pin" size={20} /></div>
              <div className="grow col" style={{ gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name} <span style={{ color: 'var(--ink-4)', fontWeight: 600, fontSize: 13 }}>{p.en}</span></span>
                <span className="row gap-2" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}><F.Rt value={p.rating} /> · {p.addr}</span>
              </div>
              <Icon name="plus" size={20} style={{ color: 'var(--accent)' }} />
            </button>
          ))}
          {!res.length && <F.EmptyState icon="search" title="找不到地點" body={`沒有符合「${q}」的結果。試試別的關鍵字，或換個拼法。`} />}
        </div>
      </div>
    </div>
  );
}

// ── Add-place modal (search → pick → list + note) ──────
function AddPlaceModal({ open, place, onClose, onSave }) {
  const myLists = Object.values(FD.LISTS).filter(l => l.owner === 'me');
  const [picked, setPicked] = React.useState([]);
  const [note, setNote] = React.useState('');
  const [status, setStatus] = React.useState('want');
  React.useEffect(() => { if (open) { setPicked([]); setNote(''); setStatus('want'); } }, [open, place]);
  if (!place && !open) return null;
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <F.Modal open={open} onClose={onClose} title="加入清單">
      <div style={{ padding: '4px 18px 18px' }}>
        {place && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 13, marginBottom: 16, border: '1px solid var(--line)' }}>
            <F.PlaceHead place={place} />
          </div>
        )}
        <p style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>選擇清單</p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
          {myLists.map(l => {
            const on = picked.includes(l.id);
            return (
              <button key={l.id} onClick={() => toggle(l.id)} className="row gap-1" style={{
                height: 38, padding: '0 13px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700,
                background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink-2)',
                boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-2)',
              }}>
                <span>{l.emoji}</span>{l.name}{on && <Icon name="check" size={14} stroke={3} />}
              </button>
            );
          })}
          <button className="row gap-1" style={{ height: 38, padding: '0 13px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700, background: 'var(--accent-tint)', color: 'var(--accent-ink)' }}>
            <Icon name="plus" size={15} stroke={2.6} />新清單
          </button>
        </div>

        <p style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>狀態</p>
        <div className="row gap-2" style={{ marginBottom: 16 }}>
          {[['want','想去','bookmark'],['visited','去過','check']].map(([s,t,ic]) => (
            <button key={s} onClick={() => setStatus(s)} className="row gap-1" style={{
              flex: 1, height: 44, borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700, justifyContent: 'center',
              background: status === s ? 'var(--accent-tint)' : 'var(--surface)', color: status === s ? 'var(--accent-ink)' : 'var(--ink-3)',
              boxShadow: `inset 0 0 0 ${status === s ? 2 : 1}px ${status === s ? 'var(--accent)' : 'var(--line-2)'}`,
            }}><Icon name={ic} size={16} />{t}</button>
          ))}
        </div>

        <p style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>你的筆記</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="想記下什麼？（例如：要訂位、避開週末）" rows={2} style={{
          width: '100%', resize: 'none', borderRadius: 'var(--r-md)', border: '1px solid var(--line-2)', padding: 12, fontSize: 14.5, outline: 'none', background: 'var(--surface)', lineHeight: 1.45, marginBottom: 18,
        }} />

        <F.B kind="primary" full size="lg" icon="bookmark" disabled={!picked.length}
          style={{ opacity: picked.length ? 1 : 0.5 }}
          onClick={() => onSave({ place, lists: picked, note, status })}>
          {picked.length ? `儲存到 ${picked.length} 個清單` : '選擇至少一個清單'}
        </F.B>
      </div>
    </F.Modal>
  );
}

// ── Import modal (paste link) ──────────────────────────
function ImportModal({ open, onClose, onImport }) {
  const [url, setUrl] = React.useState('');
  React.useEffect(() => { if (open) setUrl(''); }, [open]);
  const ex = FD.IMPORT_SOURCE;
  return (
    <F.Modal open={open} onClose={onClose} title="從連結匯入">
      <div style={{ padding: '4px 18px 18px' }}>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 14px', lineHeight: 1.5 }}>
          貼上含有餐廳的貼文連結，TasteMap 會自動找出地點、菜色與推薦人。
        </p>
        <div className="row gap-2" style={{ height: 50, padding: '0 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--line-2)', background: 'var(--surface)', marginBottom: 12 }}>
          <Icon name="link" size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input value={url} onChange={e => setUrl(e.target.value)} autoFocus placeholder="https://instagram.com/reel/…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5 }} />
        </div>
        <button onClick={() => setUrl('https://' + ex.url)} className="row gap-2" style={{ width: '100%', padding: 11, borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px dashed var(--line-2)', marginBottom: 16, textAlign: 'left' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: window.TM_DATA.PLATFORMS[ex.platform].color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{window.TM_DATA.PLATFORMS[ex.platform].short}</div>
          <div className="grow col" style={{ gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }} className="ellipsis">{ex.title}</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>試試這個範例 · @{ex.author}</span>
          </div>
        </button>
        <F.B kind="primary" full size="lg" icon="sparkle" disabled={!url} style={{ opacity: url ? 1 : 0.5 }} onClick={() => onImport(url)}>開始匯入</F.B>
        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', textAlign: 'center', margin: '12px 0 0' }}>匯入時你可以繼續使用 App，完成後會通知你。</p>
      </div>
    </F.Modal>
  );
}

window.TM_FLOWS = { CollectionsSheet, SearchOverlay, AddPlaceModal, ImportModal };
