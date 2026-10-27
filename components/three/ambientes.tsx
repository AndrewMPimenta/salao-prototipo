"use client";

import type { Cenario } from "./cenarios";
import { caixa, cilindro, esfera, mat, type Cores } from "./materiais";

type V3 = readonly [number, number, number];

/** Bloco da maquete: uma caixa de cor chapada, com sombra por padrão. */
export function Bloco({
  tam,
  pos,
  cor,
  op = 1,
  rug,
  sombra = true,
  receber,
  rot,
}: {
  tam: V3;
  pos: V3;
  cor: string;
  op?: number;
  rug?: number;
  sombra?: boolean;
  /** Por padrão só recebe sombra quem a projeta; o piso recebe sem projetar. */
  receber?: boolean;
  rot?: V3;
}) {
  return (
    <mesh
      geometry={caixa(...tam)}
      material={mat(cor, op, rug)}
      position={[...pos]}
      rotation={rot ? [...rot] : undefined}
      castShadow={sombra && op >= 1}
      receiveShadow={receber ?? (sombra && op >= 1)}
    />
  );
}

/** Laje fina e única: a sala lê como maquete sem virar um bloco empilhado. */
export function Laje({ c, cores, piso }: { c: Cenario; cores: Cores; piso: string }) {
  return <Bloco tam={[c.salaL + 0.8, 0.1, c.salaP + 0.8]} pos={[0, -0.05, 0]} cor={piso} sombra={false} receber />;
}

/** Parede baixa com tampa mais clara: a tampa separa o traço da parede do piso na vista aérea. */
export function Parede({ tam, pos, cores }: { tam: V3; pos: V3; cores: Cores }) {
  return (
    <>
      <Bloco tam={tam} pos={pos} cor={cores.parede} />
      <Bloco tam={[tam[0] + 0.01, 0.025, tam[2] + 0.01]} pos={[pos[0], tam[1] + 0.0125, pos[2]]} cor={cores.capa} sombra={false} />
    </>
  );
}

export function CenarioSalao({ cores, c }: { cores: Cores; c: Cenario }) {
  const z0 = -c.salaP / 2;

  return (
    <group>
      <Laje c={c} cores={cores} piso={cores.piso} />

      {/* Paredes baixas: delimitam a sala sem esconder as mesas do fundo. */}
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, z0]} cores={cores} />
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -z0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-c.salaL / 2, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[c.salaL / 2, 0.4, 0]} cores={cores} />

      {/* Palco no fundo, com faixa frontal marcando a quina e degrau de acesso. */}
      <group position={[0, 0, z0 + 2.6]}>
        <Bloco tam={[9.5, 0.34, 3.8]} pos={[0, 0.17, 0]} cor={cores.madeira} />
        <Bloco tam={[9.54, 0.36, 0.06]} pos={[0, 0.17, 1.92]} cor={cores.madeiraEscura} />
        <Bloco tam={[2.8, 0.16, 0.5]} pos={[0, 0.07, 2.15]} cor={cores.madeiraEscura} />
      </group>

      <Porta x={c.salaL / 2 - 0.12} z={-1.6} cores={cores} masculino />
      <Porta x={c.salaL / 2 - 0.12} z={1.0} cores={cores} masculino={false} />

      {/* Bar encostado na parede direita, fora do campo de mesas. */}
      <group position={[c.salaL / 2 - 1.6, 0, 6.2]}>
        <Bloco tam={[1.5, 1.1, 6.4]} pos={[0, 0.55, 0]} cor={cores.parede} />
        <Bloco tam={[1.74, 0.08, 6.64]} pos={[0, 1.13, 0]} cor={cores.madeira} />
      </group>
    </group>
  );
}

function Porta({ x, z, cores, masculino }: { x: number; z: number; cores: Cores; masculino: boolean }) {
  const m = mat(cores.icone);
  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <Bloco tam={[0.9, 1.76, 0.1]} pos={[0, 0.88, 0]} cor={cores.porta} />
      <Bloco tam={[0.42, 0.5, 0.02]} pos={[0, 1.3, 0.07]} cor={cores.placa} sombra={false} />
      <group position={[0, 1.3, 0.1]}>
        <mesh geometry={esfera(0.055)} material={m} position={[0, 0.15, 0]} />
        {masculino ? (
          <>
            <Bloco tam={[0.2, 0.22, 0.02]} pos={[0, -0.01, 0]} cor={cores.icone} sombra={false} />
            <Bloco tam={[0.065, 0.17, 0.02]} pos={[-0.05, -0.19, 0]} cor={cores.icone} sombra={false} />
            <Bloco tam={[0.065, 0.17, 0.02]} pos={[0.05, -0.19, 0]} cor={cores.icone} sombra={false} />
          </>
        ) : (
          <>
            <mesh geometry={cilindro(0.005, 0.145, 0.3, 24)} material={m} position={[0, -0.04, 0]} />
            <Bloco tam={[0.055, 0.14, 0.02]} pos={[-0.055, -0.27, 0]} cor={cores.icone} sombra={false} />
            <Bloco tam={[0.055, 0.14, 0.02]} pos={[0.055, -0.27, 0]} cor={cores.icone} sombra={false} />
          </>
        )}
      </group>
    </group>
  );
}

/** Deck aberto: guarda-corpo em três lados (o fundo é a passagem para o salão) e jardineiras nos cantos. */
export function CenarioVaranda({ cores, c }: { cores: Cores; c: Cenario }) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const ripas = Math.floor(c.salaP / 0.45);

  const lados = [
    { pos: [0, 0, meiaP] as V3, rot: 0, comp: c.salaL },
    { pos: [-meiaL, 0, 0] as V3, rot: Math.PI / 2, comp: c.salaP },
    { pos: [meiaL, 0, 0] as V3, rot: Math.PI / 2, comp: c.salaP },
  ];

  return (
    <group>
      <Laje c={c} cores={cores} piso={cores.deck} />

      {/* Ripas marcam a direção do piso e o diferenciam de um chão liso. */}
      {Array.from({ length: ripas }, (_, i) => (
        <Bloco
          key={i}
          tam={[c.salaL - 0.1, 0.004, 0.035]}
          pos={[0, 0.006, -meiaP + 0.225 + i * 0.45]}
          cor={cores.ripaDeck}
          sombra={false}
        />
      ))}

      {lados.map((t, i) => {
        const n = Math.max(2, Math.round(t.comp / 1.2));
        return (
          <group key={i} position={[...t.pos]} rotation={[0, t.rot, 0]}>
            <Bloco tam={[t.comp, 0.07, 0.07]} pos={[0, 1.05, 0]} cor={cores.trilho} sombra={false} />
            <Bloco tam={[t.comp, 0.045, 0.045]} pos={[0, 0.58, 0]} cor={cores.trilho} sombra={false} />
            {Array.from({ length: n + 1 }, (_, k) => (
              <Bloco key={k} tam={[0.07, 1.05, 0.07]} pos={[-t.comp / 2 + (k * t.comp) / n, 0.525, 0]} cor={cores.trilho} sombra={false} />
            ))}
          </group>
        );
      })}

      {(
        [
          [-meiaL + 0.8, -meiaP + 0.8],
          [meiaL - 0.8, -meiaP + 0.8],
          [-meiaL + 0.8, meiaP - 0.8],
          [meiaL - 0.8, meiaP - 0.8],
        ] as const
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={cilindro(0.32, 0.26, 0.6, 24)} material={mat(cores.vaso)} position={[0, 0.3, 0]} castShadow />
          <mesh geometry={esfera(0.36, 12)} material={mat(cores.verde)} position={[0, 0.78, 0]} castShadow />
        </group>
      ))}
    </group>
  );
}
