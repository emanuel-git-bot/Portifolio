---
name: Emanuel Roque — Portfólio
description: Portfólio de desenvolvedor fullstack no mundo visual de um painel de embarque
colors:
  panel-black: "#0f172a"
  panel-black-2: "#182338"
  panel-black-3: "#223047"
  hairline: "#2c3b52"
  accent: "#38bdf8"
  accent-dim: "#0ea5e9"
  paper: "#e2e8f0"
  paper-dim: "#a9b4c4"
  paper-faint: "#8a97ab"
  stamp-producao: "#4ade80"
  stamp-prototipo: "#fdba74"
  stamp-estudo: "#c4b5fd"
typography:
  display-exit:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(2rem, 6vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  display-hero:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  display-section:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3.4vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 2.6vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.005em"
  title-sm:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  lead:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 2vw, 1.4rem)"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 400
    lineHeight: 1.5
  link:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    letterSpacing: "0.01em"
  link-exit:
    fontFamily: "Overpass, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)"
    fontWeight: 800
  label:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "0.85rem"
    fontWeight: 600
    letterSpacing: "0.03em"
  label-sm:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  label-xs:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  micro:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "0.66rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  data-hero:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "clamp(3.25rem, 9vw, 6.5rem)"
    fontWeight: 700
    lineHeight: 0.85
  data:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "clamp(1.1rem, 2vw, 1.4rem)"
    fontWeight: 700
rounded:
  none: "0px"
  sm: "2px"
  md: "3px"
  scrollbar: "8px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  section: "clamp(3rem, 8vh, 5.5rem)"
  row: "clamp(1.75rem, 4vw, 3rem)"
components:
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.stamp-producao}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.65rem"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.paper-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.3rem 0.6rem"
  gate-link:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  panel-card:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.paper}"
    padding: "1.85rem"
---

# Design System: Emanuel Roque — Portfólio

## Overview

**Creative North Star: "A Torre de Controle"**

O portfólio é o painel visto do ponto de vista de quem opera a torre: cada projeto é uma linha registrada, com número de protocolo, categoria e status, e o visitante — recrutador, cliente, colaborador — lê o site como quem consulta um painel de embarque real, não como quem rola uma galeria genérica de cards de "ícone + título + texto". O sistema nasceu da fusão entre a sinalização de terminais/aeroportos (tipografia humanista, numerais tabulares, pictogramas) e o próprio ofício de Emanuel: servidor da Câmara Municipal de Terra Roxa/SP que lida com protocolo e prazo legislativo de perto, e desenvolvedor que construiu o sistema real de tramitação legislativa que aparece como carro-chefe do painel. **Correção (2026-08-18):** uma versão anterior descrevia Emanuel como vereador (cargo eletivo); ele é servidor/desenvolvedor da Câmara, não um vereador — corrigido em todo o conteúdo do site a pedido do usuário. **Revisão de paleta (pedido explícito do usuário):** a versão original usava amarelo-sinal sobre preto puro; o usuário pediu a troca para "Modern Dark" — um registro mais próximo de editor de código (VS Code) — preservando toda a estrutura de wayfinding. O azul-elétrico assumiu o papel estrutural que o amarelo tinha.

A base é quase inteiramente um slate bem escuro (`panel-black`, `#0f172a` — não preto puro, escolhido para casar com o accent azul), com o azul-elétrico reservado para chrome estrutural (borda do topo, números de protocolo, links de ação, borda do rodapé) — nunca como fundo de página inteira ou de barra inteira. Isso mantém o peso do accent como sinalização funcional ("preste atenção aqui"), não como decoração ambiente — e também é o motivo de o topo e o rodapé terem deixado de ser blocos sólidos de cor: um bloco azul-elétrico cheio pesaria como alerta, não como chrome de app. Não há sombras em lugar nenhum do sistema: profundidade vem de degraus de escuro (`panel-black` → `panel-black-2` → `panel-black-3`) e bordas finas de 1px (`hairline`), como divisórias reais de um painel físico, não como cartões flutuantes.

**Key Characteristics:**
- Fundo slate bem escuro (não preto puro); azul-elétrico como acento estrutural fino (bordas, números, links) — nunca como campo de página ou barra inteira.
- Zero sombras; profundidade por degraus de escuro e linhas finas de 1px.
- Numerais tabulares monumentais para o item em destaque; discretos para os secundários.
- Pictogramas desenhados (SVG próprio, uma cor, traço consistente) — nunca emoji ou glifo Unicode.
- Selos de status contornados (não preenchidos) para manter contraste alto sobre fundo escuro.

## Colors

Paleta "Modern Dark": um slate quase-preto domina a superfície, o azul-elétrico carrega a identidade como linha/texto/detalhe (nunca como preenchimento grande), e três cores de selo (verde, laranja, violeta) existem só para status — nunca como acento decorativo.

### Primary
- **Azul-Elétrico** (`#38bdf8`): borda do topo fixo, borda do rodapé/CTA, números de protocolo, links "→", ícones em hover. Vive em linhas, texto e detalhes finos — nunca preenche uma barra ou seção inteira.
- **Azul-Elétrico Escurecido** (`#0ea5e9`): variação de hover/estado, usada no polegar da scrollbar customizada.

### Neutral
- **Painel Slate** (`#0f172a`): fundo base de toda a página.
- **Painel Slate 2** (`#182338`): fundo de blocos elevados um degrau (painel de fatos do herói, rodapé/CTA, cards em hover, menu mobile).
- **Painel Slate 3** (`#223047`): terceiro degrau, reservado para estados hover mais profundos.
- **Linha Divisória** (`#2c3b52`): toda borda de 1px entre linhas do painel, grades e cartões.
- **Papel** (`#e2e8f0`): texto principal sobre fundo escuro.
- **Papel Esmaecido** (`#a9b4c4`): texto secundário (descrições).
- **Papel Apagado** (`#8a97ab`): texto terciário (rótulos mono, legendas) — calibrado a ≥4.5:1 sobre os dois tons de fundo mais usados.

### Named Rules
**The Accent-as-Line Rule.** O azul-elétrico vive em bordas finas, texto e detalhes (nunca em preenchimento de área grande). Substituiu a regra anterior ("Yellow-as-Chrome": amarelo em barras sólidas inteiras) porque um preenchimento sólido de accent brilhante em uma barra inteira lê como alerta num tema escuro de editor de código, não como identidade — a mudança de registro (sinalização física vs. IDE) mudou onde a cor pode viver, não só qual cor é.

**The No-Shadow Rule.** Nenhum `box-shadow` aparece no sistema. Profundidade é sempre um degrau de preto (`panel-black` → `panel-black-2`) ou uma borda de 1px (`hairline`), nunca uma sombra difusa.

## Typography

**Display/Body Font:** Overpass (com fallback `'Segoe UI', system-ui, sans-serif`)
**Label/Data Font:** Overpass Mono (com fallback `ui-monospace, monospace`)

**Character:** Overpass é uma humanista sans inspirada na Highway Gothic (a família usada em placas rodoviárias dos EUA) — a escolha carrega o mundo de sinalização até a letra, não só a paleta. Overpass Mono cobre exclusivamente dado tabular real (números de protocolo, tags de stack, rótulos de fato) — nunca é usado como "costume" de algo genérico parecer técnico.

### Hierarchy
Escala completa, do maior para o menor — cada degrau tem um papel fixo, nunca intercambiável:
- **Display Exit** (800, `clamp(2rem, 6vw, 3.75rem)`, -0.02em): headline final do rodapé/CTA ("Fim da linha...").
- **Display Hero** (800, `clamp(1.75rem, 4vw, 3.25rem)`): título do projeto em destaque no herói (item nº 001).
- **Display Section** (800, `clamp(1.6rem, 3.4vw, 2.5rem)`): títulos de seção (Painel Principal, Terminal Geral, Sala de Estudos, Torre de Controle).
- **Title** (800, `clamp(1.35rem, 2.6vw, 2rem)`): título de cada projeto em destaque no Painel Principal.
- **Title Small** (800, `1.05rem`): título de card no Terminal Geral; também a wordmark do topo.
- **Lead** (600, `clamp(1.15rem, 2vw, 1.4rem)`): parágrafo de abertura da Torre de Controle.
- **Body** (400, `1rem`, medida ~68ch): parágrafos de descrição padrão.
- **Body Small** (400, `0.92rem`): itens de lista da Torre de Controle, descrição de linha na Sala de Estudos.
- **Link** (700, `0.9rem`): links de navegação e `gate-link` padrão.
- **Link Exit** (800, `clamp(1.05rem, 1.6vw, 1.3rem)`): e-mail e GitHub no rodapé final.
- **Data Hero** (700, mono, `clamp(3.25rem, 9vw, 6.5rem)`, tabular): número de protocolo monumental — só o item nº 001.
- **Data** (700, mono, `clamp(1.1rem, 2vw, 1.4rem)`, tabular): número de protocolo nas demais linhas de painel.
- **Label** (600, mono, `0.85rem`, tracking 0.03em): rótulos médios (números de card, grid de fatos do herói).
- **Label Small** (600, mono, `0.78rem`, tracking 0.05em): rótulos de seção, contagem de itens, `gate-link` em contexto de card.
- **Label XS** (600, mono, `0.72rem`, tracking 0.05em): tags de stack, faixa de status, legendas de dado.
- **Micro** (600, mono, `0.66rem`): tags dentro dos cards compactos do Terminal Geral — o menor degrau da escala.

### Named Rules
**The Data-Only-Mono Rule.** Overpass Mono aparece apenas em números de protocolo, tags de tecnologia e rótulos de fato (mecanismo, escopo, infraestrutura) — nunca em títulos, corpo de texto ou navegação. Mono é reservado para o que é literalmente dado tabular.

## Layout

Container máximo de `88rem`, centralizado, com padding lateral fluido (`--gutter`: `clamp(1.25rem, 4vw, 3rem)`). Seções usam padding vertical fluido (`clamp(3rem, 8vh, 5.5rem)`).

O componente estrutural central é a **linha de painel** (`board-row`): grade de três colunas (`número | conteúdo | status/ação`) no desktop, colapsando para duas colunas no tablet (`≤900px`, o bloco de status desce para uma linha própria) e reempilhando totalmente no mobile (`≤640px`). Todo item de grid recebe `min-width: 0` explicitamente — texto deve quebrar linha dentro da coluna, nunca estourar a grade.

O grid secundário (`Terminal Geral`) usa 3 colunas no desktop, 2 no tablet, 1 no mobile, com gap de 1px preenchido pela cor `hairline` (as próprias bordas dos cards formam a grade, sem gutter extra).

**Named Rule — The Density Ladder Rule.** A densidade cai em degraus conforme a prioridade: herói (1 item, escala monumental) → Painel Principal (5 itens, linhas largas assimétricas) → Terminal Geral (9 itens, grid compacto uniforme) → Sala de Estudos (4 itens, lista densa de texto). Nunca pular um degrau — um destaque secundário não herda a escala do herói, e um item de estudo não herda o tratamento de card.

## Elevation & Depth

Em repouso, o sistema continua inteiramente plano — zero `box-shadow` em estado estático. Profundidade em repouso vem de dois mecanismos: degraus de cor de fundo (`panel-black` → `panel-black-2`) e bordas finas de 1px (`hairline`). **Revisão (passe de animação):** dois estados *interativos* (hover/scroll) ganharam um glow suave e delimitado — nunca um elemento em repouso. A regra evoluiu de "nenhuma sombra nunca" para "sombra só como resposta a um estado real", o que `animate.md` já previa ("Focus and depth: bounded blur, filter, backdrop, light, or shadow changes").

### Shadow Vocabulary
- **Card Hover Glow** (`box-shadow: 0 18px 40px -24px rgba(56, 189, 248, 0.35)`): sob `.panel:hover`/`:focus-within` — confirma "esta linha está sendo lida agora", nunca aparece em repouso.
- **Topbar Scrolled Glow** (`box-shadow: 0 10px 30px -18px rgba(56, 189, 248, 0.4)`): sob `.topbar.is-scrolled` — sinaliza que há conteúdo passando por baixo do topo fixo; ausente no topo da página.

### Named Rules
**The Flat-at-Rest Rule.** Nenhum elemento recebe sombra em seu estado de repouso — sombra existe apenas como confirmação de um estado real (hover, scroll), nunca como decoração ambiente ou elevação estática. Substitui a regra anterior ("Flat-by-Default": nenhuma sombra em nenhum estado), que se mostrou boa demais para durar — o passe de animação encontrou um uso genuíno para profundidade como feedback.

## Shapes

Cantos quase sempre retos. As únicas exceções são raios muito pequenos e funcionais: `2px` em selos de status (`stamp`) e `3px` em tags de tecnologia — o suficiente para suavizar a borda de um elemento pequeno de texto, nunca um raio decorativo grande. Círculos aparecem só em dois lugares com significado real: o indicador de status "ativo" (bolinha verde pulsante) e os pontos de roda dos pictogramas (ex.: ícone de carrinho). Nenhum componente de conteúdo usa `border-radius` acima de `4px` — a única exceção do sistema inteiro é o polegar da scrollbar customizada (`8px`), que é tema de chrome do navegador, não um componente de conteúdo, e por isso não segue a mesma regra.

## Components

### Buttons / Links de Ação
- **Estilo:** não há botão preenchido em lugar nenhum do sistema — toda ação é um `gate-link`: texto azul-elétrico em peso 700 com uma seta (`→`) que desliza 4px para a direita no hover/focus. A ausência de botão-caixa é proposital: reforça a leitura de "linha de painel", não "formulário".
- **Foco:** `outline: 3px solid var(--accent)` com offset de 3px em todo elemento focável — nunca o outline azul padrão do navegador (o accent do sistema substitui o default do browser, não coincide com ele por acaso).

### Selos de Status (`stamp`)
- **Estilo:** contornado (`border: 1.5px solid currentColor`), fundo transparente, texto na mesma cor da borda — nunca preenchido. Três cores fixas por significado: verde `#4ade80` (Em produção/Uso pessoal/Entregue), laranja `#fdba74` (Protótipo), violeta `#c4b5fd` (Estudo — deliberadamente não-azul, para não colidir com o accent de marca). A escolha contornada (em vez de preenchida) existe porque o preenchimento sólido original falhava contraste (~2.5:1) — o contorno resolve o problema de acessibilidade e também lê mais como carimbo/selo real do que como badge de UI genérico.

### Tags de Stack (`tag`)
- **Estilo:** borda de 1px `hairline`, texto `paper-dim` em mono, `3px` de raio, `0.3rem 0.6rem` de padding. Puramente informativo, nunca clicável.

### Cards (`panel`, Terminal Geral)
- **Canto:** reto (a própria grade de `hairline` faz a divisão, sem raio).
- **Fundo:** `panel-black` em repouso, `panel-black-2` no hover/focus — a única forma de elevação do sistema.
- **Borda:** nenhuma borda própria; a grade compartilhada (`1px` `hairline` como `gap` do CSS grid) faz o papel de divisor.
- **Padding interno:** `clamp(1.35rem, 2.5vw, 1.85rem)`.

### Linha de Painel (`board-row`) — Componente Assinatura
O componente central do sistema: número de protocolo tabular à esquerda, pictograma + título + descrição + tags no centro, selo de status + link de ação à direita. Usado em três escalas — monumental (herói, item único), padrão (Painel Principal, 5 itens) — nunca reduzido para o grid compacto, que usa o componente `panel` em vez disso. A quebra de linha (`min-width: 0` em todo filho direto de grid) é uma regra estrutural, não visual: sem ela, títulos longos estouram a grade em telas estreitas.

### Números de Protocolo (Split-Flap)
- **Comportamento:** ao entrar em viewport, cada dígito percorre valores aleatórios por ~270-540ms antes de assentar no valor final (efeito de painel de aeroporto mecânico), e um breve flash de brilho (`flap-settle`, 500ms) confirma o travamento — o dígito clareia para `paper` com `text-shadow` em accent e esmaece de volta. Implementado via `IntersectionObserver` + `setInterval` por dígito, respeitando `prefers-reduced-motion` (salta direto para o valor final, sem flash).
- **Escala:** `clamp(3.25rem, 9vw, 6.5rem)` no herói (item nº 001), `clamp(1.1rem, 2vw, 1.4rem)` nas demais linhas de painel.

### Scanfield (fundo — foco autoral do passe de animação)
- **Comportamento:** camada `fixed` atrás de todo o conteúdo, combinando uma grade técnica muito sutil (`rgba(148,163,184,0.055)`, células de 56px) com um glow radial de 560px que segue o cursor (`radial-gradient` centrado em `--mx`/`--my`, atualizado via `pointermove` com throttle por `requestAnimationFrame`). Lê como "operar o painel com uma lanterna" — reforço direto do North Star (Torre de Controle). Desativado (posição fixa no centro-topo, sem tracking) sob `prefers-reduced-motion` ou `(pointer: coarse)`.
- **Por que fixed, não scroll:** a grade e o glow pertencem à página inteira, não a uma seção — um elemento por seção quebraria a ilusão de um único painel físico sendo iluminado.

### Cartões (Terminal Geral) — Tilt + Glow Local
- **Comportamento:** ao passar o cursor, o cartão inclina levemente (`rotateX`/`rotateY`, máx. ±8°, `perspective(900px)`) seguindo a posição do ponteiro, mais um glow radial local de 220px (`--lx`/`--ly`) simulando a mesma lanterna do scanfield, agora em escala de cartão. Some com `pointerleave`. Restrito a `(pointer: fine)` e desativado sob `prefers-reduced-motion`.

### Revelação ao Rolar (Reveal-on-Scroll)
- **Comportamento:** uma linha de painel "imprime" deslizando 28px a partir do lado do número de protocolo (`.reveal--row`, translateX); cartões e linhas de lista deslizam verticalmente (`.reveal`, translateY 14px) com atraso escalonado por posição (`--reveal-delay`, até 140ms, agrupado em lotes de 3) para ler como "destinos populando o painel em sequência", não uma parede de conteúdo aparecendo de uma vez.

### Barra de Progresso + Topbar em Scroll
- **Comportamento:** linha de 2px em accent na borda inferior do topo, largura = progresso de rolagem da página. O topo ganha um glow suave (`box-shadow`, ver Shadow Vocabulary) após 40px de rolagem, confirmando que há conteúdo por baixo dele.

### Navegação
- **Estilo:** barra escura fixa (`sticky`) no topo, com a mesma cor de fundo do corpo da página e uma borda inferior de 1px em azul-elétrico separando-a do conteúdo — abaixo de uma faixa de status um degrau mais clara e não-fixa. Links em peso 700, cor `paper-dim` em repouso, `paper` + borda azul no hover/focus. Em mobile (`≤640px`), colapsa para um menu de três traços que revela um painel `panel-black-2` deslizante por cima do conteúdo, com borda azul-elétrico separando-o do topo.

## Do's and Don'ts

### Do:
- **Do** usar Overpass Mono exclusivamente para dado tabular real (protocolo, tags, rótulos de fato) — nunca para títulos ou corpo de texto.
- **Do** manter o azul-elétrico em linhas finas, texto e detalhes (bordas de 1px, números, links) — nunca como fundo de barra ou seção inteira.
- **Do** adicionar `min-width: 0` em todo item de CSS grid ou flex que possa receber texto longo — é a causa mais comum de estouro de layout neste sistema.
- **Do** desenhar novos pictogramas como SVG sólido de uma cor só, no mesmo peso visual dos existentes (estilo AIGA) — nunca emoji ou ícone de biblioteca com múltiplas cores.
- **Do** contornar (nunca preencher) selos de status, para manter contraste ≥4.5:1 sobre o fundo escuro.
- **Do** usar `box-shadow` como glow suave e delimitado exclusivamente em resposta a um estado real (hover, scroll) — nunca em repouso; ver Shadow Vocabulary.
- **Do** manter todo efeito de mouse (spotlight, tilt) atrás de `prefers-reduced-motion` e `(pointer: fine)` — nenhum efeito de cursor deve rodar em touch ou com movimento reduzido.

### Don't:
- **Don't** usar `box-shadow` em qualquer elemento no seu estado de repouso — só em resposta a hover/scroll reais, nunca como decoração ambiente.
- **Don't** colocar um rótulo pequeno (kicker/eyebrow) imediatamente acima de um heading — é um padrão banido no sistema; informação de status vive na faixa de chrome de página, separada da leitura do heading.
- **Don't** usar `border-radius` acima de `4px` em qualquer componente de conteúdo — o mundo do painel de embarque é feito de cantos retos.
- **Don't** preencher um selo de status com cor sólida — já causou falha de contraste real (~2.5:1) neste projeto; o contorno é a correção permanente, não uma preferência estética.
- **Don't** preencher uma barra ou seção inteira com o azul-elétrico — já foi tentado no topo e no rodapé desta revisão e lia como alerta, não como chrome; o accent vive em linha, nunca em área grande.
- **Don't** empilhar mais de um efeito de mouse por elemento — o cartão do Terminal Geral já soma tilt + glow local; um terceiro efeito no mesmo hover viraria espetáculo, não sinal.
