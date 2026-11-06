"use client";

import { useId, useMemo, useState, type Ref } from "react";
import type { Ambiente, Limiares, Mesa } from "@/lib/types";
import { mesasBaseDoAmbiente } from "@/lib/data";
import { derivarEstado, ROTULO_CURTO } from "@/lib/state";
import { AmostraEstado } from "../amostra-estado";
import { cn } from "@/lib/utils";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Kbd } from "../ui/kbd";

interface BuscaMesaProps {
  ambientes: Ambiente[];
  limiares: Limiares;
  onIr: (id: number) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
  onFechar?: () => void;
  className?: string;
}

/** Combobox de "Ir para mesa": digita o número, setas navegam, Enter voa até a mesa. */
export function BuscaMesa({ ambientes, limiares, onIr, inputRef, autoFocus, onFechar, className }: BuscaMesaProps) {
  const id = useId();
  const [q, setQ] = useState("");
  const [foco, setFoco] = useState(false);
  const [ativo, setAtivo] = useState(0);

  // As mesas dos outros salões só são geradas quando alguém busca.
  const achadas = useMemo(
    () => (q ? ambientes.flatMap((a) => mesasBaseDoAmbiente(a.id)).filter((m) => String(m.id).startsWith(q)).sort((a, b) => a.id - b.id).slice(0, 6) : []),
    [q, ambientes],
  );
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
      <div className="flex h-9 items-center gap-2 rounded-full border bg-background px-3 transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <MagnifyingGlassIcon aria-hidden className="size-4 flex-none text-muted-foreground" />
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
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {!q && (
          <Kbd className="hidden xl:inline-flex">/</Kbd>
        )}
      </div>

            <ul
        id={`${id}-lista`}
        role="listbox"
        aria-label="Mesas encontradas"
        hidden={!aberto}
        className="animate-surgir absolute inset-x-0 top-full z-50 m-0 mt-2 list-none rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
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
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm",
                i === ativo && "bg-muted",
              )}
            >
              <AmostraEstado estado={estado} className="size-4" />
              <span className="flex-1 font-medium text-foreground">Mesa {m.id}</span>
              <span className="text-[12px] text-muted-foreground">
                {ROTULO_CURTO[estado]} · {ambientes.find((a) => a.id === m.ambienteId)?.nome}
              </span>
            </li>
          );
        })}
        {achadas.length === 0 && (
          <li role="presentation" className="px-3 py-3 text-[13px] text-muted-foreground">
            Nenhuma mesa com esse número.
          </li>
        )}
      </ul>
    </div>
  );
}
