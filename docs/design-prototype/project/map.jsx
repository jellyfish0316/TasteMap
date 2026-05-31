// map.jsx — warm, desaturated "guide" map (stylized, pannable)
// Renders an SVG canvas larger than the viewport; pins are positioned by
// normalized x,y (0..1). Drag to pan. Children render above the map art.

const MAP_W = 760, MAP_H = 960;

function MapArt() {
  // generate a soft minor-street grid
  const minor = [];
  for (let i = 1; i < 14; i++) {
    const y = i * (MAP_H / 14) + (i % 2 ? 6 : -4);
    minor.push(<path key={'h'+i} d={`M -20 ${y} Q ${MAP_W/2} ${y + (i%3?8:-10)} ${MAP_W+20} ${y}`} />);
  }
  for (let i = 1; i < 11; i++) {
    const x = i * (MAP_W / 11) + (i % 2 ? -5 : 6);
    minor.push(<path key={'v'+i} d={`M ${x} -20 Q ${x + (i%3?10:-8)} ${MAP_H/2} ${x} ${MAP_H+20}`} />);
  }

  return (
    <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block' }}>
      {/* land base */}
      <rect width={MAP_W} height={MAP_H} fill="#f1ece2" />

      {/* river — soft band crossing diagonally */}
      <path d={`M -40 ${MAP_H*0.18} C ${MAP_W*0.3} ${MAP_H*0.30}, ${MAP_W*0.35} ${MAP_H*0.55}, ${MAP_W*0.62} ${MAP_H*0.7} S ${MAP_W*0.95} ${MAP_H*0.92}, ${MAP_W+40} ${MAP_H*0.98}`}
        stroke="#cfe0dc" strokeWidth="58" fill="none" strokeLinecap="round" opacity="0.9" />

      {/* parks */}
      <g fill="#dde6cf">
        <rect x={MAP_W*0.56} y={MAP_H*0.40} width="120" height="96" rx="20" />
        <rect x={MAP_W*0.10} y={MAP_H*0.70} width="140" height="110" rx="24" />
        <circle cx={MAP_W*0.78} cy={MAP_H*0.20} r="58" />
      </g>
      <g fill="#cfdcbe" opacity="0.7">
        <circle cx={MAP_W*0.78} cy={MAP_H*0.20} r="34" />
      </g>

      {/* city blocks tint */}
      <g fill="#f6f2ea">
        <rect x={MAP_W*0.30} y={MAP_H*0.44} width="150" height="120" rx="10" />
        <rect x={MAP_W*0.34} y={MAP_H*0.60} width="120" height="90" rx="10" />
      </g>

      {/* minor streets */}
      <g stroke="#e6dfd2" strokeWidth="6" fill="none" strokeLinecap="round">{minor}</g>

      {/* major avenues — white with subtle casing */}
      <g fill="none" strokeLinecap="round">
        <g stroke="#e3dccd" strokeWidth="20">
          <path d={`M -20 ${MAP_H*0.30} Q ${MAP_W*0.5} ${MAP_H*0.36} ${MAP_W+20} ${MAP_H*0.28}`} />
          <path d={`M -20 ${MAP_H*0.62} Q ${MAP_W*0.5} ${MAP_H*0.58} ${MAP_W+20} ${MAP_H*0.66}`} />
          <path d={`M ${MAP_W*0.38} -20 Q ${MAP_W*0.44} ${MAP_H*0.5} ${MAP_W*0.40} ${MAP_H+20}`} />
          <path d={`M ${MAP_W*0.70} -20 Q ${MAP_W*0.64} ${MAP_H*0.5} ${MAP_W*0.72} ${MAP_H+20}`} />
          <path d={`M -20 -20 Q ${MAP_W*0.5} ${MAP_H*0.5} ${MAP_W+20} ${MAP_H+20}`} />
        </g>
        <g stroke="#ffffff" strokeWidth="13">
          <path d={`M -20 ${MAP_H*0.30} Q ${MAP_W*0.5} ${MAP_H*0.36} ${MAP_W+20} ${MAP_H*0.28}`} />
          <path d={`M -20 ${MAP_H*0.62} Q ${MAP_W*0.5} ${MAP_H*0.58} ${MAP_W+20} ${MAP_H*0.66}`} />
          <path d={`M ${MAP_W*0.38} -20 Q ${MAP_W*0.44} ${MAP_H*0.5} ${MAP_W*0.40} ${MAP_H+20}`} />
          <path d={`M ${MAP_W*0.70} -20 Q ${MAP_W*0.64} ${MAP_H*0.5} ${MAP_W*0.72} ${MAP_H+20}`} />
          <path d={`M -20 -20 Q ${MAP_W*0.5} ${MAP_H*0.5} ${MAP_W+20} ${MAP_H+20}`} />
        </g>
      </g>

      {/* district labels */}
      <g fill="#b3a896" style={{ fontFamily: 'var(--font)', fontWeight: 600, letterSpacing: 1 }}>
        <text x={MAP_W*0.66} y={MAP_H*0.24} fontSize="14">松山</text>
        <text x={MAP_W*0.60} y={MAP_H*0.45} fontSize="15">信義</text>
        <text x={MAP_W*0.44} y={MAP_H*0.70} fontSize="15">大安</text>
        <text x={MAP_W*0.30} y={MAP_H*0.56} fontSize="13">中正</text>
      </g>
      <g fill="#a9c0bb" style={{ fontFamily: 'var(--font)', fontWeight: 600 }}>
        <text x={MAP_W*0.2} y={MAP_H*0.26} fontSize="12" transform={`rotate(-12 ${MAP_W*0.2} ${MAP_H*0.26})`}>淡水河</text>
      </g>
    </svg>
  );
}

function MapView({ pins, center, onBackgroundTap, panRef }) {
  const VW = 402, VH = 874;
  // default pan so the cluster sits a bit above center
  const [pan, setPan] = React.useState(() => ({
    x: -(MAP_W * 0.52 - VW / 2),
    y: -(MAP_H * 0.52 - VH * 0.42),
  }));
  const drag = React.useRef(null);

  const clamp = (p) => ({
    x: Math.min(40, Math.max(VW - MAP_W - 40, p.x)),
    y: Math.min(40, Math.max(VH - MAP_H - 40, p.y)),
  });

  // expose a recenter fn
  React.useEffect(() => {
    if (panRef) panRef.current = (nx, ny) => {
      setPan(clamp({ x: -(MAP_W * nx - VW / 2), y: -(MAP_H * ny - VH * 0.40) }));
    };
  }, [panRef]);

  const start = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    drag.current = { sx: pt.clientX, sy: pt.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const move = (e) => {
    if (!drag.current) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - drag.current.sx, dy = pt.clientY - drag.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    setPan(clamp({ x: drag.current.px + dx, y: drag.current.py + dy }));
  };
  const end = () => {
    const moved = drag.current && drag.current.moved;
    drag.current = null;
    if (!moved && onBackgroundTap) onBackgroundTap();
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#e8eded', touchAction: 'none', cursor: 'grab' }}
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}
    >
      <div style={{ position: 'absolute', width: MAP_W, height: MAP_H, transform: `translate(${pan.x}px, ${pan.y}px)`, transition: drag.current ? 'none' : 'transform .5s cubic-bezier(.22,.61,.36,1)' }}>
        <MapArt />
        {pins}
      </div>
      {/* subtle vignette / atmosphere */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(80,70,55,0.10)' }} />
    </div>
  );
}

Object.assign(window, { MapView, MAP_W, MAP_H });
