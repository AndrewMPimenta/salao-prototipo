import type { CSSProperties } from "react";
import type { Alerta, TipoAlerta } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Cada tipo tem seu token de cor; sem pedido e sem pedido crítico dividem o vermelho e diferem no glifo. */
const TOKEN: Record<TipoAlerta, string> = {
  semPedidoCritico: "critico",
  semPedido: "atencao",
  entregaAtrasada: "entrega",
  contaParada: "conta",
};

export function estiloAlerta(tipo: TipoAlerta): CSSProperties {
  return { background: `var(--color-alerta-${TOKEN[tipo]})`, color: `var(--color-alerta-${TOKEN[tipo]}-ink)` };
}

/*
  Glifos desenhados num quadro de 16×16 com o centro geométrico em (8, 8): texto de fonte
  ("!", "!!") herda as métricas da fonte e nunca fica centrado de verdade no círculo.
*/
function Desenho({ tipo }: { tipo: TipoAlerta }) {
  if (tipo === "entregaAtrasada")
    return (
      <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="5" />
        <path d="M8 5.3V8l1.9 1.2" />
      </g>
    );
  if (tipo === "contaParada")
    return (
      <text x="8" y="8.4" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="currentColor" letterSpacing="-0.4">
        R$
      </text>
    );
  const exclamacao = (cx: number) => (
    <g key={cx} fill="currentColor">
      <rect x={cx - 1.1} y="3.2" width="2.2" height="6.2" rx="1.1" />
      <circle cx={cx} cy="11.7" r="1.15" />
    </g>
  );
  return <>{tipo === "semPedidoCritico" ? [exclamacao(5.9), exclamacao(10.1)] : exclamacao(8)}</>;
}

/** O ícone sozinho, na cor do texto, para linhas e pílulas. */
export function GlifoAlerta({ tipo, className }: { tipo: TipoAlerta; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("size-3.5 flex-none", className)}>
      <Desenho tipo={tipo} />
    </svg>
  );
}

/** Ficha circular com o glifo, na cor do alerta: círculo e glifo no mesmo SVG, sem como desalinhar. */
export function FichaAlerta({ tipo, className }: { tipo: TipoAlerta; className?: string }) {
  const { background, color } = estiloAlerta(tipo);
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("size-[18px] flex-none", className)} style={{ color }}>
      <circle cx="8" cy="8" r="8" fill={background as string} />
      <g transform="translate(8 8) scale(0.72) translate(-8 -8)">
        <Desenho tipo={tipo} />
      </g>
    </svg>
  );
}

/**
 * Selo do alerta mais urgente: glifo e minutos, com "+N" quando há outros.
 * O arredondamento e o encaixe ficam com quem usa (colado ao pino ou solto na planta).
 */
export function SeloAlerta({
  alertas,
  className,
  semMinutos,
}: {
  alertas: Alerta[];
  className?: string;
  semMinutos?: boolean;
}) {
  const [a, ...resto] = alertas;
  if (!a) return null;

  return (
    <span
      className={cn("tnum flex h-5 items-center gap-1 text-[11px] font-bold whitespace-nowrap", className)}
      style={estiloAlerta(a.tipo)}
    >
      <GlifoAlerta tipo={a.tipo} />
      {!semMinutos && <span>{a.minutos}′</span>}
      {resto.length > 0 && <span className="opacity-80">+{resto.length}</span>}
    </span>
  );
}
