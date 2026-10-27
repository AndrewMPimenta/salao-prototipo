"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import type { Exibicao, ModoRotulos } from "@/lib/exibicao";
import { cn } from "@/lib/utils";
import { ToggleGroup } from "../ui/toggle-group";
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

function Chave({ ligada, onChange, rotulo, desabilitada }: { ligada: boolean; onChange: (v: boolean) => void; rotulo: string; desabilitada?: boolean }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4 text-[13px] text-(--color-ink)", desabilitada && "cursor-default opacity-45")}>
      {rotulo}
      <button
        type="button"
        role="switch"
        aria-checked={ligada}
        disabled={desabilitada}
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
  exibicao: Exibicao;
  onExibicao: (patch: Partial<Exibicao>) => void;
  /** Algum ajuste difere do automático: mostra o "Restaurar padrão". */
  personalizada: boolean;
  onRestaurar: () => void;
  camera: Salao["camera"];
}

const OPCOES_ROTULOS: { valor: ModoRotulos; rotulo: string }[] = [
  { valor: "auto", rotulo: "Automático" },
  { valor: "sempre", rotulo: "Sempre" },
  { valor: "hover", rotulo: "Ao passar o mouse" },
];

const Secao = ({ children }: { children: string }) => (
  <h2 className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">{children}</h2>
);

const botaoTexto =
  "flex min-h-9 items-center rounded-[10px] px-2 text-left text-[13px] font-medium text-(--color-ink-2) hover:bg-(--color-ink)/8 hover:text-(--color-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)";

export function AjudaAtalhos({ aberto, onAbrir, atalhosLigados, onAtalhos, exibicao, onExibicao, personalizada, onRestaurar, camera }: AjudaAtalhosProps) {
  const [vistaSalva, setVistaSalva] = useState(false);
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
          "absolute right-0 top-full z-50 mt-3 max-h-[calc(100dvh-96px)] w-80 overflow-y-auto rounded-(--radius-panel) bg-(--color-glass-strong) p-4",
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
        </div>

        <div className="border-t border-(--color-ink)/10 pt-3">
          <Secao>Exibição</Secao>
          <p className="m-0 mb-1.5 text-[13px] text-(--color-ink)">Rótulos nas mesas</p>
          <ToggleGroup<ModoRotulos>
            rotulo="Rótulos nas mesas"
            tamanho="sm"
            valor={exibicao.rotulos}
            onChange={(v) => onExibicao({ rotulos: v })}
            opcoes={OPCOES_ROTULOS}
            className="w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:px-1 [&>button]:text-[12px]"
          />
          <Chave ligada={exibicao.cadeiras} onChange={(v) => onExibicao({ cadeiras: v })} rotulo="Cadeiras" />
          <Chave ligada={exibicao.pessoas} onChange={(v) => onExibicao({ pessoas: v })} rotulo="Pessoas" desabilitada={!exibicao.cadeiras} />
          <Chave ligada={exibicao.sombras} onChange={(v) => onExibicao({ sombras: v })} rotulo="Sombras" />
          <p className="m-0 flex items-center justify-between gap-2 pb-1 text-[11px] leading-4 text-(--color-ink-3)">
            {personalizada ? "Ajuste manual." : "Padrão: cadeiras, pessoas e sombras saem em salões grandes ou máquinas fracas."}
            {personalizada && (
              <button type="button" onClick={onRestaurar} className="flex-none font-medium text-(--color-ink-2) underline underline-offset-2">
                Restaurar padrão
              </button>
            )}
          </p>
        </div>

        <div className="mt-2 border-t border-(--color-ink)/10 pt-3">
          <Secao>Câmera</Secao>
          <button
            type="button"
            className={botaoTexto + " w-full"}
            onClick={() => {
              camera.salvarVista();
              setVistaSalva(true);
              setTimeout(() => setVistaSalva(false), 1200);
            }}
          >
            {vistaSalva ? "Vista salva" : "Salvar vista atual como padrão"}
          </button>
          <button type="button" className={botaoTexto + " w-full"} onClick={camera.limparVista}>
            Restaurar vista de fábrica
          </button>
        </div>
      </div>
    </div>
  );
}
