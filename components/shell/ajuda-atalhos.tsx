"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { BotaoIcone } from "./botao-icone";
import { IconeAjuda } from "./icones";
import { materializar } from "./materializar";

const ATALHOS: { teclas: string[]; texto: string }[] = [
  { teclas: ["PgUp", "PgDn"], texto: "Trocar de ambiente" },
  { teclas: ["T"], texto: "Todas as mesas" },
  { teclas: ["L"], texto: "Só livres" },
  { teclas: ["A"], texto: "Só atenção" },
  { teclas: ["F"], texto: "Tela cheia" },
  { teclas: ["1", "2", "3"], texto: "Câmera aérea, perspectiva, nível" },
  { teclas: ["/"], texto: "Buscar mesa" },
  { teclas: ["Esc"], texto: "Fechar ou limpar seleção" },
];

const Tecla = ({ children }: { children: string }) => (
  <kbd className="inline-grid min-w-6 place-items-center rounded-md bg-(--color-raised) px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-medium text-(--color-ink) shadow-[0_1px_0_var(--color-line-2),0_0_0_1px_var(--color-line)]">
    {children}
  </kbd>
);

function Chave({ ligada, onChange, rotulo }: { ligada: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-[13px] text-(--color-ink)">
      {rotulo}
      <button
        type="button"
        role="switch"
        aria-checked={ligada}
        aria-label={rotulo}
        onClick={() => onChange(!ligada)}
        className={cn(
          "relative h-6 w-10 flex-none rounded-full transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
          ligada ? "bg-(--color-accent)" : "bg-(--color-ink)/20",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-(--color-raised) shadow-sm transition-[translate] duration-200 ease-(--ease-out-soft)",
            ligada && "translate-x-4",
          )}
        />
      </button>
    </label>
  );
}

interface AjudaAtalhosProps {
  aberto: boolean;
  onAbrir: (v: boolean) => void;
  atalhosLigados: boolean;
  onAtalhos: (v: boolean) => void;
  rotulos: boolean;
  onRotulos: (v: boolean) => void;
}

export function AjudaAtalhos({ aberto, onAbrir, atalhosLigados, onAtalhos, rotulos, onRotulos }: AjudaAtalhosProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) onAbrir(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onAbrir(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, onAbrir]);

  return (
    <div ref={raiz} className="relative">
      <BotaoIcone rotulo="Atalhos e ajustes (?)" expandido={aberto} onClick={() => onAbrir(!aberto)}>
        <IconeAjuda />
      </BotaoIcone>

      <div
        id={id}
        role="dialog"
        aria-label="Atalhos de teclado"
        inert={!aberto}
        className={cn(
          "absolute right-0 top-full z-50 mt-3 w-80 rounded-(--radius-panel) bg-(--color-glass-strong) p-4",
          "shadow-(--shadow-float) ring-1 ring-(--color-ink)/8 backdrop-blur-xl",
          materializar(aberto, "cima"),
        )}
      >
        <h2 className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">Atalhos</h2>
        <ul className="m-0 mb-3 flex list-none flex-col gap-2 p-0">
          {ATALHOS.map((a) => (
            <li key={a.texto} className="flex items-center justify-between gap-4 text-[13px]">
              <span className="text-(--color-ink-2)">{a.texto}</span>
              <span className="flex flex-none gap-1">
                {a.teclas.map((t) => <Tecla key={t}>{t}</Tecla>)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-(--color-ink)/10 pt-1">
          <Chave ligada={atalhosLigados} onChange={onAtalhos} rotulo="Atalhos de tecla única" />
          <Chave ligada={rotulos} onChange={onRotulos} rotulo="Rótulos nas mesas 3D" />
        </div>
      </div>
    </div>
  );
}
