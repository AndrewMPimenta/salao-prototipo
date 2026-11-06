"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Perfil } from "@/lib/exibicao";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { AmostraEstado } from "../amostra-estado";
import type { Resumo } from "./estatisticas";
import { Atualizado } from "./resumo";

interface KpisProps {
  resumo: Resumo;
  perfil: Perfil;
  /** Livres vira o filtro rápido: o atalho L faz o mesmo. */
  livresAtivo: boolean;
  onLivres: () => void;
  className?: string;
  /** Faixa rolável (celular): cartões de largura fixa em vez de grade. */
  compacto?: boolean;
}

const Rotulo = ({ children }: { children: ReactNode }) => (
  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{children}</span>
);

function Numero({ children, grande }: { children: ReactNode; grande?: boolean }) {
  return (
    <span className={cn("tnum font-mono font-semibold tracking-tight", grande ? "text-4xl leading-10" : "text-2xl leading-8")}>
      {children}
    </span>
  );
}

const cartao = "gap-0.5 rounded-xl border px-4 py-3 shadow-none ring-0";

/**
 * Cinco números do salão. Livres é o que o maître procura primeiro, então cresce
 * em tamanho e peso, sem cor; clicar nele mostra só as livres na cena.
 */
export function Kpis({ resumo, perfil, livresAtivo, onLivres, className, compacto }: KpisProps) {
  const completo = perfil === "completo";

  return (
    <section
      aria-label="Resumo do salão"
      className={cn(
        compacto
          ? "scrollbar-none flex snap-x gap-2 overflow-x-auto px-4 pb-2 *:min-w-36 *:flex-none *:snap-start"
          : "grid gap-4 md:grid-cols-5",
        className,
      )}
    >
      <Card
        className={cn(cartao, "transition-colors", livresAtivo && "border-foreground/40 bg-muted/60")}
      >
        <button
          type="button"
          onClick={onLivres}
          aria-pressed={livresAtivo}
          aria-label={`${resumo.livres} mesas livres de ${resumo.total}. ${livresAtivo ? "Mostrar todas" : "Mostrar só as livres (L)"}`}
          className="-m-1 flex min-h-11 flex-col items-start rounded-lg p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 lg:min-h-0"
        >
          <Rotulo>
            <AmostraEstado estado="livre" className="size-3" />
            Livres
          </Rotulo>
          <span className="flex items-baseline gap-1.5">
            <Numero grande>{resumo.livres}</Numero>
            <span className="tnum text-sm text-muted-foreground">de {resumo.total}</span>
          </span>
        </button>
      </Card>

      <Card className={cartao}>
        <Rotulo>{completo ? "Ocupadas" : "Em atendimento"}</Rotulo>
        <Numero>{resumo.ocupadas}</Numero>
      </Card>

      <Card className={cartao}>
        <Rotulo>Reservadas</Rotulo>
        <Numero>{resumo.contagem.reservada}</Numero>
      </Card>

      <Card className={cartao}>
        <Rotulo>Pessoas</Rotulo>
        <Numero>{resumo.pessoas}</Numero>
      </Card>

      <Card className={cn(cartao, "justify-between")}>
        <Rotulo>Lotação</Rotulo>
        <div className="flex items-center gap-3">
          <Numero>{resumo.lotacao}%</Numero>
          <Progress value={resumo.lotacao} aria-label="Lotação de cadeiras" className="min-w-0 flex-1 gap-0 [&_[data-slot=progress-track]]:h-1" />
        </div>
      </Card>
    </section>
  );
}

/** "Atualizado há Ns" aparece uma vez, fora dos cartões. */
export { Atualizado };
