"use client";

import { useId, useState, type Ref } from "react";
import type { Ambiente, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, ROTULO_CURTO } from "@/lib/state";
import { AmostraEstado } from "../amostra-estado";
import { cn } from "@/lib/utils";
import { IconeBusca } from "./icones";

interface BuscaMesaProps {
  mesas: Mesa[];
  ambientes: Ambiente[];
  limiares: Limiares;
  onIr: (id: number) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
  onFechar?: () => void;
  className?: string;
}

/** Combobox de "Ir para mesa": digita o número, setas navegam, Enter voa até a mesa. */
export function BuscaMesa({ mesas, ambientes, limiares, onIr, inputRef, autoFocus, onFechar, className }: BuscaMesaProps) {
  const id = useId();
  const [q, setQ] = useState("");
  const [foco, setFoco] = useState(false);
  const [ativo, setAtivo] = useState(0);

  const achadas = q ? mesas.filter((m) => String(m.id).startsWith(q)).sort((a, b) => a.id - b.id).slice(0, 6) : [];
  const aberto = foco && q.length > 0;

  function escolher(m: Mesa | undefined) {
    if (!m) return;
    onIr(m.id);
    setQ("");
    onFechar?.();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex h-11 items-center gap-2 rounded-full bg-(--color-ink)/8 px-3.5 transition-[background-color,box-shadow] focus-within:bg-(--color-raised) focus-within:shadow-[0_0_0_2px_var(--color-focus)]">
        <span className="text-(--color-ink-2)"><IconeBusca /></span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          role="combobox"
          aria-label="Ir para mesa"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={aberto && achadas[ativo] ? `${id}-${achadas[ativo].id}` : undefined}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ir para mesa"
          value={q}
          onChange={(e) => {
            setQ(e.target.value.replace(/\D/g, ""));
            setAtivo(0);
          }}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const n = achadas.length || 1;
              setAtivo((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
            } else if (e.key === "Enter") {
              e.preventDefault();
              escolher(achadas[ativo]);
            } else if (e.key === "Escape") {
              e.stopPropagation();
              if (q) setQ("");
              else {
                e.currentTarget.blur();
                onFechar?.();
              }
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-(--color-ink) outline-none placeholder:text-(--color-ink-3)"
        />
        {!q && (
          <kbd className="hidden rounded-md bg-(--color-ink)/8 px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-(--color-ink-2) xl:block">
            /
          </kbd>
        )}
      </div>

      {/* Fundo quase opaco: um vidro dentro de outro vidro não enxerga a cena. */}
      <ul
        id={`${id}-lista`}
        role="listbox"
        aria-label="Mesas encontradas"
        hidden={!aberto}
        className="animate-surgir absolute inset-x-0 top-full z-50 m-0 mt-2 list-none rounded-(--radius-panel) bg-(--color-glass-strong) p-1.5 shadow-(--shadow-float) ring-1 ring-(--color-ink)/8 backdrop-blur-xl"
      >
        {achadas.map((m, i) => {
          const estado = derivarEstado(m, limiares);
          return (
            <li
              key={m.id}
              id={`${id}-${m.id}`}
              role="option"
              aria-selected={i === ativo}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => escolher(m)}
              onPointerMove={() => setAtivo(i)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-(--radius-control) px-3",
                i === ativo && "bg-(--color-ink)/8",
              )}
            >
              <AmostraEstado estado={estado} className="size-4" />
              <span className="flex-1 text-[15px] font-medium text-(--color-ink)">Mesa {m.id}</span>
              <span className="text-[12px] text-(--color-ink-3)">
                {ROTULO_CURTO[estado]} · {ambientes.find((a) => a.id === m.ambienteId)?.nome}
              </span>
            </li>
          );
        })}
        {achadas.length === 0 && (
          <li role="presentation" className="px-3 py-3 text-[13px] text-(--color-ink-2)">
            Nenhuma mesa com esse número.
          </li>
        )}
      </ul>
    </div>
  );
}
