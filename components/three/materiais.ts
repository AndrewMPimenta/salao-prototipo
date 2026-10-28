import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { EstadoMesa, TipoAlerta } from "@/lib/types";

export type Par = { fill: string; stroke: string };

/** O tampo é neutro em todos os estados: quem diz o estado é o brilho no piso (`corBrilho`). */
export const TAMPO: Record<"claro" | "escuro", Par> = {
  claro: { fill: "#f1ebe0", stroke: "#cbc0ad" },
  escuro: { fill: "#2b2723", stroke: "#4f463d" },
};

/** Intensidade do brilho: alerta é maior e mais forte que estado, para não depender só da cor. */
export type NivelBrilho = "estado" | "alerta" | "critico";

/*
  O piso é madeira invertida em relação ao tema (escura no claro, clara no escuro), então o mesmo
  sinal precisa de dois tons: vivo sobre o piso escuro e profundo sobre o piso claro. O friso e o
  tampo pintado ficam na mesa, que é invertida de novo, e usam o tom oposto ao do brilho.
*/
const SINAL_VIVO = {
  livre: "#3fe0a0",
  reservada: "#b7a2ff",
  conta: "#5eb4ff",
  vermelho: "#ff5a4d",
  ambar: "#ffc23a",
  selecao: "#ffffff",
};
const SINAL_PROFUNDO = {
  livre: "#0b7a4d",
  reservada: "#5a32c9",
  conta: "#0a3fbf",
  vermelho: "#c4161c",
  ambar: "#b86400",
  selecao: "#1b1a17",
};

export type Superficie = "piso" | "tampo";

/** Sinal mais importante da mesa: o alerta vence o estado; ocupada sem alerta não brilha. */
export function corBrilho(
  estado: EstadoMesa,
  alerta: TipoAlerta | undefined,
  escuro: boolean,
  sobre: Superficie = "piso",
): { cor: string; nivel: NivelBrilho } | null {
  const t = escuro === (sobre === "tampo") ? SINAL_VIVO : SINAL_PROFUNDO;
  if (alerta === "semPedidoCritico") return { cor: t.vermelho, nivel: "critico" };
  if (alerta === "semPedido") return { cor: t.vermelho, nivel: "alerta" };
  if (alerta === "entregaAtrasada") return { cor: t.ambar, nivel: "alerta" };
  if (alerta === "contaParada") return { cor: t.conta, nivel: "alerta" };
  if (estado === "ocupada") return null;
  return { cor: t[estado], nivel: "estado" };
}

/** Mesa em foco sem brilho próprio (ocupada) ganha um brilho neutro de tinta. */
export const corSelecao = (escuro: boolean) => (escuro ? SINAL_PROFUNDO : SINAL_VIVO).selecao;

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
  mezPiso: string;
  verde: string;
  vaso: string;
  cadeira: string;
  figura: string;
  anel: string;
  vidro: string;
  agua: string;
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
  piso: "#7a5a3e",
  plinto: "#46341f",
  parede: "#e4ddd0",
  capa: "#f4efe6",
  madeira: "#a98763",
  madeiraEscura: "#5c4230",
  deck: "#6c5a47",
  mezPiso: "#6e4f36",
  verde: "#7f9068",
  vaso: "#b6a794",
  cadeira: "#cfc5b4",
  figura: "#8d8173",
  anel: "#1b1a17",
  vidro: "#cfe3ea",
  agua: "#3f9fc9",
  trilho: "#d4cabb",
  porta: "#cdbfa9",
  placa: "#f5f2ec",
  icone: "#2a2824",
  sofa: "#d8d0c2",
  almofada: "#e8e1d4",
  balcao: "#3a2d24",
  balcaoTopo: "#eae2d4",
  pista: "#cfc9be",
  juntaPista: "#a8a296",
};

const CORES_ESCURO: Cores = {
  fundo: "#151412",
  piso: "#b99b78",
  plinto: "#7d6347",
  parede: "#34302b",
  capa: "#4d4740",
  madeira: "#8a6c4c",
  madeiraEscura: "#66503a",
  deck: "#ab9a82",
  mezPiso: "#a88b69",
  verde: "#566a45",
  vaso: "#4a4239",
  cadeira: "#4a423a",
  figura: "#7b6e5f",
  anel: "#f4f1ea",
  vidro: "#8fb3c0",
  agua: "#3a8fb8",
  trilho: "#3d3731",
  porta: "#4d473f",
  placa: "#5a5750",
  icone: "#15140f",
  sofa: "#403a33",
  almofada: "#554e45",
  balcao: "#2a2420",
  balcaoTopo: "#d6ccbb",
  pista: "#3a3f45",
  juntaPista: "#2a2e33",
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

// Tábuas de 0,18 m correndo em x; o ladrilho cobre 8 fiadas, e as juntas de topo de cada fiada são sorteadas.
const TABUA_M = 0.18;
const FIADAS = 8;
const LADRILHO_L = 2.88;
const LADRILHO_P = TABUA_M * FIADAS;
const TOM_BASE = 0.94;

let texturaTabuas: THREE.CanvasTexture | null = null;

/**
 * Padrão de tábuas desenhado uma única vez e compartilhado por todos os pisos. Só carrega valor
 * (cinza ao redor de 0,94): a cor de cada ambiente e tema entra pela cor do material.
 */
function texturaMadeira() {
  if (texturaTabuas) return texturaTabuas;

  const larg = 1024;
  const alt = 512;
  const fiada = alt / FIADAS;
  const c = document.createElement("canvas");
  c.width = larg;
  c.height = alt;
  const g = c.getContext("2d")!;

  // Semente fixa: o desenho não muda entre recargas nem entre abas.
  let sem = 20240611;
  const rnd = () => {
    sem = (sem * 1664525 + 1013904223) >>> 0;
    return sem / 4294967296;
  };
  const noWrap = (x: number, w: number, desenha: (xx: number) => void) => {
    desenha(x);
    if (x + w > larg) desenha(x - larg);
  };

  g.fillStyle = "#f0f0f0";
  g.fillRect(0, 0, larg, alt);

  for (let f = 0; f < FIADAS; f++) {
    const y = f * fiada;
    const inicio = rnd() * larg;
    const cortes: number[] = [];
    for (let x = 0; x < larg; ) {
      const len = 380 + rnd() * 340;
      x += larg - x < 260 ? larg - x : len;
      cortes.push(Math.min(x, larg));
    }

    let ant = 0;
    for (const fim of cortes) {
      const x0 = (inicio + ant) % larg;
      const w = fim - ant;
      const v = Math.round(255 * (TOM_BASE + (rnd() - 0.5) * 0.12));
      noWrap(x0, w, (xx) => {
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(xx, y, w, fiada);
        // Veio: fios longos e quase invisíveis, só para a tábua não parecer chapada.
        for (let k = 0; k < 4; k++) {
          const gy = y + 6 + rnd() * (fiada - 12);
          const gx = xx + rnd() * w * 0.4;
          g.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.045)" : "rgba(255,255,255,0.06)";
          g.fillRect(gx, gy, w * (0.35 + rnd() * 0.5), 1);
        }
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.fillRect(xx, y, 1.6, fiada);
      });
      ant = fim;
    }

    g.fillStyle = "rgba(0,0,0,0.24)";
    g.fillRect(0, y + fiada - 1.4, larg, 1.4);
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  texturaTabuas = t;
  return t;
}

const pisos = new Map<string, THREE.MeshStandardMaterial>();

/** Piso de madeira fosco; a textura carrega só o valor, então a cor sobe para compensar o 0,94 médio dela. */
export function matMadeira(cor: string) {
  let m = pisos.get(cor);
  if (!m) {
    const k = 1 / new THREE.Color().setRGB(TOM_BASE, TOM_BASE, TOM_BASE, THREE.SRGBColorSpace).r;
    m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cor).multiplyScalar(k),
      map: texturaMadeira(),
      roughness: 0.94,
      metalness: 0,
      // Rente à laje: o offset evita a briga de profundidade de longe.
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    pisos.set(cor, m);
  }
  return m;
}

/** Plano do piso com UV em metros: as tábuas mantêm 0,18 m em qualquer tamanho de sala. */
export const planoMadeira = (l: number, p: number) =>
  obter(`pm${l},${p}`, () => {
    const g = new THREE.PlaneGeometry(l, p).rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * l) / LADRILHO_L, (uv.getY(i) * p) / LADRILHO_P);
    return g;
  });

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
