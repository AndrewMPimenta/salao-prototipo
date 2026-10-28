"use client";

import type { Cenario } from "./cenarios";
import * as THREE from "three";
import { caixa, cilindro, esfera, juntas, mat, matMadeira, matMancha, matPisoChapado, planoMadeira, planoPiso, quadPiso, type Cores } from "./materiais";

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

/** Laje fina com o piso de madeira por cima: a sala lê como maquete sem virar um bloco empilhado. */
export function Laje({ c, cores, tom = "piso" }: { c: Cenario; cores: Cores; tom?: "piso" | "deck" | "mezPiso" }) {
  return (
    <>
      <Bloco tam={[c.salaL + 0.8, 0.1, c.salaP + 0.8]} pos={[0, -0.054, 0]} cor={cores.plinto} />
      <mesh geometry={planoMadeira(c.salaL + 0.8, c.salaP + 0.8)} material={matMadeira(cores[tom])} raycast={() => null} />
    </>
  );
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
      <Laje c={c} cores={cores} />

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
      <Laje c={c} cores={cores} />

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

      {/* Pista: plano chapado a 6 mm do piso, abaixo das manchas (a partir de 12 mm), para não brigar com elas. */}
      <mesh geometry={planoPiso(16, 4.6)} material={matPisoChapado(cores.pista, 0.45)} position={[0, 0.006, -16.5]} raycast={() => null} />
      <mesh geometry={juntas(16, 4.6, 1.15, true)} material={mat(cores.juntaPista)} position={[0, 0.008, -16.5]} />

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

  const lados = [
    { pos: [0, 0, meiaP] as V3, rot: 0, comp: c.salaL },
    { pos: [-meiaL, 0, 0] as V3, rot: Math.PI / 2, comp: c.salaP },
    { pos: [meiaL, 0, 0] as V3, rot: Math.PI / 2, comp: c.salaP },
  ];

  return (
    <group>
      <Laje c={c} cores={cores} tom="deck" />


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

/** Painel de vidro entre montantes finos, com corrimão: o mesmo desenho do mezanino, em qualquer lado. */
function Balaustrada({ comp, pos, rot = 0, cores }: { comp: number; pos: V3; rot?: number; cores: Cores }) {
  const n = Math.max(2, Math.round(comp / 2.5));
  return (
    <group position={[...pos]} rotation={[0, rot, 0]}>
      <Bloco tam={[comp, 1.0, 0.03]} pos={[0, 0.5, 0]} cor={cores.vidro} op={0.25} rug={0.15} />
      <Bloco tam={[comp, 0.05, 0.08]} pos={[0, 1.02, 0]} cor={cores.trilho} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <Bloco key={i} tam={[0.05, 1.0, 0.05]} pos={[-comp / 2 + (i * comp) / n, 0.5, 0]} cor={cores.trilho} />
      ))}
    </group>
  );
}

function Jardineira({ x, z, cores, sombras }: { x: number; z: number; cores: Cores; sombras: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={cilindro(0.32, 0.26, 0.6, 24)} material={mat(cores.vaso)} position={[0, 0.3, 0]} />
      <mesh geometry={esfera(0.36, 12)} material={mat(cores.verde)} position={[0, 0.78, 0]} />
      {sombras && <Sombra x={0} z={0} l={0.5} p={0.5} />}
    </group>
  );
}

/** Terraço de cobertura: deck aberto com vidro ao sul e a leste (a vista), bar na faixa norte e a entrada no canto nordeste. */
export function CenarioTerraco({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const zBar = -meiaP + 1.6;
  const xBar = -meiaL + 6;
  const xEntrada = meiaL - 3;

  return (
    <group>
      <Laje c={c} cores={cores} tom="deck" />


      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Balaustrada comp={c.salaL} pos={[0, 0, meiaP]} cores={cores} />
      <Balaustrada comp={c.salaP} pos={[meiaL, 0, 0]} rot={Math.PI / 2} cores={cores} />

      {/* Bar pequeno: balcão e prateleira de fundo encostada na parede norte. */}
      <Bloco tam={[7, 1.1, 0.8]} pos={[xBar, 0.55, zBar]} cor={cores.balcao} />
      <Bloco tam={[7.24, 0.07, 1.04]} pos={[xBar, 1.135, zBar]} cor={cores.balcaoTopo} />
      <Bloco tam={[7, 1.5, 0.4]} pos={[xBar, 0.75, -meiaP + 0.5]} cor={cores.sofa} />
      {sombras && <Sombra x={xBar} z={zBar} l={7} p={0.9} />}

      <Entrada x={xEntrada} z={-meiaP} cores={cores} />

      {[-meiaL + 0.8, -8, 0, 8].map((x) => (
        <Jardineira key={x} x={x} z={meiaP - 0.7} cores={cores} sombras={sombras} />
      ))}
      <Jardineira x={meiaL - 0.8} z={meiaP - 0.8} cores={cores} sombras={sombras} />
      <Jardineira x={-meiaL + 0.8} z={-meiaP + 5} cores={cores} sombras={sombras} />
    </group>
  );
}

/** Ilha de buffet: balcão baixo com cubas e proteção de vidro ao longo. */
function Buffet({ x, z, comp, cores, sombras }: { x: number; z: number; comp: number; cores: Cores; sombras: boolean }) {
  const cubas = Math.floor(comp / 2.4);
  return (
    <group>
      <Bloco tam={[comp, 0.95, 1.4]} pos={[x, 0.475, z]} cor={cores.balcao} />
      <Bloco tam={[comp + 0.24, 0.07, 1.64]} pos={[x, 0.985, z]} cor={cores.balcaoTopo} />
      {Array.from({ length: cubas }, (_, i) => (
        <Bloco key={i} tam={[1.9, 0.1, 0.8]} pos={[x - ((cubas - 1) * 2.4) / 2 + i * 2.4, 1.07, z]} cor={cores.trilho} />
      ))}
      <Bloco tam={[comp, 0.4, 0.04]} pos={[x, 1.28, z + 0.5]} cor={cores.vidro} op={0.25} rug={0.15} />
      {sombras && <Sombra x={x} z={z} l={comp} p={1.4} />}
    </group>
  );
}

/** Portal de madeira numa parede norte, com tapete até o salão. */
function Entrada({ x, z, cores }: { x: number; z: number; cores: Cores }) {
  return (
    <group>
      {([-1.7, 1.7] as const).map((dx) => (
        <Bloco key={dx} tam={[0.2, 2.6, 0.2]} pos={[x + dx, 1.3, z]} cor={cores.madeiraEscura} />
      ))}
      <Bloco tam={[3.6, 0.2, 0.3]} pos={[x, 2.65, z]} cor={cores.madeira} />
      <Bloco tam={[2.2, 0.45, 0.06]} pos={[x, 2.3, z + 0.06]} cor={cores.placa} />
      <mesh geometry={planoPiso(2.8, 5.4)} material={matPisoChapado(cores.pista, 0.6)} position={[x, 0.006, z + 2.8]} raycast={() => null} />
    </group>
  );
}

/** Restaurante do resort: deck em todo o piso, piscina rasa a oeste com o bar da piscina, buffet no miolo do campo e entrada ao norte. */
export function CenarioHotBeach({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const zBuffet = c.campoZ0 + 10.5;

  return (
    <group>
      <Laje c={c} cores={cores} tom="deck" />

      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[meiaL, 0.4, 0]} cores={cores} />

      {/* Piscina: borda clara e lâmina de água azul, rente ao piso. */}
      <Bloco tam={[5.6, 0.06, 21]} pos={[-20.5, 0.03, 2.75]} cor={cores.capa} />
      <Bloco tam={[4.8, 0.02, 20.2]} pos={[-20.5, 0.062, 2.75]} cor={cores.agua} op={0.92} rug={0.2} />

      {/* Bar da piscina: balcão com banquetas na ponta norte da piscina. */}
      <Bloco tam={[4.4, 1.1, 0.9]} pos={[-20.5, 0.55, -12.9]} cor={cores.balcao} />
      <Bloco tam={[4.64, 0.07, 1.14]} pos={[-20.5, 1.135, -12.9]} cor={cores.balcaoTopo} />
      {[-1.5, -0.5, 0.5, 1.5].map((dx) => (
        <mesh key={dx} geometry={cilindro(0.2, 0.2, 0.68, 12)} material={mat(cores.sofa)} position={[-20.5 + dx, 0.34, -12]} />
      ))}
      {sombras && <Sombra x={-20.5} z={-12.9} l={4.4} p={0.9} />}

      {/* Buffet no miolo do campo, onde a grade deixa 5 x 3 células livres. */}
      <Buffet x={0} z={zBuffet} comp={11} cores={cores} sombras={sombras} />

      <Entrada x={0} z={-meiaP} cores={cores} />
    </group>
  );
}

/** Restaurante de buffet do hotel: saguão de entrada ao sul, bar a leste e a ilha do buffet na faixa central (as medidas seguem `celulasSuites`). */
export function CenarioHotBeachSuites({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const zFaixa = c.campoZ0 + 15;
  const xIlha = 22 - c.campoL / 2;
  const zBar = c.campoZ0 + c.campoP / 2;
  const zSaguao = c.campoZ0 + c.campoP;
  const meioVao = 2.4;
  const comprMuro = meiaL - meioVao;

  return (
    <group>
      <Laje c={c} cores={cores} />

      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[meiaL, 0.4, 0]} cores={cores} />

      {/* Parede da frente com o vão da entrada ao centro. */}
      <Parede tam={[comprMuro, 0.8, 0.14]} pos={[-meioVao - comprMuro / 2, 0.4, meiaP]} cores={cores} />
      <Parede tam={[comprMuro, 0.8, 0.14]} pos={[meioVao + comprMuro / 2, 0.4, meiaP]} cores={cores} />
      {([-meioVao, meioVao] as const).map((x) => (
        <Bloco key={x} tam={[0.14, 2.3, 0.14]} pos={[x, 1.15, meiaP]} cor={cores.madeiraEscura} />
      ))}
      <Bloco tam={[meioVao * 2 + 0.14, 0.12, 0.14]} pos={[0, 2.3, meiaP]} cor={cores.madeira} />

      {/* Saguão: tapete, recepção e sofá entre a porta e o corredor central do salão. */}
      <mesh geometry={planoPiso(9, 4)} material={matPisoChapado(cores.pista, 0.6)} position={[0, 0.006, zSaguao + 2.8]} raycast={() => null} />
      <Bloco tam={[3.6, 1.05, 0.8]} pos={[-5.6, 0.525, zSaguao + 1.8]} cor={cores.balcao} />
      <Bloco tam={[3.84, 0.06, 1.04]} pos={[-5.6, 1.08, zSaguao + 1.8]} cor={cores.balcaoTopo} />
      <Bloco tam={[2.6, 0.45, 0.9]} pos={[5.4, 0.225, zSaguao + 3.4]} cor={cores.sofa} />
      <Bloco tam={[2.6, 0.5, 0.2]} pos={[5.4, 0.7, zSaguao + 3.82]} cor={cores.sofa} />
      {sombras && <Sombra x={-5.6} z={zSaguao + 1.8} l={3.6} p={0.8} />}
      <Jardineira x={-3.6} z={meiaP - 1} cores={cores} sombras={sombras} />
      <Jardineira x={3.6} z={meiaP - 1} cores={cores} sombras={sombras} />

      <Buffet x={xIlha} z={zFaixa} comp={22} cores={cores} sombras={sombras} />

      {/* Bar corrido na parede leste, com prateleira de fundo. */}
      <Bloco tam={[1.2, 1.1, 16]} pos={[meiaL - 1.6, 0.55, zBar]} cor={cores.balcao} />
      <Bloco tam={[1.44, 0.07, 16.24]} pos={[meiaL - 1.6, 1.135, zBar]} cor={cores.balcaoTopo} />
      <Bloco tam={[0.4, 1.8, 16]} pos={[meiaL - 0.45, 0.9, zBar]} cor={cores.sofa} />
      {sombras && <Sombra x={meiaL - 1.6} z={zBar} l={1.2} p={16} />}

      {[-12, -6, 0, 6].map((z) => (
        <Jardineira key={z} x={-meiaL + 0.9} z={z} cores={cores} sombras={sombras} />
      ))}
    </group>
  );
}

/** Restaurante de resort: deck de madeira, piscina a oeste com o bar da piscina ao norte, buffet a leste, portão de entrada ao norte e faixa de areia ao sul. */
export function CenarioHotBeachResort({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const zCampoMeio = c.campoZ0 + c.campoP / 2;
  const xEntrada = 24.1 - c.campoL / 2;
  const meioPortao = 1.7;
  const compOeste = xEntrada - meioPortao + meiaL;
  const compLeste = meiaL - (xEntrada + meioPortao);

  return (
    <group>
      <Laje c={c} cores={cores} tom="deck" />

      {/* Muros ao norte (com o vão do portão), oeste e leste; o sul abre para a praia. */}
      <Parede tam={[compOeste, 0.8, 0.14]} pos={[-meiaL + compOeste / 2, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[compLeste, 0.8, 0.14]} pos={[meiaL - compLeste / 2, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[meiaL, 0.4, 0]} cores={cores} />

      <Entrada x={xEntrada} z={-meiaP} cores={cores} />

      {/* Deck sob as mesas: tábuas mais claras que o piso, no nível das pistas e tapetes, abaixo das manchas. */}
      <mesh geometry={planoMadeira(c.campoL + 1.6, c.campoP + 1.6)} material={matMadeira(cores.madeira)} position={[0, 0.006, zCampoMeio]} raycast={() => null} />

      {/* Piscina com borda clara e lâmina de água. */}
      <Bloco tam={[5.4, 0.06, 18.6]} pos={[-23.55, 0.03, -0.5]} cor={cores.capa} />
      <Bloco tam={[4.6, 0.02, 17.8]} pos={[-23.55, 0.062, -0.5]} cor={cores.agua} op={0.92} rug={0.2} />

      {/* Bar da piscina: balcão com banquetas sob uma palapa de quatro águas. */}
      <Bloco tam={[4.4, 1.1, 0.9]} pos={[-23.55, 0.55, -13.2]} cor={cores.balcao} />
      <Bloco tam={[4.64, 0.07, 1.14]} pos={[-23.55, 1.135, -13.2]} cor={cores.balcaoTopo} />
      {([-2.2, 2.2] as const).flatMap((dx) =>
        ([-1.2, 1.2] as const).map((dz) => <Bloco key={`${dx}${dz}`} tam={[0.12, 2.5, 0.12]} pos={[-23.55 + dx, 1.25, -13.2 + dz]} cor={cores.madeiraEscura} />),
      )}
      <mesh geometry={cilindro(0.05, 2.9, 0.9, 4)} material={mat(cores.madeiraEscura)} position={[-23.55, 2.95, -13.2]} rotation={[0, Math.PI / 4, 0]} />
      {[-1.5, -0.5, 0.5, 1.5].map((dx) => (
        <mesh key={dx} geometry={cilindro(0.2, 0.2, 0.68, 12)} material={mat(cores.sofa)} position={[-23.55 + dx, 0.34, -12.3]} />
      ))}
      {sombras && <Sombra x={-23.55} z={-13.2} l={4.4} p={0.9} />}

      {/* Buffet: ilha comprida no corredor leste, ao longo das mesas retangulares. */}
      <group position={[23.2, 0, -1]} rotation={[0, Math.PI / 2, 0]}>
        <Buffet x={0} z={0} comp={9.6} cores={cores} sombras={sombras} />
      </group>

      {/* Faixa de areia na frente, com espreguiçadeiras e guarda-sóis. */}
      <mesh geometry={planoPiso(c.salaL - 0.2, 5.4)} material={matPisoChapado(cores.capa, 0.95)} position={[0, 0.006, meiaP - 2.8]} raycast={() => null} />
      {[-21, -10, 1, 12, 21].map((x, i) => (
        <group key={x} position={[x, 0, meiaP - 2.6 + (i % 2) * 0.5]}>
          <mesh geometry={cilindro(0.025, 0.025, 2.2, 8)} material={mat(cores.trilho)} position={[0, 1.1, 0]} />
          <mesh geometry={cilindro(0.03, 1.1, 0.35, 16)} material={mat(i % 2 ? cores.almofada : cores.sofa)} position={[0, 2.25, 0]} />
          <Bloco tam={[0.7, 0.25, 1.8]} pos={[-0.9, 0.125, 0.6]} cor={cores.sofa} />
          <Bloco tam={[0.7, 0.25, 1.8]} pos={[0.9, 0.125, 0.6]} cor={cores.sofa} />
        </group>
      ))}
    </group>
  );
}

/** Restaurante compacto de hotel: corredor central com o buffet entre dois blocos de mesas, entrada ao norte e bar ao sul (as medidas seguem `celulasRaizes`). */
export function CenarioHotBeachRaizes({ cores, c, sombras }: PropsCena) {
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;
  const xCorredor = 14.6 - c.campoL / 2;
  const zMeio = c.campoZ0 + c.campoP / 2;

  return (
    <group>
      <Laje c={c} cores={cores} />

      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, -meiaP]} cores={cores} />
      <Parede tam={[c.salaL, 0.8, 0.14]} pos={[0, 0.4, meiaP]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[-meiaL, 0.4, 0]} cores={cores} />
      <Parede tam={[0.14, 0.8, c.salaP]} pos={[meiaL, 0.4, 0]} cores={cores} />

      <Entrada x={xCorredor} z={-meiaP} cores={cores} />

      {/* Buffet: ilha comprida no sentido norte-sul, no meio do corredor. */}
      <group position={[xCorredor, 0, zMeio]} rotation={[0, Math.PI / 2, 0]}>
        <Buffet x={0} z={0} comp={12} cores={cores} sombras={sombras} />
      </group>

      {/* Bar corrido junto à parede sul, com prateleira de fundo. */}
      <Bloco tam={[14, 1.1, 1.2]} pos={[0, 0.55, meiaP - 1.4]} cor={cores.balcao} />
      <Bloco tam={[14.24, 0.07, 1.44]} pos={[0, 1.135, meiaP - 1.4]} cor={cores.balcaoTopo} />
      <Bloco tam={[14, 1.8, 0.4]} pos={[0, 0.9, meiaP - 0.45]} cor={cores.sofa} />
      {sombras && <Sombra x={0} z={meiaP - 1.4} l={14} p={1.2} />}
    </group>
  );
}
