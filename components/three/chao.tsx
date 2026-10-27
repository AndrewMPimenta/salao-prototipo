"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import type { Cenario } from "./cenarios";

const AVANCO = 0.4;

/**
 * Plano invisível sobre o piso: dá ao toque no vazio um alvo para o duplo
 * toque. Como ele passa a interceptar os cliques, deseleciona aqui também,
 * já que o `onPointerMissed` do Canvas deixa de disparar sobre a sala.
 */
export function ChaoToque({ cenario, onVazio }: { cenario: Cenario; onVazio: () => void }) {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  const aoDuploToque = (e: ThreeEvent<MouseEvent>) => {
    if (!controls) return;
    e.stopPropagation();

    // Aproxima 40% da distância até o ponto, preservando a direção do olhar.
    const ponto = e.point;
    const pos = controls.getPosition(new THREE.Vector3(), true);
    const alvo = controls.getTarget(new THREE.Vector3(), true);
    pos.sub(ponto).multiplyScalar(1 - AVANCO).add(ponto);
    alvo.sub(ponto).multiplyScalar(1 - AVANCO).add(ponto);
    void controls.setLookAt(pos.x, pos.y, pos.z, alvo.x, alvo.y, alvo.z, true);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      onClick={(e) => {
        if (e.delta > 6) return;
        onVazio();
      }}
      onDoubleClick={aoDuploToque}
    >
      <planeGeometry args={[cenario.salaL, cenario.salaP]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
