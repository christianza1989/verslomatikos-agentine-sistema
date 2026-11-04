import Link from 'next/link';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label="Verslomatika pradžia"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
          <path d="M1.8 7.5h9.4l6.2 18.6-2.5 5H9.7z" fill="#6545ca" />
          <path d="M13 5h9.6l5.4 15.7h-9.5z" fill="#4d31b0" />
          <path d="M22.5 1.8h7.4l2.9 8.2h-7.3z" fill="#8c72ea" />
        </svg>
      </span>
      <span
        style={{
          fontFamily: 'Sora, Inter, system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: light ? '#ffffff' : '#141627'
        }}
      >
        Verslomatika
      </span>
    </Link>
  );
}
