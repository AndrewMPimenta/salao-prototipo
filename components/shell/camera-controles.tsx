"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Salao } from "@/hooks/use-salao";
import { BotaoIcone } from "./botao-icone";
import { IconeAlvo, IconeBussola, IconeMais, IconeMarcador, IconeMenos, ICONE_PRESET } from "./icones";
import { materializar } from "./materializar";
import { MenuExibicao, type PropsExibicao } from "./menu-exibicao";
import { PRESETS, ROTULO_PRESET } from "./tipos";

type Camera = Salao["camera"];

function Bussola({ camera }: { camera: Camera }) {
  const az = useSyncExternalStore(camera.assinarAzimute, camera.lerAzimute, () => 0);
  return (
    <BotaoIcone rotulo="Norte: realinhar a vista" onClick={camera.norte}>
      <IconeBussola graus={(-az * 180) / Math.PI} />
    </BotaoIcone>
  );
}

/** Vista padrão por ambiente: o menu abre à esquerda da pilha, onde há espaço, e fecha com Esc ou clique fora. */
function MenuVista({ camera }: { camera: Camera }) {
  const [aberto, setAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const item =
    "flex h-11 w-full items-center whitespace-nowrap rounded-[14px] px-3 text-left text-[13px] font-medium text-(--color-ink) hover:bg-(--color-ink)/8 active:bg-(--color-ink)/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)";

  return (
    <div ref={raiz} className="relative">
      <BotaoIcone rotulo="Vista padrão" expandido={aberto} onClick={() => setAberto((v) => !v)}>
        <IconeMarcador />
      </BotaoIcone>
      {aberto && (
        <div
          role="menu"
          aria-label="Vista padrão"
          className="glass absolute right-[calc(100%+8px)] bottom-0 z-30 flex w-60 flex-col rounded-[18px] p-1"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              camera.salvarVista();
              setSalvo(true);
              setTimeout(() => {
                setSalvo(false);
                setAberto(false);
              }, 900);
            }}
          >
            {salvo ? "Vista salva" : "Salvar vista atual como padrão"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              camera.limparVista();
              setAberto(false);
            }}
          >
            Restaurar padrão de fábrica
          </button>
        </div>
      )}
    </div>
  );
}

const Divisoria = () => <span aria-hidden className="mx-2 h-px bg-(--color-ink)/10" />;

/** Pilha vertical de vidro: zoom, bússola e recentralizar. */
function Pilha({ camera, children }: { camera: Camera; children?: ReactNode }) {
  return (
    <div role="group" aria-label="Navegação da câmera" className="glass flex flex-col rounded-[22px] p-1">
      <BotaoIcone rotulo="Aproximar" onClick={() => camera.zoomar(1)}><IconeMais /></BotaoIcone>
      <BotaoIcone rotulo="Afastar" onClick={() => camera.zoomar(-1)}><IconeMenos /></BotaoIcone>
      <Divisoria />
      <Bussola camera={camera} />
      <BotaoIcone rotulo="Recentralizar" onClick={camera.recentralizar}><IconeAlvo /></BotaoIcone>
      <MenuVista camera={camera} />
      {children}
    </div>
  );
}

/** Segmentado com o indicador deslizando por translate, como o ToggleGroup. */
function SeletorPreset({ camera }: { camera: Camera }) {
  const i = PRESETS.indexOf(camera.vistaCamera);
  return (
    <div role="group" aria-label="Ângulo da câmera" className="glass relative grid w-72 grid-cols-3 rounded-[22px] p-1">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-[18px] bg-(--color-raised) shadow-[0_1px_2px_rgb(40_30_15/0.18),0_0_0_1px_var(--color-line)] transition-[translate] duration-[280ms] ease-(--ease-out-soft)"
        style={{ translate: `${i * 100}% 0` }}
      />
      {PRESETS.map((p, n) => {
        const Icone = ICONE_PRESET[p];
        return (
          <button
            key={p}
            type="button"
            aria-pressed={i === n}
            title={`${ROTULO_PRESET[p]} (${n + 1})`}
            onClick={() => camera.setVistaCamera(p)}
            className={cn(
              "relative z-10 flex h-9 items-center justify-center gap-1 rounded-[18px] text-[12px] font-medium",
              "transition-[color,scale] duration-100 active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
              i === n ? "text-(--color-ink)" : "text-(--color-ink-2)",
            )}
          >
            <span className="grid size-5 scale-[0.8] place-items-center"><Icone /></span>
            {ROTULO_PRESET[p]}
          </button>
        );
      })}
    </div>
  );
}

export function ControlesDesktop({ camera, aberto, exibicao }: { camera: Camera; aberto: boolean; exibicao: PropsExibicao }) {
  return (
    <div inert={!aberto} className={cn("flex flex-col items-end gap-2", materializar(aberto))}>
      <SeletorPreset camera={camera} />
      <Pilha camera={camera}>
        <MenuExibicao {...exibicao} />
      </Pilha>
    </div>
  );
}

/** No celular os presets viram um botão que cicla; um segmentado largo cobriria a cena. */
export function ControlesMovel({ camera, aberto, base, exibicao }: { camera: Camera; aberto: boolean; base: number; exibicao: PropsExibicao }) {
  const Icone = ICONE_PRESET[camera.vistaCamera];
  return (
    <div
      inert={!aberto}
      style={{ bottom: base, right: "calc(env(safe-area-inset-right) + 12px)" }}
      className={cn(
        "absolute z-20 transition-[bottom,opacity,translate,filter,visibility] duration-[320ms] ease-(--ease-out-soft)",
        !aberto && "pointer-events-none invisible translate-y-2 opacity-0 blur-[6px]",
      )}
    >
      <Pilha camera={camera}>
        <Divisoria />
        <BotaoIcone
          rotulo={`Câmera ${ROTULO_PRESET[camera.vistaCamera]}. Alternar ângulo.`}
          onClick={camera.ciclarPreset}
        >
          <Icone />
        </BotaoIcone>
        <MenuExibicao {...exibicao} />
      </Pilha>
    </div>
  );
}
