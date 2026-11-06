import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ocupação do salão",
  description: "Mapa de mesas em tempo real para o salão do restaurante.",
};

// `viewportFit: cover` libera as áreas seguras do iPhone para a cena 3D.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
  ],
};

/*
  Roda antes da primeira pintura: sem isto a página carrega no tema padrão e
  salta para o escolhido quando o React hidrata. O padrão é "claro" e precisa
  ser o mesmo valor inicial do hook `useTema`, senão os dois discordam.
*/
const SCRIPT_TEMA = `
(function () {
  try {
    var t = localStorage.getItem("tema") || "claro";
    var escuro =
      t === "escuro" ||
      (t === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
    document.documentElement.classList.toggle("dark", escuro);
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-[family-name:var(--font-sans)]"><TooltipProvider delay={400}>{children}</TooltipProvider></body>
    </html>
  );
}
