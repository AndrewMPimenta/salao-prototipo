"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { materializar } from "./materializar";

/** Único elemento visível no modo imersivo. */
export function PilulaImersivo({ visivel, onClick }: { visivel: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      inert={!visivel}
      onClick={onClick}
      className={cn(
        "absolute left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-30 h-11 -translate-x-1/2 rounded-full px-5 shadow-sm",
        materializar(visivel, "cima"),
      )}
    >
      Mostrar controles
    </Button>
  );
}
