// screens2.jsx — Import review, Collection, Explore, Profiles
const G = {
  B: window.TMC.Btn, SB: window.TMC.SearchBar, Av: window.TMC.Avatar, Rt: window.TMC.Rating,
  SL: window.TMC.SectionLabel, FB: window.TMC.FollowButton, PG: window.TMC.PlatformGlyph,
  PlaceCard: window.TMC2.PlaceCard, CandidateCard: window.TMC2.CandidateCard,
  PersonRow: window.TMC2.PersonRow, ListCard: window.TMC2.ListCard,
  EmptyState: window.TMO.EmptyState, Modal: window.TMO.Modal, CardSkeleton: window.TMO.CardSkeleton,
};
const GD = window.TM_DATA;

// ── shared top bar ─────────────────────────────────────
function TopBar({ title, sub, onBack, trailing, large }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', borderBottom: '1px solid var(--line)', paddingTop: 48 }}>
      <div className="row gap-2" style={{ padding: '8px 12px 12px' }}>
        {onBack && <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 'var(--r-pill)', background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="arrow-left" size={20} /></button>}
        <div className="grow col" style={{ gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: large ? 21 : 17.5, fontWeight: 800, letterSpacing: -0.4 }} className="ellipsis">{title}</span>
          {sub && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }} className="ellipsis">{sub}</span>}
        </div>
        {trailing}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// IMPORT REVIEW
// ════════════════════════════════════════════════════════
function ImportReview({ onBack, onSave, onManualSearch, fixed }) {
  const src = GD.IMPORT_SOURCE;
  const [cands, setCands] = React.useState(() => GD.IMPORT_CANDIDATES.map(c => ({ ...c })));
  const [checked, setChecked] = React.useState(() => new Set(GD.IMPORT_CANDIDATES.filter(c => c.match === 'matched').map(c => c.id)));
  const [dest, setDest] = React.useState('new');
  const [listName, setListName] = React.useState('台北東區宵夜');
  const [pub, setPub] = React.useState(true);
  const [existing, setExisting] = React.useState(null);
  const myLists = Object.values(GD.LISTS).filter(l => l.owner === 'me');

  // apply manual fixes coming from parent
  React.useEffect(() => {
    if (!fixed) return;
    setCands(cs => cs.map(c => c.id === fixed.id ? { ...c, match: 'matched', name: fixed.place.name, en: fixed.place.en, area: fixed.place.area, rating: fixed.place.rating, placeId: fixed.place.id, x: fixed.place.x, y: fixed.place.y } : c));
    setChecked(s => new Set([...s, fixed.id]));
  }, [fixed]);

  const toggle = (id) => setChecked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const count = checked.size;
  const matchedCount = cands.filter(c => c.match === 'matched').length;
  const needCount = cands.filter(c => c.match !== 'matched').length;

  return (
    <div className="tm-app">
      <TopBar title="檢視匯入結果" sub={`@${src.author} · ${cands.length} 個候選`} onBack={onBack} />
      <div className="tm-scroll grow" style={{ padding: '14px 14px 120px' }}>
        {/* source banner */}
        <div className="row gap-3" style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 12, border: '1px solid var(--line)', marginBottom: 16 }}>
          <G.PG platform={src.platform} size={40} />
          <div className="grow col" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14.5 }} className="ellipsis">{src.title}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }} className="ellipsis">{src.url}</span>
          </div>
        </div>

        {/* destination chooser */}
        <G.SL>儲存到</G.SL>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', padding: 14, marginBottom: 18 }}>
          <div className="row gap-2" style={{ marginBottom: dest === 'new' ? 14 : 12 }}>
            {[['new','新清單'],['existing','現有清單']].map(([d,t]) => (
              <button key={d} onClick={() => setDest(d)} style={{ flex: 1, height: 40, borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, background: dest === d ? 'var(--accent-tint)' : 'var(--surface-2)', color: dest === d ? 'var(--accent-ink)' : 'var(--ink-3)', boxShadow: dest === d ? 'inset 0 0 0 2px var(--accent)' : 'inset 0 0 0 1px var(--line)' }}>{t}</button>
            ))}
          </div>
          {dest === 'new' ? (
            <div className="col gap-3">
              <input value={listName} onChange={e => setListName(e.target.value)} placeholder="清單名稱" style={{ height: 46, padding: '0 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--line-2)', fontSize: 15, fontWeight: 600, outline: 'none', background: 'var(--surface)' }} />
              <button onClick={() => setPub(p => !p)} className="row gap-2" style={{ padding: '4px 2px' }}>
                <div style={{ width: 44, height: 26, borderRadius: 99, background: pub ? 'var(--accent)' : 'var(--line-2)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: pub ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
                <span className="row gap-1" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}><Icon name={pub ? 'globe' : 'lock'} size={15} />{pub ? '公開 · 追蹤者看得到' : '私人 · 只有你看得到'}</span>
              </button>
            </div>
          ) : (
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {myLists.map(l => (
                <button key={l.id} onClick={() => setExisting(l.id)} className="row gap-1" style={{ height: 38, padding: '0 13px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700, background: existing === l.id ? 'var(--accent)' : 'var(--surface-2)', color: existing === l.id ? '#fff' : 'var(--ink-2)', boxShadow: existing === l.id ? 'none' : 'inset 0 0 0 1px var(--line-2)' }}>{l.emoji} {l.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* candidates */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 10px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--ink-3)' }}>候選餐廳</span>
          <span className="row gap-2" style={{ fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: 'var(--ok)' }}>{matchedCount} 已配對</span>
            {needCount > 0 && <span style={{ color: 'var(--warn)' }}>{needCount} 待處理</span>}
          </span>
        </div>
        <div className="col gap-3">
          {cands.map(c => (
            <G.CandidateCard key={c.id} cand={c} checked={checked.has(c.id)} onToggle={() => toggle(c.id)} onSearch={() => onManualSearch(c.id)} />
          ))}
        </div>
      </div>

      {/* sticky save */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 30px', background: 'linear-gradient(180deg, transparent, var(--bg) 24%)' }}>
        <G.B kind="primary" full size="lg" icon="bookmark" disabled={!count} style={{ opacity: count ? 1 : 0.5, boxShadow: 'var(--sh-3)' }}
          onClick={() => onSave({ cands: cands.filter(c => checked.has(c.id)), dest, listName, pub, existing })}>
          儲存 {count} 個到{dest === 'new' ? `「${listName || '新清單'}」` : '清單'}
        </G.B>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// COLLECTION (single list)
// ════════════════════════════════════════════════════════
function CollectionScreen({ listId, onBack, onOpenPlace, toast }) {
  const list = GD.LISTS[listId];
  const owner = list.owner === 'me';
  const ownerP = GD.PEOPLE[list.owner];
  const [cardIds, setCardIds] = React.useState(list.cards);
  const cards = window.TM_DATA.getCards();
  const items = cardIds.map(id => cards.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="tm-app">
      <TopBar title={`${list.emoji} ${list.name}`} large
        sub={<span className="row gap-1">{owner ? '' : <>by @{ownerP.handle} · </>}<Icon name={list.public ? 'globe' : 'lock'} size={12} />{list.public ? '公開' : '私人'} · {items.length} 個地點</span>}
        onBack={onBack}
        trailing={owner ? (
          <button style={{ width: 40, height: 40, borderRadius: 'var(--r-pill)', background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--danger)', flexShrink: 0 }}><Icon name="trash" size={18} /></button>
        ) : (
          <div style={{ flexShrink: 0 }}><G.FB following onToggle={()=>{}} /></div>
        )} />
      <div className="tm-scroll grow" style={{ padding: '14px 14px 30px' }}>
        {items.length ? (
          <div className="col gap-3">
            {items.map(c => (
              <G.PlaceCard key={c.id} card={c} owner={owner} onOpen={() => onOpenPlace(c.placeId)}
                onRemove={() => { setCardIds(ids => ids.filter(x => x !== c.id)); toast('已從清單移除'); }} />
            ))}
          </div>
        ) : (
          <G.EmptyState icon="bookmark" title="這個清單還是空的" body="從地圖搜尋地點，或匯入一則貼文，把第一個餐廳加進來。" />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// EXPLORE (discover + feed)
// ════════════════════════════════════════════════════════
function ExploreScreen({ onOpenList, onOpenProfile, following, onToggleFollow }) {
  const [q, setQ] = React.useState('');
  const results = q.trim() ? GD.ALL_PEOPLE_SEARCH.map(id => GD.PEOPLE[id]).filter(p => (p.name + p.handle + (p.bio||'')).toLowerCase().includes(q.toLowerCase())) : [];
  const feed = GD.FEED.map(id => GD.LISTS[id]).filter(l => following.includes(l.owner));

  return (
    <div className="tm-app">
      <div style={{ paddingTop: 52, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, background: 'var(--bg)' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 27, fontWeight: 800, letterSpacing: -0.6 }}>探索</h1>
        <G.SB value={q} onChange={setQ} onClear={() => setQ('')} placeholder="搜尋使用者 · @handle" icon="users" />
      </div>
      <div className="tm-scroll grow" style={{ padding: '8px 16px 30px' }}>
        {q.trim() ? (
          <div className="col gap-2">
            {results.length ? results.map(p => (
              <G.PersonRow key={p.id} person={p} following={following.includes(p.id)} onToggle={() => onToggleFollow(p.id)} onOpen={() => onOpenProfile(p.id)} />
            )) : <G.EmptyState icon="users" title="找不到使用者" body={`沒有符合「${q}」的人。`} />}
          </div>
        ) : (
          <>
            <G.SL>追蹤的人的公開清單</G.SL>
            {feed.length ? (
              <div className="col gap-4">
                {feed.map(l => <G.ListCard key={l.id} list={l} onOpen={() => onOpenList(l.id)} />)}
              </div>
            ) : (
              <G.EmptyState icon="compass" title="動態還是空的" body="搜尋並追蹤喜歡的美食帳號，他們公開的清單會出現在這裡。" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PROFILE (mine or someone else's)
// ════════════════════════════════════════════════════════
function ProfileScreen({ personId, onBack, onOpenList, following, onToggleFollow, onLogout }) {
  const me = personId === 'me';
  const p = GD.PEOPLE[personId];
  const lists = Object.values(GD.LISTS).filter(l => l.owner === personId && (me || l.public));
  const placeCount = new Set(lists.flatMap(l => l.cards)).size;

  return (
    <div className="tm-app">
      {!me && <TopBar title={p.name} onBack={onBack} />}
      <div className="tm-scroll grow" style={{ padding: me ? '56px 16px 30px' : '14px 16px 30px' }}>
        {/* identity */}
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 4, marginBottom: 18 }}>
          <G.Av person={p} size={84} />
          <span style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{p.name}</span>
          <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 600 }}>@{p.handle}</span>
          {me ? <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>{p.email}</span> : p.bio && <span style={{ fontSize: 13.5, color: 'var(--ink-2)', maxWidth: 280, marginTop: 2 }}>{p.bio}</span>}
        </div>

        {/* stats / action */}
        <div className="row" style={{ justifyContent: 'center', gap: 0, marginBottom: 18, background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', padding: '12px 0' }}>
          {[[lists.length,'清單'],[placeCount,'地點'],[me ? GD.getFollowing().length : '—','追蹤中']].map(([n,t],i)=>(
            <React.Fragment key={t}>
              {i>0 && <div style={{ width: 1, height: 30, background: 'var(--line)' }} />}
              <div className="col grow" style={{ alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: 19, fontWeight: 800 }}>{n}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{t}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {!me && <div style={{ marginBottom: 22, display: 'grid' }}><G.FB following={following.includes(personId)} onToggle={() => onToggleFollow(personId)} size="lg" /></div>}

        <G.SL>{me ? '我的清單' : '公開清單'}</G.SL>
        {lists.length ? (
          <div className="col gap-4">
            {lists.map(l => <G.ListCard key={l.id} list={l} onOpen={() => onOpenList(l.id)} />)}
          </div>
        ) : (
          <G.EmptyState icon="bookmark" title={me ? '還沒有清單' : '尚無公開清單'} body={me ? '建立你的第一個清單，開始收藏喜歡的餐廳。' : '這個人還沒有公開的清單。'} />
        )}

        {me && <button onClick={onLogout} className="row gap-2" style={{ marginTop: 22, justifyContent: 'center', width: '100%', height: 46, borderRadius: 'var(--r-md)', color: 'var(--ink-3)', fontWeight: 700, fontSize: 14, background: 'var(--surface)', border: '1px solid var(--line)' }}>登出</button>}
      </div>
    </div>
  );
}

window.TM_SCREENS2 = { TopBar, ImportReview, CollectionScreen, ExploreScreen, ProfileScreen };
