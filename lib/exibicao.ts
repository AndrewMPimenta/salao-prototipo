export type ModoRotulos = "auto" | "sempre" | "hover";

export interface Exibicao {
  rotulos: ModoRotulos;
  cadeiras: boolean;
  /** Só aparecem com cadeiras: ficam sentadas nelas. */
  pessoas: boolean;
  sombras: boolean;
}

const CHAVE = "exibicao";

/** Salão grande ou máquina fraca começa sem cadeiras, pessoas e sombras; o resto do padrão é fixo. */
export function exibicaoPadrao(totalMesas: number, maquinaFraca: boolean): Exibicao {
  const leve = totalMesas > 60 || maquinaFraca;
  return { rotulos: "auto", cadeiras: !leve, pessoas: !leve, sombras: !leve };
}

export function lerAjustes(): Partial<Exibicao> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as Record<string, unknown>;
    const out: Partial<Exibicao> = {};
    if (bruto.rotulos === "auto" || bruto.rotulos === "sempre" || bruto.rotulos === "hover") out.rotulos = bruto.rotulos;
    for (const k of ["cadeiras", "pessoas", "sombras"] as const) if (typeof bruto[k] === "boolean") out[k] = bruto[k];
    return out;
  } catch {
    return {};
  }
}

export function gravarAjustes(a: Partial<Exibicao>) {
  try {
    if (Object.keys(a).length === 0) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, JSON.stringify(a));
  } catch {
    // localStorage pode lançar em janela privada ou com dados bloqueados.
  }
}
