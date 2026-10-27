"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAncoragem, type Lado } from "@/hooks/use-ancoragem";
import {
  ROTULO_FERRAMENTA,
  type ConfigBarra,
  type IdFerramenta,
  type Orientacao,
} from "@/hooks/use-barra-ferramentas";
import { ToggleGroup } from "../ui/toggle-group";
import { BotaoIcone } from "./botao-icone";
import { IconeAlca, IconeLapis } from "./icones";
import { materializar } from "./materializar";
import { Chave } from "./menu-exibicao";

const LINHA = 44;

interface EditorBarraProps {
  config: ConfigBarra;
  lado: Lado;
  personalizada: boolean;
  onConfig: (patch: Partial<ConfigBarra>) => void;
  onRestaurar: () => void;
}

interface Arrasto {
  id: IdFerramenta;
  de: number;
  alvo: number;
  dy: number;
  inicio: number;
  solto: boolean;
}

/** Lápis da barra: abre um vidro para escolher orientação, ordem e quais botões aparecem. */
export function EditorBarra({ config, lado, personalizada, onConfig, onRestaurar }: EditorBarraProps) {
  const [aberto, setAberto] = useState(false);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [aviso, setAviso] = useState("");
  const raiz = useRef<HTMLDivElement | null>(null);
  const lista = useRef<HTMLUListElement>(null);
  const focar = useRef<IdFerramenta | null>(null);
  const timer = useRef(0);
  const { botao, pop, estilo } = useAncoragem(aberto, lado, `${config.orientacao}${config.ocultas.length}`);
  const { ordem, ocultas } = config;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // O Esc fecha o editor sem também limpar a mesa em foco.
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

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Mover o nó no DOM tira o foco dele; devolve ao mesmo botão depois da troca.
  useLayoutEffect(() => {
    if (!focar.current) return;
    lista.current?.querySelector<HTMLElement>(`[data-id="${focar.current}"]`)?.focus();
    focar.current = null;
  }, [ordem]);

  const mover = (de: number, para: number) => {
    const prox = [...ordem];
    const [id] = prox.splice(de, 1);
    prox.splice(para, 0, id);
    onConfig({ ordem: prox });
    return id;
  };

  const teclar = (e: React.KeyboardEvent, i: number) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    const para = i + (e.key === "ArrowUp" ? -1 : 1);
    if (para < 0 || para >= ordem.length) return;
    e.preventDefault();
    const id = mover(i, para);
    focar.current = id;
    setAviso(`${ROTULO_FERRAMENTA[id]}, posição ${para + 1} de ${ordem.length}`);
  };

  const pressionar = (e: React.PointerEvent<HTMLElement>, id: IdFerramenta, i: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ponteiro já encerrado: o arrasto segue pelos eventos do próprio alvo.
    }
    setArrasto({ id, de: i, alvo: i, dy: 0, inicio: e.clientY, solto: false });
  };

  const arrastar = (e: React.PointerEvent) => {
    const y = e.clientY;
    setArrasto((a) => {
      if (!a || a.solto) return a;
      const dy = Math.min(Math.max(y - a.inicio, -a.de * LINHA), (ordem.length - 1 - a.de) * LINHA);
      return { ...a, dy, alvo: Math.round(a.de + dy / LINHA) };
    });
  };

  const soltar = () => {
    if (!arrasto || arrasto.solto) return;
    const { de, alvo } = arrasto;
    setArrasto({ ...arrasto, dy: (alvo - de) * LINHA, solto: true });
    // A peça assenta na vaga antes de a lista trocar de verdade.
    timer.current = window.setTimeout(() => {
      if (alvo !== de) mover(de, alvo);
      setArrasto(null);
    }, 200);
  };

  const deslocamento = (id: IdFerramenta, i: number) => {
    if (!arrasto) return 0;
    if (arrasto.id === id) return arrasto.dy;
    if (arrasto.alvo > arrasto.de && i > arrasto.de && i <= arrasto.alvo) return -LINHA;
    if (arrasto.alvo < arrasto.de && i < arrasto.de && i >= arrasto.alvo) return LINHA;
    return 0;
  };

  return (
    <div
      ref={(el) => {
        raiz.current = el;
        botao.current = el;
      }}
      className="relative"
    >
      <BotaoIcone rotulo="Personalizar barra" expandido={aberto} pressionado={aberto} onClick={() => setAberto((v) => !v)}>
        <IconeLapis />
      </BotaoIcone>

      <div
        ref={pop}
        role="dialog"
        aria-label="Personalizar barra de ferramentas"
        style={estilo}
        inert={!aberto}
        className={cn("glass absolute z-30 w-72 rounded-[18px] px-3 pt-3 pb-2", materializar(aberto))}
      >
        <p className="m-0 mb-1.5 text-[13px] text-(--color-ink)">Orientação</p>
        <ToggleGroup<Orientacao>
          rotulo="Orientação da barra"
          tamanho="sm"
          valor={config.orientacao}
          onChange={(v) => onConfig({ orientacao: v })}
          opcoes={[
            { valor: "vertical", rotulo: "Vertical" },
            { valor: "horizontal", rotulo: "Horizontal" },
          ]}
          className="w-full [&>button]:flex-1"
        />

        <p className="m-0 mt-3 mb-0.5 text-[13px] text-(--color-ink)">Botões</p>
        <ul ref={lista} className="m-0 list-none p-0">
          {ordem.map((id, i) => {
            const ativo = arrasto?.id === id;
            return (
              <li
                key={id}
                data-id={id}
                tabIndex={0}
                aria-label={`${ROTULO_FERRAMENTA[id]}, posição ${i + 1} de ${ordem.length}. Alt com seta para cima ou para baixo reordena.`}
                onKeyDown={(e) => teclar(e, i)}
                style={{ transform: `translateY(${deslocamento(id, i)}px)` }}
                className={cn(
                  "relative flex h-11 items-center gap-1 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-focus)",
                  ativo && "z-10 bg-(--color-raised) shadow-(--shadow-float)",
                  // Enquanto o dedo segura a peça ela segue 1:1; só as outras e o assentar animam.
                  (!ativo || arrasto?.solto) && "transition-transform duration-200 ease-(--ease-out-soft)",
                )}
              >
                <span
                  aria-hidden
                  onPointerDown={(e) => pressionar(e, id, i)}
                  onPointerMove={arrastar}
                  onPointerUp={soltar}
                  onPointerCancel={soltar}
                  className="grid h-11 w-8 flex-none cursor-grab touch-none place-items-center text-(--color-ink-3) active:cursor-grabbing"
                >
                  <IconeAlca />
                </span>
                <div className="min-w-0 flex-1 pr-1">
                  <Chave
                    ligada={!ocultas.includes(id)}
                    rotulo={ROTULO_FERRAMENTA[id]}
                    onChange={(v) => onConfig({ ocultas: v ? ocultas.filter((o) => o !== id) : [...ocultas, id] })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p aria-live="polite" className="sr-only">{aviso}</p>

        <div className="mt-1 border-t border-(--color-ink)/10 pt-1">
          <button
            type="button"
            disabled={!personalizada}
            onClick={onRestaurar}
            className="flex min-h-9 w-full items-center rounded-[10px] px-2 text-left text-[13px] font-medium text-(--color-ink-2) hover:bg-(--color-ink)/8 hover:text-(--color-ink) disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
          >
            Restaurar padrão
          </button>
        </div>
      </div>
    </div>
  );
}
