# Conteúdo real — Emanuel Roque

Este arquivo reúne **tudo que é informação verdadeira** sobre Emanuel Roque e seus projetos, extraído dos builds `DESING_01`/`DESING_02` já verificados com o próprio Emanuel. Nenhum dado aqui é inventado — use isso como fonte única de verdade ao montar o novo portfólio. Não adicione métricas, depoimentos, número de usuários ou qualquer coisa que não esteja listada abaixo.

## Identidade

- **Nome:** Emanuel Roque
- **E-mail:** roqueemanuel2018@gmail.com
- **Localização:** Terra Roxa, SP — Brasil
- **GitHub:** https://github.com/emanuel-git-bot
- **Título profissional:** Desenvolvedor Fullstack (sem qualificador de senioridade — não inventar "júnior/pleno/sênior")
- **Papel público:** **Servidor/funcionário (desenvolvedor) da Câmara Municipal de Terra Roxa/SP — NÃO é vereador, NÃO é um cargo eletivo.** Isso já foi corrigido uma vez num rascunho anterior que errou isso; é o ponto mais importante para não errar de novo.
- Sem foto profissional "cutout"/com fundo removido disponível — existe uma foto real (selfie ao ar livre, fundo de céu e árvore), usada no `DESING_02` com vinheta em CSS para integrar ao fundo da página. O arquivo está em `assets/images/emanuel-foto.jpg` (copiado para esta pasta).

## Frase de abertura (hero)

> Olá! Eu sou **EMANUEL ROQUE**
> Um **Desenvolvedor Fullstack** — **Servidor Público**
>
> Servidor da Câmara Municipal de Terra Roxa/SP e desenvolvedor autodidata. Construo sistemas de produção, apps mobile e ferramentas de automação, do sistema de tramitação legislativa da própria Câmara a produtos pessoais e de clientes.

## Sobre mim

Sou servidor da Câmara Municipal de Terra Roxa/SP e desenvolvedor fullstack autodidata, na prática a mesma disciplina aplicada a dois ofícios. O trabalho na Câmara exige acompanhar prazo, protocolo e rito legislativo com precisão, e foi esse contato direto com a burocracia real que virou o Sistema de Tramitação Legislativa: não um exercício acadêmico, mas um sistema construído com acesso ao Regimento Interno de verdade. O restante do meu trabalho mostra a outra metade (mobile, e-commerce, automação, ferramentas de linha de comando), construído sozinho, projeto por projeto, aprendendo o que cada stack exige na prática.

## O que eu faço (duas frentes)

**1. Sistemas & Backend** — Workflows com estado, regras de negócio reais e dados que não podem se perder: o tipo de sistema que um órgão público ou uma operação de verdade exige.
Exemplo direto: o Sistema de Tramitação Legislativa da Câmara Municipal de Terra Roxa/SP — protocolo automático, máquina de estados auditável, controle de acesso por papel e backup em duas camadas, em uso real todos os dias.
Skillset: Python · Django · PostgreSQL · Docker · GitHub Actions · RBAC

**2. Produtos Web & Mobile** — Aplicações responsivas e apps mobile com experiência de usuário cuidada, do protótipo rápido ao produto que um cliente real usa todo dia.
Exemplo direto: Mundo das Coisas (e-commerce com checkout via WhatsApp) e Harpa com Cifra (app mobile em uso pessoal, Expo/React Native) — dois produtos com usuário real na outra ponta, não protótipos de vitrine.
Skillset: React · Next.js · React Native · TypeScript · Node.js · tRPC

## Carreira

- **AGORA —  Desenvolvedor Fullstack**, Câmara Municipal de Terra Roxa/SP. Trabalhando na Câmara e construindo sistemas próprios e de clientes, incluindo os ~18 projetos deste portfólio, do sistema de tramitação legislativa a ferramentas pessoais de automação.
- **2023–2027 — Graduação em Sistemas de Informação**, UNIFEB, Barretos/SP. Em andamento.
- **XXII SESINFO** — Semana de Sistemas de Informação do UNIFEB. Presença ativa em eventos acadêmicos, buscando sempre o alinhamento entre o mercado de trabalho e as inovações tecnológicas.

(Nunca inventar um "mandato" ou cargo eletivo com datas — Emanuel não é vereador.)

## Projetos — os 5 principais (com case study completo)

### 01 — Sistema de Tramitação Legislativa
- **Categoria:** Legislativo · Governo
- **Descrição:** Sistema completo de tramitação de proposições para a Câmara Municipal de Terra Roxa/SP: protocolo automático, despacho da presidência, comissões com prazos reais do Regimento Interno, parecer jurídico, plenário com votação, sanção e veto do prefeito, portal de transparência público e painel de auditoria de segurança. Máquina de estados auditável registrando cada transição.
- **Stack:** Django · React · PostgreSQL · Docker · GitHub Actions
- **Código:** privado/cliente — sem repositório público confirmado. Linkar para o e-mail/contato, não para o GitHub, neste caso.
- **Este é o projeto-carro-chefe** — deve liderar por ser o mais profundo tecnicamente (estado auditável, RBAC, backup em duas camadas, CI/CD para runner self-hosted), não por ser o mais novo ou bonito.

### 02 — SafeTrain
- **Categoria:** Segurança do Trabalho
- **Descrição:** Plataforma de treinamento e certificação em segurança do trabalho (Normas Regulamentadoras): catálogo dinâmico de cursos, compra por voucher, painel B2B, geração de certificado, checkout de verdade com Mercado Pago e PagBank.
- **Stack:** React · Vite · Fastify · Prisma · Mercado Pago
- **Código:** https://github.com/emanuel-git-bot/SafeTrain

### 03 — Mundo das Coisas
- **Categoria:** E-commerce
- **Descrição:** Loja virtual de ferragens e material de construção: catálogo por categoria, carrinho com subtotal, modo escuro completo e finalização de pedido direto pelo WhatsApp.
- **Stack:** React · Checkout via WhatsApp · Dark mode
- **Screenshot real disponível:** `assets/images/mundo-das-coisas-home.jpeg`
- **Código:** sem link público confirmado

### 04 — Harpa com Cifra
- **Categoria:** Mobile
- **Descrição:** App mobile (Expo/React Native) para visualizar hinos com letra e cifra em imagem, com busca, favoritos e zoom por pinça. Em uso pessoal.
- **Stack:** Expo · React Native · TypeScript
- **Código:** https://github.com/emanuel-git-bot/Harpa-Crista-Cifrada-App-mobile

### 05 — Plataforma Cívica para Vereadores
- **Categoria:** SaaS Cívico
- **Descrição:** Produto SaaS B2B2C: site público personalizado por mandato + área do cidadão para indicar problemas, reivindicar soluções e sugerir projetos de lei, com painel administrativo completo. Em construção.
- **Stack:** Next.js · B2B2C
- **Código:** sem link público confirmado
- **Atenção:** este é um produto PARA vereadores (clientes do SaaS), não uma afirmação de que Emanuel é vereador. Manter o nome do projeto como está, mas nunca deixar isso confundir a identidade dele.

## Projetos — os outros 9 ("Terminal Geral" / ferramentas e bots)

### 06 — Financeiro App
Scripts que leem extratos do Nubank e PicPay e calculam faturamento mensal, mais app mobile e desktop de acompanhamento financeiro.
Stack: Python · React Native · Electron
Código: https://github.com/emanuel-git-bot/Financeiro

### 07 — MediaFlow
Web app para baixar vídeo e áudio sem anúncios, com suporte a múltiplas resoluções via FFmpeg.
Stack: Django · FFmpeg
Screenshot real: `assets/images/mediaflow-home.png`
Código: https://github.com/emanuel-git-bot/MediaFlow

### 08 — Robô de Diários OAB
Robô que pesquisa publicações por número de OAB em diários oficiais, gera relatório em PDF/HTML/CSV e evita alertas duplicados.
Stack: Python · Flask local
Código: sem link público confirmado

### 09 — Cervi e Gabriel Advogados
Site institucional para escritório de advocacia, com autenticação e banco de dados próprios. Entregue como projeto de cliente.
Stack: React · tRPC · Drizzle
Código: sem link público confirmado (projeto de cliente)

### 10 — Spacefy
Rede social para compartilhar cifras musicais sincronizadas, estudo aplicando Spec Driven Development do início ao fim.
Stack: Next.js · SDD
Código: https://github.com/emanuel-git-bot/spacefy

### 11 — Cidade Hype
Backend e API de administração para um jogo de construção de cidades: loja, eventos, atualizações e sistema de bugs.
Stack: Django · DRF
Código: https://github.com/emanuel-git-bot/cidade-hype

### 12 — PyZapZure
Ferramenta de automação de envio de mensagens no WhatsApp via Selenium.
Stack: Python · Selenium
Código: https://github.com/emanuel-git-bot/pyzapzure

### 13 — SecSpec Verify
Skill de IA para agentes rodarem auditorias de segurança automatizadas em projetos baseados em OpenSpec.
Stack: Node.js · Agentes de IA
Código: https://github.com/emanuel-git-bot/secspec-verify

### 14 — StudioFlow
App construído com Google AI Studio integrando a API do Gemini, com autenticação e dados via Firebase.
Stack: Gemini API · Firebase
Código: sem link público confirmado

## Projetos — "Sala de Estudos" (exercícios e protótipos, escopo menor mas reais)

### 15 — PI 2026 — Loja TI
Design de e-commerce como projeto integrador.
Stack: Next.js
Código: https://github.com/emanuel-git-bot/PI-2026-Loja-Ti

### 16 — Tech Hub Manage
Ferramenta de gestão em estágio inicial.
Stack: Vite
Código: https://github.com/emanuel-git-bot/tech-hub-manage

### 17 — Loja Virtual — Atividade POO
SOLID, Clean Code e dois padrões de projeto.
Stack: C#
Código: https://github.com/emanuel-git-bot/P2_Atividade2025_LojaVirtual

### 18 — Estudos de POO
Exercícios de programação orientada a objetos.
Stack: — (sem stack específica)
Código: https://github.com/emanuel-git-bot/POO

## Tech Stack completo (32 tecnologias reais)

Linguagens: Python, JavaScript, TypeScript, C#, HTML, CSS
Frontend/Mobile: React, React Native, Next.js, Expo, Tailwind (se usado — conferir), tRPC
Backend: Node.js, Django, Django REST Framework, Fastify, Flask
Dados: PostgreSQL, MySQL, SQLite, Drizzle, Prisma
DevOps/Ferramentas: Docker, GitHub Actions, Firebase, Selenium, FFmpeg
Pagamentos (Brasil): Mercado Pago, PagBank
IA: Gemini API
Versionamento/Editor: Git, GitHub, VS Code

Os arquivos de ícone de cada tecnologia (SVG) estão em `assets/images/` — reaproveitar os mesmos arquivos, não recriar.

## Rodapé / Contato

- Título do CTA final: "Vamos construir algo juntos?"
- Botões: "ENVIAR E-MAIL" (mailto:roqueemanuel2018@gmail.com) e "Ver GitHub →"
- Blocos do rodapé: E-MAIL (roqueemanuel2018@gmail.com), LOCALIZAÇÃO (Terra Roxa, SP — Brasil), SOCIAL (só GitHub — nunca adicionar LinkedIn/Twitter/Instagram sem confirmação real, pois não existem)
- Assinatura: "Emanuel Roque — Portfólio" / "Desenvolvido por Emanuel Roque © 2026"

## Regras de conteúdo (não violar)

1. **Emanuel NÃO é vereador.** É servidor/funcionário (desenvolvedor) da Câmara Municipal de Terra Roxa/SP.
2. Nenhuma métrica, número de usuários, depoimento ou prêmio deve ser inventado — nada disso existe nas fontes reais.
3. Não fabricar capturas de tela de projetos que não têm uma (`assets/images/` só tem duas: Mundo das Coisas e MediaFlow) — para os demais, usar case study em texto.
4. Não adicionar redes sociais além do GitHub.
5. Site em português (pt-BR) — é o idioma de todo o material-fonte e do público-alvo (mercado brasileiro, cliente municipal brasileiro).
