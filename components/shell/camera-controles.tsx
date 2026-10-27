"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { Salao } from "@/hooks/use-salao";
import { useAncoragem, type Lado } from "@/hooks/use-ancoragem";
import type { IdFerramenta, Orientacao } from "@/hooks/use-barra-ferramentas";
import { BotaoIcone } from "./botao-icone";
import { IconeAlvo, IconeBussola, IconeMais, IconeMarcador, IconeMenos, ICONE_PRESET } from "./icones";
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

const item =
  "flex h-11 w-full items-center whitespace-nowrap rounded-[14px] px-3 text-left text-[13px] font-medium text-(--color-ink) hover:bg-(--color-ink)/8 active:bg-(--color-ink)/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)";

/** Vista padrão por ambiente: o menu abre do lado que a barra deixa livre e fecha com Esc ou clique fora. */
function MenuVista({ camera, lado }: { camera: Camera; lado: Lado }) {
  const [aberto, setAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const { botao, pop, estilo } = useAncoragem(aberto, lado);

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

  return (
    <div
      ref={(el) => {
        raiz.current = el;
        botao.current = el;
      }}
      className="relative"
    >
      <BotaoIcone rotulo="Vista padrão" expandido={aberto} onClick={() => setAberto((v) => !v)}>
        <IconeMarcador />
      </BotaoIcone>
      {aberto && (
        <div
          ref={pop}
          role="menu"
          aria-label="Vista padrão"
          style={estilo}
          className="glass animate-surgir absolute z-30 flex w-60 flex-col rounded-[18px] p-1"
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

/** Três botões de ícone seguindo a orientação da barra; no celular um só, que cicla. */
function Presets({ camera, orientacao, movel }: { camera: Camera; orientacao: Orientacao; movel: boolean }) {
  if (movel) {
    const Icone = ICONE_PRESET[camera.vistaCamera];
    return (
      <BotaoIcone rotulo={`Câmera ${ROTULO_PRESET[camera.vistaCamera]}. Alternar ângulo.`} onClick={camera.ciclarPreset}>
        <Icone />
      </BotaoIcone>
    );
  }

  return (
    <div role="group" aria-label="Ângulo da câmera" className={cn("flex", orientacao === "vertical" ? "flex-col" : "flex-row")}>
      {PRESETS.map((p, n) => {
        const Icone = ICONE_PRESET[p];
        return (
          <BotaoIcone
            key={p}
            rotulo={`${ROTULO_PRESET[p]} (${n + 1})`}
            pressionado={camera.vistaCamera === p}
            onClick={() => camera.setVistaCamera(p)}
          >
            <Icone />
          </BotaoIcone>
        );
      })}
    </div>
  );
}

interface FerramentaProps {
  id: IdFerramenta;
  camera: Camera;
  exibicao: PropsExibicao;
  orientacao: Orientacao;
  /** Lado em que os popovers abrem, sempre o que a barra deixa livre. */
  lado: Lado;
  movel: boolean;
}

export function Ferramenta({ id, camera, exibicao, orientacao, lado, movel }: FerramentaProps) {
  switch (id) {
    case "presets":
      return <Presets camera={camera} orientacao={orientacao} movel={movel} />;
    case "aproximar":
      return <BotaoIcone rotulo="Aproximar" onClick={() => camera.zoomar(1)}><IconeMais /></BotaoIcone>;
    case "afastar":
      return <BotaoIcone rotulo="Afastar" onClick={() => camera.zoomar(-1)}><IconeMenos /></BotaoIcone>;
    case "bussola":
      return <Bussola camera={camera} />;
    case "recentralizar":
      return <BotaoIcone rotulo="Recentralizar" onClick={camera.recentralizar}><IconeAlvo /></BotaoIcone>;
    case "vista":
      return <MenuVista camera={camera} lado={lado} />;
    case "exibicao":
      return <MenuExibicao {...exibicao} lado={lado} />;
  }
}
