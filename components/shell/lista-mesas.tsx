"use client";

import { useMemo } from "react";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { useHoverMesa, type ArmazemHover } from "@/hooks/use-hover-mesa";
import { derivarAlertas, derivarEstado, ROTULO_ALERTA, ROTULO_CURTO, ROTULO_ESTADO, textoAlerta, triarMesas } from "@/lib/state";
import { cn, formatarDuracao } from "@/lib/utils";
import { AmostraEstado } from "../amostra-estado";
import { FichaAlerta } from "../selo-alerta";

export type AbaMesas = "todas" | "livres" | "reservadas" | "ocupadas" | "atencao";

export const ABAS_MESAS: { valor: AbaMesas; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "livres", rotulo: "Livres" },
  { valor: "reservadas", rotulo: "Reservadas" },
  { valor: "ocupadas", rotulo: "Ocupadas" },
  { valor: "atencao", rotulo: "Atenção" },
];

const ESTADOS_DA_ABA: Record<Exclude<AbaMesas, "todas" | "atencao">, EstadoMesa[]> = {
  livres: ["livre"],
  reservadas: ["reservada"],
  // Conta impressa ainda é mesa ocupada para quem procura lugar.
  ocupadas: ["ocupada", "conta"],
};

/** Mesas de cada guia, com o estado já derivado; Atenção segue a prioridade do alerta, o resto o número. */
export function mesasDaAba(aba: AbaMesas, mesas: Mesa[], limiares: Limiares) {
  if (aba === "atencao") return triarMesas(mesas, limiares).map((t) => ({ mesa: t.mesa, estado: derivarEstado(t.mesa, limiares) }));

  const estados = aba === "todas" ? null : ESTADOS_DA_ABA[aba];
  return [...mesas]
    .sort((a, b) => a.id - b.id)
    .map((mesa) => ({ mesa, estado: derivarEstado(mesa, limiares) }))
    .filter((m) => !estados || estados.includes(m.estado));
}

interface LinhaProps {
  mesa: Mesa;
  estado: EstadoMesa;
  limiares: Limiares;
  hover: ArmazemHover;
  selecionada: boolean;
  onIr: (id: number) => void;
}

function Linha({ mesa, estado, limiares, hover, selecionada, onIr }: LinhaProps) {
  const destacada = useHoverMesa(hover, mesa.id);
  const alertas = derivarAlertas(mesa, limiares);
  const principal = alertas[0];

  return (
    <li>
      <button
        type="button"
        onClick={() => onIr(mesa.id)}
        data-linha={mesa.id}
        onPointerEnter={(e) => e.pointerType === "mouse" && hover.definir(mesa.id)}
        onPointerLeave={() => hover.ler() === mesa.id && hover.definir(null)}
        onFocus={() => hover.definir(mesa.id)}
        onBlur={() => hover.ler() === mesa.id && hover.definir(null)}
        aria-current={selecionada || undefined}
        aria-label={`Mesa ${mesa.id}. ${[ROTULO_ESTADO[estado], ...alertas.map(textoAlerta)].join(". ")}`}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm outline-none",
          "transition-colors duration-100 focus-visible:ring-3 focus-visible:ring-ring/30",
          destacada ? "bg-(--color-hover-linha) shadow-[inset_0_0_0_1.5px_var(--hover-aro)]" : selecionada ? "bg-muted" : "hover:bg-muted/70",
        )}
      >
        <span className="tnum w-8 flex-none font-mono font-semibold">{mesa.id}</span>

        <span className="flex min-w-0 flex-1 items-center gap-2">
          {principal ? <FichaAlerta tipo={principal.tipo} className="size-4" /> : <AmostraEstado estado={estado} className="size-3.5" />}
          <span className="min-w-0 text-[13px] leading-4" title={principal ? ROTULO_ALERTA[principal.tipo] : ROTULO_CURTO[estado]}>
            {principal ? ROTULO_ALERTA[principal.tipo] : ROTULO_CURTO[estado]}
            {alertas.length > 1 && <span className="tnum text-muted-foreground"> +{alertas.length - 1}</span>}
          </span>
        </span>

        <span className="tnum w-10 flex-none text-right text-[13px] text-muted-foreground">
          {mesa.pessoas > 0 ? `${mesa.pessoas}/${mesa.lugares}` : mesa.lugares}
          <span className="sr-only">{mesa.pessoas > 0 ? " pessoas" : " lugares"}</span>
        </span>

        <span className="tnum w-11 flex-none text-right font-mono text-xs text-muted-foreground">
          {principal ? (
            <>
              <span className="text-sm font-semibold text-foreground">{principal.minutos}</span> min
            </>
          ) : mesa.abertaHa ? (
            formatarDuracao(mesa.abertaHa)
          ) : null}
        </span>
      </button>
    </li>
  );
}

interface ListaMesasProps {
  mesas: Mesa[];
  limiares: Limiares;
  hover: ArmazemHover;
  selecionada: number | null;
  aba: AbaMesas;
  /** Filtro pelo número, controlado pelo painel que fixa o campo acima da lista. */
  busca: string;
  /** Seleciona a mesa e leva a câmera até ela, sem zoom. */
  onIr: (id: number) => void;
}

/** As mesas da guia, filtradas pelo número. Passar o mouse destaca a mesa na cena. */
export function ListaMesas({ mesas, limiares, hover, selecionada, aba, busca, onIr }: ListaMesasProps) {
  const linhas = useMemo(() => {
    const q = busca.trim();
    return mesasDaAba(aba, mesas, limiares).filter((m) => !q || String(m.mesa.id).includes(q));
  }, [aba, mesas, limiares, busca]);

  if (linhas.length === 0) {
    return (
      <p className="m-0 px-2 py-6 text-center text-sm text-muted-foreground">
        {busca.trim() ? "Nenhuma mesa com esse número." : aba === "atencao" ? "Nenhuma mesa pedindo atenção neste salão." : "Nenhuma mesa nesta guia."}
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {linhas.map(({ mesa, estado }) => (
        <Linha key={mesa.id} mesa={mesa} estado={estado} limiares={limiares} hover={hover} selecionada={selecionada === mesa.id} onIr={onIr} />
      ))}
    </ul>
  );
}
