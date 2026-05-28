import React from "react";

export default function ZoeLogo({ className = "w-12 h-12", customLogo }: { className?: string; customLogo?: string }) {
  if (customLogo) {
    return (
      <img 
        src={customLogo} 
        alt="Zoe's Bake My Dream" 
        className={`${className} object-contain rounded-full border border-[#4a1e1b]/25 shadow-sm bg-amber-50`} 
      />
    );
  }
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="https://scontent-mnl1-2.xx.fbcdn.net/v/t39.30808-1/306356524_395361929460467_455241905572990115_n.png?stp=dst-png_s200x200&_nc_cat=111&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeGrW-NjT-QtR7XWK_rumVDG3u2rtrIc093e7au2shzT3X8gwSFm_RbZbwUidkRUURAXqJhXzMNywJRtJbFHODiH&_nc_ohc=WsMzzlBCaZoQ7kNvwGNPVrZ&_nc_oc=AdqedpLP_SnuSM3NePG2-bT2OcxJOIUph9ipeVTAFI4LBLxZD8Epq2NaFSqX-wqRE7g&_nc_zt=24&_nc_ht=scontent-mnl1-2.xx&_nc_gid=No6X-DJoMhMdILYrOqusgQ&_nc_ss=7b2a8&oh=00_Af5M_lRfoiBzP_xptq_xM7gQKP0dlJQpCie9S8IO5_7K1Q&oe=6A1C8D0A"
      id="zoe-bakery-svg-logo"
    >
      {/* Circle Background - Warm Yellow with thin outline */}
      <circle cx="100" cy="100" r="85" fill="#fef08a" stroke="#4a1e1b" strokeWidth="5" />
      
      {/* Outer thin decorative border */}
      <circle cx="100" cy="100" r="92" stroke="#4a1e1b" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />

      {/* Chef Hat - Pink & puffy */}
      {/* Hat Poufs */}
      <circle cx="82" cy="46" r="16" fill="#fbcfe8" />
      <circle cx="100" cy="38" r="21" fill="#fbcfe8" />
      <circle cx="118" cy="46" r="16" fill="#fbcfe8" />
      {/* Hat band fold */}
      <rect x="74" y="55" width="52" height="14" rx="4" fill="#f9a8d4" stroke="#4a1e1b" strokeWidth="3.5" />

      {/* Curly Dark Hair (back layer) */}
      <circle cx="70" cy="88" r="18" fill="#2d1d1b" />
      <circle cx="130" cy="88" r="18" fill="#2d1d1b" />
      <circle cx="62" cy="105" r="18" fill="#2d1d1b" />
      <circle cx="138" cy="105" r="18" fill="#2d1d1b" />

      {/* Face */}
      <rect x="74" y="68" width="52" height="52" rx="18" fill="#ffe4e1" stroke="#4a1e1b" strokeWidth="3.5" />
      
      {/* Curly bangs style top */}
      <path d="M74 80 C84 76 84 82 94 78 C104 82 106 76 116 80 C120 82 122 83 126 80" stroke="#4a1e1b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="71" cy="74" r="8" fill="#2d1d1b" />
      <circle cx="129" cy="74" r="8" fill="#2d1d1b" />

      {/* Rosy blush cheeks */}
      <circle cx="84" cy="103" r="5" fill="#f472b6" opacity="0.8" />
      <circle cx="116" cy="103" r="5" fill="#f472b6" opacity="0.8" />

      {/* Sparkly cartoon eyes */}
      <circle cx="87" cy="94" r="4" fill="#2d1d1b" />
      <circle cx="113" cy="94" r="4" fill="#2d1d1b" />
      <circle cx="86" cy="92" r="1.5" fill="#ffffff" />
      <circle cx="112" cy="92" r="1.5" fill="#ffffff" />

      {/* Cute smile */}
      <path d="M96 102 C96 106 104 106 104 102" stroke="#4a1e1b" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Pink Top / Apron */}
      <path d="M80 119 L120 119 L126 148 L74 148 Z" fill="#fbcfe8" stroke="#4a1e1b" strokeWidth="3.5" />
      {/* Apron collar */}
      <path d="M92 119 C92 124 108 124 108 119" stroke="#4a1e1b" strokeWidth="3" fill="none" />

      {/* Little hands holding baking tools */}
      {/* Whisk Hand */}
      <circle cx="56" cy="116" r="6" fill="#ffe4e1" stroke="#4a1e1b" strokeWidth="2.5" />
      {/* Pink Wire Whisk */}
      <line x1="56" y1="120" x2="42" y2="103" stroke="#4a1e1b" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 103 C38 95 44 88 50 94 C56 100 44 106 42 103 Z" fill="#fbcfe8" stroke="#4a1e1b" strokeWidth="2" />
      
      {/* Pastry Bowl Hand */}
      <circle cx="144" cy="116" r="6" fill="#ffe4e1" stroke="#4a1e1b" strokeWidth="2.5" />
      {/* Dark pink mixing bowl */}
      <path d="M124 121 C124 136 156 136 156 121 Z" fill="#f9a8d4" stroke="#4a1e1b" strokeWidth="3" />
      {/* Colorful pastry cookie/sprinkles inside bowl */}
      <circle cx="132" cy="118" r="5.5" fill="#93c5fd" stroke="#4a1e1b" strokeWidth="2" />
      <circle cx="140" cy="116" r="5" fill="#fde047" stroke="#4a1e1b" strokeWidth="2" />
      <circle cx="148" cy="118" r="5.5" fill="#fca5a5" stroke="#4a1e1b" strokeWidth="2" />

      {/* Main Banner text ZOE'S */}
      <rect x="36" y="145" width="128" height="25" rx="7" fill="#db2777" stroke="#4a1e1b" strokeWidth="3.5" />
      <text
        x="100"
        y="162"
        fill="#ffffff"
        fontFamily="serif"
        fontWeight="900"
        fontSize="15"
        textAnchor="middle"
        letterSpacing="2.5"
      >
        ZOE'S
      </text>

      {/* Bake My Dream Subtext banner */}
      <rect x="42" y="170" width="116" height="14" rx="4" fill="#4a1e1b" />
      <text
        x="100"
        y="180"
        fill="#fef08a"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="7.5"
        textAnchor="middle"
        letterSpacing="1"
      >
        BAKE MY DREAM
      </text>
    </svg>
  );
}
