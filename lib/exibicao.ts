/** "sempre" mostra só os números; o detalhe completo é sempre do hover. */
export type ModoRotulos = "hover" | "sempre";

/** Como a cor do sinal aparece na mesa: friso na borda do tampo, tampo pintado ou brilho no piso. */
export type Destaque = "borda" | "tampo" | "brilho";

/** Maître só consulta a ocupação (US 24358); Completo acrescenta consumo, comandas e posições simulados. */
export type Perfil = "maitre" | "completo";

/** Simplificado: lugares como pinos (base baixa, pino onde há gente); Completo: cadeiras e figuras sentadas. */
export type Assentos = "nenhum" | "simplificado" | "completo";

export interface Exibicao {
  perfil: Perfil;
  rotulos: ModoRotulos;
  destaque: Destaque;
  assentos: Assentos;
  sombras: boolean;
}

const CHAVE = "exibicao";

/**
 * Simplificado é o padrão em qualquer máquina: custa duas malhas instanciadas e só a mesa em foco
 * paga a cadeira completa. As sombras de contato custam uma chamada de desenho.
 */
export function exibicaoPadrao(): Exibicao {
  return { perfil: "maitre", rotulos: "hover", destaque: "borda", assentos: "simplificado", sombras: true };
}

export function lerAjustes(): Partial<Exibicao> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as Record<string, unknown>;
    const out: Partial<Exibicao> = {};
    if (bruto.perfil === "maitre" || bruto.perfil === "completo") out.perfil = bruto.perfil;
    if (bruto.rotulos === "sempre" || bruto.rotulos === "hover") out.rotulos = bruto.rotulos;
    if (bruto.destaque === "borda" || bruto.destaque === "tampo" || bruto.destaque === "brilho") out.destaque = bruto.destaque;
    if (typeof bruto.sombras === "boolean") out.sombras = bruto.sombras;

    if (bruto.assentos === "nenhum" || bruto.assentos === "simplificado" || bruto.assentos === "completo") out.assentos = bruto.assentos;
    // Ajuste gravado antes do ajuste único: cadeiras desligadas = nenhum; com pessoas = completo; só cadeiras = simplificado.
    else if (typeof bruto.cadeiras === "boolean" || typeof bruto.pessoas === "boolean") {
      if (bruto.cadeiras === false) out.assentos = "nenhum";
      else out.assentos = bruto.pessoas === true ? "completo" : "simplificado";
    }
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
