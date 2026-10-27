/** localStorage pode lançar (modo privado, cota, bloqueio): a interface funciona sem ele. */
export function lerArmazenado<T>(chave: string, validar: (bruto: unknown) => T | null): T | null {
  try {
    const texto = window.localStorage.getItem(chave);
    return texto === null ? null : validar(JSON.parse(texto));
  } catch {
    return null;
  }
}

export function gravarArmazenado(chave: string, valor: unknown) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem persistência, o ajuste vale só nesta sessão.
  }
}
