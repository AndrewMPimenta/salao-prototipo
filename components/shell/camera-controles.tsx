"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Salao } from "@/hooks/use-salao";
import { BotaoIcone } from "./botao-icone";
import { IconeAlvo, IconeBussola, IconeMais, IconeMenos, ICONE_PRESET } from "./icones";
import { materializar } from "./materializar";
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

export function ControlesDesktop({ camera, aberto }: { camera: Camera; aberto: boolean }) {
  return (
    <div inert={!aberto} className={cn("flex flex-col items-end gap-2", materializar(aberto))}>
      <SeletorPreset camera={camera} />
      <Pilha camera={camera} />
    </div>
  );
}

/** No celular os presets viram um botão que cicla; um segmentado largo cobriria a cena. */
export function ControlesMovel({ camera, aberto, base }: { camera: Camera; aberto: boolean; base: number }) {
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
      </Pilha>
    </div>
  );
}
