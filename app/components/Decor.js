const range = (n) => Array.from({ length: n }, (_, i) => i);

export function Mandala({ className = "" }) {
  return (
    <svg className={`mandala ${className}`} viewBox="-100 -100 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.6">
        {[92, 80, 62, 44, 24].map((r) => <circle key={r} r={r} />)}
        {range(24).map((i) => (
          <path key={`o${i}`} transform={`rotate(${i * 15})`} d="M0-92 C8-84 8-70 0-62 C-8-70 -8-84 0-92Z" />
        ))}
        {range(16).map((i) => (
          <path key={`m${i}`} transform={`rotate(${i * 22.5})`} d="M0-62 C12-54 12-50 0-44 C-12-50 -12-54 0-62Z" />
        ))}
        {range(12).map((i) => (
          <path key={`i${i}`} transform={`rotate(${i * 30})`} d="M0-44 Q10-34 0-24 Q-10-34 0-44Z" />
        ))}
        {range(48).map((i) => (
          <circle key={`d${i}`} transform={`rotate(${i * 7.5})`} cx="0" cy="-86" r="1.2" fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}

// ponytail: toran is a repeating CSS background tile (see .toran in styles.css)
export function Toran() {
  return <div className="toran" aria-hidden="true" />;
}

export function Diya({ className = "" }) {
  return (
    <svg className={`diya ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      <path className="flame" d="M32 6 C40 18 38 28 32 32 C26 28 24 18 32 6Z" fill="#FFB627" />
      <path d="M32 14 C36 21 35 27 32 29 C29 27 28 21 32 14Z" fill="#FFF1C1" />
      <path d="M6 36 H58 C56 50 44 58 32 58 C20 58 8 50 6 36Z" fill="#C8102E" />
      <path d="M10 40 H54" stroke="#FFB627" strokeWidth="2" />
    </svg>
  );
}

export function LotusDivider() {
  return (
    <div className="lotus-divider" aria-hidden="true">
      <span />
      <svg viewBox="0 0 60 30" width="60" height="30">
        <path d="M30 2 C37 10 37 20 30 28 C23 20 23 10 30 2Z" fill="#C8102E" />
        <path d="M30 28 C20 26 12 18 10 8 C20 10 27 18 30 28Z" fill="#FF8C1A" />
        <path d="M30 28 C40 26 48 18 50 8 C40 10 33 18 30 28Z" fill="#FF8C1A" />
        <path d="M30 28 C18 30 6 24 2 16 C12 16 24 22 30 28Z" fill="#FFB627" />
        <path d="M30 28 C42 30 54 24 58 16 C48 16 36 22 30 28Z" fill="#FFB627" />
      </svg>
      <span />
    </div>
  );
}

// ponytail: fixed 18 petals with CSS vars, no JS animation loop
export function Petals() {
  return (
    <div className="petals" aria-hidden="true">
      {range(18).map((i) => (
        <i
          key={i}
          style={{
            "--x": `${(i * 53) % 100}%`,
            "--d": `${9 + (i % 5) * 2.5}s`,
            "--delay": `${-(i * 1.7)}s`,
            "--s": `${0.6 + (i % 4) * 0.25}`,
          }}
        />
      ))}
    </div>
  );
}
