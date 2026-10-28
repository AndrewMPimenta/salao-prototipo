"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Ambiente, Mesa } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconeCheck } from "../detalhe/icones";
import "./shell.css";

interface SeletorAmbienteProps {
  ambientes: Ambiente[];
  mesas: Mesa[];
  ativo: string;
  onChange: (id: string) => void;
  /** "painel": lista que desce do botão (desktop). "movel": chips, ou folha inferior a partir de LIMITE_CHIPS salões. */
  variante: "painel" | "movel";
  className?: string;
}

/** Acima disso os chips viram tarefa de rolagem e a folha com lista lê melhor em 375px. */
const LIMITE_CHIPS = 5;
const SAIDA_MS = 120;

const indice = (i: number) => String(i + 1).padStart(2, "0");

function medir(mesas: Mesa[], ambienteId: string) {
  let total = 0;
  let ocupadas = 0;
  let pessoas = 0;
  let lugares = 0;
  for (const m of mesas) {
    if (m.ambienteId !== ambienteId) continue;
    total++;
    if (m.pessoas > 0) ocupadas++;
    pessoas += m.pessoas;
    lugares += m.lugares;
  }
  return { total, ocupadas, lotacao: lugares ? Math.min(100, Math.round((pessoas / lugares) * 100)) : 0 };
}

export function SeletorAmbiente(props: SeletorAmbienteProps) {
  if (props.variante === "movel" && props.ambientes.length < LIMITE_CHIPS) return <Chips {...props} />;
  return <Dropdown {...props} folha={props.variante === "movel"} />;
}

type Estado = "fechado" | "aberto" | "fechando";

function Dropdown({ ambientes, mesas, ativo, onChange, folha, className }: SeletorAmbienteProps & { folha: boolean }) {
  const [estado, setEstado] = useState<Estado>("fechado");
  const [destaque, setDestaque] = useState(0);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const busca = useRef({ texto: "", t: 0 });
  const id = useId();
  const idOpcao = (i: number) => `${id}-op-${i}`;
  const aberto = estado === "aberto";

  const indiceAtivo = Math.max(0, ambientes.findIndex((a) => a.id === ativo));
  const atual = ambientes[indiceAtivo];
  const dados = useMemo(() => ambientes.map((a) => medir(mesas, a.id)), [ambientes, mesas]);

  const abrir = useCallback(() => {
    setDestaque(indiceAtivo);
    setEstado("aberto");
  }, [indiceAtivo]);

  const fechar = useCallback((devolverFoco = true) => {
    setEstado((e) => (e === "aberto" ? "fechando" : e));
    if (devolverFoco) botao.current?.focus({ preventScroll: true });
  }, []);

  // A saída termina por tempo, não por animationend: com movimento reduzido ou aba oculta o evento pode não vir.
  useEffect(() => {
    if (estado !== "fechando") return;
    const t = setTimeout(() => setEstado("fechado"), SAIDA_MS);
    return () => clearTimeout(t);
  }, [estado]);

  useLayoutEffect(() => {
    if (!aberto) return;
    lista.current?.focus({ preventScroll: true });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    document.getElementById(idOpcao(destaque))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destaque, aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (raiz.current?.contains(alvo) || lista.current?.contains(alvo)) return;
      fechar(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto, fechar]);

  const escolher = (i: number) => {
    const a = ambientes[i];
    if (a && a.id !== ativo) onChange(a.id);
    fechar();
  };

  const aoTeclarBotao = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      abrir();
    }
  };

  const aoTeclarLista = (e: React.KeyboardEvent) => {
    const ultimo = ambientes.length - 1;
    switch (e.key) {
      case "ArrowDown": setDestaque((d) => Math.min(ultimo, d + 1)); break;
      case "ArrowUp": setDestaque((d) => Math.max(0, d - 1)); break;
      case "Home": setDestaque(0); break;
      case "End": setDestaque(ultimo); break;
      case "Enter":
      case " ": escolher(destaque); break;
      case "Escape": fechar(); break;
      case "Tab": fechar(false); return;
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        // Digitar em sequência refina o prefixo; a pausa recomeça a busca.
        const b = busca.current;
        const agora = Date.now();
        b.texto = agora - b.t > 600 ? e.key : b.texto + e.key;
        b.t = agora;
        const alvo = b.texto.toLocaleLowerCase("pt-BR");
        const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
        const i = ambientes.findIndex((a) => norm(a.nome).startsWith(norm(alvo)));
        if (i >= 0) setDestaque(i);
        break;
      }
    }
    e.preventDefault();
  };

  const conteudo = estado !== "fechado" && (
    <div
      ref={lista}
      role="listbox"
      tabIndex={-1}
      aria-label="Salões e mesas"
      aria-activedescendant={idOpcao(destaque)}
      onKeyDown={aoTeclarLista}
      data-estado={estado}
      data-folha={folha ? "" : undefined}
      className={cn(
        // pointer-events-auto: a lista desce dentro do header `pointer-events-none` e herdaria o "none", deixando o clique cair na cena.
        "lista-ambiente glass pointer-events-auto scrollbar-none overflow-y-auto overscroll-contain outline-none",
        folha
          ? "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 max-h-[70dvh] rounded-[26px] p-2"
          : "absolute left-1/2 top-[calc(100%+8px)] z-30 max-h-[min(70dvh,520px)] w-[380px] -translate-x-1/2 rounded-[22px] p-1.5",
      )}
    >
      {folha && (
        <p className="m-0 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">
          Salões e mesas
        </p>
      )}
      {ambientes.map((a, i) => {
        const d = dados[i];
        const selecionado = a.id === ativo;
        return (
          <div
            key={a.id}
            id={idOpcao(i)}
            role="option"
            aria-selected={selecionado}
            aria-label={`${a.nome}, ${d.ocupadas} de ${d.total} mesas ocupadas`}
            style={{ "--i": i } as React.CSSProperties}
            onPointerMove={() => setDestaque(i)}
            onClick={() => escolher(i)}
            className={cn(
              "flex cursor-default items-center gap-2.5 rounded-[14px] px-3 transition-colors duration-100",
              folha ? "min-h-14" : "min-h-11",
              i === destaque && "bg-(--color-ink)/7",
            )}
          >
            <span aria-hidden className="tnum w-5 flex-none font-[family-name:var(--font-mono)] text-[12px] text-(--color-ink-3)">
              {indice(i)}
            </span>
            <span className={cn("min-w-0 flex-1 text-[15px] font-medium text-(--color-ink)", folha ? "py-2 leading-5" : "truncate")}>{a.nome}</span>
            <span aria-hidden className="tnum flex-none font-[family-name:var(--font-mono)] text-[13px] text-(--color-ink-2)">
              {d.ocupadas}/{d.total}
            </span>
            <span aria-hidden className="h-1 w-10 flex-none overflow-hidden rounded-full bg-(--color-ink)/10">
              <span className="block h-full rounded-full bg-(--color-ink)" style={{ width: `${d.lotacao}%` }} />
            </span>
            <span aria-hidden className="grid size-4 flex-none place-items-center text-(--color-ink)">
              {selecionado && <IconeCheck className="size-4" />}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={raiz} className={cn("relative min-w-0", className)}>
      <button
        ref={botao}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`Salão: ${atual?.nome}, ${dados[indiceAtivo]?.ocupadas} de ${dados[indiceAtivo]?.total} mesas ocupadas`}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={aoTeclarBotao}
        className={cn(
          "glass pointer-events-auto flex w-full items-center gap-3 rounded-[22px] px-4 text-left transition-[scale] duration-100 active:scale-[0.99]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
          folha ? "h-12" : "h-12 min-w-[320px]",
        )}
      >
        <span aria-hidden className="tnum flex-none font-[family-name:var(--font-mono)] text-[12px] text-(--color-ink-3)">
          {indice(indiceAtivo)}
        </span>
        <span aria-hidden className="min-w-0 flex-1 truncate text-[15px] font-medium text-(--color-ink)">{atual?.nome}</span>
        <span aria-hidden className="tnum flex-none font-[family-name:var(--font-mono)] text-[13px] text-(--color-ink-2)">
          {dados[indiceAtivo]?.ocupadas}/{dados[indiceAtivo]?.total}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn("size-4 flex-none text-(--color-ink-2) transition-transform duration-200", aberto && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {atual?.ilustrativo && (
        <span
          title="Mesas conforme o cliente; planta fictícia até recebermos a real"
          className="glass pointer-events-auto absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-(--color-ink-2)"
        >
          Layout ilustrativo
        </span>
      )}

      {folha
        ? conteudo &&
          createPortal(
            <>
              <div data-estado={estado} className="lista-ambiente-fundo fixed inset-0 z-50 bg-black/25" aria-hidden />
              {conteudo}
            </>,
            document.body,
          )
        : conteudo}
    </div>
  );
}

/** Poucos salões no celular: chips que rolam, cada um com seu índice e ocupadas/total. */
function Chips({ ambientes, mesas, ativo, onChange, className }: SeletorAmbienteProps) {
  const rolagem = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const [bordas, setBordas] = useState({ esq: false, dir: false });
  const MARGEM = 16;

  const medirBordas = useCallback(() => {
    const el = rolagem.current;
    if (!el) return;
    const esq = el.scrollLeft > 2;
    const dir = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setBordas((b) => (b.esq === esq && b.dir === dir ? b : { esq, dir }));
  }, []);

  useLayoutEffect(() => {
    const el = rolagem.current;
    const btn = trilho.current?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!el || !btn) return;
    // Só rola se a opção ativa estiver escondida ou sob a máscara; centralizar empurrava o primeiro chip para o degradê.
    const fim = btn.offsetLeft + btn.offsetWidth;
    if (btn.offsetLeft < el.scrollLeft + MARGEM) el.scrollTo({ left: Math.max(0, btn.offsetLeft - MARGEM), behavior: "smooth" });
    else if (fim > el.scrollLeft + el.clientWidth - MARGEM) el.scrollTo({ left: fim - el.clientWidth + MARGEM, behavior: "smooth" });
    medirBordas();
    const obs = new ResizeObserver(medirBordas);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ativo, ambientes, medirBordas]);

  const M = `${MARGEM}px`;
  const mascara = `linear-gradient(90deg, ${bordas.esq ? "transparent" : "#000"}, #000 ${M}, #000 calc(100% - ${M}), ${bordas.dir ? "transparent" : "#000"})`;

  return (
    <div
      ref={rolagem}
      onScroll={medirBordas}
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
      className={cn("scrollbar-none -mx-4 -mb-3 snap-x snap-proximity overflow-x-auto overscroll-x-contain px-4 pb-3 pt-1", className)}
    >
      <div ref={trilho} role="group" aria-label="Ambiente" className="relative inline-flex gap-2">
        {ambientes.map((a, i) => {
          const { total, ocupadas } = medir(mesas, a.id);
          const selecionado = a.id === ativo;

          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={selecionado}
              aria-label={`${a.nome}, ${ocupadas} de ${total} mesas ocupadas`}
              onClick={() => onChange(a.id)}
              className={cn(
                "flex h-11 flex-none snap-start items-center whitespace-nowrap font-medium transition-[color,scale,background-color] duration-100 active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
              )}
            >
              {/* Chip de 36px visuais dentro de um alvo de 44px. */}
              <span
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3.5 text-[15px]",
                  selecionado
                    ? "bg-(--color-accent) text-(--color-accent-ink)"
                    : "bg-(--color-glass-strong) text-(--color-ink) shadow-[inset_0_1px_0_var(--color-glass-edge),0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent),0_4px_12px_-4px_rgb(40_30_15/0.2)]",
                )}
              >
                <span className={cn("tnum font-[family-name:var(--font-mono)] text-[12px]", selecionado ? "opacity-60" : "text-(--color-ink-3)")}>
                  {indice(i)}
                </span>
                {a.nome}
                <span className={cn("tnum font-[family-name:var(--font-mono)] text-[13px] font-medium", selecionado ? "opacity-70" : "text-(--color-ink-3)")}>
                  {ocupadas}/{total}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
