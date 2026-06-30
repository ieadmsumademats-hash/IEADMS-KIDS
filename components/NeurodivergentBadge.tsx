import React from 'react';

export const TEARibbon = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    aria-label="TEA"
    title="TEA - Transtorno do Espectro Autista"
  >
    <defs>
      <pattern id="tea-pattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3" height="3" fill="#E8384F" />
        <rect x="3" width="3" height="3" fill="#2D9CDB" />
        <rect y="3" width="3" height="3" fill="#F2C94C" />
        <rect x="3" y="3" width="3" height="3" fill="#27AE60" />
      </pattern>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
      </filter>
    </defs>
    <path 
      d="M7.5 21C7.5 21 16.5 13.5 16.5 8.5C16.5 4 14.5 2 12 2C9.5 2 7.5 4 7.5 8.5C7.5 13.5 16.5 21 16.5 21" 
      fill="none" 
      stroke="url(#tea-pattern)" 
      strokeWidth="4" 
      strokeLinecap="round"
      filter="url(#shadow)"
    />
  </svg>
);

export const TDAHRibbon = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    aria-label="TDAH"
    title="TDAH - Transtorno do Déficit de Atenção com Hiperatividade"
  >
    <defs>
      <filter id="tdah-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
      </filter>
    </defs>
    <path 
      d="M7.5 21C7.5 21 16.5 13.5 16.5 8.5C16.5 4 14.5 2 12 2C9.5 2 7.5 4 7.5 8.5C7.5 13.5 16.5 21 16.5 21" 
      fill="none" 
      stroke="#FF8A00" 
      strokeWidth="4" 
      strokeLinecap="round"
      filter="url(#tdah-shadow)"
    />
  </svg>
);

export const OutroGirassol = ({ className = "text-base" }) => (
  <span title="Neurodivergente" aria-label="Neurodivergente" className={`leading-none flex-shrink-0 ${className}`}>
    🌻
  </span>
);

export interface NeurodivergentBadgeProps {
  neurodivergente?: boolean;
  opcoes?: string[];
}

export const NeurodivergentBadge: React.FC<NeurodivergentBadgeProps> = ({ neurodivergente, opcoes = [] }) => {
  if (!neurodivergente) return null;

  // Handle cases where opcoes might not be an array or is null/undefined
  const safeOpcoes = Array.isArray(opcoes) ? opcoes : [];

  // Normalize options to uppercase to ignore case variations
  const tiposNormalizados = safeOpcoes.map((tipo) => String(tipo).trim().toUpperCase());

  const hasTEA = tiposNormalizados.includes('TEA');
  const hasTDAH = tiposNormalizados.includes('TDAH');
  const hasOutro = tiposNormalizados.includes('OUTRO') || tiposNormalizados.includes('OUTROS');

  // We show the sunflower ONLY if 'Outro' is explicitly selected
  // If no options are selected (e.g. legacy records or empty array), we don't show any symbol.
  if (!hasTEA && !hasTDAH && !hasOutro) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
      {hasTEA && <TEARibbon />}
      {hasTDAH && <TDAHRibbon />}
      {hasOutro && <OutroGirassol />}
    </div>
  );
};
