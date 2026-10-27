"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variante = "padrao" | "solido" | "silencioso";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = "padrao", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-[11px] px-4 text-[14px] font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        variante === "padrao" && "bg-(--color-sunken)/70 hover:bg-(--color-sunken)",
        variante === "solido" && "bg-(--color-ink) text-(--color-app) hover:opacity-85",
        variante === "silencioso" && "hover:bg-(--color-sunken)/70",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
