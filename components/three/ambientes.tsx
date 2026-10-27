"use client";

import type { Cenario } from "./cenarios";
import * as THREE from "three";
import { caixa, cilindro, esfera, juntas, mat, matMancha, quadPiso, type Cores } from "./materiais";

type V3 = readonly [number, number, number];

export interface PropsCena {
  cores: Cores;
  c: Cenario;
  /** Sombras de contato sob os móveis grandes. */
  sombras: boolean;
}

/** Bloco da maquete: uma caixa de cor chapada. */
export function Bloco({ tam, pos, cor, op = 1, rug, rot }: { tam: V3; pos: V3; cor: string; op?: number; rug?: number; rot?: V3 }) {
  return <mesh geometry={caixa(...tam)} material={mat(cor, op, rug)} position={[...pos]} rotation={rot ? [...rot] : undefined} />;
}

let matSombra: THREE.MeshLambertMaterial | null = null;

/** Sombra de contato de um móvel grande: a mesma mancha macia das mesas, esticada ao contorno. */
export function Sombra({ x, z, l, p }: { x: number; z: number; l: number; p: number }) {
  if (!matSombra) {
    matSombra = matMancha(0.14, 0);
    matSombra.color.set("#000000");
  }
  return <mesh geometry={quadPiso()} material={matSombra} position={[x, 0.012, z]} scale={[l / 2 + 0.7, 1, p / 2 + 0.7]} renderOrder={1} raycast={() => null} />;
}

/** Laje fina e única: a sala lê como maquete sem virar um bloco empilhado. */
export function Laje({ c, piso }: { c: Cenario; piso: string }) {
  return <Bloco tam={[c.salaL + 0.8, 0.1, c.salaP + 0.8]} pos={[0, -0.05, 0]} cor={piso} />;
}

/** Parede baixa com tampa mais clara: a tampa separa o traço da parede do piso na vista aérea. */
export function Parede({ tam, pos, cores }: { tam: V3; pos: V3; cores: Cores }) {
  return (
    <>
      <Bloco tam={tam} pos={pos} cor={cores.parede} />
      <Bloco tam={[tam[0] + 0.01, 0.025, tam[2] + 0.01]} pos={[pos[0], tam[1] + 0.0125, pos[2]]} cor={cores.capa} />
    </>
  );
}

export function CenarioSalao({ cores, c, sombras }: PropsCena) {
  const z0 = -c.salaP / 2;

  return (
    <group>
      <Laje c={c} piso={cores.piso} />

      {/* Paredes baixas: delimitam a sala sem esconder as mesas do fundo. */}
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, z0]} cores={cores} />
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -z0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-c.salaL / 2, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[c.salaL / 2, 0.4, 0]} cores={cores} />

      {/* Palco no fundo, com faixa frontal marcando a quina e degrau de acesso. */}
      <group position={[0, 0, z0 + 2.6]}>
        <Bloco tam={[9.5, 0.34, 3.8]} pos={[0, 0.17, 0]} cor={cores.madeira} />
        <mesh geometry={juntas(9.5, 3.8, 0.32)} material={mat(cores.madeiraEscura)} position={[0, 0.342, 0]} />
        <Bloco tam={[9.54, 0.36, 0.06]} pos={[0, 0.17, 1.92]} cor={cores.madeiraEscura} />
        <Bloco tam={[2.8, 0.16, 0.5]} pos={[0, 0.07, 2.15]} cor={cores.madeiraEscura} />
      </group>
      {sombras && <Sombra x={0} z={z0 + 2.6} l={9.5} p={3.8} />}

      <Porta x={c.salaL / 2 - 0.12} z={-1.6} cores={cores} masculino />
      <Porta x={c.salaL / 2 - 0.12} z={1.0} cores={cores} masculino={false} />

      {/* Bar encostado na parede direita, fora do campo de mesas. */}
      <group position={[c.salaL / 2 - 1.6, 0, 6.2]}>
        <Bloco tam={[1.5, 1.1, 6.4]} pos={[0, 0.55, 0]} cor={cores.balcao} />
        <Bloco tam={[1.74, 0.08, 6.64]} pos={[0, 1.13, 0]} cor={cores.balcaoTopo} />
      </group>
      {sombras && <Sombra x={c.salaL / 2 - 1.6} z={6.2} l={1.5} p={6.4} />}
    </group>
  );
}

/** Salão de banquetes: palco ao norte, pista de dança diante dele e buffet na lateral oeste, fora do campo de mesas. */
export function CenarioEventos({ cores, c, sombras }: PropsCena) {
  const z0 = -c.salaP / 2;
  const x0 = -c.salaL / 2;

  return (
    <group>
      <Laje c={c} piso={cores.piso} />

      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, z0]} cores={cores} />
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -z0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[x0, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-x0, 0.4, 0]} cores={cores} />

      <group position={[0, 0, z0 + 3]}>
        <Bloco tam={[20, 0.5, 5.4]} pos={[0, 0.25, 0]} cor={cores.madeira} />
        <mesh geometry={juntas(20, 5.4, 0.32)} material={mat(cores.madeiraEscura)} position={[0, 0.502, 0]} />
        <Bloco tam={[20.04, 0.52, 0.06]} pos={[0, 0.25, 2.72]} cor={cores.madeiraEscura} />
        <Bloco tam={[3.2, 0.25, 0.6]} pos={[0, 0.12, 3.0]} cor={cores.madeiraEscura} />
      </group>
      {sombras && <Sombra x={0} z={z0 + 3} l={20} p={5.4} />}

      {/* Pista: lâmina de madeira rente ao piso. */}
      <Bloco tam={[16, 0.03, 4.6]} pos={[0, 0.015, -16.5]} cor={cores.pista} rug={0.45} />
      <mesh geometry={juntas(16, 4.6, 1.15, true)} material={mat(cores.juntaPista)} position={[0, 0.032, -16.5]} />

      {/* Balcão do buffet ao longo da parede oeste. */}
      <group position={[x0 + 1.4, 0, 0]}>
        <Bloco tam={[1.1, 1.0, 22]} pos={[0, 0.5, 0]} cor={cores.balcao} />
        <Bloco tam={[1.34, 0.07, 22.24]} pos={[0, 1.035, 0]} cor={cores.balcaoTopo} />
      </group>
      {sombras && <Sombra x={x0 + 1.4} z={0} l={1.1} p={22} />}

      <Porta x={-x0 - 0.12} z={-6} cores={cores} masculino />
      <Porta x={-x0 - 0.12} z={-3.4} cores={cores} masculino={false} />
    </group>
  );
}

function Porta({ x, z, cores, masculino }: { x: number; z: number; cores: Cores; masculino: boolean }) {
  const m = mat(cores.icone);
  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <Bloco tam={[0.9, 1.76, 0.1]} pos={[0, 0.88, 0]} cor={cores.porta} />
      <Bloco tam={[0.42, 0.5, 0.02]} pos={[0, 1.3, 0.07]} cor={cores.placa} />
      <group position={[0, 1.3, 0.1]}>
        <mesh geometry={esfera(0.055)} material={m} position={[0, 0.15, 0]} />
        {masculino ? (
          <>
            <Bloco tam={[0.2, 0.22, 0.02]} pos={[0, -0.01, 0]} cor={cores.icone} />
            <Bloco tam={[0.065, 0.17, 0.02]} pos={[-0.05, -0.19, 0]} cor={cores.icone} />
            <Bloco tam={[0.065, 0.17, 0.02]} pos={[0.05, -0.19, 0]} cor={cores.icone} />
          </>
        ) : (
          <>
            <mesh geometry={cilindro(0.005, 0.145, 0.3, 24)} material={m} position={[0, -0.04, 0]} />
            <Bloco tam={[0.055, 0.14, 0.02]} pos={[-0.055, -0.27, 0]} cor={cores.icone} />
            <Bloco tam={[0.055, 0.14, 0.02]} pos={[0.055, -0.27, 0]} cor={cores.icone} />
          </>
        )}
      </group>
    </group>
  );
}

/** Deck aberto: guarda-corpo em três lados (o fundo é a passagem para o salão) e jardineiras nos cantos. */
export function CenarioVaranda({ cores, c, sombras }: PropsCena) {
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
      <Laje c={c} piso={cores.deck} />

      {/* Ripas marcam a direção do piso e o diferenciam de um chão liso. */}
      {Array.from({ length: ripas }, (_, i) => (
        <Bloco
          key={i}
          tam={[c.salaL - 0.1, 0.004, 0.035]}
          pos={[0, 0.006, -meiaP + 0.225 + i * 0.45]}
          cor={cores.ripaDeck}
        />
      ))}

      {lados.map((t, i) => {
        const n = Math.max(2, Math.round(t.comp / 1.2));
        return (
          <group key={i} position={[...t.pos]} rotation={[0, t.rot, 0]}>
            <Bloco tam={[t.comp, 0.07, 0.07]} pos={[0, 1.05, 0]} cor={cores.trilho} />
            <Bloco tam={[t.comp, 0.045, 0.045]} pos={[0, 0.58, 0]} cor={cores.trilho} />
            {Array.from({ length: n + 1 }, (_, k) => (
              <Bloco key={k} tam={[0.07, 1.05, 0.07]} pos={[-t.comp / 2 + (k * t.comp) / n, 0.525, 0]} cor={cores.trilho} />
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
          <mesh geometry={cilindro(0.32, 0.26, 0.6, 24)} material={mat(cores.vaso)} position={[0, 0.3, 0]} />
          <mesh geometry={esfera(0.36, 12)} material={mat(cores.verde)} position={[0, 0.78, 0]} />
          {sombras && <Sombra x={0} z={0} l={0.5} p={0.5} />}
        </group>
      ))}
    </group>
  );
}
