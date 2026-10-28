# Escopo e dependências do protótipo

Base: US 24358 — *Visualização de ocupação do salão* (maître: ver de imediato quantas e quais mesas estão
livres, sem operações de lançamento e fechamento; PDV Desktop e Android; apoiada nos salões e mesas
cadastrados) e a reunião de alinhamento do protótipo.

## Perfis de visão

| Perfil | Para quem | Mostra |
|---|---|---|
| **Maître** (padrão) | quem precisa saber o que está livre | estados (livre, reservada, ocupada, conta), alertas visuais, lugares, pessoas, tempo de abertura; **sem** consumo, comandas, posições nem cobrança |
| **Completo** | gerente / demonstração do que vem depois | acrescenta Comandas e Posições (US 24360) com divisão e cobrança **simuladas** |

## O que depende só do protótipo (fazer agora)

- Mapa 2D e 3D com mesas, bar, palco, banheiros, cozinha e entradas, com dados fictícios.
- Cenário dos cinco salões de cliente (Terraço, Celebration, Suites, Resort, Raízes) é ilustrativo até recebermos as plantas reais: só as mesas seguem o cliente. Fontes públicas consultadas (turismo): o Resort tem os restaurantes Maresias e Canoa Quebrada e bares junto à piscina; o Celebration tem o restaurante Prata da Casa (buffet) e o Bar da Piscina. Não há fonte pública para Suites, Raízes nem Terraço, nem para pista, DJ, lounge, churrasqueira, cozinha ao vivo, pérgola ou elevador, por isso ficaram só buffet, bar, piscina, deck e entrada. As telas mostram o aviso "Layout ilustrativo".
- Estados e alertas apenas como **representação visual** (cores, legenda).
- Detalhes da mesa no painel lateral **ao passar o mouse**, sem zoom; clique fixa a mesa.
- Arrastar mesas para ajustar o layout (editor local, salvo no navegador).
- Desempenho com vários salões e 120+ mesas.

## O que depende de terceiros

| Item | Depende de |
|---|---|
| Salvar coordenadas e atributos da mesa (forma, dimensões) | contrato de dados do Retaguarda |
| Cadastro de mesas e posições | Retaguarda (decidido que não fica no PDV) |
| Regras de estado e de "alerta" (limiares, prioridade) | definição de negócio — "esse conceito não existe hoje" |
| Dados reais de ocupação | o que o sistema já expõe hoje |
| Lista real de salões e mesas dos clientes | Fábio e o cliente. Já recebidas: Restaurante do Terraço (49), Hot Beach Celebration (65), Hot Beach Suites (124) e Hot Beach Resort (105) e Hot Beach Raízes (52); Celebration ainda pode ser 69 |
| Visualização dentro do PDV Desktop (Electron/Nextron ou webview) | spike, API do servidor, limites do DevExpress |
| Reserva com preferência de posição | recurso novo, sem definição |
| Montagem de salão por IA ou foto | versão 2 |

## Em aberto

- O que é "alerta" e qual regra o dispara.
- Viabilidade do 3D em interface e implementação.
- Usuário principal: maître, gerente, garçom?
- Onde a reserva fica no modelo.
- Hot Beach: 65 ou 69 mesas.
