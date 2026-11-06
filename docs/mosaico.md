# Mosaico no protótipo

A casca usa o Mosaico (`@multiclubes/ui`, repositório `Multiui-kit`), o design system da Multiclubes. O pacote é
privado e não publicado, então o protótipo traz uma **cópia** dos componentes e do tema ("depois de adicionado, o
componente é nosso"), o que também permite o deploy na Vercel.

- Commit do kit copiado: `ef50a2d`
- Origem: `packages/ui/src/components`, `packages/ui/src/hooks/use-mobile.ts`, `packages/ui/src/styles/globals.css`

## O que foi copiado

| Destino | Origem |
|---|---|
| `components/ui/{sidebar,breadcrumb,separator,tooltip,sheet,tabs,dropdown-menu,popover,switch,toggle-group,toggle,scroll-area,badge,card,kbd,input,input-group,textarea,button,collapsible,command,dialog,skeleton,progress}.tsx` | `components/*.tsx` |
| `hooks/use-mobile.ts` | `hooks/use-mobile.ts` |
| tokens, `@theme inline`, `.dark`, `@layer base` em `app/globals.css` | `styles/globals.css` |

## Diferenças em relação ao kit (ao ressincronizar, reaplicar)

1. Os imports `@multiclubes/ui/components/*` e `@multiclubes/ui/hooks/*` viraram `@/components/ui/*` e `@/hooks/*`.
2. `hooks/use-mobile.ts`: breakpoint 1024 (o kit usa 768), igual ao corte desktop/celular do protótipo.
3. `app/globals.css` não leva os loaders, a troca de tema animada nem as classes `animate-fluid-*`; leva o resto do tema.
   O tema escuro vale pela classe `dark` **e** por `data-theme="dark"` (as cores da cena 3D dependem do atributo);
   `hooks/use-tema.ts` e o script de `app/layout.tsx` mantêm os dois.
4. Os tokens de cena (`--color-livre-*`, `--color-brilho-*`, pisos de madeira, etc.) seguem no `@theme static`, fora do kit.
5. O `cn` dos componentes do kit vem do pacote `cn`; o código do app usa `lib/utils.ts` (clsx + tailwind-merge).
   Esse `cn` não resolve conflito entre classes com variável (`w-(--x)` contra `w-80`): use `min-w-*` ou `!` ao sobrescrever.

## Dependências

`@base-ui/react`, `@phosphor-icons/react`, `class-variance-authority`, `cmdk`, `cn`, `shadcn` (só para
`shadcn/tailwind.css`), `tw-animate-css`. Ícones da casca: Phosphor; as figuras de domínio (presets de câmera, bússola, detalhe
da mesa) continuam em SVG próprio.
