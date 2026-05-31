// cards.jsx — place cards, candidate cards, pins, person rows
const { PLACES: P2, PLATFORMS: PL2, PEOPLE: PE2, LISTS: LS2 } = window.TM_DATA;
const { Avatar: Av, Rating: Rt, Btn: B, MatchBadge: MB, StatusChip: SC, DishChips: DC,
        FollowButton: FB, VoiceBlock: VB, PlatformGlyph: PG } = window.TMC;

// ── place header (name / area / rating) ────────────────
function PlaceHead({ place, size = 'md', trailing }) {
  const big = size === 'lg';
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
      <div className="grow col" style={{ gap: 3 }}>
        <div className="row gap-2" style={{ flexWrap: 'wrap', rowGap: 2 }}>
          <span style={{ fontSize: big ? 22 : 17, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.15 }}>{place.name}</span>
          <span style={{ fontSize: big ? 14 : 12.5, color: 'var(--ink-4)', fontWeight: 600, alignSelf: 'flex-end', paddingBottom: 1 }}>{place.en}</span>
        </div>
        <div className="row gap-2" style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>
          <Rt value={place.rating} reviews={big ? place.reviews : null} />
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span className="row gap-1"><Icon name="map-pin" size={13} />{place.area}</span>
        </div>
      </div>
      {trailing}
    </div>
  );
}

// ── full place card in a collection / list ─────────────
function PlaceCard({ card, onOpen, onRemove, owner }) {
  const place = P2[card.placeId];
  return (
    <div onClick={onOpen} style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 16,
      boxShadow: 'var(--sh-1)', border: '1px solid var(--line)', cursor: 'pointer',
    }}>
      <div style={{ marginBottom: 12 }}>
        <PlaceHead place={place} trailing={owner && (
          <button onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }}
            style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--ink-4)', background: 'var(--surface-2)' }}>
            <Icon name="trash" size={16} />
          </button>
        )} />
      </div>
      <VoiceBlock card={card} />
    </div>
  );
}

// ── import candidate card ──────────────────────────────
function CandidateCard({ cand, checked, onToggle, onSearch, expanded, onExpand }) {
  const matched = cand.match === 'matched';
  const disabled = !matched;
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      border: `1px solid ${checked ? 'var(--accent)' : 'var(--line)'}`,
      boxShadow: checked ? '0 0 0 3px var(--accent-tint)' : 'var(--sh-1)',
      overflow: 'hidden', transition: 'all .15s',
    }}>
      <div className="row gap-3" style={{ padding: 14, alignItems: 'flex-start' }}>
        {/* checkbox */}
        <button onClick={() => !disabled && onToggle()} disabled={disabled} style={{
          width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 2,
          display: 'grid', placeItems: 'center',
          background: checked ? 'var(--accent)' : 'var(--surface)',
          boxShadow: `inset 0 0 0 ${checked ? 0 : 2}px var(--line-2)`,
          color: '#fff', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        }}>{checked && <Icon name="check" size={15} stroke={3} />}</button>

        <div className="grow col" style={{ gap: 7 }}>
          <div className="row gap-2" style={{ justifyContent: 'space-between' }}>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{cand.name}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{cand.area}{cand.rating ? ` · ⭐ ${cand.rating}` : ''}</span>
            </div>
            <MB status={cand.match} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>{cand.summary}</p>
          <DC dishes={cand.dishes} />

          {!matched && (
            <button onClick={onSearch} className="row gap-1" style={{
              marginTop: 2, height: 38, borderRadius: 'var(--r-sm)', padding: '0 12px',
              background: 'var(--surface-2)', border: '1px solid var(--line-2)',
              color: 'var(--accent-ink)', fontSize: 13.5, fontWeight: 700, alignSelf: 'flex-start',
            }}>
              <Icon name="search" size={15} />手動搜尋地點 · Search manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── person row (search / profile lists) ────────────────
function PersonRow({ person, following, onToggle, onOpen }) {
  return (
    <div className="row gap-3" onClick={onOpen} style={{
      padding: 12, background: 'var(--surface)', borderRadius: 'var(--r-md)',
      border: '1px solid var(--line)', cursor: 'pointer',
    }}>
      <Av person={person} size={46} />
      <div className="grow col" style={{ gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 15.5 }}>{person.name}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>@{person.handle}</span>
        {person.bio && <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }} className="ellipsis">{person.bio}</span>}
      </div>
      <div onClick={e => e.stopPropagation()}><FB following={following} onToggle={onToggle} /></div>
    </div>
  );
}

// ── feed / collection summary card ─────────────────────
function ListCard({ list, onOpen }) {
  const owner = PE2[list.owner];
  const cards = window.TM_DATA.getCards();
  const places = list.cards.map(id => cards.find(c => c.id === id)).filter(Boolean).map(c => P2[c.placeId]);
  return (
    <div onClick={onOpen} style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: '1px solid var(--line)', boxShadow: 'var(--sh-1)', cursor: 'pointer',
    }}>
      {/* preview strip */}
      <div className="row" style={{ height: 96, background: 'var(--surface-3)' }}>
        {places.slice(0, 3).map((pl, i) => (
          <div key={i} className="grow" style={{
            height: '100%', borderRight: i < 2 ? '2px solid var(--surface)' : 'none',
            background: `repeating-linear-gradient(135deg, ${owner.color}14, ${owner.color}14 9px, ${owner.color}06 9px, ${owner.color}06 18px)`,
            display: 'grid', placeItems: 'center', position: 'relative',
          }}>
            <Icon name="pin-fill" size={22} style={{ color: owner.color, opacity: .55 }} />
          </div>
        ))}
        {!places.length && <div className="grow" style={{ display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}><Icon name="map-pin" size={26} /></div>}
      </div>
      <div className="col" style={{ padding: 14, gap: 8 }}>
        <div className="row gap-2">
          <span style={{ fontSize: 19 }}>{list.emoji}</span>
          <span className="grow" style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: -0.3 }}>{list.name}</span>
          <Icon name={list.public ? 'globe' : 'lock'} size={15} style={{ color: 'var(--ink-4)' }} />
        </div>
        <div className="row gap-2" style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <Av person={owner} size={20} />
          <span className="ellipsis">{list.owner === 'me' ? '你的清單' : `by @${owner.handle}`}</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span style={{ flexShrink: 0 }}>{list.cards.length} 個地點</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAP PIN
// ════════════════════════════════════════════════════════
function MapPin({ x, y, place, selected, circle, owner, onClick, index = 0 }) {
  const color = circle ? (PE2[owner]?.color || '#0e7490') : 'var(--accent)';
  const z = selected ? 60 : 10;
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{
        position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`,
        transform: 'translate(-50%, -100%)', zIndex: z, opacity: 1,
        filter: selected ? 'drop-shadow(0 6px 10px rgba(146,64,14,.4))' : 'none',
      }}>
      <div style={{ position: 'relative', transition: 'transform .18s', transform: selected ? 'scale(1.18)' : 'scale(1)' }}>
        {/* teardrop */}
        <svg width="38" height="46" viewBox="0 0 38 46">
          <path d="M19 45C19 45 35 27 35 16A16 16 0 1 0 3 16C3 27 19 45 19 45Z"
            fill={color} stroke="#fff" strokeWidth="2.5" />
        </svg>
        {/* glyph bubble */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          display: 'grid', placeItems: 'center', color,
        }}>
          {circle
            ? <span style={{ fontSize: 11, fontWeight: 800 }}>{PE2[owner]?.initial}</span>
            : <Icon name={place?.cat === 'coffee' ? 'utensils' : 'utensils'} size={13} stroke={2.4} />}
        </div>
        {/* shadow dot */}
        <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 10, height: 4, borderRadius: '50%', background: 'rgba(60,50,40,.25)', filter: 'blur(1.5px)' }} />
      </div>
    </button>
  );
}

window.TMC2 = { PlaceHead, PlaceCard, CandidateCard, PersonRow, ListCard, MapPin };
