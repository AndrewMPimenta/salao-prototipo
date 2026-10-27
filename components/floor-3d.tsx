"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, ROTULO_ESTADO } from "@/lib/state";
import { cn } from "@/lib/utils";
import { useTemaEscuro } from "@/hooks/use-tema";
import { CenarioEventos, CenarioSalao, CenarioVaranda } from "./three/ambientes";
import { CenarioMezanino } from "./three/mezanino";
import { Camera } from "./three/camera";
import { ChaoToque } from "./three/chao";
import { obterCenario, ALTURA_ROTULO_3D, ms, mx, mz } from "./three/cenarios";
import { CLARO, ESCURO, coresDoTema } from "./three/materiais";
import { Assentos, type ItemAssento } from "./three/assentos";
import { Mesa3D } from "./three/mesa-3d";
import { CamadaRotulos, ProjetorRotulos, type ItemRotulo, type MapaRotulos } from "./three/rotulos";
import { useReduzMovimento } from "./three/util";

export type VistaCamera = "aerea" | "perspectiva" | "nivel";

export interface Floor3DProps {
  mesas: Mesa[];
  limiares: Limiares;
  ambienteId: string;
  /** Mesas fora do filtro esmaecem a ~25%, rótulos inclusive. */
  filtro: EstadoMesa | null;
  /** Quando presente, tem precedência sobre `filtro` para esmaecer. */
  destacar?: (mesa: Mesa) => boolean;
  selecionada: number | null;
  onSelect: (id: number | null) => void;
  vistaCamera: VistaCamera;
  /** Muda a cada clique em "recentralizar": re-enquadra mesmo se a vista não mudou. */
  sinalReset: number;
  zoom: { direcao: 1 | -1; n: number } | null;
  /** Desloca até a mesa sob demanda (lista/busca), sem zoom nem giro. */
  foco: { id: number; n: number } | null;
  /** Anima o azimute de volta ao do preset. */
  sinalNorte: number;
  /** Grava a vista atual como padrão do ambiente. */
  sinalSalvarVista: number;
  /** Apaga a vista salva do ambiente e volta ao enquadramento de fábrica. */
  sinalLimparVista: number;
  /** Azimute em radianos, ~10 Hz, para a bússola do shell. */
  onCameraChange?: (azimuteRad: number) => void;
  /** Folga em px que a interface flutuante ocupa sobre o canvas. */
  folga: { topo: number; base: number; esquerda: number; direita: number };
  mostrarRotulos: boolean;
  /** Sem cadeiras, figuras e sombras, para máquinas fracas e salões muito cheios. */
  modoLeve: boolean;
  className?: string;
}

/** Luz de chave com sombra: mapa menor no celular, onde a GPU é o gargalo. */
function Luzes({ escuro, raio, sombras }: { escuro: boolean; raio: number; sombras: boolean }) {
  const mapa = useThree((s) => (s.size.width < 768 ? 512 : 1024));

  return (
    <>
      {/* Sem legado de luz, a intensidade é dividida por π no difuso: ~3 no total devolve a cor do material. O chão do hemisfério é claro para as paredes laterais não escurecerem. */}
      <hemisphereLight args={["#fff8ee", escuro ? "#a39c90" : "#cfc7b9", 1.5]} />
      <directionalLight
        key={mapa}
        position={[-raio * 0.5, raio * 1.1, raio * 0.8]}
        color="#fff6ea"
        intensity={1.7}
        castShadow={sombras}
        shadow-mapSize={[mapa, mapa]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-raio}
        shadow-camera-right={raio}
        shadow-camera-top={raio}
        shadow-camera-bottom={-raio}
        shadow-camera-far={raio * 4}
      />
      <directionalLight position={[raio * 0.6, raio * 0.4, -raio * 0.5]} intensity={0.4} />
    </>
  );
}

const CENAS: Record<string, typeof CenarioSalao> = {
  varanda: CenarioVaranda,
  mezanino: CenarioMezanino,
  eventos: CenarioEventos,
};

export function Floor3D({
  mesas,
  limiares,
  ambienteId,
  filtro,
  destacar,
  selecionada,
  onSelect,
  vistaCamera,
  sinalReset,
  zoom,
  foco,
  sinalNorte,
  sinalSalvarVista,
  sinalLimparVista,
  onCameraChange,
  folga,
  mostrarRotulos,
  modoLeve,
  className,
}: Floor3DProps) {
  const cenario = obterCenario(ambienteId);
  const escuro = useTemaEscuro();
  const reduz = useReduzMovimento();
  const cores = coresDoTema(escuro);
  const paleta = escuro ? ESCURO : CLARO;
  const els = useRef<MapaRotulos>(new Map());
  const aoSelecionar = useCallback((id: number) => onSelect(id), [onSelect]);
  const aoVazio = useCallback(() => onSelect(null), [onSelect]);

  const posicoes = useMemo(
    () => new Map(mesas.map((m) => [m.id, [mx(m.x, cenario), mz(m.y, cenario), Math.max(ms(m.largura), ms(m.altura)) / 2] as [number, number, number]])),
    [mesas, cenario],
  );

  const situacoes = useMemo<ItemAssento[]>(
    () =>
      mesas.map((mesa) => {
        const estado = derivarEstado(mesa, limiares);
        const esmaecida = destacar ? !destacar(mesa) : filtro !== null && filtro !== estado;
        return { mesa, estado, esmaecida };
      }),
    [mesas, limiares, destacar, filtro],
  );

  const itensRotulo = useMemo<ItemRotulo[]>(
    () =>
      situacoes.flatMap(({ mesa, estado, esmaecida }) => {
        if (esmaecida) return [];
        const [x, z] = posicoes.get(mesa.id)!;
        return [{ mesa, estado, par: paleta[estado], x, z, selecionada: selecionada === mesa.id }];
      }),
    [situacoes, posicoes, paleta, selecionada],
  );

  const raio = Math.max(cenario.salaL, cenario.salaP) / 2 + 2;
  const Cena = CENAS[ambienteId] ?? CenarioSalao;

  return (
    <div className={cn("absolute inset-0", className)}>
      <div aria-hidden className="h-full w-full">
        <Canvas
          // Remonta ao trocar: ligar/desligar sombras exige recompilar os materiais.
          key={modoLeve ? "leve" : "cheio"}
          flat
          frameloop="demand"
          shadows={!modoLeve}
          dpr={modoLeve ? [1, 1] : [1, 1.5]}
          camera={{ fov: 34, near: 0.1, far: 600, position: [12, 14, 16] }}
          onPointerMissed={aoVazio}
        >
          <color attach="background" args={[cores.fundo]} />
          <fog attach="fog" args={[cores.fundo, 300, 700]} />

          <Suspense fallback={null}>
            <Luzes escuro={escuro} raio={raio} sombras={!modoLeve} />
            <Cena cores={cores} c={cenario} />
            <ChaoToque cenario={cenario} onVazio={aoVazio} />

            {!modoLeve && <Assentos itens={situacoes} cenario={cenario} cores={cores} />}

            {situacoes.map(({ mesa, estado, esmaecida }) => (
              <Mesa3D
                key={mesa.id}
                mesa={mesa}
                estado={estado}
                par={paleta[estado]}
                cores={cores}
                escuro={escuro}
                cenario={cenario}
                esmaecida={esmaecida}
                selecionada={selecionada === mesa.id}
                onSelect={aoSelecionar}
              />
            ))}

            <Camera
              cenario={cenario}
              ambienteId={ambienteId}
              vistaCamera={vistaCamera}
              sinalReset={sinalReset}
              zoom={zoom}
              foco={foco}
              sinalNorte={sinalNorte}
              sinalSalvarVista={sinalSalvarVista}
              sinalLimparVista={sinalLimparVista}
              onCameraChange={onCameraChange}
              folga={folga}
              posicoes={posicoes}
              reduzMovimento={reduz}
            />
            {/* Depois da câmera: precisa ler a pose já atualizada deste quadro. */}
            {mostrarRotulos && <ProjetorRotulos itens={itensRotulo} els={els} priorizarLivres={filtro === "livre" || destacar !== undefined} />}
          </Suspense>
        </Canvas>
      </div>

      {mostrarRotulos && <CamadaRotulos itens={itensRotulo} corHaste={cores.anel} els={els} />}

      {/* A cena não é operável por teclado; esta é a via equivalente. */}
      <table className="sr-only">
        <caption>Mesas do ambiente</caption>
        <thead>
          <tr>
            <th>Mesa</th>
            <th>Situação</th>
            <th>Pessoas</th>
            <th>Lugares</th>
          </tr>
        </thead>
        <tbody>
          {mesas.map((m) => (
            <tr key={m.id}>
              <td>Mesa {m.id}</td>
              <td>{ROTULO_ESTADO[derivarEstado(m, limiares)]}</td>
              <td>{m.pessoas}</td>
              <td>{m.lugares}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
