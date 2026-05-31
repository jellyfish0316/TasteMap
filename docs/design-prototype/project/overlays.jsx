// overlays.jsx — bottom sheet, place detail, modals, import indicator, states
const { Btn: OB, VoiceBlock: OVB, Rating: ORt, SearchBar: OSB, Avatar: OAv } = window.TMC;
const { PlaceHead: OPH } = window.TMC2;
const { PLACES: P3, PEOPLE: PE3, LISTS: LS3 } = window.TM_DATA;

// ── generic bottom sheet ───────────────────────────────
function Sheet({ open, onClose, children, maxH = 0.86, padBottom = 24 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(33,29,24,.34)', backdropFilter: 'blur(1.5px)' }} />
      <div style={{
        position: 'relative', background: 'var(--bg)',
        borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)',
        maxHeight: `${maxH * 100}%`, display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(33,29,24,.22)',
      }}>
        <div style={{ padding: '10px 0 4px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 99, background: 'var(--line-2)' }} />
        </div>
        <div className="tm-scroll" style={{ overflowY: 'auto', padding: `4px 18px ${padBottom}px` }}>{children}</div>
      </div>
    </div>
  );
}

// ── place detail (the pin sheet) ───────────────────────
function PlaceDetailSheet({ placeId, open, onClose, onAddToList }) {
  const place = placeId ? P3[placeId] : null;
  const cards = window.TM_DATA.getCards().filter(c => c.placeId === placeId);
  return (
    <Sheet open={open} onClose={onClose}>
      {place && (
        <div>
          <OPH place={place} size="lg" />
          <div className="row gap-2" style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 13.5, alignItems: 'flex-start' }}>
            <Icon name="map-pin" size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ lineHeight: 1.4 }}>{place.addr}</span>
          </div>

          <div className="row gap-2" style={{ marginTop: 14 }}>
            <OB kind="primary" size="md" icon="bookmark" onClick={onAddToList} style={{ flex: 1 }}>加入清單</OB>
            <OB kind="neutral" size="md" icon="navigation">導航</OB>
            <OB kind="neutral" size="md" style={{ width: 46, padding: 0 }}><Icon name="external" size={19} /></OB>
          </div>
          <a className="row gap-1" style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, justifyContent: 'center' }}>
            <Icon name="external" size={14} />在 Google 地圖開啟
          </a>

          <div className="row gap-2" style={{ margin: '20px 0 12px', alignItems: 'center' }}>
            <div style={{ height: 1, background: 'var(--line)', flex: 1 }} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-3)', letterSpacing: 0.4 }}>
              {cards.length} 個收藏 · {cards.length} {cards.length === 1 ? 'voice' : 'voices'}
            </span>
            <div style={{ height: 1, background: 'var(--line)', flex: 1 }} />
          </div>

          <div className="col" style={{ gap: 12 }}>
            {cards.map(c => (
              <div key={c.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 15, border: '1px solid var(--line)', boxShadow: 'var(--sh-1)' }}>
                <OVB card={c} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── center modal ───────────────────────────────────────
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(33,29,24,.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'relative', width: '100%', background: 'var(--bg)', borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--sh-3)', overflow: 'hidden',
      }}>
        {title && (
          <div className="row" style={{ justifyContent: 'space-between', padding: '16px 18px 4px' }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{title}</span>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="x" size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── background import indicator ─────────────────────────
function ImportIndicator({ state, source, count, onReview, onDismiss }) {
  if (state === 'idle') return null;
  const running = state === 'running', done = state === 'done', failed = state === 'failed';
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 70,
      background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '12px 14px',
      boxShadow: 'var(--sh-3)', border: '1px solid var(--line)',
    }}>
      <div className="row gap-3">
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: failed ? 'var(--danger-bg)' : done ? 'var(--ok-bg)' : 'var(--accent-tint)',
          color: failed ? 'var(--danger)' : done ? 'var(--ok)' : 'var(--accent-deep)',
        }}>
          {running ? <Icon name="refresh" size={19} className="spin" /> : done ? <Icon name="check-circle" size={20} /> : <Icon name="alert" size={19} />}
        </div>
        <div className="grow col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {running ? '正在匯入…' : done ? `找到 ${count} 個地點` : '匯入失敗'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="ellipsis">
            {running ? `@${source.author} · ${source.title}` : done ? '點擊檢視並儲存' : '連結無法解析，請重試'}
          </span>
        </div>
        {done && <OB kind="primary" size="sm" onClick={onReview}>檢視</OB>}
        {failed && <OB kind="soft" size="sm" onClick={onReview}>重試</OB>}
        {!running && <button onClick={onDismiss} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}><Icon name="x" size={17} /></button>}
      </div>
      {running && (
        <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, height: '100%', width: '40%', borderRadius: 99, background: 'var(--accent)', animation: 'tm-bar 1.1s ease-in-out infinite' }} />
        </div>
      )}
    </div>
  );
}

// ── empty / loading states ─────────────────────────────
function EmptyState({ icon, title, body, action }) {
  return (
    <div className="col" style={{ alignItems: 'center', textAlign: 'center', padding: '48px 28px', gap: 6 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-4)', marginBottom: 6 }}>
        <Icon name={icon} size={28} />
      </div>
      <span style={{ fontSize: 16.5, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: 260 }}>{body}</span>
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

function Skeleton({ h = 16, w = '100%', r = 8, style = {} }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: 'linear-gradient(90deg,var(--surface-3),var(--surface-2),var(--surface-3))', backgroundSize: '200% 100%', animation: 'tm-pulse 1.4s ease-in-out infinite', ...style }} />;
}
function CardSkeleton() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 16, border: '1px solid var(--line)' }} className="col gap-3">
      <Skeleton h={20} w="60%" />
      <Skeleton h={14} w="40%" />
      <Skeleton h={40} w="100%" r={12} />
    </div>
  );
}

// ── toast ──────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 102, zIndex: 95, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <div className="row gap-2" style={{ background: 'var(--ink)', color: '#fff', padding: '11px 18px', borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600, boxShadow: 'var(--sh-3)' }}>
        <Icon name="check-circle" size={17} style={{ color: '#7ee2a8' }} />{msg}
      </div>
    </div>
  );
}

window.TMO = { Sheet, PlaceDetailSheet, Modal, ImportIndicator, EmptyState, Skeleton, CardSkeleton, Toast };
