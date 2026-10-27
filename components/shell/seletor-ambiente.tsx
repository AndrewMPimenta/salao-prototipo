"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Ambiente, Mesa } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SeletorAmbienteProps {
  ambientes: Ambiente[];
  mesas: Mesa[];
  ativo: string;
  onChange: (id: string) => void;
  variante: "segmentado" | "chips";
  className?: string;
}

/**
 * Cliente real tem 6+ ambientes: o seletor rola em vez de quebrar linha, e a
 * máscara nas bordas avisa que há mais para o lado. Cada opção mostra
 * ocupadas/total, para dispensar entrar no ambiente só para ver se está cheio.
 */
export function SeletorAmbiente({ ambientes, mesas, ativo, onChange, variante, className }: SeletorAmbienteProps) {
  const rolagem = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const [marca, setMarca] = useState<{ x: number; w: number } | null>(null);
  const [bordas, setBordas] = useState({ esq: false, dir: false });
  const chips = variante === "chips";
  const MARGEM = chips ? 16 : 24;

  const medirBordas = useCallback(() => {
    const el = rolagem.current;
    if (!el) return;
    const esq = el.scrollLeft > 2;
    const dir = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setBordas((b) => (b.esq === esq && b.dir === dir ? b : { esq, dir }));
  }, []);

  useLayoutEffect(() => {
    const el = rolagem.current;
    const btn = trilho.current?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!el || !btn) return;
    setMarca({ x: btn.offsetLeft, w: btn.offsetWidth });
    // Só rola se a opção ativa estiver escondida ou sob a máscara; centralizar empurrava o primeiro chip para o degradê.
    const fim = btn.offsetLeft + btn.offsetWidth;
    if (btn.offsetLeft < el.scrollLeft + MARGEM) el.scrollTo({ left: Math.max(0, btn.offsetLeft - MARGEM), behavior: "smooth" });
    else if (fim > el.scrollLeft + el.clientWidth - MARGEM) el.scrollTo({ left: fim - el.clientWidth + MARGEM, behavior: "smooth" });
    medirBordas();
    const obs = new ResizeObserver(medirBordas);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ativo, ambientes, medirBordas, MARGEM]);

  const M = `${MARGEM}px`;
  const mascara = `linear-gradient(90deg, ${bordas.esq ? "transparent" : "#000"}, #000 ${M}, #000 calc(100% - ${M}), ${bordas.dir ? "transparent" : "#000"})`;

  return (
    <div
      ref={rolagem}
      onScroll={medirBordas}
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
      className={cn("scrollbar-none overflow-x-auto overscroll-x-contain", chips && "snap-x snap-proximity", className)}
    >
      <div
        ref={trilho}
        role="group"
        aria-label="Ambiente"
        className={cn("relative inline-flex", chips ? "gap-2" : "rounded-(--radius-control) bg-(--color-ink)/8 p-1")}
      >
        {!chips && marca && (
          <span
            aria-hidden
            className="absolute inset-y-1 left-0 rounded-[8px] bg-(--color-raised) shadow-[0_1px_2px_rgb(40_30_15/0.18),0_0_0_1px_var(--color-line)] transition-[translate,width] duration-[280ms] ease-(--ease-out-soft)"
            style={{ width: marca.w, translate: `${marca.x}px 0` }}
          />
        )}

        {ambientes.map((a) => {
          const doAmbiente = mesas.filter((m) => m.ambienteId === a.id);
          const ocupadas = doAmbiente.filter((m) => m.pessoas > 0).length;
          const selecionado = a.id === ativo;

          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={selecionado}
              aria-label={`${a.nome}, ${ocupadas} de ${doAmbiente.length} mesas ocupadas`}
              onClick={() => onChange(a.id)}
              className={cn(
                "flex flex-none items-center whitespace-nowrap font-medium transition-[color,scale,background-color] duration-100 active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                chips
                  ? "h-11 snap-start"
                  : [
                      "relative z-10 min-h-9 gap-2 rounded-[8px] px-3.5 text-[13px]",
                      selecionado ? "font-semibold text-(--color-ink)" : "text-(--color-ink-2) hover:text-(--color-ink)",
                    ],
              )}
            >
              {/* Chip de 36px visuais dentro de um alvo de 44px. */}
              <span
                className={cn(
                  "flex items-center gap-2",
                  chips && [
                    "h-9 rounded-full px-3.5 text-[15px]",
                    selecionado ? "bg-(--color-accent) text-(--color-accent-ink)" : "bg-(--color-glass-strong) text-(--color-ink) shadow-[inset_0_1px_0_var(--color-glass-edge),0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent),0_4px_12px_-4px_rgb(40_30_15/0.2)]",
                  ],
                )}
              >
                {a.nome}
                <span
                  className={cn(
                    "tnum font-[family-name:var(--font-mono)] font-medium",
                    chips ? "text-[13px]" : "text-[11px]",
                    chips && selecionado ? "opacity-70" : "text-(--color-ink-3)",
                  )}
                >
                  {ocupadas}/{doAmbiente.length}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
