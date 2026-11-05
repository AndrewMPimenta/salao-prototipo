import {
  ArrowsInIcon,
  ArrowsOutIcon,
  BookmarkSimpleIcon,
  CrosshairIcon,
  DotsSixIcon,
  DotsSixVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PencilSimpleIcon,
  PlusIcon,
  QuestionIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

const I = "size-5";

export const IconeMais = () => <PlusIcon className={I} />;
export const IconeMenos = () => <MinusIcon className={I} />;
export const IconeBusca = () => <MagnifyingGlassIcon className={I} />;
export const IconeFechar = () => <XIcon className={I} />;
export const IconeAjuda = () => <QuestionIcon className={I} />;
export const IconeExpandir = () => <ArrowsOutIcon className={I} />;
export const IconeRecolher = () => <ArrowsInIcon className={I} />;
export const IconeAlvo = () => <CrosshairIcon className={I} />;
export const IconeOlho = () => <EyeIcon className={I} />;
export const IconeMarcador = () => <BookmarkSimpleIcon className={I} />;
export const IconeLapis = () => <PencilSimpleIcon className={I} />;

/** Seis pontos: duas colunas por três linhas, ou o contrário na barra deitada. */
export const IconeAlca = ({ deitada }: { deitada?: boolean }) =>
  deitada ? <DotsSixIcon className={I} weight="bold" /> : <DotsSixVerticalIcon className={I} weight="bold" />;

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
