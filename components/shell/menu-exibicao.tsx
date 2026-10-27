"use client";

import { useEffect, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import type { Destaque, Exibicao, ModoRotulos, Perfil } from "@/lib/exibicao";
import { cn } from "@/lib/utils";
import { ToggleGroup } from "../ui/toggle-group";
import { BotaoIcone } from "./botao-icone";
import { IconeOlho } from "./icones";
import { useAncoragem, type Lado } from "@/hooks/use-ancoragem";
import { materializar } from "./materializar";

export function Chave({ ligada, onChange, rotulo, desabilitada }: { ligada: boolean; onChange: (v: boolean) => void; rotulo: string; desabilitada?: boolean }) {
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

const OPCOES_ROTULOS: { valor: ModoRotulos; rotulo: string }[] = [
  { valor: "hover", rotulo: "Ao passar o mouse" },
  { valor: "sempre", rotulo: "Números" },
];

const OPCOES_PERFIL: { valor: Perfil; rotulo: string }[] = [
  { valor: "maitre", rotulo: "Maître" },
  { valor: "completo", rotulo: "Completo" },
];

const OPCOES_DESTAQUE: { valor: Destaque; rotulo: string }[] = [
  { valor: "borda", rotulo: "Borda" },
  { valor: "tampo", rotulo: "Tampo" },
  { valor: "brilho", rotulo: "Brilho" },
];

export interface PropsExibicao {
  exibicao: Exibicao;
  onExibicao: (patch: Partial<Exibicao>) => void;
  personalizada: boolean;
  onRestaurar: () => void;
}

export const exibicaoDe = (s: Salao): PropsExibicao => ({
  exibicao: s.exibicao,
  onExibicao: s.definirExibicao,
  personalizada: s.exibicaoPersonalizada,
  onRestaurar: s.restaurarExibicao,
});

/** Os ajustes de exibição, com um só estado gravado: o mesmo painel serve o menu da pilha e a ajuda. */
export function PainelExibicao({ exibicao, onExibicao, personalizada, onRestaurar }: PropsExibicao) {
  return (
    <>
      <p className="m-0 mt-2 mb-1.5 text-[13px] text-(--color-ink)">Perfil</p>
      <ToggleGroup<Perfil>
        rotulo="Perfil de visão"
        tamanho="sm"
        valor={exibicao.perfil}
        onChange={(v) => onExibicao({ perfil: v })}
        opcoes={OPCOES_PERFIL}
        className="mb-1 w-full [&>button]:flex-1 [&>button]:px-1 [&>button]:text-[12px]"
      />
      <p className="m-0 mb-2 text-[11px] leading-4 text-(--color-ink-3)">
        {exibicao.perfil === "maitre" ? "Só a ocupação: o que está livre, reservado e em atendimento." : "Acrescenta consumo, comandas e posições simulados."}
      </p>
      <p className="m-0 mt-2 mb-1.5 text-[13px] text-(--color-ink)">Destaque da mesa</p>
      <ToggleGroup<Destaque>
        rotulo="Destaque da mesa"
        tamanho="sm"
        valor={exibicao.destaque}
        onChange={(v) => onExibicao({ destaque: v })}
        opcoes={OPCOES_DESTAQUE}
        className="mb-1 w-full [&>button]:flex-1 [&>button]:px-1 [&>button]:text-[12px]"
      />
      <Chave ligada={exibicao.cadeiras} onChange={(v) => onExibicao({ cadeiras: v })} rotulo="Cadeiras" />
      <Chave ligada={exibicao.pessoas} onChange={(v) => onExibicao({ pessoas: v })} rotulo="Pessoas" desabilitada={!exibicao.cadeiras} />
      <Chave ligada={exibicao.sombras} onChange={(v) => onExibicao({ sombras: v })} rotulo="Sombras" />
      <p className="m-0 mt-1 mb-1.5 text-[13px] text-(--color-ink)">Rótulos</p>
      <ToggleGroup<ModoRotulos>
        rotulo="Rótulos nas mesas"
        tamanho="sm"
        valor={exibicao.rotulos}
        onChange={(v) => onExibicao({ rotulos: v })}
        opcoes={OPCOES_ROTULOS}
        className="w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:px-1 [&>button]:text-[12px]"
      />
      <p className="m-0 flex items-center justify-between gap-2 pt-2 pb-1 text-[11px] leading-4 text-(--color-ink-3)">
        {personalizada ? "Ajuste manual." : "De longe, cadeiras e pessoas somem sozinhas."}
        {personalizada && (
          <button type="button" onClick={onRestaurar} className="flex-none font-medium text-(--color-ink-2) underline underline-offset-2">
            Restaurar padrão
          </button>
        )}
      </p>
    </>
  );
}

/** Botão da barra de ferramentas que abre os ajustes num vidro ancorado nele, do lado que a barra deixa livre. */
export function MenuExibicao({ lado = "esquerda", ...props }: PropsExibicao & { lado?: Lado }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const { botao, pop, estilo } = useAncoragem(aberto, lado);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // O Esc fecha o menu sem também limpar a mesa em foco.
      e.preventDefault();
      setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc, true);
    };
  }, [aberto]);

  return (
    <div
      ref={(el) => {
        raiz.current = el;
        botao.current = el;
      }}
      className="relative"
    >
      <BotaoIcone rotulo="Exibição" expandido={aberto} pressionado={aberto} onClick={() => setAberto((v) => !v)}>
        <IconeOlho />
      </BotaoIcone>
      <div
        role="dialog"
        aria-label="Exibição"
        ref={pop}
        style={estilo}
        inert={!aberto}
        className={cn(
          "glass absolute z-30 w-64 rounded-[18px] px-3 pt-1 pb-2",
          materializar(aberto),
        )}
      >
        <PainelExibicao {...props} />
      </div>
    </div>
  );
}
