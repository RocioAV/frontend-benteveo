function BenteveoBird({ className }) {
  return (
    <svg
      viewBox="0 0 140 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="70" cy="62" r="52" fill="var(--color-concrete-surface)" />
      <path d="M34 78 L16 90 L36 91 Z" fill="var(--color-dark)" />
      <ellipse cx="72" cy="80" rx="30" ry="22" fill="var(--color-primary)" />
      <path d="M48 74 Q44 85 58 89 Q68 82 62 74 Z" fill="var(--color-dark)" />
      <circle cx="74" cy="47" r="18" fill="var(--color-dark)" />
      <path d="M57 41 Q74 34 91 41" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" />
      <path d="M66 33 Q74 30 82 33" stroke="var(--color-surface)" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="82" cy="46" r="3" fill="var(--color-surface)" />
      <polygon points="89,47 106,51 89,54" fill="var(--color-primary)" />
      <ellipse cx="74" cy="62" rx="11" ry="8" fill="var(--color-surface)" />
    </svg>
  )
}

export default BenteveoBird
