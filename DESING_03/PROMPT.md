# Prompt — Construir o portfólio de Emanuel Roque

Cole este prompt inteiro numa nova conversa com a IA (idealmente com acesso a ferramentas de arquivo/terminal/navegador, como o Claude Code) para construir o site.

---

Quero que você construa meu portfólio pessoal como um site estático (HTML/CSS/JS puro, sem build step).

## Conteúdo e assets

Todo o conteúdo real (bio, projetos, tech stack, timeline, contato) está no arquivo `CONTEUDO_EMANUEL.md`, nesta mesma pasta. Use exatamente essas informações — não invente projetos, métricas, depoimentos ou redes sociais que não estejam listados lá. Onde o conteúdo estiver incompleto ou um link não existir, deixe como está descrito (ex.: "sem link público confirmado") em vez de inventar.

Todas as imagens necessárias (foto real, screenshots de projetos, ícones de tecnologia) já estão em `assets/images/` nesta pasta — copie a pasta inteira para o projeto e reaproveite os arquivos como estão, sem recriar ícones que já existem ali.

## Referência visual

O visual do site deve ser modelado em cima do site **https://www.redoyanulhaque.me/** — não é uma inspiração vaga, é uma referência pinada: acesse o site, extraia os tokens de design reais (cores, tipografia, espaçamento, raios de borda, animações) do CSS computado de verdade, não de memória ou aproximação. Replique a mesma linguagem visual (tema escuro, tipografia gigante, glassmorphism, cursor customizado, cards numerados, timeline com ano em destaque) adaptada para o conteúdo do `CONTEUDO_EMANUEL.md`.

## A única mudança deliberada em relação à referência: o personagem 3D

O site de referência tem um personagem 3D animado (Three.js) ao lado da foto de perfil no herói. Eu não tenho um modelo `.glb` real nem forma de gerar um, então **troque esse personagem 3D por um boneco de neve totalmente animado em CSS/JS** — não é um modelo 3D de verdade, é uma aparência de profundidade construída com esferas em `radial-gradient` + sombra interna, mas deve se comportar de um jeito que pareça vivo:

- Olhos que seguem o cursor do mouse em tempo real (só em dispositivos com `pointer: fine`).
- Balanço de respiração contínuo (idle animation), sutil, sem parecer nervoso.
- Pula ao clicar/tocar nele.
- A cada terceiro clique, em vez de pular, as partes do boneco se desmontam e remontam sozinhas — uma recompensa rara, não o comportamento padrão.
- Acessível via teclado (`role="button"`, `tabindex`, `aria-label`, funciona com Enter/Espaço).
- Desliga toda animação sob `prefers-reduced-motion: reduce`.
- Começa como um companheiro ancorado perto da foto no herói (desktop). Ao rolar a página para além do herói, vira um mascote fixo no canto da tela que acompanha o resto da navegação (`IntersectionObserver` no herói, não scroll listener pesado).
- No mobile, já nasce fixo no canto (não há espaço para um companheiro ao lado da foto numa tela estreita) — cuidado para não deixá-lo sobrepondo qualquer barra de navegação fixa que o site tiver nesse breakpoint.
- Nunca chamar isso de "3D" ou "modelo 3D" na cópia do site — é uma aparência honesta de profundidade em CSS puro, não geometria 3D real.

**Há uma implementação já pronta e testada desse exato boneco de neve** num build anterior meu (`DESING_02/styles.css` e `DESING_02/script.js`, se essa pasta estiver disponível para você) — pode reaproveitar esse código como base direta (a classe `.snowman` e toda a lógica de eye-tracking/scroll/clique) em vez de reescrever do zero.

## Navegação

O menu principal deve ser uma coluna vertical fixa na borda esquerda da tela (não um header horizontal), mostrando **só ícones** — sem texto visível por padrão. Ao passar o mouse sobre cada ícone, uma tooltip pequena aparece ao lado mostrando o nome da seção (ex.: "SOBRE"). No mobile, essa mesma navegação vira uma barra fixa na parte de baixo da tela, com ícone + legenda pequena sempre visível (sem depender de hover, que não existe em touch).

## Idioma e tom

Português do Brasil (pt-BR), sempre. Emanuel é servidor/desenvolvedor da Câmara Municipal de Terra Roxa/SP — **não é vereador, não é um cargo eletivo** — isso precisa estar correto desde a primeira versão.

## Processo

1. Acesse `https://www.redoyanulhaque.me/` de verdade e extraia os tokens de design reais antes de escrever qualquer CSS.
2. Leia `CONTEUDO_EMANUEL.md` inteiro antes de escrever qualquer HTML.
3. Construa o site (HTML/CSS/JS estático).
4. Verifique visualmente em desktop e mobile (screenshot) antes de considerar terminado.
5. Nunca fabrique projetos, métricas, fotos, redes sociais ou depoimentos que não estejam em `CONTEUDO_EMANUEL.md`.
