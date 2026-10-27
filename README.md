# Ocupação do salão

Tela de ocupação de salão para PDV de restaurante. Next.js 15 (App Router),
React 19, TypeScript, Tailwind v4 e react-three-fiber para a vista 3D.

```bash
npm install
npm run dev
```

## Por que o código é assim

### O estado da mesa é derivado, nunca armazenado

`lib/state.ts` calcula o estado a partir dos minutos sem pedido e dos limiares.
Mudar um limiar reclassifica o salão inteiro sem tocar nos dados. Se o estado
fosse gravado, cada mudança de política exigiria migração.

### A cor não carrega informação sozinha

A paleta convencional de PDV — verde, amarelo, vermelho — tem um problema
medido: amarelo `#f1c21b` contra vermelho `#da1e28` dá **2,97:1**, abaixo do
mínimo de 3:1 da SC 1.4.11 do WCAG 2.2, que é limiar duro e não arredondado. E
é justamente o par entre os dois níveis de escalada.

A paleta aqui inverte a lógica (princípio ISA-101, "Gray is Good"): `livre` e
`ocupada` não têm matiz, e toda a cor saturada vai para os três estados que
pedem ação, num eixo laranja escalante mais azul terminal. Os âncoras laranja
vêm da paleta Okabe-Ito; o azul é o Blue 70 do IBM Carbon. Os traços escuros
foram derivados por cálculo e são decisão de projeto, não valores de fonte.

Cada estado carrega quatro sinais independentes: preenchimento, espessura de
traço, glifo e numeral — mais as cadeiras preenchidas, que contam pessoas. O
conjunto sobrevive ao teste de escala de cinza.

### Três layouts, uma funcionalidade

Nada é removido por tamanho de tela; o que muda é quanto aparece de uma vez.
No celular a planta sai porque não cabe: em 390px entram ~6 mesas com alvos de
44–48px, e o salão tem 20+. O ambiente vira o alvo grande e a mesa vira lista
ordenada por posição física.

### Teclado por geometria

`hooks/use-spatial-keyboard.ts` move o foco para a vizinha mais próxima **na
direção pedida**, não para a próxima do DOM — num mapa de salão a ordem do DOM
não tem significado espacial. Segue o espírito do padrão Grid do ARIA APG, com
roving tabindex.

Os atalhos de tecla única podem ser desligados, como exige a SC 2.1.4.

### O 3D é deliberadamente limitado

`components/floor-3d.tsx` serve à tela de parede e à do cliente, não à
operacional. Ele inclui um medidor de oclusão que conta, a cada quadro, quantas
mesas estão escondidas atrás de outras do ângulo atual — o custo do 3D fica
visível em número. Os rótulos são HTML plano projetado sobre a cena, porque
texto em perspectiva é ilegível.

## Verificações pendentes

Honestidade sobre o que não foi confirmado na pesquisa que originou este
projeto:

- O texto normativo das SC **2.1.1, 2.1.2, 2.1.4, 2.4.3 e 2.4.11** não foi
  verificado. Confira 2.1.4 em w3.org antes de fechar os atalhos.
- A escala do modo parede (~1,5×) é inferência por analogia com os números
  oficiais do tvOS. **Não existe fórmula publicada** para leitura a 1–3 metros;
  o ajuste final tem que ser medido no local.
- A previsão de liberação usa permanência média fixa. Mesa que pediu sobremesa
  e mesa esperando a conta aparecem iguais.
- Performance de render não foi medida acima de ~30 mesas por ambiente. Se
  algum salão passar de 100, meça antes de manter DOM — a alternativa é canvas
  (Konva) ou virtualização.

## Estrutura

```
app/
  layout.tsx            fontes e shell
  page.tsx              Server Component: busca os dados
  globals.css           tokens Tailwind v4, claro e escuro
components/
  salao-client.tsx      estado da tela e troca de vista
  floor-plan.tsx        planta 2D
  table-shape.tsx       a mesa e as cadeiras
  occupancy-bar.tsx     barra de ocupação: resumo + legenda + filtro
  zone-rail.tsx         trilha de ambientes
  attention-panel.tsx   fila de mesas que pedem ação
  timeline-view.tsx     previsão de liberação
  mobile-list.tsx       lista do celular
  table-sheet.tsx       bottom sheet em dois estágios
  floor-3d.tsx          cena 3D + medidor de oclusão
  ui/                   primitivos
lib/
  types.ts  state.ts  data.ts  geometria.ts  utils.ts
hooks/
  use-spatial-keyboard.ts  use-atalhos.ts
```

Os dados em `lib/data.ts` são de exemplo. Troque por leitura do banco.
