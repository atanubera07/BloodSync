export function HeroIllustration() {
  return (
    <svg
      className="hero-illustration"
      viewBox="0 0 600 500"
      role="img"
      aria-labelledby="hero-art-title"
    >
      <title id="hero-art-title">An illustrated blood bag connecting a donor and a patient</title>
      <defs>
        <linearGradient id="hero-warm" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#FFE3E5" />
          <stop offset="1" stopColor="#F8B8BE" />
        </linearGradient>
        <linearGradient id="hero-cool" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#E1E6FF" />
          <stop offset="1" stopColor="#B9C5F5" />
        </linearGradient>
        <filter id="hero-shadow">
          <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#1B1E4A" floodOpacity=".12" />
        </filter>
      </defs>
      <rect
        x="90"
        y="65"
        width="355"
        height="355"
        rx="56"
        transform="rotate(45 267 242)"
        fill="url(#hero-cool)"
      />
      <rect
        x="310"
        y="82"
        width="210"
        height="210"
        rx="32"
        transform="rotate(45 415 187)"
        fill="#EEEEDF"
      />
      <rect
        x="309"
        y="268"
        width="176"
        height="176"
        rx="30"
        transform="rotate(45 397 356)"
        fill="url(#hero-warm)"
      />
      <circle cx="306" cy="242" r="181" fill="#FFFFFF" fillOpacity=".62" />
      <path
        d="M284 94h44M306 94v35"
        fill="none"
        stroke="#1B1E4A"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <g filter="url(#hero-shadow)">
        <rect
          x="238"
          y="125"
          width="136"
          height="170"
          rx="24"
          fill="#FFFFFF"
          stroke="#1B1E4A"
          strokeWidth="4"
        />
        <path
          d="M246 203c34-20 75 20 120-5v68c0 12-10 22-22 22h-76c-12 0-22-10-22-22z"
          fill="#D21319"
        />
        <rect
          x="280"
          y="113"
          width="52"
          height="17"
          rx="6"
          fill="#FFFFFF"
          stroke="#1B1E4A"
          strokeWidth="4"
        />
        <path d="M303 155v34m-17-17h34" stroke="#D21319" strokeWidth="8" strokeLinecap="round" />
      </g>
      <path
        d="M306 294v43c0 23-19 42-42 42h-32"
        fill="none"
        stroke="#D21319"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M233 379c-19 0-24 21-45 21"
        fill="none"
        stroke="#D21319"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g filter="url(#hero-shadow)">
        <rect x="62" y="248" width="158" height="167" rx="30" fill="#FFFFFF" />
        <circle cx="141" cy="298" r="32" fill="#F5C4AB" />
        <path d="M110 297c1-45 57-48 66-6-17-17-37-23-66 6z" fill="#1B1E4A" />
        <path d="M93 385c0-32 21-53 48-53s48 21 48 53" fill="#D21319" />
        <path d="M120 341l21 18 21-18" fill="none" stroke="#FFFFFF" strokeWidth="5" />
      </g>
      <g filter="url(#hero-shadow)">
        <rect x="390" y="232" width="155" height="183" rx="30" fill="#FFFFFF" />
        <circle cx="468" cy="284" r="31" fill="#DCA786" />
        <path d="M435 280c4-42 59-46 66-1-13-14-32-22-66 1z" fill="#30304B" />
        <path d="M422 381c0-34 20-54 46-54 27 0 47 20 47 54" fill="#1B1E4A" />
        <path d="M453 340l15 18 16-18" fill="none" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M467 345v27" stroke="#D21319" strokeWidth="4" strokeLinecap="round" />
        <circle cx="467" cy="379" r="8" fill="none" stroke="#D21319" strokeWidth="4" />
      </g>
      <path d="M378 347h35" stroke="#D21319" strokeWidth="6" strokeLinecap="round" />
      <circle cx="48" cy="164" r="18" fill="#D21319" opacity=".12" />
      <path
        d="M49 153v22m-11-11h22M530 89v24m-12-12h24"
        stroke="#D21319"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="527" cy="163" r="7" fill="#D21319" />
      <circle cx="75" cy="465" r="8" fill="#AFAEA2" />
    </svg>
  );
}
