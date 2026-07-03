import React from "react";

/**
 * Marca do Adimplo: um "A" desenhado como uma linha ascendente (recebimento
 * subindo), com um ponto de destaque no topo (o "pago"/spark). Gradiente
 * sky→emerald (cobrança → recebido). `mono` usa currentColor (1 cor).
 */
export const Logo: React.FC<{ size?: number; className?: string; mono?: boolean }> = ({
  size = 32,
  className,
  mono = false,
}) => {
  const uid = React.useId();
  const gradId = `adimplo-grad-${uid}`;
  const stroke = mono ? "currentColor" : `url(#${gradId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Adimplo"
    >
      {!mono && (
        <defs>
          <linearGradient id={gradId} x1="8" y1="40" x2="40" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      )}
      {/* legs do "A" como pico ascendente */}
      <path
        d="M8 40 L24 10 L40 40"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* travessão do "A" */}
      <path d="M16.5 28.5 H31.5" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      {/* ponto "recebido" no topo */}
      <circle cx="40" cy="10" r="3.6" fill={mono ? "currentColor" : "#10b981"} />
    </svg>
  );
};

/** Logo + wordmark "Adimplo" (dois tons). Use no header/nav/auth. */
export const LogoWordmark: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className,
}) => (
  <div className={`flex items-center gap-2 ${className ?? ""}`}>
    <Logo size={size} />
    <span className="font-bold tracking-tight" style={{ fontSize: size * 0.72 }}>
      Adim<span className="text-brand-primary">plo</span>
    </span>
  </div>
);
