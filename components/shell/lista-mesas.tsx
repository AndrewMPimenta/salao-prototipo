"use client";

import { useMemo } from "react";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { useHoverMesa, type ArmazemHover } from "@/hooks/use-hover-mesa";
import { derivarAlertas, derivarEstado, ORDEM_ESTADOS, ROTULO_ESTADO, textoAlerta } from "@/lib/state";
import { cn } from "@/lib/utils";
import { AmostraEstado } from "../amostra-estado";
import { FichaAlerta } from "../selo-alerta";

const TITULO_GRUPO: Record<EstadoMesa, string> = {
  livre: "Livres",
  reservada: "Reservadas",
  ocupada: "Ocupadas",
  conta: "Conta",
};

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
        onPointerEnter={(e) => e.pointerType === "mouse" && hover.definir(mesa.id, "lista")}
        onPointerLeave={() => hover.ler() === mesa.id && hover.definir(null)}
        onFocus={() => hover.definir(mesa.id, "lista")}
        onBlur={() => hover.ler() === mesa.id && hover.definir(null)}
        aria-current={selecionada || undefined}
        aria-label={`Mesa ${mesa.id}. ${[ROTULO_ESTADO[estado], ...alertas.map(textoAlerta)].join(". ")}`}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-[12px] px-2 text-left text-[13px] text-(--color-ink)",
          "transition-[background-color] duration-100",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-focus)",
          destacada ? "bg-(--color-ink)/10" : selecionada ? "bg-(--color-ink)/6" : "hover:bg-(--color-ink)/6",
        )}
      >
        <AmostraEstado estado={estado} className="size-4" />
        <span className="tnum w-9 flex-none font-[family-name:var(--font-mono)] font-semibold">{mesa.id}</span>
        <span className="tnum min-w-0 flex-1 truncate text-(--color-ink-2)">
          {mesa.pessoas > 0 ? `${mesa.pessoas}/${mesa.lugares} pessoas` : `${mesa.lugares} lugares`}
        </span>
        {principal && <FichaAlerta tipo={principal.tipo} />}
      </button>
    </li>
  );
}

interface ListaMesasProps {
  mesas: Mesa[];
  limiares: Limiares;
  hover: ArmazemHover;
  selecionada: number | null;
  /** Filtro pelo número, controlado pelo painel que fixa o campo no cabeçalho. */
  busca: string;
  /** Seleciona a mesa e leva a câmera até ela, sem zoom. */
  onIr: (id: number) => void;
}

/** Todas as mesas do ambiente, por estado, filtradas pelo número. Passar o mouse destaca a mesa na cena. */
export function ListaMesas({ mesas, limiares, hover, selecionada, busca, onIr }: ListaMesasProps) {
  const grupos = useMemo(() => {
    const q = busca.trim();
    const por: Record<EstadoMesa, { mesa: Mesa; estado: EstadoMesa }[]> = { livre: [], reservada: [], ocupada: [], conta: [] };

    for (const mesa of [...mesas].sort((a, b) => a.id - b.id)) {
      if (q && !String(mesa.id).includes(q)) continue;
      const estado = derivarEstado(mesa, limiares);
      por[estado].push({ mesa, estado });
    }

    return por;
  }, [mesas, limiares, busca]);

  const total = ORDEM_ESTADOS.reduce((n, e) => n + grupos[e].length, 0);

  return (
    <div className="flex flex-col gap-1">
      {ORDEM_ESTADOS.map((estado) =>
        grupos[estado].length === 0 ? null : (
          <section key={estado} aria-label={TITULO_GRUPO[estado]}>
            <h3 className="m-0 flex items-baseline gap-2 px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--color-ink-3)">
              {TITULO_GRUPO[estado]}
              <span className="tnum font-[family-name:var(--font-mono)] text-(--color-ink-2)">{grupos[estado].length}</span>
            </h3>
            <ul className="m-0 flex list-none flex-col p-0">
              {grupos[estado].map(({ mesa }) => (
                <Linha
                  key={mesa.id}
                  mesa={mesa}
                  estado={estado}
                  limiares={limiares}
                  hover={hover}
                  selecionada={selecionada === mesa.id}
                  onIr={onIr}
                />
              ))}
            </ul>
          </section>
        ),
      )}

      {total === 0 && <p className="m-0 py-4 text-[13px] text-(--color-ink-2)">Nenhuma mesa com esse número.</p>}
    </div>
  );
}
