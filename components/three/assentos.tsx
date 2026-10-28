"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { ms, mx, mz, type Cenario } from "./cenarios";
import { caixa, capsula, cilindro, esfera, mat, OCUPADA, pino, type Cores } from "./materiais";
import type { Assentos as NivelAssentos } from "@/lib/exibicao";
import { posicaoDaCadeira } from "@/lib/assentos";
import { useEsmaecimento } from "./util";

export interface ItemAssento {
  mesa: Mesa;
  estado: EstadoMesa;
  alertas: Alerta[];
}

interface Parte {
  geo: THREE.BufferGeometry;
  matrizes: THREE.Matrix4[];
  cores: THREE.Color[];
  mesaIds: number[];
  /** Posição (P1…Pn) da cadeira dona de cada instância. */
  numeros: number[];
  /** Só as peças da cadeira recebem raio; a figura sentada não. */
  cadeira: boolean;
  /** Cadeira e figura (completo) crescem com a mesa em foco; base e pino (simplificado) cedem a vez a elas. */
  cheia: boolean;
  /** Ponto no piso em torno do qual a peça encolhe: o centro do assento. */
  ox: number[];
  oz: number[];
}

/** Quanto cada mesa está "completa" (0 = pinos, 1 = cadeiras e figuras); só guarda mesas que saíram do padrão. */
type Transicao = { current: Map<number, number> };

/** Troca de pinos por cadeiras na mesa em foco ou em prévia: ~150 ms, interrompível. */
const DURACAO_TROCA = 0.15;
const ESCALA_MIN = 1e-4;

/** Mesa em foco com posições: as cadeiras dela ganham chave própria para esmaecer, realçar e levantar uma a uma. */
export interface FocoAssentos {
  mesaId: number;
  pagas: number[];
  selecionada: number | null;
  onSelecionar: (numero: number) => void;
}

const BASE_CHAVE = 1_000_000;
export const chaveCadeira = (mesaId: number, numero: number) => BASE_CHAVE + mesaId * 100 + numero;
/** Cadeira e figura de posição paga ficam com ~35% da presença. */
const MUDO_PAGA = 0.65;
const LEVANTE_CADEIRA = 0.06;
const nulo = () => null;

const MATERIAL = mat("#ffffff");
const FOLGA_CADEIRA = 0.36;
// Mesa ocupada pesa mais: cadeira e figura andam em direção à tinta do tema.
const PESO_CADEIRA = 0.42;
const PESO_FIGURA = 0.55;
const ALTURA_BASE = 0.06;

/** Posição de cada cadeira da mesa no mundo; o encosto (+z local) aponta para fora da mesa. */
export function cadeirasDa(mesa: Mesa, c: Cenario) {
  const raioX = ms(mesa.largura) / 2;
  const raioZ = ms(mesa.altura) / 2;
  const redonda = mesa.forma === "redonda";
  const out: { x: number; z: number; rot: number; ocupada: boolean; numero: number }[] = [];

  for (let i = 0; i < mesa.lugares; i++) {
    let cx: number;
    let cz: number;

    if (redonda) {
      const a = (i / mesa.lugares) * Math.PI * 2 - Math.PI / 2;
      cx = Math.cos(a) * (raioX + FOLGA_CADEIRA);
      cz = Math.sin(a) * (raioZ + FOLGA_CADEIRA);
    } else {
      const porLado = Math.ceil(mesa.lugares / 2);
      const lado = i < porLado ? -1 : 1;
      const idx = i < porLado ? i : i - porLado;
      const n = i < porLado ? porLado : mesa.lugares - porLado;
      const f = (idx + 1) / (n + 1) - 0.5;

      if (raioZ > raioX) {
        cx = lado * (raioX + FOLGA_CADEIRA);
        cz = f * raioZ * 2;
      } else {
        cx = f * raioX * 2;
        cz = lado * (raioZ + FOLGA_CADEIRA);
      }
    }

    // Com posições, a cadeira ocupada é a da posição marcada, não a i-ésima.
    const numero = posicaoDaCadeira(mesa, i);
    const ocupada = mesa.posicoes ? (mesa.posicoes.find((p) => p.numero === numero)?.ocupada ?? false) : i < mesa.pessoas;
    out.push({ x: mx(mesa.x, c) + cx, z: mz(mesa.y, c) + cz, rot: Math.atan2(cx, cz), ocupada, numero });
  }

  return out;
}

const eixoX = new THREE.Vector3(1, 0, 0);
const um = new THREE.Vector3(1, 1, 1);

function local(x: number, y: number, z: number, rotX = 0) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(eixoX, rotX),
    um,
  );
}

const PECA_BASE = { geo: () => cilindro(0.2, 0.2, ALTURA_BASE, 16) };

const reduz = new THREE.Matrix4();
const final = new THREE.Matrix4();
const sobeY = new THREE.Matrix4();

/** Matriz da instância encolhida em torno do centro do assento; a mesa completa (s = 1) usa a matriz original. */
function matrizEscalada(parte: Parte, i: number, t: number, subida: number) {
  const s = Math.max(parte.cheia ? t : 1 - t, ESCALA_MIN);
  if (s >= 0.9999) final.copy(parte.matrizes[i]);
  else {
    reduz.makeScale(s, s, s).setPosition(parte.ox[i] * (1 - s), 0, parte.oz[i] * (1 - s));
    final.multiplyMatrices(reduz, parte.matrizes[i]);
  }
  return subida ? final.premultiply(sobeY.makeTranslation(0, subida, 0)) : final;
}

/** Peças da cadeira e da figura sentada, no referencial da cadeira (frente = -z). */
const PECAS_CADEIRA = [
  { geo: () => caixa(0.42, 0.055, 0.42), m: local(0, 0.44, 0) },
  { geo: () => caixa(0.42, 0.44, 0.05), m: local(0, 0.68, 0.185) },
  { geo: () => cilindro(0.03, 0.04, 0.42, 8), m: local(0, 0.21, 0) },
];

const PECAS_FIGURA = [
  { geo: () => capsula(0.12, 0.28), m: local(0, 0.8, -0.05, -0.2) },
  { geo: () => esfera(0.095, 12), m: local(0, 1.2, -0.12) },
  { geo: () => capsula(0.065, 0.2), m: local(-0.09, 0.54, -0.14, Math.PI / 2) },
  { geo: () => capsula(0.065, 0.2), m: local(0.09, 0.54, -0.14, Math.PI / 2) },
];

function Instancias({
  parte,
  esmaecidas,
  piso,
  instantaneo,
  lod,
  foco,
  realce,
  aoRealcar,
  troca,
  padrao,
}: {
  parte: Parte;
  esmaecidas: ReadonlyMap<number, boolean>;
  piso: string;
  instantaneo: boolean;
  lod: React.RefObject<number>;
  foco: FocoAssentos | null;
  realce: number | null;
  aoRealcar: (chave: number | null) => void;
  troca: Transicao;
  /** Completude de uma mesa fora de foco: 1 no perfil completo, 0 no simplificado. */
  padrao: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const escrito = useRef(new Map<number, number>());
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const mesaFoco = foco?.mesaId ?? null;
  const ids = useMemo(
    () => parte.mesaIds.map((m, i) => (m === mesaFoco ? chaveCadeira(m, parte.numeros[i]) : m)),
    [parte, mesaFoco],
  );
  const porMesa = useMemo(() => {
    const out = new Map<number, number[]>();
    parte.mesaIds.forEach((id, i) => out.set(id, [...(out.get(id) ?? []), i]));
    return out;
  }, [parte]);
  const levantada = foco?.selecionada != null && mesaFoco !== null ? chaveCadeira(mesaFoco, foco.selecionada) : null;

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    parte.matrizes.forEach((_, i) => m.setMatrixAt(i, matrizEscalada(parte, i, troca.current.get(parte.mesaIds[i]) ?? padrao, ids[i] === levantada ? LEVANTE_CADEIRA : 0)));
    m.instanceMatrix.needsUpdate = true;
    escrito.current = new Map(troca.current);
    invalidate();
  }, [parte, ids, levantada, troca, padrao, invalidate]);

  // Só as mesas cuja completude andou desde a última escrita reescrevem as próprias matrizes.
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    let mudou = false;
    for (const [mesa, t] of troca.current) {
      if ((escrito.current.get(mesa) ?? padrao) === t) continue;
      escrito.current.set(mesa, t);
      for (const i of porMesa.get(mesa) ?? []) m.setMatrixAt(i, matrizEscalada(parte, i, t, ids[i] === levantada ? LEVANTE_CADEIRA : 0));
      mudou = true;
    }
    if (mudou) m.instanceMatrix.needsUpdate = true;
  });

  useEsmaecimento(ref, ids, parte.cores, esmaecidas, piso, instantaneo, lod, realce, (id) => (id >= BASE_CHAVE ? MUDO_PAGA : undefined));

  if (parte.matrizes.length === 0) return null;

  const clicavel = parte.cadeira && foco !== null;
  const doFoco = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.instanceId !== undefined && parte.mesaIds[e.instanceId] === mesaFoco;

  return (
    <instancedMesh
      key={parte.matrizes.length}
      ref={ref}
      args={[parte.geo, MATERIAL, parte.matrizes.length]}
      frustumCulled={false}
      raycast={clicavel ? THREE.InstancedMesh.prototype.raycast : nulo}
      onPointerOver={
        clicavel
          ? (e) => {
              if (!doFoco(e)) return;
              e.stopPropagation();
              aoRealcar(ids[e.instanceId!]);
              gl.domElement.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        clicavel
          ? () => {
              aoRealcar(null);
              gl.domElement.style.cursor = "";
            }
          : undefined
      }
      onClick={
        clicavel
          ? (e) => {
              // Arrastar a câmera termina em click; só toque curto escolhe a posição.
              if (e.delta > 6 || !doFoco(e)) return;
              e.stopPropagation();
              foco.onSelecionar(parte.numeros[e.instanceId!]);
            }
          : undefined
      }
    />
  );
}

// Diâmetro médio do tampo na tela, em px, que esconde (e devolve) os assentos: abaixo de 17 as cadeiras
// viram ruído; os pinos, mais baixos e sem detalhe, aguentam até 9.
const LOD_CHEIO = [17, 22] as const;
const LOD_SIMPLES = [9, 12] as const;

/**
 * Assentos de TODAS as mesas em poucas malhas instanciadas: sem `<mesh>` por lugar, o custo de
 * desenho não cresce com o número de mesas. No modo simplificado cada lugar é uma base baixa e,
 * onde há gente, um pino; a cadeira com figura existe também, encolhida a zero, e só a mesa
 * em foco ou em prévia troca os pinos por ela. De longe somem por conta própria, fundindo-se
 * ao piso antes de esconder, para não estalar.
 */
export function Assentos({
  itens,
  cenario,
  cores,
  escuro,
  modo,
  esmaecidas: esmaecidasBase,
  instantaneo,
  foco = null,
  selecionada,
}: {
  itens: ItemAssento[];
  cenario: Cenario;
  cores: Cores;
  escuro: boolean;
  modo: Exclude<NivelAssentos, "nenhum">;
  esmaecidas: ReadonlyMap<number, boolean>;
  instantaneo: boolean;
  foco?: FocoAssentos | null;
  /** Mesa fixada: ganha cadeira completa mesmo no modo simplificado. */
  selecionada: number | null;
}) {
  const lodCheio = useRef(0);
  const lodSimples = useRef(0);
  const [realce, setRealce] = useState<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const padrao = modo === "completo" ? 1 : 0;
  const troca = useMemo<Transicao>(() => ({ current: new Map() }), [modo]);
  const fixada = useRef(selecionada);
  fixada.current = selecionada;
  const esmaecidas = useMemo(() => {
    if (!foco || foco.pagas.length === 0) return esmaecidasBase;
    const m = new Map(esmaecidasBase);
    for (const n of foco.pagas) m.set(chaveCadeira(foco.mesaId, n), true);
    return m;
  }, [esmaecidasBase, foco]);
  const longe = useRef({ cheio: false, simples: false });
  const ultimo = useRef<number[]>([]);
  const centros = useMemo(
    () => itens.map(({ mesa }) => ({ x: mx(mesa.x, cenario), z: mz(mesa.y, cenario), d: Math.max(ms(mesa.largura), ms(mesa.altura)) })),
    [itens, cenario],
  );

  const partes = useMemo(() => {
    const cadeira = new THREE.Color(cores.cadeira);
    const figura = new THREE.Color(cores.figura);
    const tema = OCUPADA[escuro ? "escuro" : "claro"];
    const tinta = new THREE.Color(tema.tinta);
    const corPino = new THREE.Color(tema.pino);
    const simples = modo === "simplificado";

    const nova = (geo: THREE.BufferGeometry, ehCadeira: boolean, cheia: boolean): Parte => ({
      geo,
      matrizes: [],
      cores: [],
      mesaIds: [],
      numeros: [],
      cadeira: ehCadeira,
      cheia,
      ox: [],
      oz: [],
    });
    const cad = PECAS_CADEIRA.map((p) => nova(p.geo(), true, true));
    const fig = PECAS_FIGURA.map((p) => nova(p.geo(), false, true));
    const base = nova(PECA_BASE.geo(), false, false);
    const peg = nova(pino(), false, false);

    const empurra = (p: Parte, m: THREE.Matrix4, cor: THREE.Color, mesaId: number, numero: number, c: { x: number; z: number }) => {
      p.matrizes.push(m);
      p.cores.push(cor);
      p.mesaIds.push(mesaId);
      p.numeros.push(numero);
      p.ox.push(c.x);
      p.oz.push(c.z);
    };

    for (const { mesa, estado } of itens) {
      // Ocupada pesa mais que a livre: tudo anda em direção à tinta (escura no claro, clara no escuro).
      const pesada = estado === "ocupada";
      const corCadeira = pesada ? cadeira.clone().lerp(tinta, PESO_CADEIRA) : cadeira;
      const corFigura = pesada ? figura.clone().lerp(tinta, PESO_FIGURA) : figura;
      // Assento mais claro que o encosto e o pé: a cadeira ganha volume sem contorno.
      const corEncosto = corCadeira.clone().multiplyScalar(0.86);

      for (const c of cadeirasDa(mesa, cenario)) {
        const rotacao = new THREE.Matrix4().makeRotationY(c.rot).setPosition(c.x, 0, c.z);
        PECAS_CADEIRA.forEach((p, k) => empurra(cad[k], rotacao.clone().multiply(p.m), k === 0 ? corCadeira : corEncosto, mesa.id, c.numero, c));
        if (c.ocupada) PECAS_FIGURA.forEach((p, k) => empurra(fig[k], rotacao.clone().multiply(p.m), corFigura, mesa.id, c.numero, c));

        if (!simples) continue;
        empurra(base, new THREE.Matrix4().makeTranslation(c.x, ALTURA_BASE / 2, c.z), corCadeira, mesa.id, c.numero, c);
        if (c.ocupada) empurra(peg, new THREE.Matrix4().makeTranslation(c.x, ALTURA_BASE, c.z), corPino, mesa.id, c.numero, c);
      }
    }

    return [...cad, ...fig, ...(simples ? [base, peg] : [])];
  }, [itens, cenario, cores, escuro, modo]);

  useLayoutEffect(() => {
    invalidate();
  }, [selecionada, invalidate]);

  useFrame(({ camera, size, invalidate }, delta) => {
    const e = camera.matrixWorld.elements;
    const chave = [...e, size.height];
    const mudouCamera = !ultimo.current.every((v, k) => v === chave[k]) || ultimo.current.length !== chave.length;

    if (mudouCamera) {
      ultimo.current = chave;
      // Profundidade de cada mesa ao longo do olhar; o diâmetro na tela é d · altura / (2 · prof · tan(fov/2)).
      const cam = camera as THREE.PerspectiveCamera;
      const k = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
      let soma = 0;
      let n = 0;
      for (const c of centros) {
        const prof = -((c.x - e[12]) * e[8] + (0.74 - e[13]) * e[9] + (c.z - e[14]) * e[10]);
        if (prof <= 0.1) continue;
        soma += (c.d * k) / prof;
        n++;
      }
      const media = n ? soma / n : Infinity;
      if (longe.current.cheio && media > LOD_CHEIO[1]) longe.current.cheio = false;
      else if (!longe.current.cheio && media < LOD_CHEIO[0]) longe.current.cheio = true;
      if (longe.current.simples && media > LOD_SIMPLES[1]) longe.current.simples = false;
      else if (!longe.current.simples && media < LOD_SIMPLES[0]) longe.current.simples = true;
    }

    let andando = false;
    const lods: [React.RefObject<number>, number][] = [
      [lodCheio, longe.current.cheio ? 1 : 0],
      [lodSimples, longe.current.simples ? 1 : 0],
    ];
    for (const [ref, alvo] of lods) {
      if (ref.current === alvo) continue;
      ref.current = instantaneo || Math.abs(ref.current - alvo) < 0.01 ? alvo : THREE.MathUtils.damp(ref.current, alvo, 20, delta);
      andando = true;
    }

    // Completude por mesa: a fixada vai a 1; as demais voltam ao padrão do modo.
    const ativos = new Set(troca.current.keys());
    if (fixada.current !== null) ativos.add(fixada.current);
    for (const id of ativos) {
      const atual = troca.current.get(id) ?? padrao;
      const alvo = padrao === 1 || id === fixada.current ? 1 : 0;
      if (atual === alvo) continue;
      const passo = instantaneo ? 1 : delta / DURACAO_TROCA;
      troca.current.set(id, atual < alvo ? Math.min(alvo, atual + passo) : Math.max(alvo, atual - passo));
      andando = true;
    }

    if (andando) invalidate();
  });

  return (
    <>
      {partes.map((p, i) => (
        <Instancias
          key={i}
          parte={p}
          esmaecidas={esmaecidas}
          piso={cores.piso}
          instantaneo={instantaneo}
          lod={p.cheia ? lodCheio : lodSimples}
          foco={foco}
          realce={realce}
          aoRealcar={setRealce}
          troca={troca}
          padrao={padrao}
        />
      ))}
    </>
  );
}
