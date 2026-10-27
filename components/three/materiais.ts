import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { EstadoMesa } from "@/lib/types";

export type Par = { fill: string; stroke: string };

/** O tampo é neutro em todos os estados: quem diz o estado é o aro da borda (`corAro`). */
export const TAMPO: Record<"claro" | "escuro", Par> = {
  claro: { fill: "#fbf8f2", stroke: "#8a8479" },
  escuro: { fill: "#46423b", stroke: "#8f897e" },
};

export type TipoAro = "solido" | "tracejado" | "fino";

/** Livre e conta usam o traço cheio; reservada é tracejada; ocupada recua num fio. */
export const TIPO_ARO: Record<EstadoMesa, TipoAro> = {
  livre: "solido",
  reservada: "tracejado",
  ocupada: "fino",
  conta: "solido",
};

const ARO_CLARO: Record<EstadoMesa, string> = { livre: "#1b1a17", reservada: "#4a463f", ocupada: "#aaa397", conta: "#0043ce" };
const ARO_ESCURO: Record<EstadoMesa, string> = { livre: "#f4f1ea", reservada: "#cdc6ba", ocupada: "#7c776d", conta: "#64b5f6" };

/** O realce do hover leva qualquer aro ao contraste máximo com o tampo. */
export function corAro(estado: EstadoMesa, escuro: boolean, realce: boolean) {
  const t = escuro ? ARO_ESCURO : ARO_CLARO;
  return realce ? t.livre : t[estado];
}

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

const PASSOS_ARCO = 48;

/** Arco horário a partir das 12h; a fração é quantizada para o cache não crescer sem limite. */
export const arco = (ri: number, ro: number, fracao: number) => {
  const passos = Math.max(1, Math.round(Math.min(Math.max(fracao, 0), 1) * PASSOS_ARCO));
  const comp = (passos / PASSOS_ARCO) * Math.PI * 2;
  return obter(`r${ri},${ro},${passos}`, () => new THREE.RingGeometry(ri, ro, Math.max(2, passos * 2), 1, Math.PI / 2 - comp, comp));
};

const SEGMENTOS_TRACEJADO = 28;

/** Anel tracejado numa só geometria: 28 arcos fundidos custam uma chamada de desenho. */
export const anelTracejado = (ri: number, ro: number) =>
  obter(`t${ri},${ro}`, () => {
    const passo = (Math.PI * 2) / SEGMENTOS_TRACEJADO;
    const partes = Array.from({ length: SEGMENTOS_TRACEJADO }, (_, k) => new THREE.RingGeometry(ri, ro, 3, 1, k * passo, passo * 0.55));
    return mergeGeometries(partes)!;
  });

const TUBO_ARO: Record<TipoAro, number> = { solido: 0.085, tracejado: 0.075, fino: 0.035 };
const ARCOS_ARO = 20;

/**
 * Aro de raio 1 deitado no plano xz; a escala uniforme da instância dá o raio da mesa e,
 * junto, a espessura proporcional. Os tracejados são arcos fundidos numa só geometria.
 */
export const aroCircular = (tipo: TipoAro) =>
  obter(`o${tipo}`, () => {
    const tubo = TUBO_ARO[tipo];
    if (tipo !== "tracejado") return new THREE.TorusGeometry(1, tubo, 6, 56).rotateX(Math.PI / 2);

    const passo = (Math.PI * 2) / ARCOS_ARO;
    const arcos = Array.from({ length: ARCOS_ARO }, (_, k) => new THREE.TorusGeometry(1, tubo, 6, 5, passo * 0.55).rotateZ(k * passo));
    return mergeGeometries(arcos)!.rotateX(Math.PI / 2);
  });

const ESPESSURA_ARO = { solido: 0.055, tracejado: 0.05, fino: 0.025 } as const;
const ALTURA_ARO = 0.02;

/** Moldura da mesa retangular, centrada na origem; o aro reto é feito de caixas porque a escala deformaria a espessura. */
export const aroRetangular = (largura: number, profundidade: number, tipo: TipoAro) =>
  obter(`q${largura},${profundidade},${tipo}`, () => {
    const e = ESPESSURA_ARO[tipo];
    const partes: THREE.BufferGeometry[] = [];

    // Traço contínuo ou dashes de 14 cm com vão de 10 cm, centrados na aresta.
    const aresta = (comp: number, cx: number, cz: number, horizontal: boolean) => {
      const peca = (len: number, off: number) => {
        const g = horizontal ? new THREE.BoxGeometry(len, ALTURA_ARO, e) : new THREE.BoxGeometry(e, ALTURA_ARO, len);
        partes.push(g.translate(horizontal ? cx + off : cx, 0, horizontal ? cz : cz + off));
      };
      if (tipo !== "tracejado") return peca(comp, 0);

      const dash = 0.14;
      const passo = dash + 0.1;
      const n = Math.max(1, Math.floor((comp + 0.1) / passo));
      const inicio = -((n - 1) * passo) / 2;
      for (let k = 0; k < n; k++) peca(dash, inicio + k * passo);
    };

    const x = largura / 2 - e / 2;
    const z = profundidade / 2 - e / 2;
    aresta(largura, 0, -z, true);
    aresta(largura, 0, z, true);
    aresta(profundidade - e * 2, -x, 0, false);
    aresta(profundidade - e * 2, x, 0, false);
    return mergeGeometries(partes)!;
  });

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
