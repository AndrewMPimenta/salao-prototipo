import type { Mesa } from "./types";
import { ms } from "@/components/three/cenarios";

/** Posições editadas de um ambiente, em % do campo, por id de mesa. */
export type SubstituicoesLayout = Record<number, { x: number; y: number }>;

/** Passo da grade de encaixe, em metros. */
export const GRADE_M = 0.25;

const chave = (ambienteId: string) => `layout:${ambienteId}`;

export function lerLayout(ambienteId: string): SubstituicoesLayout {
  try {
    const bruto = JSON.parse(localStorage.getItem(chave(ambienteId)) ?? "{}") as Record<string, unknown>;
    const out: SubstituicoesLayout = {};
    for (const [id, v] of Object.entries(bruto)) {
      const p = v as { x?: unknown; y?: unknown } | null;
      if (p && typeof p.x === "number" && typeof p.y === "number" && Number.isFinite(p.x) && Number.isFinite(p.y)) out[Number(id)] = { x: p.x, y: p.y };
    }
    return out;
  } catch {
    return {};
  }
}

export function gravarLayout(ambienteId: string, s: SubstituicoesLayout) {
  try {
    if (Object.keys(s).length === 0) localStorage.removeItem(chave(ambienteId));
    else localStorage.setItem(chave(ambienteId), JSON.stringify(s));
  } catch {
    // Sem localStorage a edição vale só nesta sessão.
  }
}

const reposicionadas = new WeakMap<Mesa, { x: number; y: number; mesa: Mesa }>();

/**
 * Mover uma mesa não pode renovar as demais: cada instância é reaproveitada enquanto a posição
 * não muda, e é isso que mantém as mesas memoizadas da planta e da cena fora do re-render.
 */
export function aplicarLayout(mesas: Mesa[], s: SubstituicoesLayout | undefined): Mesa[] {
  if (!s || Object.keys(s).length === 0) return mesas;

  return mesas.map((m) => {
    const p = s[m.id];
    if (!p) return m;
    const c = reposicionadas.get(m);
    if (c && c.x === p.x && c.y === p.y) return c.mesa;
    const mesa = { ...m, x: p.x, y: p.y };
    reposicionadas.set(m, { x: p.x, y: p.y, mesa });
    return mesa;
  });
}

export const encaixar = (v: number, passo = GRADE_M) => Math.round(v / passo) * passo;

/** Metade da largura e da altura da mesa, em metros. */
export const meiaMesa = (m: Pick<Mesa, "largura" | "altura">) => ({ rx: ms(m.largura) / 2, rz: ms(m.altura) / 2 });

/** Mantém a mesa inteira dentro do campo, em metros. */
export function limitarAoCampo(xm: number, ym: number, m: Pick<Mesa, "largura" | "altura">, campoL: number, campoP: number) {
  const { rx, rz } = meiaMesa(m);
  return {
    x: Math.min(Math.max(xm, rx), Math.max(rx, campoL - rx)),
    y: Math.min(Math.max(ym, rz), Math.max(rz, campoP - rz)),
  };
}

export interface Pegada {
  x: number;
  y: number;
  rx: number;
  ry: number;
  redonda: boolean;
}

export const pegadaDe = (m: Mesa, campoL: number, campoP: number): Pegada => ({
  x: (m.x / 100) * campoL,
  y: (m.y / 100) * campoP,
  rx: ms(m.largura) / 2,
  ry: ms(m.altura) / 2,
  redonda: m.forma === "redonda",
});

/** Sobreposição pela forma real do tampo (círculo ou retângulo), não pela caixa. */
export function sobrepoe(a: Pegada, b: Pegada): boolean {
  if (a.redonda && b.redonda) return Math.hypot(a.x - b.x, a.y - b.y) < a.rx + b.rx;
  if (!a.redonda && !b.redonda) return Math.abs(a.x - b.x) < a.rx + b.rx && Math.abs(a.y - b.y) < a.ry + b.ry;
  const [c, r] = a.redonda ? [a, b] : [b, a];
  const px = Math.min(Math.max(c.x, r.x - r.rx), r.x + r.rx);
  const py = Math.min(Math.max(c.y, r.y - r.ry), r.y + r.ry);
  return Math.hypot(c.x - px, c.y - py) < c.rx;
}

/** Ids das mesas que se sobrepõem a alguma outra. */
export function mesasEmConflito(mesas: Mesa[], campoL: number, campoP: number): Set<number> {
  const p = mesas.map((m) => pegadaDe(m, campoL, campoP));
  const out = new Set<number>();
  for (let i = 0; i < mesas.length; i++)
    for (let j = i + 1; j < mesas.length; j++)
      if (sobrepoe(p[i], p[j])) {
        out.add(mesas[i].id);
        out.add(mesas[j].id);
      }
  return out;
}
