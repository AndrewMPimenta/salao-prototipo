"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatarCentavos, type FormaPagamento } from "@/lib/conta";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export const FORMAS: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: "pix", rotulo: "Pix" },
  { valor: "credito", rotulo: "Crédito" },
  { valor: "debito", rotulo: "Débito" },
  { valor: "dinheiro", rotulo: "Dinheiro" },
];

export function rotuloForma(forma: FormaPagamento): string {
  return FORMAS.find((f) => f.valor === forma)?.rotulo ?? forma;
}

interface FolhaCobrancaProps {
  posicao: number;
  centavos: number;
  onConfirmar: (forma: FormaPagamento) => void;
  onFechar: () => void;
}

const SELETOR_FOCAVEL = "button:not([disabled]), input:not([disabled])";

/**
 * Confirmação da cobrança de uma posição, em folha sobre o detalhe. Depois de confirmar, mostra o
 * visto desenhando e se fecha sozinha: o retorno visual é calmo e curto, sem pedir novo toque.
 */
export function FolhaCobranca({ posicao, centavos, onConfirmar, onFechar }: FolhaCobrancaProps) {
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [paga, setPaga] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const quadro = requestAnimationFrame(() => setVisivel(true));
    raiz.current?.querySelector<HTMLElement>("input:checked")?.focus();
    return () => {
      cancelAnimationFrame(quadro);
      anterior?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!paga) return;
    const t = window.setTimeout(onFechar, 1500);
    return () => window.clearTimeout(t);
  }, [paga, onFechar]);

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onFechar();
      return;
    }
    if (e.key !== "Tab") return;

    // A folha é modal: o Tab circula só entre os controles dela.
    const focaveis = [...(raiz.current?.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL) ?? [])];
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  };

  const confirmar = () => {
    onConfirmar(forma);
    setPaga(true);
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-end overflow-hidden rounded-(--radius-panel) bg-(--color-ink)/35 transition-opacity duration-200",
        visivel ? "opacity-100" : "opacity-0",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !paga) onFechar();
      }}
    >
      <div
        ref={raiz}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onKeyDown={aoTeclar}
        className="animate-surgir w-full rounded-t-[20px] bg-(--color-surface) p-4 shadow-[0_-1px_0_var(--color-line),0_-12px_32px_-8px_rgb(40_30_15/0.25)]"
      >
        {paga ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <VistoAnimado />
            <div>
              <p id={idTitulo} className="m-0 text-[17px] font-semibold leading-6 text-(--color-ink)">
                Posição P{posicao} paga
              </p>
              <p className="tnum m-0 text-[13px] leading-5 text-(--color-ink-2)">
                {formatarCentavos(centavos)} · {rotuloForma(forma)}
              </p>
            </div>
            <Button variante="padrao" className="min-w-28 justify-center" onClick={onFechar}>
              Concluir
            </Button>
          </div>
        ) : (
          <>
            <p id={idTitulo} className="m-0 text-[15px] font-semibold leading-6 text-(--color-ink)">
              Cobrar posição P{posicao}
            </p>
            <p className="font-display tnum m-0 mt-1 text-[44px] text-(--color-ink)">{formatarCentavos(centavos)}</p>
            <p className="m-0 mt-1 text-[12px] leading-4 text-(--color-ink-3)">Cobrança simulada: nada é gravado.</p>

            <fieldset className="m-0 mt-4 min-w-0 border-0 p-0">
              <legend className="mb-2 p-0 text-[12px] font-medium leading-4 text-(--color-ink-2)">Forma de pagamento</legend>
              <div className="grid grid-cols-2 gap-2">
                {FORMAS.map((f) => (
                  <label key={f.valor} className="relative block">
                    <input
                      type="radio"
                      name={`forma-${idTitulo}`}
                      value={f.valor}
                      checked={forma === f.valor}
                      onChange={() => setForma(f.valor)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "grid min-h-11 cursor-pointer place-items-center rounded-(--radius-control) text-[13px] font-medium text-(--color-ink)",
                        "bg-(--color-raised) shadow-[inset_0_0_0_1px_var(--color-line)] transition-[background-color,color,transform] duration-100 active:scale-[0.97]",
                        "peer-checked:bg-(--color-accent) peer-checked:text-(--color-accent-ink) peer-checked:shadow-none",
                        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-focus)",
                      )}
                    >
                      {f.rotulo}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4 flex gap-2">
              <Button variante="padrao" className="flex-1 justify-center" onClick={onFechar}>
                Cancelar
              </Button>
              <Button variante="solido" className="flex-[1.6] justify-center" onClick={confirmar}>
                Confirmar cobrança
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** O círculo assenta e o traço do visto se desenha; a curva sem ressalto mantém o gesto calmo. */
function VistoAnimado() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const quadro = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(quadro);
  }, []);

  return (
    <span
      aria-hidden
      className="grid size-14 place-items-center rounded-full bg-(--color-brilho-livre)/16 text-(--color-brilho-livre)"
      style={{
        transform: pronto ? "scale(1)" : "scale(0.86)",
        opacity: pronto ? 1 : 0,
        transition: "transform 320ms var(--ease-out-soft), opacity 200ms ease-out",
      }}
    >
      <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="m5.5 12.5 4.2 4.2L18.5 7.8"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: pronto ? 0 : 1,
            transition: "stroke-dashoffset 420ms var(--ease-out-soft) 140ms",
          }}
        />
      </svg>
    </span>
  );
}
