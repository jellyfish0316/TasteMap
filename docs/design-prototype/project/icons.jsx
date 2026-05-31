// icons.jsx — clean line-icon set (Lucide-style), stroke-based
// <Icon name="map-pin" size={20} className="" /> ; color via currentColor

function Icon({ name, size = 20, stroke = 2, fill = false, style = {}, className = '' }) {
  const p = ICON_PATHS[name];
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style, className,
  };
  if (!p) return <svg {...common} />;
  return <svg {...common}>{p}</svg>;
}

const ICON_PATHS = {
  'map-pin': <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  'pin-fill': <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="currentColor" stroke="none"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  x: <><path d="M18 6 6 18M6 6l12 12"/></>,
  check: <><path d="M20 6 9 17l-5-5"/></>,
  'check-circle': <><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
  star: <><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z"/></>,
  'star-fill': <><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor"/></>,
  utensils: <><path d="M7 3v8m0 0a2 2 0 0 0 2-2V3M7 11v10M5 3v6m12-6v18m0-9c2 0 3-1 3-4 0-3-1-5-3-5"/></>,
  note: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V15l-5 5H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 15h-3.5A1.5 1.5 0 0 0 15 16.5V20"/></>,
  bookmark: <><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"/></>,
  'bookmark-fill': <><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" fill="currentColor"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 5.2A3 3 0 0 1 16 11M21 20c0-2.4-1.5-4.2-4-4.8"/></>,
  'user-plus': <><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6 1 0 2 .15 2.8.45"/><path d="M17 11v6m3-3h-6"/></>,
  'arrow-left': <><path d="M19 12H5m6-7-7 7 7 7"/></>,
  'chevron-right': <><path d="m9 6 6 6-6 6"/></>,
  'chevron-down': <><path d="m6 9 6 6 6-6"/></>,
  link: <><path d="M9 15l6-6"/><path d="M11 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L16 11.5"/><path d="M13 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L8 12.5"/></>,
  external: <><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17"/><path d="M12 3c2.5 2.5 2.5 16 0 18M12 3c-2.5 2.5-2.5 16 0 18"/></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"/></>,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 14 9 5 9-5"/></>,
  'corner-up-right': <><path d="M5 18V9a3 3 0 0 1 3-3h11"/><path d="m15 2 5 4-5 4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></>,
  send: <><path d="M21 4 3 11l7 2 2 7z"/><path d="m10 13 4-4"/></>,
  sparkle: <><path d="M12 3c.6 4.5 1.5 5.4 6 6-4.5.6-5.4 1.5-6 6-.6-4.5-1.5-5.4-6-6 4.5-.6 5.4-1.5 6-6Z" fill="currentColor"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  heart: <><path d="M12 20s-7-4.5-9.2-8.5C1.2 8.2 3 5 6 5c2 0 3 1.2 3.8 2.3.4.5 1 .5 1.4 0C12 6.2 13 5 15 5c3 0 4.8 3.2 3.2 6.5C18 15.5 12 20 12 20Z"/></>,
  inbox: <><path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M5.5 5h13l1.5 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z"/></>,
  refresh: <><path d="M20 8a8 8 0 0 0-14.5-2M4 5v4h4"/><path d="M4 16a8 8 0 0 0 14.5 2M20 19v-4h-4"/></>,
  alert: <><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".4" fill="currentColor"/><path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/></>,
  navigation: <><path d="M3 11 21 4l-7 18-2.5-7.5z" fill="currentColor"/></>,
};

window.Icon = Icon;
