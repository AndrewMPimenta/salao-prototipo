"use client";

import { useTema, type Tema } from "@/hooks/use-tema";
import { ToggleGroup } from "./ui/toggle-group";

export function ThemeToggle() {
  const { tema, setTema } = useTema();

  return (
    <ToggleGroup<Tema>
      rotulo="Tema da interface"
      valor={tema}
      onChange={setTema}
      opcoes={[
        { valor: "claro", rotulo: "Claro" },
        { valor: "escuro", rotulo: "Escuro" },
        { valor: "sistema", rotulo: "Sistema" },
      ]}
    />
  );
}
