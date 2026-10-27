"use client";

import { ToggleGroup } from "../ui/toggle-group";
import type { FiltroRapido } from "./tipos";

interface FiltrosRapidosProps {
  valor: FiltroRapido | "outro";
  atencao: number;
  onChange: (f: FiltroRapido) => void;
  className?: string;
}

/**
 * O trio é o controle primário; os chips finos do OccupancyBar ficam para
 * quem quer um estado específico. "outro" (um chip fino ativo) não acende
 * nenhum segmento, porque nenhum dos três descreve o filtro.
 */
export function FiltrosRapidos({ valor, atencao, onChange, className }: FiltrosRapidosProps) {
  return (
    <ToggleGroup<FiltroRapido>
      rotulo="Filtro rápido"
      tamanho="sm"
      className={className}
      valor={valor as FiltroRapido}
      onChange={onChange}
      opcoes={[
        { valor: "todas", rotulo: "Todas" },
        { valor: "livres", rotulo: "Livres" },
        { valor: "atencao", rotulo: atencao ? `Atenção (${atencao})` : "Atenção" },
      ]}
    />
  );
}
