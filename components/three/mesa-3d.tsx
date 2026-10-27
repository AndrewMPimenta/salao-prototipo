"use client";

import { useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { useHoverMesa, type ArmazemHover } from "@/hooks/use-hover-mesa";
import { LEVANTE_HOVER } from "./aros";
import { ALTURA_TAMPO, ESPESSURA_TAMPO, ms, mx, mz, type Cenario } from "./cenarios";
import { anel, arco, aroRetangular, caixa, cilindro, circulo, corAro, mat, matAlvo, matBasico, matHalo, TIPO_ARO, type Cores, type Par } from "./materiais";

const OPACIDADE_FILTRO = 0.2;

// Faixa do anel de tempo: fora das cadeiras (~0,55 m do tampo) e dentro do anel de seleção (0,66 m).
const ANEL_TEMPO_INTERNO = 0.57;
const ANEL_TEMPO_EXTERNO = 0.63;

interface Props {
  mesa: Mesa;
  estado: EstadoMesa;
  alertas: Alerta[];
  /** Permanência dividida pela média da casa; só faz sentido com comanda aberta. */
  progresso: number | null;
  hover: ArmazemHover;
  par: Par;
  cores: Cores;
  escuro: boolean;
  cenario: Cenario;
  esmaecida: boolean;
  selecionada: boolean;
  onSelect: (id: number) => void;
}

/**
 * Só o tampo, a borda e o pedestal: cadeiras e figuras são instanciadas em
 * `assentos.tsx` e o aro de estado das mesas redondas em `aros.tsx`; a retangular
 * leva o seu aro aqui, no grupo que levanta. Sombra só no que é grande o bastante
 * para ler como sombra.
 */
export function Mesa3D({ mesa, estado, alertas, progresso, hover: armazem, par, cores, escuro, cenario, esmaecida, selecionada, onSelect }: Props) {
  const gl = useThree((s) => s.gl);
  const tampoRef = useRef<THREE.Group>(null);
  const hover = useHoverMesa(armazem, mesa.id);

  const raioX = ms(mesa.largura) / 2;
  const raioZ = ms(mesa.altura) / 2;
  const redonda = mesa.forma === "redonda";
  const op = esmaecida ? OPACIDADE_FILTRO : 1;
  const sombra = !esmaecida;
  const raioAlvo = Math.max(raioX, raioZ) + 0.55;

  // O levante é amortecido; só pede quadro enquanto ainda se move (frameloop sob demanda).
  useFrame(({ invalidate }, delta) => {
    const g = tampoRef.current;
    if (!g) return;
    const alvo = hover && !esmaecida ? LEVANTE_HOVER : 0;
    if (Math.abs(g.position.y - alvo) < 0.0004) {
      g.position.y = alvo;
      return;
    }
    g.position.y = THREE.MathUtils.damp(g.position.y, alvo, 14, delta);
    invalidate();
  });

  const aoPassar = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // No toque o pointerover vem colado ao toque; hover de verdade é só do mouse.
    if (e.nativeEvent.pointerType !== "mouse") return;
    armazem.definir(mesa.id);
    gl.domElement.style.cursor = "pointer";
  };

  const aoSair = () => {
    if (armazem.ler() === mesa.id) armazem.definir(null);
    gl.domElement.style.cursor = "";
  };

  const aoClicar = (e: ThreeEvent<MouseEvent>) => {
    // Arrastar para girar a câmera termina em click; só toque curto seleciona.
    if (e.delta > 6) return;
    e.stopPropagation();
    onSelect(mesa.id);
  };

  const raioAnel = Math.max(raioX, raioZ) + 0.36 + 0.42;
  const raioMaior = Math.max(raioX, raioZ);
  const critico = !esmaecida && alertas[0]?.tipo === "semPedidoCritico";
  const completo = progresso !== null && progresso >= 1;

  return (
    <group
      position={[mx(mesa.x, cenario), 0, mz(mesa.y, cenario)]}
      onPointerOver={aoPassar}
      onPointerOut={aoSair}
      onClick={aoClicar}
    >
      {/* Área de toque generosa, cobrindo cadeiras e figuras: um dedo não acerta um tampo de 80 cm. */}
      <mesh
        geometry={redonda ? cilindro(raioAlvo, raioAlvo, 1.3, 16) : caixa(raioX * 2 + 1.1, 1.3, raioZ * 2 + 1.1)}
        material={matAlvo}
        position={[0, 0.65, 0]}
      />

      {/* Mancha de contato no lugar da sombra das cadeiras, que não projetam. */}
      <mesh
        geometry={circulo()}
        material={mat("#000000", esmaecida ? 0.04 : 0.1)}
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[raioX + 0.75, raioZ + 0.75, 1]}
      />

      {/* Halo estático: sem animação, para não forçar quadros no frameloop sob demanda. */}
      {critico && (
        <mesh
          geometry={circulo()}
          material={matHalo(escuro ? "#ff6b6b" : "#c62828", escuro ? 0.5 : 0.55)}
          position={[0, 0.006, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[raioX + 1.35, raioZ + 1.35, 1]}
        />
      )}

      {/* Anel de tempo: trilho fraco e arco da permanência contra a média da casa. */}
      {!esmaecida && progresso !== null && (
        <>
          <mesh
            geometry={anel(raioMaior + ANEL_TEMPO_INTERNO, raioMaior + ANEL_TEMPO_EXTERNO)}
            material={mat(escuro ? "#7c776d" : "#8c867c", 0.16)}
            position={[0, 0.011, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={arco(raioMaior + ANEL_TEMPO_INTERNO, raioMaior + ANEL_TEMPO_EXTERNO, progresso)}
            material={completo ? mat(escuro ? "#cdc6ba" : "#4a463f", 0.85) : mat(escuro ? "#7c776d" : "#8c867c", 0.6)}
            position={[0, 0.012, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </>
      )}

      <mesh
        geometry={cilindro(0.05, 0.09, ALTURA_TAMPO - ESPESSURA_TAMPO, 14)}
        material={mat(par.stroke, op)}
        position={[0, (ALTURA_TAMPO - ESPESSURA_TAMPO) / 2, 0]}
        castShadow={sombra}
      />

      <group ref={tampoRef}>
        {/* Bisel de 1,5 cm na cor do traço, um fio abaixo do tampo para não brigar com ele na face de cima. */}
        <mesh
          geometry={
            redonda
              ? cilindro(raioX + 0.015, raioX + 0.015, ESPESSURA_TAMPO - 0.004, 24)
              : caixa(raioX * 2 + 0.03, ESPESSURA_TAMPO - 0.004, raioZ * 2 + 0.03)
          }
          material={mat(par.stroke, op)}
          position={[0, ALTURA_TAMPO - 0.002, 0]}
          castShadow={sombra}
        />
        <mesh
          geometry={redonda ? cilindro(raioX, raioX, ESPESSURA_TAMPO, 24) : caixa(raioX * 2, ESPESSURA_TAMPO, raioZ * 2)}
          material={mat(par.fill, op)}
          position={[0, ALTURA_TAMPO, 0]}
          castShadow={sombra}
          receiveShadow
        />

        {!redonda && (
          <mesh
            geometry={aroRetangular(raioX * 2, raioZ * 2, TIPO_ARO[estado])}
            material={matBasico(corAro(estado, escuro, hover && !esmaecida), esmaecida ? 0.2 : 1)}
            position={[0, ALTURA_TAMPO + ESPESSURA_TAMPO / 2, 0]}
          />
        )}
      </group>

      {/* Anel estático: o pulso forçaria quadros contínuos no frameloop sob demanda. */}
      {selecionada && (
        <mesh
          geometry={anel(raioAnel - 0.12, raioAnel)}
          material={mat(cores.anel, 0.55)}
          position={[0, 0.015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}
    </group>
  );
}
