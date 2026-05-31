// app.jsx — root: navigation, bottom nav, global overlays, flows
const { LoginScreen, MapScreen } = window.TM_SCREENS;
const { TopBar, ImportReview, CollectionScreen, ExploreScreen, ProfileScreen } = window.TM_SCREENS2;
const { CollectionsSheet, SearchOverlay, AddPlaceModal, ImportModal } = window.TM_FLOWS;
const { PlaceDetailSheet, ImportIndicator, Toast } = window.TMO;
const AD = window.TM_DATA;

const NAV = [
  { id: 'map', label: '地圖', icon: 'map-pin' },
  { id: 'explore', label: '探索', icon: 'compass' },
  { id: 'profile', label: '我的', icon: 'user' },
];

function BottomNav({ tab, onTab }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      paddingBottom: 26, paddingTop: 8, background: 'rgba(255,255,255,.86)',
      backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderTop: '1px solid var(--line)', display: 'flex',
    }}>
      {NAV.map(n => {
        const on = tab === n.id;
        return (
          <button key={n.id} onClick={() => onTab(n.id)} className="col" style={{ flex: 1, alignItems: 'center', gap: 3, color: on ? 'var(--accent-deep)' : 'var(--ink-4)' }}>
            <Icon name={n.icon} size={24} stroke={on ? 2.4 : 2} fill={false} />
            <span style={{ fontSize: 11, fontWeight: on ? 800 : 600 }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [auth, setAuth] = React.useState(false);
  const [tab, setTab] = React.useState('map');
  const [stack, setStack] = React.useState([]); // pushed views
  const [following, setFollowingState] = React.useState(AD.getFollowing());
  const [version, setVersion] = React.useState(0); // force pin/card recompute

  // overlays
  const [detailPlace, setDetailPlace] = React.useState(null);
  const [collectionsOpen, setCollectionsOpen] = React.useState(false);
  const [search, setSearch] = React.useState(null); // null | {mode:'add'} | {mode:'fix', id}
  const [addPlace, setAddPlace] = React.useState(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importState, setImportState] = React.useState('idle');
  const [manualFix, setManualFix] = React.useState(null);
  const [toastMsg, setToastMsg] = React.useState(null);
  const panRef = React.useRef(null);

  const toast = (m) => { setToastMsg(m); clearTimeout(window.__tmt); window.__tmt = setTimeout(() => setToastMsg(null), 1900); };
  const top = stack[stack.length - 1];
  const push = (v) => setStack(s => [...s, v]);
  const pop = () => setStack(s => s.slice(0, -1));

  const toggleFollow = (id) => setFollowingState(f => {
    const nf = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
    AD.setFollowing(nf); return nf;
  });

  // open a place detail + recenter map
  const openPlace = (placeId) => {
    setDetailPlace(placeId);
    const pl = AD.PLACES[placeId];
    if (pl && pl.x != null && panRef.current) panRef.current(pl.x, pl.y);
  };

  // ── import lifecycle ─────────────────────────────────
  const runImport = () => {
    setImportOpen(false);
    setImportState('running');
    clearTimeout(window.__tmi);
    window.__tmi = setTimeout(() => setImportState('done'), 2600);
  };
  const saveImport = ({ cands, dest, listName, pub, existing }) => {
    const src = AD.IMPORT_SOURCE;
    const cards = AD.getCards();
    const newCardIds = [];
    cands.forEach((c, i) => {
      // register place
      if (c.placeId && !AD.PLACES[c.placeId]) {
        AD.PLACES[c.placeId] = { id: c.placeId, name: c.name, en: c.en, area: c.area, cat: 'utensils', rating: c.rating, reviews: Math.round(800 + Math.random()*9000), addr: `台北市${c.area}`, x: c.x, y: c.y };
      }
      const id = 'imp_' + Date.now() + '_' + i;
      newCardIds.push(id);
      cards.push({ id, placeId: c.placeId, savedBy: 'me', user: { note: '', status: 'want' },
        creator: { author: src.author, platform: src.platform, summary: c.summary, dishes: c.dishes, quote: null, src: src.url }, lists: [] });
    });
    AD.setCards(cards);
    // list
    let listId;
    if (dest === 'new') {
      listId = 'l_new_' + Date.now();
      AD.LISTS[listId] = { id: listId, name: listName || '新清單', owner: 'me', public: pub, emoji: '📍', cards: newCardIds };
    } else {
      listId = existing || Object.values(AD.LISTS).find(l => l.owner === 'me').id;
      AD.LISTS[listId].cards = [...AD.LISTS[listId].cards, ...newCardIds];
    }
    newCardIds.forEach((cid, i) => { const cc = cards.find(c => c.id === cid); if (cc) cc.lists = [listId]; });
    setStack([]); setTab('map'); setImportState('idle'); setVersion(v => v + 1);
    setTimeout(() => toast(`已儲存 ${cands.length} 個地點到地圖`), 380);
  };

  // ── manual capture save ──────────────────────────────
  const savePlace = ({ place, lists, note, status }) => {
    const cards = AD.getCards();
    const id = 'man_' + Date.now();
    cards.push({ id, placeId: place.id, savedBy: 'me', creator: null, user: { note, status }, lists });
    AD.setCards(cards);
    lists.forEach(lid => { if (AD.LISTS[lid] && !AD.LISTS[lid].cards.includes(id)) AD.LISTS[lid].cards.push(id); });
    setAddPlace(null); setVersion(v => v + 1);
    setTimeout(() => { toast('已加入清單'); openPlace(place.id); }, 200);
  };

  if (!auth) return <LoginScreen onAuth={() => setAuth(true)} />;

  // ── current screen ───────────────────────────────────
  let screen;
  if (top?.name === 'collection') screen = <CollectionScreen listId={top.listId} onBack={pop} onOpenPlace={openPlace} toast={toast} />;
  else if (top?.name === 'profile') screen = <ProfileScreen personId={top.personId} onBack={pop} onOpenList={(id) => push({ name: 'collection', listId: id })} following={following} onToggleFollow={toggleFollow} />;
  else if (top?.name === 'import-review') screen = <ImportReview onBack={pop} fixed={manualFix} onManualSearch={(id) => setSearch({ mode: 'fix', id })} onSave={saveImport} />;
  else if (tab === 'map') screen = <MapScreen key={version} version={version} panRef={panRef} onOpenPlace={openPlace} onOpenImport={() => setImportOpen(true)} onOpenSearch={() => setSearch({ mode: 'add' })} onOpenCollections={() => setCollectionsOpen(true)} />;
  else if (tab === 'explore') screen = <ExploreScreen following={following} onToggleFollow={toggleFollow} onOpenList={(id) => push({ name: 'collection', listId: id })} onOpenProfile={(id) => push({ name: 'profile', personId: id })} />;
  else if (tab === 'profile') screen = <ProfileScreen personId="me" following={following} onToggleFollow={toggleFollow} onOpenList={(id) => push({ name: 'collection', listId: id })} onLogout={() => { setAuth(false); setTab('map'); setStack([]); }} />;

  const showNav = !top; // hide on pushed views

  return (
    <div className="tm-app">
      <div className="grow" style={{ position: 'relative', overflow: 'hidden' }}>
        {screen}
      </div>

      {showNav && <BottomNav tab={tab} onTab={(t) => { setStack([]); setTab(t); }} />}

      {/* global overlays */}
      <ImportIndicator state={importState} source={AD.IMPORT_SOURCE} count={AD.IMPORT_CANDIDATES.length}
        onReview={() => { setImportState('idle'); setManualFix(null); push({ name: 'import-review' }); }}
        onDismiss={() => setImportState('idle')} />

      <PlaceDetailSheet placeId={detailPlace} open={!!detailPlace} onClose={() => setDetailPlace(null)}
        onAddToList={() => { const pl = AD.PLACES[detailPlace]; setDetailPlace(null); setTimeout(() => setAddPlace(pl), 260); }} />

      <CollectionsSheet open={collectionsOpen} onClose={() => setCollectionsOpen(false)}
        onOpenImport={() => { setCollectionsOpen(false); setTimeout(() => setImportOpen(true), 260); }}
        onOpenList={(id) => { setCollectionsOpen(false); push({ name: 'collection', listId: id }); }} />

      <SearchOverlay open={!!search} onClose={() => setSearch(null)}
        onPick={(place) => {
          if (search?.mode === 'fix') { setManualFix({ id: search.id, place }); setSearch(null); toast('已配對地點'); }
          else { setSearch(null); setTimeout(() => setAddPlace(place), 200); }
        }} />

      <AddPlaceModal open={!!addPlace} place={addPlace} onClose={() => setAddPlace(null)} onSave={savePlace} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={runImport} />

      <Toast msg={toastMsg} />
    </div>
  );
}

// ── device stage: center + scale the phone to fit viewport ──
function DeviceStage() {
  const W = 402, H = 874;
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 24) / W, (window.innerHeight - 24) / H, 1.15));
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(120% 120% at 50% 0%, #34302b, #211d18)' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <IOSDevice width={W} height={H}>
          <App />
        </IOSDevice>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DeviceStage />);
