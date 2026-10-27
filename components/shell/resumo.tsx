"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Resumo } from "./estatisticas";
import "./shell.css";

function useSegundos() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return s;
}

/** Os dados são de exemplo; o contador existe para a interface já nascer com o ritmo de um painel ao vivo. */
export function Atualizado({ className }: { className?: string }) {
  const s = useSegundos();
  const texto = s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;
  return (
    <p className={cn("m-0 flex items-center gap-2 text-[12px] text-(--color-ink-2)", className)}>
      <span aria-hidden className="ponto-vivo size-1.5 rounded-full bg-current text-(--color-ink-2)" />
      <span className="tnum">Atualizado há {texto}</span>
    </p>
  );
}

const Rotulo = ({ children }: { children: string }) => (
  <span className="block text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-(--color-ink-3)">{children}</span>
);

function itens(r: Resumo) {
  return [
    { rotulo: "Livres", n: r.livres },
    { rotulo: "Em atendimento", n: r.emAtendimento },
    { rotulo: "Atenção", n: r.atencao },
    { rotulo: "Pessoas", n: r.pessoas },
  ];
}

/** Lotação de cadeiras com um medidor fino. */
export function Lotacao({ resumo, className }: { resumo: Resumo; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Rotulo>Lotação</Rotulo>
      <div
        role="meter"
        aria-label="Lotação"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={resumo.lotacao}
        className="h-1 flex-1 overflow-hidden rounded-full bg-(--color-ink)/10"
      >
        <div
          className="h-full rounded-full bg-(--color-ink) transition-[width] duration-[600ms] ease-(--ease-out-soft)"
          style={{ width: `${resumo.lotacao}%` }}
        />
      </div>
      <span className="tnum font-[family-name:var(--font-mono)] text-[13px] font-semibold">{resumo.lotacao}%</span>
    </div>
  );
}

/** Grade 2×2 de numerais grandes, mais a lotação com um medidor fino. */
export function Estatisticas({ resumo }: { resumo: Resumo }) {
  return (
    <div>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3">
        {itens(resumo).map((i) => (
          <div key={i.rotulo}>
            <dt><Rotulo>{i.rotulo}</Rotulo></dt>
            <dd className="tnum m-0 font-[family-name:var(--font-mono)] text-[24px] font-semibold leading-8">{i.n}</dd>
          </div>
        ))}
      </dl>

      <Lotacao resumo={resumo} className="mt-3" />
    </div>
  );
}

/** Versão de uma linha para o peek do celular, onde a 2×2 não cabe. */
export function EstatisticasLinha({ resumo }: { resumo: Resumo }) {
  return (
    <dl className="m-0 grid grid-cols-4 gap-2">
      {itens(resumo).map((i) => (
        <div key={i.rotulo} className="min-w-0">
          <dd className="tnum m-0 font-[family-name:var(--font-mono)] text-[20px] font-semibold leading-6">{i.n}</dd>
          <dt className="truncate text-[11px] leading-4 text-(--color-ink-3)">{i.rotulo === "Em atendimento" ? "Atendimento" : i.rotulo}</dt>
        </div>
      ))}
    </dl>
  );
}
