# Regras de negócio — Ocupação do salão

Decisão de produto do protótipo. Os limiares são configuráveis por casa; os valores abaixo são o
padrão.

## Referência: como o mercado organiza a planta 2D

| Produto | Estado da mesa | Tempo | Alerta |
|---|---|---|---|
| Toast / Square (PDV) | cor por etapa do serviço (sentada, pediu, conta, paga, suja) | cronômetro desde que sentou | mesa "parada" há muito tempo |
| OpenTable / SevenRooms (reserva) | cor por etapa (entrada, prato, sobremesa, conta) | anel de progresso em volta da mesa contra o tempo médio de giro | anel muda de cor ao estourar o tempo |
| Resy / Tock | livre, reservada em breve, ocupada | tempo previsto de liberação | reserva atrasada |

O padrão que se repete: **cor para o estado** (calmo, poucas cores) e **destaque para o que pede
ação** (raro, chamativo). O protótipo junta os dois num só sinal de cor por mesa e deixa o tempo
para o texto do hover e do popup.

## 1. Estado da mesa — a cor do sinal

Um estado por mesa, mutuamente exclusivo. O mobiliário é neutro para todos (tampo, cadeiras e figuras
em cinzas quentes foscos); a única cor da cena é a do **sinal** da mesa, mostrado no destaque que o
usuário escolhe em Exibição: **Borda** (padrão, friso colorido na borda do tampo), **Tampo** (o tampo
inteiro na cor) ou **Brilho** (mancha suave no piso, sob a mesa e as cadeiras). As amostras da legenda
e das listas seguem o mesmo destaque.

| Estado | Regra | Cor |
|---|---|---|
| **Livre** | sem comanda e sem reserva nos próximos 30 min | verde — o sinal universal de "disponível", que o cliente e a recepção procuram |
| **Reservada** | sem comanda, com reserva em até 30 min | violeta |
| **Ocupada** | comanda aberta | nenhum — só a sombra de contato; a mesa recua para o fundo |
| **Conta** | conta impressa, aguardando pagamento | azul |

Ocupada **não é alerta**. Uma mesa ocupada em andamento normal não pede nada do operador; destacá-la
esconde as que realmente precisam de atenção.

## 2. Alertas — a cor do alerta vence a do estado

Alertas são independentes do estado e uma mesa pode ter mais de um. Na cena, o **alerta mais urgente
toma o lugar da cor do estado**; no destaque Brilho ele é maior e mais forte que qualquer brilho de
estado, para não depender só da cor. Não há número, glifo nem minutos sobre a mesa: o alerta precisa ser visto sem interação,
mas não pode poluir a visão geral. O hover e o popup dizem o alerta por escrito, com o tempo.

| Alerta | Regra (padrão) | Severidade | Cor |
|---|---|---|---|
| **Sem pedido** | mesa ocupada há ≥ 20 min sem lançar nada (desde o último pedido, ou desde a abertura se nunca pediu) | Atenção | vermelho, forte |
| **Sem pedido crítico** | o mesmo, ≥ 40 min | Crítico | vermelho, maior e mais intenso |
| **Entrega atrasada** | item lançado há ≥ 15 min e ainda não entregue | Atenção | âmbar, forte |
| **Conta parada** | conta impressa há ≥ 10 min sem pagamento | Informativo | azul, forte |

Prioridade: sem pedido crítico → entrega atrasada → sem pedido → conta parada. Mesa com conta
impressa não recebe "sem pedido": o cliente já está fechando.

Por que "sem pedido" é vermelho e "entrega atrasada" é âmbar: sem pedido é **receita parada e cliente
esquecido**, o garçom precisa ir à mesa; entrega atrasada é um problema da cozinha/expedição, que o
salão acompanha. Nas listas e no popup o glifo do alerta distingue os dois sem depender da cor.

Pedidos pendentes **dentro** do prazo não são alerta: aparecem só como contagem no popup.

## Rótulos e foco

O número é o que mais polui um salão grande, então a cena não mostra rótulo nenhum por padrão. Ao
passar o mouse (ou pela lista de mesas) surge uma pílula **acima** da mesa, nunca sobre o tampo, com
número, estado e o alerta principal com os minutos. Em **Exibição** (botão na pilha da câmera) o
usuário troca para **Números**, que mostra só o número das mesas que cabem na tela sem se sobrepor, e
liga e desliga cadeiras, pessoas e sombras. De longe, cadeiras e pessoas somem sozinhas.

Ao selecionar uma mesa (na cena, na lista ou no painel de atenção) a sala entra em **foco**: a luz
geral cai para cerca de um terço, as outras mesas recuam e um holofote acende a mesa escolhida, sem
rótulo na cena — o número e os detalhes estão no popup. Se a mesa estiver sob o popup, a câmera
desliza o necessário para mostrá-la, sem zoom. Clicar no piso, Esc ou fechar o popup devolve a sala.
Os filtros (Livres, Atenção) usam o mesmo recuo para as mesas que não entram.

## 3. Tempo — no texto, não na cena

A permanência aparece no popup ("Permanência: 1h06 de 35 min", contra a média da casa, 35 min por
padrão) e na previsão de liberação. Ficar mais tempo que a média não vira alerta, porque não é
problema por si só. Não há anel de tempo no piso: de longe ele vira ruído em volta das
mesas.

## 4. Popup da mesa — informações da mesa

Ordem pensada para o operador responder "o que está acontecendo nesta mesa?" em um olhar:

1. **Cabeçalho:** número grande, ambiente · praça · garçom.
2. **Estado + alertas ativos:** uma linha por alerta, com ícone, texto e tempo ("Sem pedido há 56 min").
3. **Dados da mesa:**
   - Livre: lugares, livre há, próxima reserva (horário, nome, pessoas).
   - Ocupada/conta: pessoas / lugares, permanência contra a média, último pedido há, pedidos pendentes (e há quanto
     tempo o mais antigo), consumo e consumo por pessoa, previsão de liberação.
4. **Rodapé:** "Somente consulta" — o protótipo não opera a mesa.

## 5. Painel "Precisam de atenção"

Lista só mesas com alerta, ordenadas pela prioridade do selo e depois pelo tempo. Ocupadas sem alerta
não entram.

## Em aberto

- "Precisa limpar" (mesa paga e ainda não liberada) depende de um evento que o PDV hoje não registra.
- Os limiares devem ser configuráveis por casa; o protótipo usa os padrões acima.

## Comandas, posições e divisão da conta

Base: o PDV Desktop atual (Multivendas) e a US 24360 — *Lançamento de pedidos por posição*.

### O que o PDV atual já mostra, e como fica aqui

| PDV Desktop hoje | No protótipo |
|---|---|
| Mesa com várias comandas ("3 comandas", Nº 9252) | Aba **Comandas** no detalhe da mesa: nº, titular, total, abertura, última venda, itens, aberto por |
| Mesa nomeada ("1 - CAIO VI…") | Nome opcional da mesa no cabeçalho do detalhe |
| "Livre" em cartão vazio | Brilho verde na cena; sem cartão |
| "16 mesas abertas" no rodapé | Resumo de ocupação (já existe) |
| F2 / F5 / digitar o nº da mesa | Busca "Ir para mesa" (/), atalhos já existentes |

### Posições (US 24360)

- Recurso **opcional por estabelecimento** (`posicoesHabilitadas`). Desligado, a mesa funciona como hoje, sem posições.
- Cada cadeira da mesa é uma **posição** (P1…Pn, no sentido horário a partir da cabeceira/porta). A abertura registra quais posições estão ocupadas; posições podem entrar e sair com a mesa aberta. Posição com consumo não pode ser removida.
- Todo item lançado em mesa com posições pertence a uma posição — exceto itens marcados **compartilhados** (ex.: porção, garrafa de vinho), que são divididos entre as posições que os consumiram.
- Mesa aberta antes da ativação segue sem posições.

### Divisão da conta por posição (fechamento)

- O detalhe da mesa ganha a aba **Posições**: cada posição com seus itens, a parte dos compartilhados, a taxa de serviço (10%, opcional) e o subtotal.
- Modos de divisão: **por consumo** (padrão, usa as posições) e **igualmente** (total ÷ posições ocupadas). Os centavos que sobram da divisão vão para a primeira posição, para a soma fechar exatamente.
- **Cobrar uma posição por vez**, sem fechar a mesa: a posição fica *paga* e some do saldo; a mesa fecha quando todas estiverem pagas. No protótipo a cobrança é **simulada** (não persiste).
- Na cena 3D, com a mesa em foco, cada cadeira mostra o número da posição; clicar numa cadeira abre a posição no painel. Posição paga: cadeira e boneco esmaecidos com um selo de "pago".
