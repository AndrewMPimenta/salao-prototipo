"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { ms, mx, mz, type Cenario } from "./cenarios";
import { caixa, capsula, cilindro, esfera, mat, type Cores } from "./materiais";
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
}

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
const MUDO_OCUPADA = 0.28;

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
}: {
  parte: Parte;
  esmaecidas: ReadonlyMap<number, boolean>;
  piso: string;
  instantaneo: boolean;
  lod: React.RefObject<number>;
  foco: FocoAssentos | null;
  realce: number | null;
  aoRealcar: (chave: number | null) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const mesaFoco = foco?.mesaId ?? null;
  const ids = useMemo(
    () => parte.mesaIds.map((m, i) => (m === mesaFoco ? chaveCadeira(m, parte.numeros[i]) : m)),
    [parte, mesaFoco],
  );
  const levantada = foco?.selecionada != null && mesaFoco !== null ? chaveCadeira(mesaFoco, foco.selecionada) : null;

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const sobe = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    parte.matrizes.forEach((x, i) => m.setMatrixAt(i, ids[i] === levantada ? tmp.copy(x).premultiply(sobe.makeTranslation(0, LEVANTE_CADEIRA, 0)) : x));
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [parte, ids, levantada, invalidate]);

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

// Diâmetro médio do tampo na tela, em px: abaixo de 17 as cadeiras viram ruído; voltam acima de 22.
const LOD_SOME = 17;
const LOD_VOLTA = 22;

/**
 * Cadeiras e figuras de TODAS as mesas em poucas malhas instanciadas: sem
 * `<mesh>` por cadeira, o custo de desenho não cresce com o número de mesas.
 * De longe somem por conta própria (o ajuste do usuário é só o teto), fundindo-se
 * ao piso antes de esconder, para não estalar.
 */
export function Assentos({
  itens,
  cenario,
  cores,
  pessoas,
  esmaecidas: esmaecidasBase,
  instantaneo,
  foco = null,
}: {
  itens: ItemAssento[];
  cenario: Cenario;
  cores: Cores;
  pessoas: boolean;
  esmaecidas: ReadonlyMap<number, boolean>;
  instantaneo: boolean;
  foco?: FocoAssentos | null;
}) {
  const lod = useRef(0);
  const [realce, setRealce] = useState<number | null>(null);
  const esmaecidas = useMemo(() => {
    if (!foco || foco.pagas.length === 0) return esmaecidasBase;
    const m = new Map(esmaecidasBase);
    for (const n of foco.pagas) m.set(chaveCadeira(foco.mesaId, n), true);
    return m;
  }, [esmaecidasBase, foco]);
  const longe = useRef(false);
  const ultimo = useRef<number[]>([]);
  const centros = useMemo(
    () => itens.map(({ mesa }) => ({ x: mx(mesa.x, cenario), z: mz(mesa.y, cenario), d: Math.max(ms(mesa.largura), ms(mesa.altura)) })),
    [itens, cenario],
  );

  const partes = useMemo(() => {
    const piso = new THREE.Color(cores.piso);
    const cadeira = new THREE.Color(cores.cadeira);
    const figura = new THREE.Color(cores.figura);

    const cad: Parte[] = PECAS_CADEIRA.map((p) => ({ geo: p.geo(), matrizes: [], cores: [], mesaIds: [], numeros: [], cadeira: true }));
    const fig: Parte[] = PECAS_FIGURA.map((p) => ({ geo: p.geo(), matrizes: [], cores: [], mesaIds: [], numeros: [], cadeira: false }));

    for (const { mesa, estado } of itens) {
      // Ocupadas recuam; livres mantêm o tom cheio para a vaga se destacar.
      const mudo = estado === "ocupada" ? MUDO_OCUPADA : 0;
      const corCadeira = cadeira.clone().lerp(piso, mudo);
      const corFigura = figura.clone().lerp(piso, mudo);
      // Assento mais claro que o encosto e o pé: a cadeira ganha volume sem contorno.
      const corEncosto = corCadeira.clone().multiplyScalar(0.86);

      for (const c of cadeirasDa(mesa, cenario)) {
        const base = new THREE.Matrix4().makeRotationY(c.rot).setPosition(c.x, 0, c.z);
        PECAS_CADEIRA.forEach((p, k) => {
          cad[k].matrizes.push(base.clone().multiply(p.m));
          cad[k].cores.push(k === 0 ? corCadeira : corEncosto);
          cad[k].mesaIds.push(mesa.id);
          cad[k].numeros.push(c.numero);
        });
        if (!pessoas || !c.ocupada) continue;
        PECAS_FIGURA.forEach((p, k) => {
          fig[k].matrizes.push(base.clone().multiply(p.m));
          fig[k].cores.push(corFigura);
          fig[k].mesaIds.push(mesa.id);
          fig[k].numeros.push(c.numero);
        });
      }
    }

    return [...cad, ...fig];
  }, [itens, cenario, cores, pessoas]);

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
      if (longe.current && media > LOD_VOLTA) longe.current = false;
      else if (!longe.current && media < LOD_SOME) longe.current = true;
    }

    const alvo = longe.current ? 1 : 0;
    if (lod.current === alvo) return;
    lod.current = instantaneo || Math.abs(lod.current - alvo) < 0.01 ? alvo : THREE.MathUtils.damp(lod.current, alvo, 20, delta);
    invalidate();
  });

  return (
    <>
      {partes.map((p, i) => (
        <Instancias key={i} parte={p} esmaecidas={esmaecidas} piso={cores.piso} instantaneo={instantaneo} lod={lod} foco={foco} realce={realce} aoRealcar={setRealce} />
      ))}
    </>
  );
}
