/** "sempre" mostra só os números; o detalhe completo é sempre do hover. */
export type ModoRotulos = "hover" | "sempre";

/** Como a cor do sinal aparece na mesa: friso na borda do tampo, tampo pintado ou brilho no piso. */
export type Destaque = "borda" | "tampo" | "brilho";

/** Maître só consulta a ocupação (US 24358); Completo acrescenta consumo, comandas e posições simulados. */
export type Perfil = "maitre" | "completo";

export interface Exibicao {
  perfil: Perfil;
  rotulos: ModoRotulos;
  destaque: Destaque;
  cadeiras: boolean;
  /** Só aparecem com cadeiras: ficam sentadas nelas. */
  pessoas: boolean;
  sombras: boolean;
}

const CHAVE = "exibicao";

/**
 * Máquina fraca começa sem cadeiras e pessoas. O tamanho do salão não pesa: tudo é instanciado
 * e de longe as cadeiras somem sozinhas. As sombras de contato custam uma chamada de desenho.
 */
export function exibicaoPadrao(maquinaFraca: boolean): Exibicao {
  return { perfil: "maitre", rotulos: "hover", destaque: "borda", cadeiras: !maquinaFraca, pessoas: !maquinaFraca, sombras: true };
}

export function lerAjustes(): Partial<Exibicao> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as Record<string, unknown>;
    const out: Partial<Exibicao> = {};
    if (bruto.perfil === "maitre" || bruto.perfil === "completo") out.perfil = bruto.perfil;
    if (bruto.rotulos === "sempre" || bruto.rotulos === "hover") out.rotulos = bruto.rotulos;
    if (bruto.destaque === "borda" || bruto.destaque === "tampo" || bruto.destaque === "brilho") out.destaque = bruto.destaque;
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
