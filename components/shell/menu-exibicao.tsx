"use client";

import { useEffect, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import type { Assentos, Destaque, Exibicao, ModoRotulos, Perfil } from "@/lib/exibicao";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { Segmentado } from "./segmentado";
import { BotaoIcone } from "./botao-icone";
import { IconeOlho } from "./icones";
import { useAncoragem, type Lado } from "@/hooks/use-ancoragem";
import { materializar } from "./materializar";

export function Chave({ ligada, onChange, rotulo, desabilitada }: { ligada: boolean; onChange: (v: boolean) => void; rotulo: string; desabilitada?: boolean }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4 text-[13px] text-foreground", desabilitada && "cursor-default opacity-45")}>
      {rotulo}
      <Switch checked={ligada} disabled={desabilitada} aria-label={rotulo} onCheckedChange={onChange} />
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

const OPCOES_ASSENTOS: { valor: Assentos; rotulo: string }[] = [
  { valor: "nenhum", rotulo: "Nenhum" },
  { valor: "simplificado", rotulo: "Simplificado" },
  { valor: "completo", rotulo: "Completo" },
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
      <p className="m-0 mt-2 mb-1.5 text-[13px] text-foreground">Perfil</p>
      <Segmentado<Perfil>
        rotulo="Perfil de visão"
        valor={exibicao.perfil}
        onChange={(v) => onExibicao({ perfil: v })}
        opcoes={OPCOES_PERFIL}
      />
      <p className="m-0 mb-2 text-[11px] leading-4 text-muted-foreground">
        {exibicao.perfil === "maitre" ? "Só a ocupação: o que está livre, reservado e em atendimento." : "Acrescenta consumo, comandas e posições simulados."}
      </p>
      <p className="m-0 mt-2 mb-1.5 text-[13px] text-foreground">Destaque da mesa</p>
      <Segmentado<Destaque>
        rotulo="Destaque da mesa"
        valor={exibicao.destaque}
        onChange={(v) => onExibicao({ destaque: v })}
        opcoes={OPCOES_DESTAQUE}
      />
      <p className="m-0 mt-2 mb-1.5 text-[13px] text-foreground">Assentos</p>
      <Segmentado<Assentos>
        rotulo="Nível de detalhe dos assentos"
        valor={exibicao.assentos}
        onChange={(v) => onExibicao({ assentos: v })}
        opcoes={OPCOES_ASSENTOS}
      />
      <p className="m-0 mb-1 text-[11px] leading-4 text-muted-foreground">Simplificado: lugares como pinos; Completo: cadeiras e pessoas</p>
      <Chave ligada={exibicao.sombras} onChange={(v) => onExibicao({ sombras: v })} rotulo="Sombras" />
      <p className="m-0 mt-1 mb-1.5 text-[13px] text-foreground">Rótulos</p>
      <Segmentado<ModoRotulos>
        rotulo="Rótulos nas mesas"
        valor={exibicao.rotulos}
        onChange={(v) => onExibicao({ rotulos: v })}
        opcoes={OPCOES_ROTULOS}
      />
      <p className="m-0 flex items-center justify-between gap-2 pt-2 pb-1 text-[11px] leading-4 text-muted-foreground">
        {personalizada ? "Ajuste manual." : "De longe, os assentos somem sozinhos."}
        {personalizada && (
          <button type="button" onClick={onRestaurar} className="flex-none font-medium text-muted-foreground underline underline-offset-2">
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
          "absolute z-30 w-64 rounded-xl border bg-popover px-3 pt-1 pb-2 text-popover-foreground shadow-lg",
          materializar(aberto),
        )}
      >
        <PainelExibicao {...props} />
      </div>
    </div>
  );
}
