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

const Relogio = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 12 12" className={cn("size-3 flex-none", className)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="4.6" />
    <path d="M6 3.4V6l1.8 1.1" />
  </svg>
);

/** O ícone sozinho, para linhas de lista onde o selo inteiro seria demais. */
export function GlifoAlerta({ tipo, className }: { tipo: TipoAlerta; className?: string }) {
  if (tipo === "entregaAtrasada") return <Relogio className={className} />;
  const texto = tipo === "semPedidoCritico" ? "!!" : tipo === "semPedido" ? "!" : "R$";
  return <span aria-hidden className={cn("flex-none font-bold leading-none", className)}>{texto}</span>;
}

/** Ficha circular com o glifo, na cor do alerta. */
export function FichaAlerta({ tipo, className }: { tipo: TipoAlerta; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-6 flex-none place-items-center rounded-full text-[12px]", className)}
      style={estiloAlerta(tipo)}
    >
      <GlifoAlerta tipo={tipo} />
    </span>
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
