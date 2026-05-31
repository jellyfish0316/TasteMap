// components.jsx — atoms + the core Place Card ("two voices")
const { PLATFORMS, PEOPLE, PLACES } = window.TM_DATA;

// ── Avatar ─────────────────────────────────────────────
function Avatar({ person, size = 28 }) {
  const p = typeof person === 'string' ? PEOPLE[person] : person;
  if (!p) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: p.color, color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 700, fontSize: size * 0.42, letterSpacing: -0.3,
      boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.25)',
    }}>{p.initial}</div>
  );
}

// ── Platform glyph ─────────────────────────────────────
function PlatformGlyph({ platform, size = 22 }) {
  const p = PLATFORMS[platform] || PLATFORMS.maps;
  return (
    <div title={p.label} style={{
      width: size, height: size, borderRadius: 7, flexShrink: 0,
      background: p.color, color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 800, fontSize: size * 0.42, letterSpacing: -0.5,
    }}>{p.short}</div>
  );
}

// ── Rating ─────────────────────────────────────────────
function Rating({ value, reviews, size = 13 }) {
  if (value == null) return null;
  return (
    <span className="row gap-1" style={{ fontSize: size, color: 'var(--ink-2)', fontWeight: 600 }}>
      <Icon name="star-fill" size={size + 1} style={{ color: 'var(--accent)' }} />
      {value.toFixed(1)}
      {reviews != null && <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>({reviews.toLocaleString()})</span>}
    </span>
  );
}

// ── Buttons ────────────────────────────────────────────
function Btn({ children, kind = 'primary', size = 'md', full, icon, style = {}, ...rest }) {
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, r: 'var(--r-sm)' },
    md: { h: 46, px: 18, fs: 15, r: 'var(--r-md)' },
    lg: { h: 54, px: 22, fs: 16, r: 'var(--r-md)' },
  }[size];
  const kinds = {
    primary: { background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: '0 1px 2px rgba(146,64,14,.25)' },
    deep:    { background: 'var(--accent-deep)', color: '#fff' },
    soft:    { background: 'var(--accent-tint)', color: 'var(--accent-ink)' },
    neutral: { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line-2)' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)' },
    danger:  { background: 'var(--danger-bg)', color: 'var(--danger)' },
  }[kind];
  return (
    <button className="row gap-2 focusable" style={{
      height: sizes.h, padding: `0 ${sizes.px}px`, borderRadius: sizes.r,
      fontSize: sizes.fs, fontWeight: 700, justifyContent: 'center',
      width: full ? '100%' : undefined, whiteSpace: 'nowrap',
      transition: 'transform .12s, filter .12s', ...kinds, ...style,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
      {...rest}>
      {icon && <Icon name={icon} size={sizes.fs + 3} stroke={2.2} />}
      {children}
    </button>
  );
}

// ── Match-status badge ─────────────────────────────────
function MatchBadge({ status }) {
  const map = {
    matched:      { t: '已配對', icon: 'check-circle', c: 'var(--ok)',   bg: 'var(--ok-bg)' },
    needs_review: { t: '待確認', icon: 'alert',        c: 'var(--warn)', bg: 'var(--warn-bg)' },
    unmatched:    { t: '找不到', icon: 'search',       c: 'var(--mute)', bg: 'var(--mute-bg)' },
    pending:      { t: '搜尋中', icon: 'clock',        c: 'var(--mute)', bg: 'var(--mute-bg)' },
  }[status] || {};
  return (
    <span className="row gap-1" style={{
      height: 24, padding: '0 9px', borderRadius: 'var(--r-pill)',
      background: map.bg, color: map.c, fontSize: 12, fontWeight: 700,
    }}>
      <Icon name={map.icon} size={13} stroke={2.4} />{map.t}
    </span>
  );
}

// ── Status chip (want / visited) ───────────────────────
function StatusChip({ status, onClick }) {
  const map = {
    want:    { t: '想去', icon: 'bookmark', c: 'var(--accent-ink)', bg: 'var(--accent-tint)' },
    visited: { t: '去過', icon: 'check',    c: 'var(--ok)', bg: 'var(--ok-bg)' },
  }[status];
  if (!map) return null;
  return (
    <button className="row gap-1" onClick={onClick} style={{
      height: 26, padding: '0 10px', borderRadius: 'var(--r-pill)',
      background: map.bg, color: map.c, fontSize: 12.5, fontWeight: 700,
    }}>
      <Icon name={map.icon} size={13} stroke={2.4} fill={status==='visited'} />{map.t}
    </button>
  );
}

// ── Dish chips ─────────────────────────────────────────
function DishChips({ dishes }) {
  if (!dishes || !dishes.length) return null;
  return (
    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
      {dishes.map((d, i) => (
        <span key={i} className="row gap-1" style={{
          height: 27, padding: '0 10px 0 8px', borderRadius: 'var(--r-pill)',
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)',
        }}>
          <Icon name="utensils" size={12.5} style={{ color: 'var(--accent)' }} stroke={2} />{d}
        </span>
      ))}
    </div>
  );
}

// ── Follow button ──────────────────────────────────────
function FollowButton({ following, onToggle, size = 'sm' }) {
  const [hover, setHover] = React.useState(false);
  const h = size === 'sm' ? 34 : 42;
  if (following) {
    return (
      <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onToggle}
        className="row gap-1" style={{
          height: h, padding: '0 14px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700,
          background: hover ? 'var(--danger-bg)' : 'var(--surface-2)',
          color: hover ? 'var(--danger)' : 'var(--ink-2)',
          boxShadow: 'inset 0 0 0 1px var(--line-2)', transition: 'all .15s',
        }}>
        <Icon name={hover ? 'x' : 'check'} size={14} stroke={2.4} />{hover ? '取消追蹤' : '追蹤中'}
      </button>
    );
  }
  return (
    <button onClick={onToggle} className="row gap-1" style={{
      height: h, padding: '0 16px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700,
      background: 'var(--accent)', color: '#fff',
    }}>
      <Icon name="user-plus" size={14} stroke={2.4} />追蹤
    </button>
  );
}

// ── Search bar ─────────────────────────────────────────
function SearchBar({ value, onChange, placeholder, icon = 'search', onFocus, onClear, autoFocus, trailing }) {
  return (
    <div className="row gap-2" style={{
      height: 48, padding: '0 6px 0 14px', borderRadius: 'var(--r-pill)',
      background: 'var(--surface)', boxShadow: 'var(--sh-2)', border: '1px solid var(--line)',
    }}>
      <Icon name={icon} size={19} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      <input value={value} onChange={e => onChange && onChange(e.target.value)} onFocus={onFocus}
        autoFocus={autoFocus} placeholder={placeholder} style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 15.5, color: 'var(--ink)', fontWeight: 500,
        }} />
      {value ? (
        <button onClick={onClear} style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
          <Icon name="x" size={18} />
        </button>
      ) : trailing}
    </div>
  );
}

// ── Section label ──────────────────────────────────────
function SectionLabel({ children, right }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '0 2px 10px' }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--ink-3)' }}>{children}</span>
      {right}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// VOICE BLOCK — the creator's voice + the user's overlay
// ════════════════════════════════════════════════════════
function VoiceBlock({ card, compact }) {
  const c = card.creator;
  const fromCircle = card.savedBy !== 'me';
  const saver = fromCircle ? PEOPLE[card.savedBy] : null;

  // manually added (no creator voice)
  if (!c) {
    return (
      <div>
        <div className="row gap-2" style={{ marginBottom: card.user && (card.user.note || card.user.status) ? 0 : 4 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-tint)', color: 'var(--accent-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="user" size={15} /></div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>你新增 · Added by you</span>
        </div>
        {card.user && (card.user.note || card.user.status) && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'linear-gradient(180deg, var(--accent-wash), #fff)', border: '1px dashed var(--accent)' }}>
            <div className="row gap-1" style={{ marginBottom: card.user.note ? 5 : 0 }}>
              <Icon name="note" size={13} style={{ color: 'var(--accent-deep)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--accent-deep)' }}>你的筆記 · Your note</span>
              <span className="grow" />
              {card.user.status && <StatusChip status={card.user.status} />}
            </div>
            {card.user.note && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>{card.user.note}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* attribution row */}
      <div className="row gap-2" style={{ marginBottom: 8 }}>
        <PlatformGlyph platform={c.platform} size={26} />
        <div className="grow col" style={{ gap: 1 }}>
          <span className="row gap-1" style={{ fontWeight: 700, fontSize: 14.5 }}>
            @{c.author}
            {c.verified && <Icon name="check-circle" size={14} style={{ color: 'var(--accent)' }} />}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{PLATFORMS[c.platform].label}</span>
        </div>
        {fromCircle && (
          <span className="row gap-1" style={{
            height: 25, padding: '0 9px 0 4px', borderRadius: 'var(--r-pill)',
            background: saver.color + '14', color: saver.color, fontSize: 11.5, fontWeight: 700,
          }}>
            <Avatar person={saver} size={18} />@{saver.handle} 收藏
          </span>
        )}
      </div>

      {/* the creator's words */}
      <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.5, color: 'var(--ink)', textWrap: 'pretty' }}>{c.summary}</p>

      {!compact && c.quote && (
        <div style={{
          margin: '0 0 10px', padding: '8px 12px', borderRadius: 'var(--r-sm)',
          background: 'var(--accent-wash)', borderLeft: '3px solid var(--accent)',
          fontSize: 13.5, fontStyle: 'italic', color: 'var(--accent-ink)', lineHeight: 1.45,
        }}>{c.quote}</div>
      )}

      <div style={{ marginBottom: c.src ? 10 : 0 }}><DishChips dishes={c.dishes} /></div>

      {!compact && c.src && (
        <a className="row gap-1" style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, textDecoration: 'none' }}>
          <Icon name={c.platform === 'youtube' ? 'corner-up-right' : 'link'} size={14} />
          {c.src}
        </a>
      )}

      {/* the user's overlay — visually distinct, "your voice" */}
      {card.user && (card.user.note || card.user.status) && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)',
          background: 'linear-gradient(180deg, var(--accent-wash), #fff)',
          border: '1px dashed var(--accent)', position: 'relative',
        }}>
          <div className="row gap-1" style={{ marginBottom: card.user.note ? 5 : 0 }}>
            <Icon name="note" size={13} style={{ color: 'var(--accent-deep)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--accent-deep)' }}>你的筆記 · Your note</span>
            <span className="grow" />
            {card.user.status && <StatusChip status={card.user.status} />}
          </div>
          {card.user.note && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>{card.user.note}</p>}
        </div>
      )}
    </div>
  );
}

window.TMC = { Avatar, PlatformGlyph, Rating, Btn, MatchBadge, StatusChip, DishChips, FollowButton, SearchBar, SectionLabel, VoiceBlock };
