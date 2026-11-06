import dynamic from "next/dynamic";

// Superfícies que só aparecem sob demanda (detalhe da mesa, planta, linha do tempo, atalhos) ficam fora do bundle inicial.
// `precarregarTardias` as busca quando o navegador está ocioso, para o primeiro clique não esperar rede.
export const TableSheet = dynamic(() => import("./table-sheet").then((m) => m.TableSheet), { ssr: false });
export const FloorPlan = dynamic(() => import("./floor-plan").then((m) => m.FloorPlan), { ssr: false });
export const TimelineView = dynamic(() => import("./timeline-view").then((m) => m.TimelineView), { ssr: false });
export const AjudaAtalhos = dynamic(() => import("./shell/ajuda-atalhos").then((m) => m.AjudaAtalhos), { ssr: false });

export function precarregarTardias() {
  void import("./table-sheet");
  void import("./floor-plan");
  void import("./timeline-view");
  void import("./shell/ajuda-atalhos");
}
