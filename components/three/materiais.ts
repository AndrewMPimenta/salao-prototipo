import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { EstadoMesa, TipoAlerta } from "@/lib/types";

export type Par = { fill: string; stroke: string };

/** O tampo é neutro em todos os estados: quem diz o estado é o brilho no piso (`corBrilho`). */
export const TAMPO: Record<"claro" | "escuro", Par> = {
  claro: { fill: "#e3dccf", stroke: "#b3a999" },
  escuro: { fill: "#a39c90", stroke: "#8a8378" },
};

/** Intensidade do brilho: alerta é maior e mais forte que estado, para não depender só da cor. */
export type NivelBrilho = "estado" | "alerta" | "critico";

const BRILHO_CLARO = {
  livre: "#1f9d6a",
  reservada: "#7c5cd6",
  conta: "#0043ce",
  vermelho: "#d32f2f",
  ambar: "#e09a12",
  selecao: "#1b1a17",
};
const BRILHO_ESCURO = {
  livre: "#34c08a",
  reservada: "#a08cf0",
  conta: "#64b5f6",
  vermelho: "#ff6b6b",
  ambar: "#f0b43a",
  selecao: "#f4f1ea",
};

/** Sinal mais importante da mesa: o alerta vence o estado; ocupada sem alerta não brilha. */
export function corBrilho(estado: EstadoMesa, alerta: TipoAlerta | undefined, escuro: boolean): { cor: string; nivel: NivelBrilho } | null {
  const t = escuro ? BRILHO_ESCURO : BRILHO_CLARO;
  if (alerta === "semPedidoCritico") return { cor: t.vermelho, nivel: "critico" };
  if (alerta === "semPedido") return { cor: t.vermelho, nivel: "alerta" };
  if (alerta === "entregaAtrasada") return { cor: t.ambar, nivel: "alerta" };
  if (alerta === "contaParada") return { cor: t.conta, nivel: "alerta" };
  if (estado === "ocupada") return null;
  return { cor: t[estado], nivel: "estado" };
}

/** Mesa em foco sem brilho próprio (ocupada) ganha um brilho neutro de tinta. */
export const corSelecao = (escuro: boolean) => (escuro ? BRILHO_ESCURO : BRILHO_CLARO).selecao;

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
  balcao: string;
  balcaoTopo: string;
  pista: string;
  juntaPista: string;
}

const CORES_CLARO: Cores = {
  fundo: "#efebe4",
  piso: "#f2eee7",
  plinto: "#ddd5c7",
  parede: "#d8cfc1",
  capa: "#ebe5da",
  madeira: "#c7ae90",
  madeiraEscura: "#b0967a",
  deck: "#e4ddd1",
  ripaDeck: "#d6cdbf",
  mezPiso: "#ddd5c8",
  mezRipa: "#cfc6b8",
  verde: "#a6ab9b",
  vaso: "#a8998a",
  cadeira: "#9c9184",
  figura: "#6b6257",
  anel: "#1b1a17",
  vidro: "#cfe3ea",
  trilho: "#9a9286",
  porta: "#c9bfae",
  placa: "#f5f2ec",
  icone: "#2a2824",
  sofa: "#bfb6a9",
  almofada: "#d0c8bb",
  balcao: "#8f857a",
  balcaoTopo: "#e2dbcf",
  pista: "#cdc5b8",
  juntaPista: "#bdb4a6",
};

const CORES_ESCURO: Cores = {
  fundo: "#151412",
  piso: "#1f1d1a",
  plinto: "#121110",
  parede: "#3a3631",
  capa: "#4c4741",
  madeira: "#4d4237",
  madeiraEscura: "#40362c",
  deck: "#24221e",
  ripaDeck: "#26231f",
  mezPiso: "#2e2b26",
  mezRipa: "#282520",
  verde: "#3a3d36",
  vaso: "#3a3631",
  cadeira: "#7d756a",
  figura: "#c4bdb0",
  anel: "#f4f1ea",
  vidro: "#8fb3c0",
  trilho: "#7a7368",
  porta: "#47433d",
  placa: "#5a5750",
  icone: "#15140f",
  sofa: "#4f4a43",
  almofada: "#635d55",
  balcao: "#2b2824",
  balcaoTopo: "#5e5850",
  pista: "#2b2925",
  juntaPista: "#34312c",
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

const basicos = new Map<string, THREE.MeshBasicMaterial>();

/** Sem iluminação: o aro tem de ler a mesma cor sob qualquer luz da cena. */
export function matBasico(cor: string, opacidade = 1) {
  const chave = `${cor}|${opacidade}`;
  let m = basicos.get(chave);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: cor, transparent: opacidade < 1, opacity: opacidade, depthWrite: opacidade >= 1 });
    basicos.set(chave, m);
  }
  return m;
}

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

let textura: THREE.CanvasTexture | null = null;

/** Gradiente radial gerado uma vez e compartilhado por sombras de contato e brilhos. */
export function texturaMancha() {
  if (textura) return textura;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.75)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.22)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  textura = new THREE.CanvasTexture(c);
  return textura;
}

/**
 * Decalque deitado no piso: não grava profundidade e o polygonOffset o puxa à frente da laje,
 * então camadas quase coplanares não cintilam de longe. A cor vem por instância.
 */
export function matMancha(opacidade: number, camada: number) {
  // Iluminado como o piso: com a sala em foco, a mancha esmaecida (cor do piso) some em vez de virar um halo claro.
  return new THREE.MeshLambertMaterial({
    map: texturaMancha(),
    transparent: true,
    opacity: opacidade,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1 - camada,
    polygonOffsetUnits: -4 - camada * 2,
  });
}

/** Quadrado unitário deitado no plano xz, para as manchas instanciadas. */
export const quadPiso = () => obter("quadPiso", () => new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2));

/** Friso do destaque "borda" na mesa redonda: raio 1, tubo de 5,5% do raio, deitado no plano xz. */
export const friso = () => obter("friso", () => new THREE.TorusGeometry(0.97, 0.055, 8, 72).rotateX(Math.PI / 2));

const ESPESSURA_MOLDURA = 0.045;
const RAIO_CANTO = 0.06;

function retanguloArredondado(l: number, p: number, r: number) {
  const s = new THREE.Shape();
  const x = -l / 2;
  const y = -p / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + l - r, y);
  s.quadraticCurveTo(x + l, y, x + l, y + r);
  s.lineTo(x + l, y + p - r);
  s.quadraticCurveTo(x + l, y + p, x + l - r, y + p);
  s.lineTo(x + r, y + p);
  s.quadraticCurveTo(x, y + p, x, y + p - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Moldura do destaque "borda" na mesa retangular: retângulo arredondado vazado, na medida do tampo. */
export const moldura = (l: number, p: number) =>
  obter(`m${l},${p}`, () => {
    const e = ESPESSURA_MOLDURA;
    const forma = retanguloArredondado(l, p, RAIO_CANTO);
    forma.holes.push(retanguloArredondado(l - e * 2, p - e * 2, Math.max(0.01, RAIO_CANTO - e)));
    return new THREE.ExtrudeGeometry(forma, { depth: 0.022, bevelEnabled: false, curveSegments: 4 }).rotateX(-Math.PI / 2);
  });

/**
 * Juntas finas sobre uma face (tábuas do palco, placas da pista) fundidas numa só geometria:
 * dezenas de frisos custam uma chamada de desenho. `cruzado` acrescenta as juntas no outro eixo.
 */
export const juntas = (l: number, p: number, passo: number, cruzado = false) =>
  obter(`j${l},${p},${passo},${cruzado}`, () => {
    const partes: THREE.BufferGeometry[] = [];
    for (let z = -p / 2 + passo; z < p / 2 - 0.01; z += passo) partes.push(new THREE.BoxGeometry(l, 0.004, 0.018).translate(0, 0, z));
    if (cruzado) for (let x = -l / 2 + passo; x < l / 2 - 0.01; x += passo) partes.push(new THREE.BoxGeometry(0.018, 0.004, p).translate(x, 0, 0));
    return mergeGeometries(partes)!;
  });
