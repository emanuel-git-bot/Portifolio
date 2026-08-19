# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JS — same choice as the first build (`DESING_01`), no build step, deployable to any static host. This is a from-scratch second visual system over the identical product/content, built as a sibling folder so both can be compared; it does not replace `DESING_01`.

## Users

Primary: recruiters, hiring managers, and tech leads screening Emanuel for fullstack developer roles (job hunting) or evaluating him for freelance/contract work. Secondary: people who encounter his connection to public administration (he is a staff member/developer at the Câmara Municipal de Terra Roxa/SP, not an elected official — corrected 2026-08-18 after an earlier draft wrongly called him "vereador"/city councilor) and want to understand the range of what he's built — from a production government system to consumer mobile apps to automation tooling.

## Product Purpose

A personal portfolio site presenting Emanuel's shipped software projects as evidence of fullstack capability. Success means a visitor (recruiter, client, or collaborator) can quickly grasp the breadth and seriousness of the work and has a clear path to view code (GitHub) or reach out.

## Positioning

Most junior/early-career portfolios show CRUD todo-apps and course clones. This one is anchored by a production legislative-workflow system (Django + React) actively used by a real municipal government body — with an explicit state machine, role-based access control, a documented security-hardening cycle, two-tier automated backups, and CI/CD to a self-hosted runner. That project alone is evidence of production-grade engineering judgment that most portfolios at this career stage can't truthfully claim. The rest of the catalog (mobile apps, e-commerce, automation bots, SaaS platforms) shows range across stacks (Python, React/React Native, Django, Node/tRPC, Expo) rather than a single tutorial-stack specialization.

## Operating Context

- Built and maintained solo by Emanuel, edited by hand (no CMS/admin). Two parallel static builds now exist side by side: `DESING_01` (the "Painel de Embarque" wayfinding/Modern-Dark system, already shipped) and `DESING_02` (this one — a from-scratch visual system explicitly modeled on a reference site the user supplied).
- Content sourced from ~19 real local project folders on Emanuel's machine plus his GitHub profile (https://github.com/emanuel-git-bot). Not all are public repos; some (e.g. the legislative system, the law firm site) are private/client work and are presented as case studies without a public code link.
- Portuguese (pt-BR) is the primary language — all source projects, READMEs, and target audience (Brazilian tech market, Brazilian municipal client) are Portuguese. No i18n requirement was confirmed; site ships pt-BR only.
- No live demo URLs are confirmed for most projects (several are local-only apps, government-internal systems, or client work with no public staging URL). Screenshots are the primary proof where real screenshots exist; otherwise a text case study.
- New content added since `DESING_01` shipped: an "Educação e Eventos" line (UNIFEB graduation 2023–2027, XXII SESINFO participation), carried into this build too since it's real product/profile truth, not a `DESING_01`-specific decision.

## Capabilities and Constraints

- Static site: no backend, no database, no auth, no forms that persist anywhere. A contact path (email/GitHub/LinkedIn) substitutes for a working contact form unless the user supplies one later.
- Real assets available: product screenshots for "Mundo das Coisas" (light + dark mode, product page, cart) and "MediaFlow" (downloader UI), copied into `DESING_01/assets/images/` already; copy or re-source into this build's own `assets/` rather than referencing the sibling folder cross-path. Most other projects have no screenshot on hand — do not fabricate UI screenshots; represent those projects with text/diagram-driven case studies instead.
- No professional headshot/cutout photo of Emanuel exists in the source material. The reference site this build imitates (see DESIGN.md) uses a floating background-removed profile photo as a hero focal element — that specific asset cannot be produced here without a real photo from the user; treat it as an open placeholder, not something to fabricate or approximate with stock imagery.
- GitHub is the evidence source for code links: profile is https://github.com/emanuel-git-bot. Confirmed public repos include Financeiro, Harpa-Crista-Cifrada-App-mobile, SafeTrain, spacefy, tech-hub-manage, secspec-verify, MediaFlow, cidade-hype, pyzapzure, PI-2026-Loja-Ti, P2_Atividade2025_LojaVirtual, POO, portfolio-pessoal, Navega-o-map.
- The legislative system (Sistema de Tramitação — Câmara Municipal de Terra Roxa/SP) and the Cervi e Gabriel Advogados site have no confirmed public repo; link to GitHub profile generally or omit the code link for these two.
- Academic/exam exercises (P2_Atividade2025_LojaVirtual, POO) and thin/early-stage scaffolds (Tech-Hub-Manage, PI-2026-Loja-Ti) exist and should be included per the user's earlier "use everything you found" instruction, but are weighted lower rather than given full case-study treatment.
- Ideas/concepts with no working build (Navega-o-map / "Project_City", mercado-pavam as a separate line from "Mundo das Coisas") are not presented as shipped work.

## Evidence on Hand

- Local project folders (paths on Emanuel's machine, not in this repo): `Financeiro_App`, `Harpa_Cifra`, `Camara-Tr/Sistema-de-Tramita-o` (+ `relatorio.md` audit), `Projetos/Vereador` (+ `ideia.md` product spec), `oab_diarios_bot`, `Projetos/CerviEGabriel/Cervi-e-Gabriel-Advogados`, `studioflow-main`, `sites`.
- Real screenshots: `Projetos/portifolio-pessoal/imagens/` — `tela inicial.jpeg`, `tela produto.jpeg`, `carinho.jpeg`, `modo escuro.jpeg` (all "Mundo das Coisas" hardware e-commerce store); `mflow1.PNG` (MediaFlow). Also already copied once into `DESING_01/assets/images/`.
- GitHub repo descriptions fetched live from https://github.com/emanuel-git-bot for repos not present locally.
- No testimonials, press, case-study metrics (users, revenue, uptime), or client quotes exist anywhere in the source material — none should be fabricated. The legislative-system audit report (`relatorio.md`) is the closest thing to third-party validation and can be paraphrased factually without inventing numbers.
- Assumption flagged (carried from `DESING_01`): professional title is stated as "Desenvolvedor Fullstack" without a seniority qualifier.

## Product Principles

1. Evidence over adjectives — every claim traces to a real file, repo, or screenshot found during research; no invented metrics, testimonials, or user counts.
2. One flagship, ranked honestly — the legislative system leads because it's genuinely the deepest engineering, not because it's newest or prettiest.
3. Range is the pitch — deliberately show breadth (gov backend, mobile, e-commerce, automation bots, dev tooling) rather than hiding smaller projects.
4. No screenshot fabrication, no fabricated profile photo — projects and the person are represented only with real assets on hand; a missing asset is a labeled gap, never a stand-in.
5. Static and maintainable — content lives in plain HTML/CSS/JS Emanuel can hand-edit later to add new projects.

## Accessibility & Inclusion

No project-specific requirement was established; build to standard WCAG AA baseline (semantic HTML, sufficient contrast, keyboard-navigable) as general good practice — the reference site's very low-contrast gray ghost-links (`Do` in DESIGN.md) are the one place this build must deliberately diverge from its visual reference to hold that baseline.
