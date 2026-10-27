# Regras de negócio — Ocupação do salão

Decisão de produto do protótipo. Os limiares são configuráveis por casa; os valores abaixo são o
padrão.

## Referência: como o mercado organiza a planta 2D

| Produto | Estado da mesa | Tempo | Alerta |
|---|---|---|---|
| Toast / Square (PDV) | cor por etapa do serviço (sentada, pediu, conta, paga, suja) | cronômetro desde que sentou | mesa "parada" há muito tempo |
| OpenTable / SevenRooms (reserva) | cor por etapa (entrada, prato, sobremesa, conta) | anel de progresso em volta da mesa contra o tempo médio de giro | anel muda de cor ao estourar o tempo |
| Resy / Tock | livre, reservada em breve, ocupada | tempo previsto de liberação | reserva atrasada |

O padrão que se repete: **cor para o estado** (calmo, poucas cores), **selo para o que pede ação**
(raro, chamativo) e **anel para o tempo** (lido de relance, sem número). O protótipo adota os três.

## 1. Estado da mesa — o aro do tampo

Um estado por mesa, mutuamente exclusivo. O tampo é neutro para todos; o estado está no **aro**
em volta da borda, visível de qualquer distância e sem texto:

| Estado | Regra | Aro |
|---|---|---|
| **Livre** | sem comanda e sem reserva nos próximos 30 min | preto, grosso — é o que o cliente e a recepção procuram |
| **Reservada** | sem comanda, com reserva em até 30 min | tracejado |
| **Ocupada** | comanda aberta | cinza fino, recua para o fundo |
| **Conta** | conta impressa, aguardando pagamento | azul |

Ocupada **não é alerta**. Uma mesa ocupada em andamento normal não pede nada do operador; destacá-la
esconde as que realmente precisam de atenção.

## 2. Alertas — o marcador sobre a mesa

Alertas são independentes do estado e uma mesa pode ter mais de um. Sobre a mesa fica só um
**marcador de 14 px com o glifo** do mais urgente, sem número nem minutos: alerta precisa ser visto
sem interação, mas não pode poluir a visão geral. O rótulo completo (ao passar o mouse ou ao
selecionar) e o popup mostram todos, com o tempo.

| Alerta | Regra (padrão) | Severidade | Marcador |
|---|---|---|---|
| **Sem pedido** | mesa ocupada há ≥ 20 min sem lançar nada (desde o último pedido, ou desde a abertura se nunca pediu) | Atenção | vermelho com "!" |
| **Sem pedido crítico** | o mesmo, ≥ 40 min | Crítico | vermelho com "!!" e halo vermelho no piso |
| **Entrega atrasada** | item lançado há ≥ 15 min e ainda não entregue | Atenção | âmbar com relógio |
| **Conta parada** | conta impressa há ≥ 10 min sem pagamento | Informativo | azul com "R$" |

Prioridade: sem pedido crítico → entrega atrasada → sem pedido → conta parada. Mesa com conta
impressa não recebe "sem pedido": o cliente já está fechando.

Por que "sem pedido" é vermelho e "entrega atrasada" é âmbar: sem pedido é **receita parada e cliente
esquecido**, o garçom precisa ir à mesa; entrega atrasada é um problema da cozinha/expedição, que o
salão acompanha. O glifo distingue os dois sem depender da cor.

Pedidos pendentes **dentro** do prazo não são alerta: aparecem só como contagem no popup.

## Número da mesa — sob demanda

O número é o que mais polui um salão grande, então ele não aparece na visão geral. No modo
**Automático** surge quando o zoom deixa a mesa com pelo menos 34 px na tela; ao passar o mouse (ou
pela lista de mesas) aparece o rótulo completo na hora. O usuário pode trocar para **Sempre** ou
**Ao passar o mouse** em Exibição, onde também liga e desliga cadeiras, pessoas e sombras e salva a
vista padrão da câmera.

## 3. Tempo — o anel no piso

Mesas ocupadas ganham um anel fino no piso, em volta da mesa, que se completa conforme a permanência
se aproxima da média da casa (35 min por padrão). Lido de relance: anel quase fechado = mesa perto de
liberar. Ao passar da média, o anel fica completo e muda para o tom de "ocupada" mais escuro; não vira
alerta, porque ficar mais tempo não é problema por si só.

## 4. Popup da mesa — informações da mesa

Ordem pensada para o operador responder "o que está acontecendo nesta mesa?" em um olhar:

1. **Cabeçalho:** número grande, ambiente · praça · garçom.
2. **Estado + alertas ativos:** uma linha por alerta, com ícone, texto e tempo ("Sem pedido há 56 min").
3. **Dados da mesa:**
   - Livre: lugares, livre há, próxima reserva (horário, nome, pessoas).
   - Ocupada/conta: pessoas / lugares, aberta há, último pedido há, pedidos pendentes (e há quanto
     tempo o mais antigo), consumo e consumo por pessoa, previsão de liberação.
4. **Rodapé:** "Somente consulta" — o protótipo não opera a mesa.

## 5. Painel "Precisam de atenção"

Lista só mesas com alerta, ordenadas pela prioridade do selo e depois pelo tempo. Ocupadas sem alerta
não entram.

## Em aberto

- "Precisa limpar" (mesa paga e ainda não liberada) depende de um evento que o PDV hoje não registra.
- Os limiares devem ser configuráveis por casa; o protótipo usa os padrões acima.
