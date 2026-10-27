"use client";

import { Bloco, Laje, Parede, Sombra, type PropsCena } from "./ambientes";
import type { Cores } from "./materiais";

/**
 * Piso elevado com vista para o salão: tábuas escuras, balaustrada de vidro na
 * frente (o lado que dá para o vazio), canto de lounge e escada no fundo.
 */
export function CenarioMezanino({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const tabuas = Math.floor(c.salaP / 0.3);

  return (
    <group>
      <Laje c={c} piso={cores.mezPiso} />

      {Array.from({ length: tabuas }, (_, i) => (
        <Bloco
          key={i}
          tam={[c.salaL - 0.1, 0.004, 0.03]}
          pos={[0, 0.006, -meiaP + 0.15 + i * 0.3]}
          cor={cores.mezRipa}
        />
      ))}

      {/* Paredes baixas nos três lados fechados. */}
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[meiaL, 0.4, 0]} cores={cores} />

      {/* Balaustrada de vidro: painel translúcido entre montantes finos, com corrimão. */}
      <Bloco tam={[c.salaL, 1.0, 0.03]} pos={[0, 0.5, meiaP]} cor={cores.vidro} op={0.25} rug={0.15} />
      <Bloco tam={[c.salaL, 0.05, 0.08]} pos={[0, 1.02, meiaP]} cor={cores.trilho} />
      {Array.from({ length: Math.round(c.salaL / 2.5) + 1 }, (_, i) => (
        <Bloco
          key={i}
          tam={[0.05, 1.0, 0.05]}
          pos={[-meiaL + (i * c.salaL) / Math.round(c.salaL / 2.5), 0.5, meiaP]}
          cor={cores.trilho}
        />
      ))}

      {/* Lounge no canto do fundo esquerdo: dois sofás baixos em L aberto. */}
      <Sofa x={-meiaL + 3.2} z={-meiaP + 1.1} larg={3.2} rot={0} cores={cores} />
      <Sofa x={-meiaL + 1.0} z={-meiaP + 3.4} larg={2.6} rot={Math.PI / 2} cores={cores} />
      <Bloco tam={[1.0, 0.32, 1.0]} pos={[-meiaL + 3.0, 0.16, -meiaP + 3.0]} cor={cores.madeira} />
      {sombras && (
        <>
          <Sombra x={-meiaL + 3.2} z={-meiaP + 1.1} l={3.2} p={0.9} />
          <Sombra x={-meiaL + 1.0} z={-meiaP + 3.4} l={0.9} p={2.6} />
          <Sombra x={meiaL - 1.0} z={-meiaP + 1.6} l={1.2} p={2.2} />
        </>
      )}

      {/* Escada subindo rente à parede direita, no fundo. */}
      {Array.from({ length: 7 }, (_, i) => (
        <Bloco
          key={i}
          tam={[1.2, 0.17 * (i + 1), 0.32]}
          pos={[meiaL - 1.0, (0.17 * (i + 1)) / 2, -meiaP + 0.5 + i * 0.32]}
          cor={cores.madeira}
        />
      ))}
    </group>
  );
}

function Sofa({ x, z, larg, rot, cores }: { x: number; z: number; larg: number; rot: number; cores: Cores }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Bloco tam={[larg, 0.4, 0.9]} pos={[0, 0.2, 0]} cor={cores.sofa} />
      <Bloco tam={[larg, 0.38, 0.22]} pos={[0, 0.58, -0.34]} cor={cores.sofa} />
      <Bloco tam={[larg - 0.3, 0.12, 0.62]} pos={[0, 0.46, 0.08]} cor={cores.almofada} />
    </group>
  );
}
