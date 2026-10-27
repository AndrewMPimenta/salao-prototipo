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
        "inline-flex min-h-11 items-center gap-2 rounded-(--radius-control) px-4 text-sm font-medium",
        // O escalonamento de 100ms confirma o toque antes de a ação resolver.
        "transition-[background-color,transform,opacity] duration-100 active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        variante === "padrao" &&
          "bg-(--color-raised) text-(--color-ink) shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1px_var(--color-line-2)]",
        variante === "solido" && "bg-(--color-accent) text-(--color-accent-ink) hover:opacity-90",
        variante === "silencioso" && "text-(--color-ink-2) hover:bg-(--color-sunken)",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
