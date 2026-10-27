"use client";

import { memo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { Mesa } from "@/lib/types";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import { ms, mx, mz, type Cenario } from "./cenarios";
import { caixa, cilindro, matAlvo } from "./materiais";

interface Props {
  mesa: Mesa;
  hover: ArmazemHover;
  cenario: Cenario;
  onSelect: (id: number) => void;
}

/**
 * Só o alvo de toque da mesa, invisível: tampo, cadeiras e manchas são instanciados
 * (`mesas.tsx`, `assentos.tsx`, `manchas.tsx`) para o custo de desenho não crescer com o salão.
 */
export const Mesa3D = memo(function Mesa3D({ mesa, hover, cenario, onSelect }: Props) {
  const gl = useThree((s) => s.gl);
  const raioX = ms(mesa.largura) / 2;
  const raioZ = ms(mesa.altura) / 2;
  const raioAlvo = Math.max(raioX, raioZ) + 0.55;

  const aoPassar = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // No toque o pointerover vem colado ao toque; hover de verdade é só do mouse.
    if (e.nativeEvent.pointerType !== "mouse") return;
    hover.definir(mesa.id);
    gl.domElement.style.cursor = "pointer";
  };

  const aoSair = () => {
    if (hover.ler() === mesa.id) hover.definir(null);
    gl.domElement.style.cursor = "";
  };

  const aoClicar = (e: ThreeEvent<MouseEvent>) => {
    // Arrastar a câmera termina em click; só toque curto seleciona.
    if (e.delta > 6) return;
    e.stopPropagation();
    onSelect(mesa.id);
  };

  // Área de toque generosa, cobrindo as cadeiras: um dedo não acerta um tampo de 80 cm.
  return (
    <mesh
      geometry={mesa.forma === "redonda" ? cilindro(raioAlvo, raioAlvo, 1.3, 16) : caixa(raioX * 2 + 1.1, 1.3, raioZ * 2 + 1.1)}
      material={matAlvo}
      position={[mx(mesa.x, cenario), 0.65, mz(mesa.y, cenario)]}
      onPointerOver={aoPassar}
      onPointerOut={aoSair}
      onClick={aoClicar}
    />
  );
});
