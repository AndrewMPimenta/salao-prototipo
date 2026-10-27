import * as THREE from "three";
import type { EstadoMesa } from "@/lib/types";

export type Par = { fill: string; stroke: string };

export const CLARO: Record<EstadoMesa, Par> = {
  livre: { fill: "#ffffff", stroke: "#8a8479" },
  ocupada: { fill: "#cfc8bb", stroke: "#4a463f" },
  alerta1: { fill: "#d4941a", stroke: "#5c3f00" },
  alerta2: { fill: "#7b2436", stroke: "#4a121f" },
  conta: { fill: "#cfe3f5", stroke: "#0043ce" },
};

export const ESCURO: Record<EstadoMesa, Par> = {
  // Livre é o único tampo claro no tema escuro: a luminância é o que o destaca, sem nova matiz.
  livre: { fill: "#ece3d3", stroke: "#8f897e" },
  ocupada: { fill: "#3f3b36", stroke: "#cdc6ba" },
  alerta1: { fill: "#8a6700", stroke: "#ffe0a3" },
  alerta2: { fill: "#5e1a28", stroke: "#ff93a6" },
  conta: { fill: "#1c3a5e", stroke: "#64b5f6" },
};

/** Cores do cenário; o fundo acompanha --color-app para a maquete flutuar na página. */
export interface Cores {
  fundo: string;
  piso: string;
  plinto: string;
  parede: string;
  capa: string;
  madeira: string;
  madeiraEscura: string;
  deck: string;
  ripaDeck: string;
  mezPiso: string;
  mezRipa: string;
  verde: string;
  vaso: string;
  cadeira: string;
  figura: string;
  anel: string;
  vidro: string;
  trilho: string;
  porta: string;
  placa: string;
  icone: string;
  sofa: string;
  almofada: string;
}

const CORES_CLARO: Cores = {
  fundo: "#efebe4",
  piso: "#ebe5da",
  plinto: "#ddd5c7",
  parede: "#ddd4c6",
  capa: "#efe9df",
  madeira: "#9a7652",
  madeiraEscura: "#7f6044",
  deck: "#d8cbb8",
  ripaDeck: "#c3b49e",
  mezPiso: "#b8a083",
  mezRipa: "#a58c6c",
  verde: "#6f8f6a",
  vaso: "#a8998a",
  cadeira: "#d4ccbf",
  figura: "#8a8376",
  anel: "#1b1a17",
  vidro: "#cfe3ea",
  trilho: "#9a9286",
  porta: "#c9bfae",
  placa: "#f5f2ec",
  icone: "#2a2824",
  sofa: "#8c7f70",
  almofada: "#b3a592",
};

const CORES_ESCURO: Cores = {
  fundo: "#0f0e0c",
  piso: "#25231f",
  plinto: "#141311",
  parede: "#37342e",
  capa: "#46433c",
  madeira: "#4a3a2c",
  madeiraEscura: "#3a2e23",
  deck: "#1d1a17",
  ripaDeck: "#17150f",
  mezPiso: "#3a2f25",
  mezRipa: "#2d251d",
  verde: "#34463a",
  vaso: "#2e2a25",
  cadeira: "#3a3732",
  figura: "#b5aea2",
  anel: "#f4f1ea",
  vidro: "#8fb3c0",
  trilho: "#6a645a",
  porta: "#3b3a36",
  placa: "#5a5750",
  icone: "#15140f",
  sofa: "#4d4640",
  almofada: "#68604f",
};

export const coresDoTema = (escuro: boolean) => (escuro ? CORES_ESCURO : CORES_CLARO);

/*
  Geometrias e materiais ficam num cache de módulo: dezenas de cadeiras e
  figuras iguais não podem alocar um buffer cada, ou o celular sente.
*/
const geometrias = new Map<string, THREE.BufferGeometry>();
const materiais = new Map<string, THREE.MeshStandardMaterial>();

function obter(chave: string, criar: () => THREE.BufferGeometry) {
  let g = geometrias.get(chave);
  if (!g) {
    g = criar();
    geometrias.set(chave, g);
  }
  return g;
}

export const caixa = (w: number, h: number, d: number) =>
  obter(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));

export const cilindro = (rt: number, rb: number, h: number, seg = 32) =>
  obter(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));

export const esfera = (r: number, seg = 16) =>
  obter(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)));

export const capsula = (r: number, comp: number) =>
  obter(`k${r},${comp}`, () => new THREE.CapsuleGeometry(r, comp, 4, 12));

export const circulo = () => obter("circ", () => new THREE.CircleGeometry(1, 40));

export const anel = (ri: number, ro: number) =>
  obter(`a${ri},${ro}`, () => new THREE.RingGeometry(ri, ro, 64));

export function mat(cor: string, opacidade = 1, rugosidade = 0.9) {
  const chave = `${cor}|${opacidade}|${rugosidade}`;
  let m = materiais.get(chave);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: cor,
      roughness: rugosidade,
      metalness: 0,
      transparent: opacidade < 1,
      opacity: opacidade,
      depthWrite: opacidade >= 1,
    });
    materiais.set(chave, m);
  }
  return m;
}

/** Alvo de toque invisível: não desenha, mas o raycast ainda o enxerga. */
export const matAlvo = new THREE.MeshBasicMaterial({ visible: false });

const halos = new Map<string, THREE.MeshBasicMaterial>();

/** Halo suave sob a mesa livre: gradiente radial que some na borda, sem recorte duro. */
export function matHalo(cor: string, alfa: number) {
  const chave = `${cor}|${alfa}`;
  let m = halos.get(chave);
  if (!m) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    m = new THREE.MeshBasicMaterial({ map: tex, color: cor, transparent: true, opacity: alfa, depthWrite: false });
    halos.set(chave, m);
  }
  return m;
}
