"use client";

import { useEffect, useState } from "react";
import type { Perfil } from "@/lib/exibicao";
import { cn } from "@/lib/utils";
import { AmostraEstado } from "../amostra-estado";
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

/** "13 comandas abertas em 5 mesas": a mesa é onde se senta, a comanda é o que se cobra. */
export function textoComandas(r: Resumo) {
  const c = `${r.comandas} ${r.comandas === 1 ? "comanda aberta" : "comandas abertas"}`;
  return `${c} em ${r.ocupadas} ${r.ocupadas === 1 ? "mesa" : "mesas"}`;
}

/** Para o maître: o que ele precisa saber do salão, sem comanda nem valor. */
export function textoAtendimento(r: Resumo) {
  const m = `${r.ocupadas} ${r.ocupadas === 1 ? "mesa em atendimento" : "mesas em atendimento"}`;
  return `${m} · ${r.pessoas} ${r.pessoas === 1 ? "pessoa" : "pessoas"}`;
}

const Rotulo = ({ children }: { children: string }) => (
  <span className="block text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-(--color-ink-3)">{children}</span>
);

function itens(r: Resumo) {
  return [
    { rotulo: "Livres", n: r.livres },
    { rotulo: "Ocupadas", n: r.ocupadas },
    { rotulo: "Com alerta", n: r.atencao },
    { rotulo: "Pessoas", n: r.pessoas },
  ];
}

function itensMaitre(r: Resumo) {
  return [
    { rotulo: "Em atendimento", n: r.ocupadas },
    { rotulo: "Reservadas", n: r.contagem.reservada },
  ];
}

interface PropsLivres {
  resumo: Resumo;
  /** Livres vira o filtro rápido: o atalho L faz o mesmo. */
  onLivres?: () => void;
  livresAtivo?: boolean;
  tamanho: "grande" | "medio";
}

/** O numeral que o maître procura primeiro; clicar mostra só as livres. */
function Livres({ resumo, onLivres, livresAtivo, tamanho }: PropsLivres) {
  const grande = tamanho === "grande";
  return (
    <button
      type="button"
      onClick={onLivres}
      aria-pressed={livresAtivo}
      aria-label={`${resumo.livres} mesas livres. ${livresAtivo ? "Mostrar todas" : "Mostrar só as livres (L)"}`}
      className={cn(
        "-m-1.5 min-w-0 rounded-[14px] p-1.5 text-left transition-[background-color,scale] duration-100 hover:bg-(--color-ink)/6 active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-focus)",
        livresAtivo && "bg-(--color-ink)/8",
      )}
    >
      <span className="flex items-center gap-1.5">
        <AmostraEstado estado="livre" className="size-3" />
        <Rotulo>Livres</Rotulo>
      </span>
      <span
        className={cn(
          "tnum block font-[family-name:var(--font-mono)] font-semibold",
          grande ? "text-[44px] leading-[48px]" : "text-[32px] leading-9",
        )}
      >
        {resumo.livres}
        <span className="ml-1.5 text-[13px] font-medium text-(--color-ink-3)">de {resumo.total}</span>
      </span>
    </button>
  );
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

interface PropsEstatisticas {
  resumo: Resumo;
  perfil?: Perfil;
  onLivres?: () => void;
  livresAtivo?: boolean;
}

/** Grade 2×2 de numerais grandes, mais a lotação com um medidor fino. No Maître, Livres leva a cena. */
export function Estatisticas({ resumo, perfil = "completo", onLivres, livresAtivo }: PropsEstatisticas) {
  if (perfil === "maitre") {
    return (
      <div>
        <Livres resumo={resumo} onLivres={onLivres} livresAtivo={livresAtivo} tamanho="grande" />
        <dl className="m-0 mt-3 grid grid-cols-2 gap-x-6">
          {itensMaitre(resumo).map((i) => (
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
export function EstatisticasLinha({ resumo, perfil = "completo", onLivres, livresAtivo }: PropsEstatisticas) {
  if (perfil === "maitre") {
    return (
      <div className="flex items-end gap-5">
        <Livres resumo={resumo} onLivres={onLivres} livresAtivo={livresAtivo} tamanho="medio" />
        <dl className="m-0 grid min-w-0 flex-1 grid-cols-2 gap-x-3 pb-0.5">
          {itensMaitre(resumo).map((i) => (
            <div key={i.rotulo} className="min-w-0">
              <dd className="tnum m-0 font-[family-name:var(--font-mono)] text-[20px] font-semibold leading-6">{i.n}</dd>
              <dt className="truncate text-[11px] leading-4 text-(--color-ink-3)">{i.rotulo}</dt>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <dl className="m-0 grid grid-cols-4 gap-2">
      {itens(resumo).map((i) => (
        <div key={i.rotulo} className="min-w-0">
          <dd className="tnum m-0 font-[family-name:var(--font-mono)] text-[20px] font-semibold leading-6">{i.n}</dd>
          <dt className="truncate text-[11px] leading-4 text-(--color-ink-3)">{i.rotulo}</dt>
        </div>
      ))}
    </dl>
  );
}
