---
name: Emanuel Roque — Portfólio (DESING_02)
description: Portfólio de desenvolvedor fullstack no mundo visual de um site AI/dev internacional — preto absoluto, glassmorphism, acento lilás
colors:
  bg: "#000000"
  bg-elevated: "#0a0a0d"
  text: "#eae5ec"
  text-muted: "#9ca3af"
  accent: "#c2a4ff"
  accent-dim: "#8b6fd6"
  glass-fill: "rgba(255, 255, 255, 0.03)"
  glass-fill-strong: "rgba(255, 255, 255, 0.15)"
  glass-border: "rgba(255, 255, 255, 0.1)"
  glass-border-strong: "rgba(255, 255, 255, 0.31)"
  snowman-snow-light: "#ffffff"
  snowman-snow-mid: "#e6ebf1"
  snowman-snow-shade: "#c3ccd6"
  snowman-snow-shadow: "rgba(30, 32, 40, 0.22)"
  snowman-coal: "#1a1a1a"
  snowman-button: "#232323"
  snowman-twig-light: "#8a6238"
  snowman-twig-dark: "#6b4a29"
  snowman-carrot: "#e8792e"
  snowman-hat-light: "#33363d"
  snowman-hat-dark: "#17191c"
  snowman-hat-brim: "#2a2d33"
  accent-deep: "#7f40ff"
  accent-glow: "#aa42ff"
  line-color: "#363636"
  bg-orb: "#fb8dff"
  bg-orb-shadow: "rgba(84, 0, 255, 0.6)"
  career-dot-glow-1: "#d29bff"
  career-dot-glow-2: "#d097ff"
  career-dot-glow-3: "#f2c0ff"
typography:
  # `scale` covers the header/whatIDO/work-section/career-section port from
  # DESING_04 (see "DESING_04 Port" below): those components carry DESING_04's
  # own literal px scale verbatim rather than being re-expressed in this
  # file's clamp() roles, since exact visual fidelity to that port was the
  # explicit goal, not a token-system unification.
  scale:
    ported-10: "10px"
    ported-11: "11px"
    ported-12: "12px"
    ported-12-5: "12.5px"
    ported-13: "13px"
    ported-14: "14px"
    ported-15: "15px"
    ported-16: "16px"
    ported-17: "17px"
    ported-18: "18px"
    ported-20: "20px"
    ported-22: "22px"
    ported-24: "24px"
    ported-25: "25px"
    ported-26: "26px"
    ported-28: "28px"
    ported-32: "32px"
    ported-35: "35px"
    ported-36: "36px"
    ported-38: "38px"
    ported-40: "40px"
    ported-45: "45px"
    ported-48: "48px"
    ported-50: "50px"
    ported-55: "55px"
    ported-56: "56px"
    ported-70: "70px"
  display:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(3rem, 9vw, 7rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  display-compact:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 7vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2vw, 1.6rem)"
    fontWeight: 500
  title-large:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2.4vw, 1.85rem)"
    fontWeight: 500
  lead:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)"
    fontWeight: 400
  body:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    letterSpacing: "4px"
  micro-2xs:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
  micro-xs:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
  micro-sm:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
  timeline-year:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 500
    lineHeight: 1
  tile-label:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.56rem"
    fontWeight: 400
  nav-label:
    fontFamily: "Geist, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    letterSpacing: "1.5px"
rounded:
  pill: "30px"
  tile: "8px"
  tile-icon: "10px"
  button: "8px"
  photo-frame: "28px"
  snowman-trim: "3px"
  snowman-hat: "4px"
  tooltip: "6px"
  ported-card: "14px"
  ported-dot: "50px"
spacing:
  gutter: "clamp(1.25rem, 6vw, 6rem)"
  section: "clamp(4rem, 12vh, 9rem)"
components:
  cta-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 28px"
  skill-pill:
    backgroundColor: "{colors.glass-fill-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "2px 12px"
  tech-tile:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.tile}"
    padding: "8px 14px"
---

# Design System: Emanuel Roque — Portfólio (DESING_02)

## Overview

**Creative North Star: "O Dev Internacional"**

Este é o segundo sistema visual completo do portfólio (o primeiro, "A Torre de Controle" em `DESING_01`, continua existindo à parte). Onde o primeiro traduzia o ofício de Emanuel (servidor da Câmara Municipal de Terra Roxa/SP + desenvolvedor) para uma metáfora de sinalização de terminal, este segundo mundo é uma tradução direta e pinada pelo usuário: replicar a linguagem visual de um portfólio de referência real (redoyanulhaque.me) — preto absoluto, tipografia gigante em Geist, pills e tiles de vidro (glassmorphism), acento lilás único, cursor customizado, links com texto duplicado que desliza no hover — preenchida com o conteúdo real de Emanuel.

Não é uma homenagem livre: cada decisão de token abaixo tem origem em uma leitura direta do CSS computado e do DOM real do site de referência (cor, peso de fonte, raio, padding, e — numa segunda passagem, depois que o usuário apontou que a primeira versão tinha perdido fidelidade — a inspeção visual real do herói via screenshot, que a primeira pesquisa só baseada em texto/CSS computado não capturou). O herói de referência renderiza um personagem 3D animado (Three.js) enorme, com um orbezinho de luz brilhante perto da têmpora, halo lilás/magenta, uma barra lateral fixa de ícones sociais à esquerda, e um efeito de encolher/fixar a cena ao rolar a página. Duas peças do original ficam de fora por decisão do próprio usuário: a foto/personagem 3D (Emanuel não tem esse asset ainda — a marca gráfica circular ocupa o mesmo papel compositivo, na mesma escala dominante, com o mesmo orbe de luz e anel, mas sem fingir ser um retrato) e a tela de carregamento animada (pulada — vai direto ao conteúdo). Uma peça foi corrigida deliberadamente: o cinza fantasma do link "RESUME" do original (`#5e5e5e` sobre preto, ~3.2:1) reprova contraste; aqui o equivalente usa `text-muted` (`#9ca3af`, ~8.3:1).

**Key Characteristics:**
- Preto absoluto como fundo único da página inteira — não existe um segundo tom de fundo "elevado" em uso amplo, só glass sutil por cima do preto.
- Um único acento (`#c2a4ff`, lilás) usado com extrema disciplina: botão primário, orbe de luz do herói e pouco mais.
- A marca gráfica do herói é dominante e sobreposta ao texto (não uma ilustração educada ao lado) — ecoa a escala do personagem 3D da referência sem fingir ser uma foto.
- Barra vertical fixa de redes sociais na borda esquerda (só GitHub, único link social confirmado — nunca inventar LinkedIn/Twitter/Instagram que não existem).
- Efeito de rolagem no herói: a marca gráfica e o texto encolhem/deslocam suavemente enquanto a página rola, ecoando o efeito de "encolher e fixar" do personagem 3D da referência.
- Componentes de vidro (glass): pills arredondadas para skills, tiles quase-quadrados para stack tecnológico — nunca card com fundo sólido opaco.
- Tipografia Geist gigante e de peso médio (500) para nomes/headlines — nunca peso 800/900 "grosso"; a escala grita pelo tamanho, não pelo peso.
- Cursor customizado substituindo o cursor do sistema; links de navegação com efeito de texto duplicado deslizando no hover.

## Colors

Paleta "Committed" mínima: um único acento sobre um fundo que é, na prática, uma única cor (preto) — a variação vem de opacidade (glass), não de uma escala de neutros como no `DESING_01`.

### Primary
- **Lilás-Acento** (`#c2a4ff`): botão "Fale comigo" preenchido (texto preto sobre o lilás), links de destaque, pequenos detalhes de estado ativo. Não vive em bordas finas como no `DESING_01` — aqui ele pode preencher uma área pequena e deliberada (o botão), porque o mundo de referência já usa esse dispositivo assim.
- **Lilás-Acento Escurecido** (`#8b6fd6`): hover/estado do botão primário.

### Neutral
- **Preto** (`#000000`): fundo único de toda a página, sem exceção.
- **Preto Elevado** (`#0a0a0d`): reservado para o único caso em que uma superfície precisa se destacar levemente do fundo puro (ex.: dentro do cursor customizado); não é um "segundo fundo de seção" como no `DESING_01`.
- **Texto** (`#eae5ec`): cor de texto principal — um branco levemente lavanda, nunca branco puro (`#fff`), característica direta do site de referência.
- **Texto Esmaecido** (`#9ca3af`): rótulos secundários, texto de apoio — **revisado do original** (`#5e5e5e`, ~3.2:1) para manter ≥4.5:1 sobre preto puro.

### Glass (não é bem "neutro", é a própria linguagem de superfície do sistema)
- **Glass Sutil** (`rgba(255,255,255,0.03)` de fundo, borda `rgba(255,255,255,0.1)`): tiles de stack tecnológico.
- **Glass Forte** (`rgba(255,255,255,0.15)` de fundo, borda `rgba(255,255,255,0.31)`): pills de skill dentro dos cards "O que eu faço".

### Named Rules
**The One Accent Rule.** O lilás aparece em no máximo dois lugares por viewport — nunca vira paleta. Se a tentação é usar o acento numa terceira coisa na mesma tela, a resposta certa é `text-muted` ou glass, não mais lilás.

**The No-Fake-Photo Rule.** O espaço reservado para a foto de perfil nunca recebe uma foto de banco de imagens, ilustração genérica ou avatar gerado como substituto. **Cumprida em 2026-08-18:** o usuário enviou uma foto real (selfie ao ar livre); a marca gráfica abstrata "ER" foi substituída pela foto de verdade em `assets/images/emanuel-foto.jpg` (ver Components → Foto do Herói). A regra continua valendo daqui pra frente — qualquer imagem futura no lugar de uma pessoa real precisa ser a pessoa real, nunca um placeholder genérico.

## Typography

**Fonte única:** Geist (com fallback `'Segoe UI', system-ui, sans-serif`) — usada para tudo, display e corpo, exatamente como no site de referência (que não faz par com uma serifada ou mono para contraste; a variação vem só de peso e tamanho).

**Character:** Geist é uma grotesca geométrica moderna (a fonte de sistema da Vercel) — reta, neutra, técnica sem ser fria. Pesos ficam entre 400 (corpo) e 600 (rótulos com tracking largo); nunca 800+, mesmo no display gigante — é a escala que carrega a presença, não o peso do traço.

### Hierarchy
- **Display** (500, `clamp(3rem, 9vw, 7rem)`, -0.02em): nome no herói ("EMANUEL ROQUE").
- **Display Compact** (500, `clamp(2.25rem, 7vw, 4.5rem)`, -0.02em): headline de fechamento no rodapé — mesma família do Display, deliberadamente menor porque fecha a página, não abre.
- **Headline** (500, `clamp(1.75rem, 4vw, 3rem)`): títulos de seção ("O que eu faço", "Minha carreira", "Meu trabalho").
- **Title** (500, `clamp(1.3rem, 2vw, 1.6rem)`): título de card (do-card, item de timeline).
- **Title Large** (500, `clamp(1.3rem, 2.4vw, 1.85rem)`): título de item na lista "Meu Trabalho" — mesma família do Title, maior porque projetos são o conteúdo principal da página.
- **Lead** (400, `1.1rem`; até `clamp(1.1rem, 2.2vw, 1.6rem)` nos papéis do herói): texto secundário logo abaixo do nome no herói ("Olá, eu sou" / papéis) — entre Body e Title.
- **Body** (400, `1rem`, 1.65): parágrafos.
- **Label** (600, `0.9rem`, tracking `4px`, caixa alta): rótulos de navegação e ghost-links — o tracking largo é a assinatura tipográfica mais reconhecível do mundo de referência.
- **Micro-escala** (`--fs-2xs: 0.75rem`, `--fs-xs: 0.85rem`, `--fs-sm: 0.95rem`): todo texto secundário pequeno (categorias, rótulos de rodapé, stack de projeto, contagens) resolve para um destes três tokens — nunca um valor solto novo.
- **Aposentado (2026-08-18):** o monograma "ER" que ocupava o lugar da foto (`hero__mark-glyph`) foi removido — a foto real de Emanuel entrou no lugar. A exceção de escala que ele carregava não existe mais; não reintroduzir um glifo decorativo aqui.

### Named Rules
**The Weight-Never-Size Rule.** Hierarquia vem de tamanho (a escala display é enorme), nunca de engordar o peso da fonte além de 600 — um H1 em 800/900 quebraria a leitura "internacional/editorial" que a Geist em peso médio carrega.

## Layout

Sem grid de linhas de painel como no `DESING_01` — este mundo é editorial/cinematográfico: uma coluna central de leitura por seção, com respiro vertical generoso (`--section`: `clamp(4rem, 12vh, 9rem)` de padding entre seções) e gutter lateral fluido (`--gutter`: `clamp(1.25rem, 6vw, 6rem)`, propositalmente mais largo que o do `DESING_01` — o mundo de referência usa margens laterais grandes para deixar o texto gigante "respirar").

O herói é o único momento assimétrico de duas colunas (texto à esquerda, marca gráfica no lugar da foto à direita) — todo o resto da página é de coluna única centralizada, com os cards de projeto e os tiles de stack organizados em grid dentro dessa coluna.

**Named Rule — The Single Column Rule.** Fora do herói, nenhuma seção usa duas colunas de conteúdo lado a lado — a leitura é sempre vertical, uma coisa de cada vez, reforçando o tom editorial/cinematográfico em vez do tom "painel de dados" do `DESING_01`.

## Elevation & Depth

Sem sombra de caixa (`box-shadow`) como recurso principal de profundidade — o sistema usa **glass** (opacidade + blur leve + borda de 1px translúcida) para destacar um elemento do fundo preto, não sombra projetada. Um glow suave (blur grande, baixa opacidade, cor do acento) é permitido em pontos de foco reais (botão primário no hover, cursor customizado) — nunca como decoração ambiente.

### Named Rules
**The Glass-Not-Shadow Rule.** Elevação vem de transparência e blur (`backdrop-filter: blur(...)` + fundo semi-transparente + borda translúcida), não de `box-shadow` escuro. Onde o `DESING_01` usa graus de preto para separar camadas, este mundo usa graus de transparência sobre o mesmo preto.

## Shapes

Cantos generosamente arredondados — o oposto do `DESING_01`: pills de skill em `30px` (`--radius-pill`, efetivamente cápsula), tiles de stack e botões em `8px` (`--radius-tile`), cards maiores (do-card, grid de trabalho secundário, menu mobile) em `16px` (`--radius-card`). Nenhuma forma reta/cortada; o mundo de referência não usa esquadro em nenhum componente de UI. Exceção: o anel de foco do teclado (`:focus-visible`) usa `2px` — é um detalhe de acessibilidade do navegador, não uma forma de componente, e por isso não segue a escala de raio de conteúdo.

## Components

### Botão Primário (CTA)
- **Estilo:** preenchido em `accent`, texto preto, `8px` de raio, padding `12px 28px`, rótulo em caixa alta com tracking largo.
- **Hover:** escurece para `accent-dim`; nunca perde o preenchimento (não vira ghost no hover).

### Links Fantasma (Ghost Links / Navegação)
- **Revisão (2026-08-18):** a primeira versão do menu (topo horizontal, depois sidebar vertical) mostrava texto com um efeito de troca vertical no hover (duas cópias do texto empilhadas, `translateY` revelando a segunda ao passar o mouse). O usuário pediu explicitamente ícone-only na sidebar vertical, com o nome aparecendo só ao passar o mouse — o texto-com-troca foi substituído por ícone + tooltip.
- **Estilo (desktop):** cada link é um círculo (`2.75rem`, `border-radius: 50%`) contendo só um ícone SVG desenhado à mão (`1.15rem`, `stroke-width: 1.6`, sem preenchimento de emoji/pictograma pronto) — Sobre (pessoa), Projetos (grade 2×2), Formação (capelo), Contato (envelope), GitHub (o octocat real, reaproveitado da antiga Social Rail). Cor `text-muted` em repouso, fundo `glass-fill` sutil e ícone em `text` no hover/focus.
- **Tooltip:** um rótulo (`ghost-link__label`, mesmo texto que era o link antes) fica posicionado absoluto ao lado do ícone, oculto (`opacity: 0`) até `:hover`/`:focus-visible` — nesse momento desliza 4px e aparece como uma pill com fundo `bg-elevated` e borda `glass-border-strong`, tipografia `nav-label` (`0.68rem`, tracking `1.5px`). Como o rótulo é texto real dentro do link (só deslocado visualmente), continua sendo o nome acessível do link para leitor de tela — não precisa de `aria-label` extra.
- **Mobile:** hover não existe em touch, então o rótulo vira permanente — sai da posição absoluta, encolhe (`0.52rem`) e senta embaixo do ícone dentro do próprio link, virando o padrão comum de barra de abas mobile (ícone + legenda pequena, sempre visível).

### Navegação Principal — Sidebar Vertical / Barra Inferior (2026-08-18)
- **O que é:** a navegação deixou de ser um header horizontal no topo e virou `.sidebar`, uma coluna fixa (`position: fixed`, `--sidebar-w: 6.5rem`) grudada na borda esquerda da viewport em telas ≥900px — marca ("ER") no topo, os cinco links (Sobre/Projetos/Formação/Contato/GitHub) centralizados verticalmente no meio, fundo com glass + blur e borda direita de 1px. `body` ganha `padding-left: var(--sidebar-w)` para o conteúdo nunca ficar por baixo dela. Substitui tanto o antigo header horizontal quanto a antiga Social Rail separada (GitHub já mora dentro da própria lista de navegação agora — nunca duplicar o link em dois lugares).
- **Mobile (<900px):** a mesma `.sidebar` vira uma barra inferior fixa (`--bottom-nav-h: 3.75rem`, `flex-direction: row`), com os cinco links espalhados (`justify-content: space-around`) e a marca escondida (redundante — o nome já aparece gigante no herói). `body` troca `padding-left` por `padding-bottom: var(--bottom-nav-h)` nesse breakpoint, e o boneco de neve flutuante é ancorado acima da barra (`bottom: calc(var(--bottom-nav-h) + 0.5rem)`) para nunca cobrir o link de GitHub — **armadilha real encontrada:** a posição original do boneco (`bottom: 0.65rem`) ficava exatamente em cima do link GitHub da nova barra; corrigido somando a altura da barra ao deslocamento.
- **O que foi removido:** o botão hamburguer (`.nav-toggle`) e o painel dropdown do menu mobile (`.nav-list.is-open`) não existem mais — como a barra inferior já mostra todos os links o tempo todo, não há mais um estado "menu fechado" para abrir.

### Pills de Skill
- **Estilo:** `glass-fill-strong` de fundo, borda `glass-border-strong`, raio `30px` (cápsula), texto pequeno (`~0.75rem`), padding `2px 12px`. Usadas dentro dos cards "O que eu faço", nunca soltas na página.

### Cards "O que eu faço" — Moldura de Canto + Expandir
- **Moldura:** quatro marcas em "L" nos cantos (`.do-card__corner`, `14×14px`, borda de 1px em `text` a 50% de opacidade) — aproximação em CSS puro do frame decorativo em SVG (`.what-border1`/`.what-border2`) que a referência desenha ao redor de cada card "What I Do". Não é uma cópia pixel-a-pixel (a referência anima o traço da borda via SVG); é a mesma leitura — "isto é uma moldura técnica/blueprint", não um card genérico.
- **Expandir:** botão circular `25×25px` no canto inferior direito (mesma posição e tamanho do `.what-arrow` real da referência), seta que gira 180° ao abrir. Revela um parágrafo extra com um exemplo concreto e nomeado (projeto real, não uma frase genérica) — nunca conteúdo inventado só para preencher o espaço expandido. Animado via `grid-template-rows: 0fr → 1fr` no wrapper, não `max-height`/`margin` (evita o antipadrão de animar propriedade de layout).

### Tiles de Stack Tecnológico
- **Estilo:** `glass-fill` de fundo, borda `glass-border`. Dois formatos no mesmo grid: **tile com ícone** (`.tile--icon`, `3.5rem × 4.3rem`, raio `10px` — `rounded.tile-icon` —, link real para o site oficial, ícone `1.9rem` fornecido pelo usuário em `assets/images/`, `filter: grayscale(1) contrast(1.2) brightness(1.5)` + `opacity: 0.85` em repouso, cor plena no hover/focus, rótulo de texto visível abaixo do ícone em `tile-label` — `0.56rem`, `rgba(255,255,255,0.7)`, sempre visível, nunca só tooltip) e **tile só-texto** (`.tile`, mesmo material, raio `8px` — `rounded.tile` —, para tecnologias sem ícone disponível ou sem link oficial óbvio).
- **Revisão (2026-08-18, primeira leitura):** a primeira versão evitava ícones de marca por não ter os arquivos; o usuário forneceu os SVGs reais depois de comparar com o site de referência, e o grid passou a usá-los onde a tecnologia é confirmada no repertório de Emanuel — nunca para uma tecnologia não confirmada, mesmo que o ícone estivesse disponível no pacote que o usuário mandou (o pacote incluía ícones de ferramentas de ML/dados — PyTorch, OpenCV, NumPy, Pandas, MongoDB — que pertencem ao stack do dev do site de referência, não ao de Emanuel; ficaram de fora por não serem verdade sobre ele).
- **Revisão (2026-08-18, segunda leitura):** essa primeira correção usava `opacity` sem `filter`, uma aproximação de memória. Uma segunda passagem leu o CSS computado real do `.techstack-item` da referência (`grayscale(1) contrast(1.2) brightness(1.5)`, tile `55×68px`, rótulo `9px` sempre visível) e o sistema foi ajustado para bater com o valor real, não com uma aproximação segura. **Armadilha evitada:** a primeira tentativa de replicar o filtro grayscale (sem o `contrast(1.2)` da referência) lavava ícones com contraste interno baixo (JS, HTML5, CSS3, Firebase viravam blocos quase invisíveis) — o `contrast(1.2)` da receita real é o que evita esse problema.
- **Revisão (2026-08-18, terceira leitura):** o grid virou uma grade centralizada (`justify-content: center`, largura máxima `46rem`) igual à organização compacta em várias colunas de referência, e os 15 itens que só existiam como `.tile` de texto (C#, React Native, Expo, tRPC, Django REST Framework, Fastify, SQLite, Drizzle, Prisma, GitHub Actions, Selenium, FFmpeg, Mercado Pago, PagBank, Gemini API) ganharam ícone real — buscados do devicon/simple-icons (CDNs públicos), nunca inventados. React Native reaproveita o átomo do React (mesma marca oficial); Django REST Framework reaproveita o logo do Django (não existe ícone oficial dedicado ao DRF em nenhum dos dois catálogos). **Armadilha real encontrada:** vários SVGs baixados (Expo, SQLite, Fastify, e os de simple-icons — tRPC, Drizzle, Mercado Pago, PagBank, Gemini, FFmpeg) não têm `fill` próprio, herdando preto puro por padrão do SVG — invisíveis num tile quase preto mesmo depois do filtro (`brightness` não clareia preto puro, `0 × 1.5 = 0`). Corrigido injetando um `fill="#e8e8e8"` no `<svg>` raiz de cada um. A mesma varredura encontrou 3 ícones **antigos** (não desta sessão) com o mesmo problema — Flask (`#010101`), Django (`#092e20`), GitHub (`#181616`) — todos corrigidos para `#e8e8e8` também.
- **Fundo — Portal Roxo (2026-08-18):** atrás do grid, centrado no topo da seção, um "buraco de minhoca" em CSS puro (`.stack-portal`): um núcleo radial pulsante (`portal-pulse`), três anéis concêntricos girando em velocidades e sentidos diferentes (`conic-gradient` mascarado num anel via `mask-image` radial, `portal-spin`), e raios finos por trás girando mais devagar no sentido oposto. Tudo em `accent` com opacidade baixa, desfocado (`blur`), `pointer-events: none`, `z-index` atrás do grid. Congela sob `prefers-reduced-motion`.

### Cards de Projeto (Meu Trabalho)
- **Estilo:** numerados (`01`, `02`...) em `text-muted`, título em `title`, categoria como pill pequena, lista de stack como texto simples (não pills, para diferenciar do "O que eu faço"), miniatura/print quando existe um asset real — nunca uma imagem genérica quando não existe.

### Timeline (Minha Carreira)
- **Estilo:** cada item é uma grade de duas colunas (`1fr auto`) — conteúdo (título em `title`, organização e descrição em `body`/`text-muted`) à **esquerda**, período/ano em **destaque monumental** à **direita** (`timeline-year`, `clamp(2rem, 4vw, 3rem)`, peso 500, cor `text` — item "AGORA" em `accent`). **Revisão (2026-08-18):** a primeira versão tratava o período como rótulo pequeno e esmaecido à esquerda do conteúdo — o oposto do real, que lê o ano quase como um segundo título, deliberadamente grande, à direita. O ano NÃO é hierarquia decorativa: é conteúdo de leitura primária, do mesmo jeito que o nome do cargo. O primeiro item é sempre "AGORA" (sem data fixa) — convenção herdada direto do site de referência.

### Cursor Customizado
- **Comportamento:** um pequeno círculo (`~18px`) substitui o cursor do sistema (`cursor: none` no `body`, só em dispositivos com `pointer: fine`), seguindo o ponteiro com um leve atraso (lerp), crescendo (~2.2×) e invertendo para `accent` sobre qualquer alvo clicável. Desligado completamente em touch e sob `prefers-reduced-motion`.

### Foto do Herói (Hero Mark) — Componente Assinatura
- **Revisão (2026-08-18):** este componente era uma marca gráfica abstrata ("ER" monumental num círculo) porque Emanuel ainda não tinha enviado uma foto. Ele mandou uma foto real (selfie ao ar livre, fundo de céu e árvore) e o componente virou o que sempre devia ser: a foto de verdade, tratada para caber no mundo visual do site. A moldura circular abstrata foi trocada por retângulo arredondado (`28px` — `rounded.photo-frame`), mais fiel ao formato retangular real da foto de perfil da referência.
- **Estilo:** retângulo `min(46vw, 30rem)` (proporção ~0.86, desktop) / `min(70vw, 16rem)` (mobile), `object-fit: cover`, borda de 1px em `glass-border-strong`, glow radial lilás atrás (`::before`, blur), sombra ambiente extra (`::after`). **Vinheta:** a foto tem `mask-image: radial-gradient(...)` esmaecendo as bordas para transparente — sem isso, o céu claro da foto brigaria com o fundo preto puro da página como um retângulo duro; com a máscara, a foto se funde na página como se estivesse iluminada por dentro, sem precisar remover o fundo de verdade (a referência usa uma foto com fundo já removido; aqui, a vinheta em CSS resolve o mesmo problema sem depender de recorte manual). Orbe pulsante de luz (`hero__mark-orb`) perto do canto superior esquerdo, legenda "TERRA ROXA, SP — BRASIL" na base. No desktop, posiciona-se absoluto à direita, sobrepondo o texto do herói; no mobile, volta ao fluxo normal, empilhado acima do texto.
- **Interação — Tilt 3D:** a foto inclina seguindo o cursor (`rotateX`/`rotateY`, até ±10°, `perspective(1000px)`, com um lerp suave de 0.12/frame para não parecer nervosa), só em `pointer: fine` e fora de `prefers-reduced-motion`. Substitui o modelo 3D animado (Three.js) real da referência — que exigiria modelagem/rigging 3D de verdade, fora do escopo de um site estático — por uma aproximação honesta: profundidade real de interação, sem fingir ser um personagem 3D.
- **Scroll:** o contêiner externo (`.hero__mark`) encolhe levemente (até ~18%) e desliza ao rolar a página, enquanto o texto do herói esmaece e sobe — efeito JS (`translateY`/`scale` via `requestAnimationFrame`). O tilt do mouse fica num elemento filho separado (`.hero__mark-photo`), então os dois efeitos nunca competem pelo mesmo `transform`. **Armadilha real encontrada:** a fórmula de scroll do desktop inclui um `translateY(-50%)` base (necessário porque a marca é `position: absolute; top: 50%` só no desktop); aplicar essa mesma fórmula no mobile — onde a marca volta a ser `position: relative`, sem `top: 50%` — abre um vão de ~128px entre a marca e o texto abaixo. A correção verifica `matchMedia('(max-width: 900px)')` antes de decidir se o `-50%` base entra na transformação.

### Redes Sociais
- **Conteúdo:** só GitHub — o único link social confirmado de Emanuel. Nunca adicionar LinkedIn/Twitter/Instagram só para ecoar a referência (que tem os quatro); ícone sem link real por trás é o tipo de mentira visual que este sistema existe para evitar.
- **Aposentado (2026-08-18):** existia uma "Social Rail" separada (coluna fixa própria, só com o ícone de GitHub) além do link GitHub já presente na navegação principal. Removida ao mesmo tempo em que a navegação virou sidebar — o GitHub da lista de navegação já cobre o mesmo propósito, e duas colunas fixas concorrendo pela borda esquerda seria redundante.

### Boneco de Neve (Mascote) — Componente Assinatura (2026-08-18)
- **O que é e o que não é:** um personagem inteiramente em CSS/JS (três esferas com sombreamento radial-gradient simulando volume, sem modelagem 3D real) — pedido explícito do usuário como resposta honesta a não termos um modelo `.glb` real. Nunca chamar isso de "3D" na cópia do site; é uma aparência de profundidade, não geometria 3D.
- **Anatomia:** três esferas empilhadas (base `6.4rem`, meio `4.6rem`, cabeça `3.3rem`) com `radial-gradient` + sombra interna para volume; dois braços-graveto rotacionados; três botões de carvão; cachecol na cor `accent` (único ponto onde o mascote toca a paleta do site — em todo o resto ele usa a paleta própria, ver Colors); cartola; nariz de cenoura (triângulo CSS); dois olhos de carvão com um brilho pequeno (`snowman__pupil`) que se desloca dentro do olho para simular "olhar".
- **Comportamento:** balanço de repouso contínuo (`snowman-bounce`, ~3.4s); olhos seguem o cursor em tempo real (só `pointer: fine`); pulo ao clicar/Enter/Espaço; a cada terceiro clique, as partes se desmontam e remontam sozinhas (`is-breaking`, ~1.6s) em vez de pular — uma recompensa rara, não o comportamento padrão. Acessível via teclado (`role="button"`, `tabindex="0"`, `aria-label`).
- **Posição:** começa como companheiro ancorado perto da foto no herói (desktop); ao rolar a página para além do herói, vira um mascote fixo (`position: fixed`, canto inferior direito, `is-floating`) que acompanha o resto da navegação. No mobile, já nasce fixo no canto — não há espaço decente para um companheiro ao lado da foto numa tela estreita, e a troca de posição/tamanho ali é instantânea (sem transição em `width`/`height`, que é propriedade de layout).
- **Armadilha real encontrada (2026-08-18):** as esferas internas (`.snowman__part--*`) são dimensionadas em `rem` fixo para a escala do companheiro no herói; o contêiner `.snowman.is-floating` (e a versão mobile) declarava uma caixa menor sem de fato encolher o personagem — as partes continuavam a renderizar no tamanho cheio e apenas transbordavam da caixa. Corrigido aplicando `transform: scale()` + `transform-origin: bottom right` no próprio `.snowman`, que encolhe visualmente toda a subárvore pintada (contêiner + conteúdo que transborda) em vez de tentar redimensionar cada parte individualmente.
- **Armadilha real encontrada (2026-08-18):** a legenda da foto (`.hero__mark-caption`) era centralizada sob a foto e, sendo mais larga que a foto, transbordava para a esquerda bem em cima do boneco de neve. Corrigido ancorando a legenda à direita da foto (`right: 0.25rem`) em vez de centralizada — o boneco ocupa o canto inferior esquerdo da foto, então a legenda precisa "sobrar" para o lado oposto.

### Named Rules
**The Character Palette Exception.** O boneco de neve tem paleta própria (branco-neve, cinza-neve, carvão, gravetos, cenoura, cartola escura) fora da paleta de chrome do site — documentada em `colors` do frontmatter com o prefixo `snowman-*`. Isso é deliberado: forçar um personagem ilustrativo a usar só preto/lilás/branco do site tiraria toda a leitura do que ele é. A única cor do site que o boneco herda é o `accent` no cachecol — um aceno deliberado, não acidental.

## Do's and Don'ts

### Do:
- **Do** manter o lilás em no máximo dois usos por viewport (The One Accent Rule).
- **Do** usar glass (opacidade + borda translúcida) para toda elevação — nunca `box-shadow` escuro como recurso principal.
- **Do** manter `text-muted` em `#9ca3af` ou mais claro sobre preto puro — nunca reintroduzir o cinza `#5e5e5e` original, que reprova contraste.
- **Do** deixar o espaço da foto de perfil como marca gráfica até existir uma foto real — nunca uma foto de banco ou ilustração genérica no lugar.
- **Do** desligar cursor customizado e qualquer efeito de mouse sob `prefers-reduced-motion` e em `pointer: coarse`.

### Don't:
- **Don't** usar peso de fonte acima de 600 em qualquer texto do sistema — a hierarquia é por tamanho, não por peso.
- **Don't** usar cantos retos em componentes de UI — este mundo é todo arredondado (pills e tiles), o oposto do `DESING_01`.
- **Don't** inventar datas na timeline de carreira — cada item usa só datas confirmadas (ex.: UNIFEB 2023–2027); sem data confirmada, o item fica sem ano, nunca com um ano estimado. Regra reforçada em 2026-08-18 depois de uma versão anterior ter inventado um "mandato 2025–2028" com base numa identidade errada (vereador) que o usuário corrigiu.
- **Don't** adicionar um segundo tom de fundo de seção — a página inteira é preto puro; variação vem de glass, não de degradê de cinzas.
- **Don't** misturar o vocabulário deste mundo com o do `DESING_01` (números de protocolo, selos, pictogramas desenhados) — são dois sistemas irmãos, não um híbrido.
