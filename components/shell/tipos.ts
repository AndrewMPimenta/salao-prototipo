export type Vista = "3d" | "planta" | "linha";
export type VistaCamera = "aerea" | "perspectiva" | "nivel";
export type FiltroRapido = "todas" | "livres" | "atencao";

export const PRESETS: VistaCamera[] = ["aerea", "perspectiva", "nivel"];
export const ROTULO_PRESET: Record<VistaCamera, string> = {
  aerea: "Aérea",
  perspectiva: "Perspectiva",
  nivel: "Nível",
};

export interface PropsLayout {
  salao: import("@/hooks/use-salao").Salao;
  /** Chrome escondido; só a pílula "Mostrar controles" fica. */
  imersivo: boolean;
  telaCheia: { ativo: boolean; imersivoNoLugar: boolean; alternar: () => void };
}
