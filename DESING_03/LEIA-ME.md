# Portfólio — Emanuel Roque

Site estático, sem build step. Abra `index.html` no navegador ou publique a pasta inteira
(GitHub Pages, Netlify, Vercel — qualquer host de arquivos estáticos serve).

```
index.html
styles.css
script.js
assets/images/emanuel-foto.jpg
```

## O que ficou pendente por falta de arquivo

A pasta `assets` chegou vazia no upload (0 bytes). Só a foto subiu. Por isso:

1. **Ícones das tecnologias (SVG).** A seção Stack está com as 32 tecnologias em chips de
   texto, sem logos. Quando você reenviar os SVGs, é só colocá-los em `assets/images/` e
   trocar cada `<li>Nome</li>` da seção `#stack` por:
   ```html
   <li><img src="assets/images/python.svg" alt="" width="16" height="16">Python</li>
   ```
   e adicionar no CSS: `.chips-lg li{ display:flex; align-items:center; gap:8px; }`

2. **Screenshots reais.** `mundo-das-coisas-home.jpeg` e `mediaflow-home.png` não vieram.
   Os dois projetos estão com estudo de caso em texto, como manda a regra de conteúdo
   (nada de screenshot fabricado). Para encaixar depois, adicione dentro do `.case-body`:
   ```html
   <img class="case-shot" src="assets/images/mundo-das-coisas-home.jpeg" alt="Tela inicial do Mundo das Coisas">
   ```

3. **`DESING_02/styles.css` e `script.js`** também não vieram, então o boneco de neve foi
   escrito do zero aqui — mesmo comportamento pedido, código novo.

## Decisões de conteúdo que valem conferir

- **Tailwind saiu da lista.** O material marcava como "se usado — conferir", e com ele a
  contagem dava 33, não 32. Se você usa mesmo, adicione o chip de volta e troque o título
  da seção para "33 tecnologias".
- **Projeto 05** ganhou uma nota curta deixando explícito que é um produto *para*
  vereadores (eles são os clientes do SaaS), para nunca confundir com o seu cargo.
- Nenhuma métrica, depoimento, prêmio ou rede social além do GitHub foi adicionado.
- Onde não havia link, está escrito "Sem link público confirmado". O projeto 01 aponta
  para o seu e-mail, não para o GitHub.

## Referência visual

Não consegui extrair o CSS computado de `redoyanulhaque.me` — o site devolve só o HTML
inicial (conteúdo renderizado por JS) e o ambiente aqui não abre aquele domínio no
navegador. Então a linguagem visual foi construída a partir da descrição do briefing
(tema escuro, tipografia gigante, glassmorphism, cursor customizado, cards numerados,
timeline com ano em destaque), não copiando tokens medidos. Se quiser fidelidade maior,
me mande um print ou o CSS do site de referência e eu calibro cor, escala e espaçamento
em cima do arquivo real.

## Tipografia

As fontes vêm do Google Fonts (Bricolage Grotesque, Inter Tight, JetBrains Mono).
Precisa de internet na primeira carga. Para usar offline, baixe os `.woff2` para
`assets/fonts/` e troque o `<link>` por `@font-face` no `styles.css`.

## Acessibilidade e movimento

- Navegação por teclado com foco visível; link "pular para o conteúdo".
- Boneco de neve é `role="button"` com `tabindex` e responde a Enter/Espaço.
- `prefers-reduced-motion: reduce` desliga respiração, pulo, desmonte e as revelações
  de scroll.
- Rastreamento dos olhos só em `pointer: fine` (não roda em touch).
