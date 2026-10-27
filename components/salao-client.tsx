"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { Ambiente, EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, ORDEM_ESTADOS, precisaAtencao } from "@/lib/state";
import { useAtalhos } from "@/hooks/use-atalhos";
import { FloorPlan } from "./floor-plan";
import { OccupancyBar } from "./occupancy-bar";
import { ZoneRail } from "./zone-rail";
import { AttentionPanel } from "./attention-panel";
import { TimelineView } from "./timeline-view";
import { MobileList } from "./mobile-list";
import { TableSheet } from "./table-sheet";
import { ToggleGroup } from "./ui/toggle-group";
import { ThemeToggle } from "./theme-toggle";
import type { Densidade } from "./table-shape";

const Floor3D = dynamic(() => import("./floor-3d").then((m) => m.Floor3D), {
  ssr: false,
  loading: () => (
    <div className="grid h-[560px] place-items-center rounded-2xl bg-(--color-floor) text-[13px] text-(--color-ink-2)">
      Carregando a cena…
    </div>
  ),
});

type Vista = "planta" | "linha" | "tres-d";

const DENSIDADES: Densidade[] = ["minimo", "padrao", "completo"];

interface SalaoClientProps {
  mesas: Mesa[];
  ambientes: Ambiente[];
  limiares: Limiares;
}

export function SalaoClient({ mesas, ambientes, limiares }: SalaoClientProps) {
  const [ambienteId, setAmbienteId] = useState(ambientes[0]?.id ?? "principal");
  const [vista, setVista] = useState<Vista>("planta");
  const [densidade, setDensidade] = useState<Densidade>("padrao");
  const [filtro, setFiltro] = useState<EstadoMesa | null>(null);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [atalhosLigados, setAtalhosLigados] = useState(true);

  const doAmbiente = useMemo(
    () => mesas.filter((m) => m.ambienteId === ambienteId),
    [mesas, ambienteId],
  );

  const contagem = useMemo(() => {
    const base = Object.fromEntries(ORDEM_ESTADOS.map((e) => [e, 0])) as Record<EstadoMesa, number>;
    for (const mesa of doAmbiente) base[derivarEstado(mesa, limiares)]++;
    return base;
  }, [doAmbiente, limiares]);

  const limparSelecao = useCallback(() => setSelecionada(null), []);

  useAtalhos(
    useMemo(
      () => ({
        a: () => setFiltro((f) => (f === "alerta2" ? null : "alerta2")),
        l: () => setFiltro((f) => (f === "livre" ? null : "livre")),
        t: () => setFiltro(null),
        d: () =>
          setDensidade((d) => DENSIDADES[(DENSIDADES.indexOf(d) + 1) % DENSIDADES.length]),
      }),
      [],
    ),
    atalhosLigados,
  );

  const mesaSelecionada = doAmbiente.find((m) => m.id === selecionada) ?? null;
  const atencao = doAmbiente.filter((m) => precisaAtencao(derivarEstado(m, limiares)));
  const nomeAmbiente = ambientes.find((a) => a.id === ambienteId)?.nome ?? "";

  return (
    <div className="overflow-hidden rounded-[22px] bg-(--color-surface) shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-center gap-4 px-7 pb-5 pt-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">
            Restaurante Sede
          </h1>
          <p className="mt-1 text-[13px] text-(--color-ink-2)">
            {nomeAmbiente} · somente consulta
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <ToggleGroup<Vista>
            rotulo="Vista do salão"
            valor={vista}
            onChange={setVista}
            opcoes={[
              { valor: "planta", rotulo: "Planta" },
              { valor: "linha", rotulo: "Linha do tempo" },
              { valor: "tres-d", rotulo: "3D" },
            ]}
          />
        </div>
      </header>

      <OccupancyBar
        contagem={contagem}
        total={doAmbiente.length}
        filtro={filtro}
        onFiltrar={setFiltro}
      />

      <div className="flex min-h-0 border-t border-(--color-line)/60">
        <div className="hidden border-r border-(--color-line)/60 lg:flex">
          <ZoneRail
            ambientes={ambientes}
            mesas={mesas}
            limiares={limiares}
            ativo={ambienteId}
            onChange={(id) => {
              setAmbienteId(id);
              setSelecionada(null);
            }}
          />
        </div>

        <div className="hidden min-w-0 flex-1 p-7 lg:block">
          {vista === "planta" && (
            <FloorPlan
              mesas={doAmbiente}
              ambienteId={ambienteId}
              limiares={limiares}
              densidade={densidade}
              filtro={filtro}
              selecionada={selecionada}
              onSelect={(id) => setSelecionada((s) => (s === id ? null : id))}
              onEscape={limparSelecao}
            />
          )}
          {vista === "linha" && <TimelineView mesas={doAmbiente} limiares={limiares} />}
          {vista === "tres-d" && (
            <Floor3D mesas={doAmbiente} limiares={limiares} ambienteId={ambienteId} />
          )}
        </div>

        <aside className="hidden w-80 flex-none border-l border-(--color-line)/60 xl:block">
          <div className="px-6 py-6">
            <h2 className="mb-4 flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">
                Precisam de atenção
              </span>
              {atencao.length > 0 && (
                <span className="tnum font-[family-name:var(--font-mono)] text-[13px] font-semibold text-(--color-ink-2)">
                  {atencao.length}
                </span>
              )}
            </h2>

            <AttentionPanel
              mesas={doAmbiente}
              limiares={limiares}
              onSelect={(id) => setSelecionada(id)}
            />

            <div className="mt-7 border-t border-(--color-line)/60 pt-5">
              <p className="text-[12.5px] leading-relaxed text-(--color-ink-2)">
                O número grande dentro da mesa é o tempo sem pedido.{" "}
                <span className="font-semibold text-(--color-ink)">!</span> marca 20 minutos,{" "}
                <span className="font-semibold text-(--color-ink)">!!</span> marca 40. A hachura
                diagonal é conta impressa — ela diz &ldquo;diferente&rdquo;, não &ldquo;mais
                urgente&rdquo;. Cadeiras preenchidas são pessoas sentadas.
              </p>

              <label className="mt-5 flex min-h-11 items-center gap-2.5 text-[12.5px] text-(--color-ink-2)">
                <input
                  type="checkbox"
                  checked={atalhosLigados}
                  onChange={(e) => setAtalhosLigados(e.target.checked)}
                  className="size-4 accent-(--color-focus)"
                />
                Atalhos de tecla única
              </label>
            </div>
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <MobileList
          mesas={doAmbiente}
          limiares={limiares}
          filtro={filtro}
          onSelect={(id) => setSelecionada((s) => (s === id ? null : id))}
        />
      </div>

      {mesaSelecionada && (
        <div className="lg:hidden">
          <TableSheet mesa={mesaSelecionada} limiares={limiares} onClose={limparSelecao} />
        </div>
      )}
    </div>
  );
}
