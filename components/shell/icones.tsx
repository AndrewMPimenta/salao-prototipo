import type { ReactNode } from "react";

function Base({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconeMais = () => <Base><path d="M12 5v14M5 12h14" /></Base>;
export const IconeMenos = () => <Base><path d="M5 12h14" /></Base>;
export const IconeBusca = () => <Base><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Base>;
export const IconeFechar = () => <Base><path d="M6 6l12 12M18 6 6 18" /></Base>;
export const IconeAjuda = () => <Base><circle cx="12" cy="12" r="8.5" /><path d="M9.7 9.5a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.8M12 16.6v.1" /></Base>;
export const IconeExpandir = () => <Base><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Base>;
export const IconeRecolher = () => <Base><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></Base>;
export const IconeAlvo = () => <Base><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></Base>;
export const IconeMarcador = () => <Base><path d="M7 4h10v16l-5-3.5L7 20V4Z" /></Base>;
export const IconeChevron = ({ baixo }: { baixo?: boolean }) => (
  <Base><path d={baixo ? "m7 10 5 5 5-5" : "m7 14 5-5 5 5"} /></Base>
);

export const IconeAerea = () => <Base><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9.5" cy="10" r="1.6" /><circle cx="14.5" cy="14" r="1.6" /></Base>;
export const IconePerspectiva = () => <Base><path d="M3 9 12 4l9 5-9 5-9-5Z" /><path d="M3 14l9 5 9-5" /></Base>;
export const IconeNivel = () => <Base><path d="M3 15h18M6 15V9h5v6M14 15v-4h4v4" /><path d="M3 19h18" /></Base>;

export const ICONE_PRESET = { aerea: IconeAerea, perspectiva: IconePerspectiva, nivel: IconeNivel } as const;

/** A agulha gira; o anel fica. O norte é a ponta cheia. */
export function IconeBussola({ graus }: { graus: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth={1.5} opacity={0.35} />
      <g style={{ transform: `rotate(${graus}deg)`, transformOrigin: "12px 12px", transition: "transform 120ms linear" }}>
        <path d="M12 4.5 15 12H9Z" fill="currentColor" />
        <path d="M12 19.5 9 12h6Z" fill="currentColor" opacity={0.3} />
      </g>
    </svg>
  );
}
