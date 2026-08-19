# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JS — user's explicit choice (no build step, deployable to any static host: Vercel, Netlify, GitHub Pages).

## Users

Primary: recruiters, hiring managers, and tech leads screening Emanuel for fullstack developer roles (job hunting) or evaluating him for freelance/contract work. Secondary: people who encounter his connection to public administration (he is a staff member/developer at the Câmara Municipal de Terra Roxa/SP, not an elected official — corrected 2026-08-18 after an earlier draft wrongly called him "vereador"/city councilor) and want to understand the range of what he's built — from a production government system to consumer mobile apps to automation tooling.

## Product Purpose

A personal portfolio site presenting Emanuel's shipped software projects as evidence of fullstack capability. Success means a visitor (recruiter, client, or collaborator) can quickly grasp the breadth and seriousness of the work and has a clear path to view code (GitHub) or reach out.

## Positioning

Most junior/early-career portfolios show CRUD todo-apps and course clones. This one is anchored by a production legislative-workflow system (Django + React) actively used by a real municipal government body — with an explicit state machine, role-based access control, a documented security-hardening cycle, two-tier automated backups, and CI/CD to a self-hosted runner. That project alone is evidence of production-grade engineering judgment that most portfolios at this career stage can't truthfully claim. The rest of the catalog (mobile apps, e-commerce, automation bots, SaaS platforms) shows range across stacks (Python, React/React Native, Django, Node/tRPC, Expo) rather than a single tutorial-stack specialization.

## Operating Context

- Built and maintained solo by Emanuel, edited by hand (no CMS/admin — a prior attempt at a database-backed admin panel exists in `Projetos/portifolio-pessoal` but was abandoned unfinished; this build intentionally avoids that complexity per the user's stack choice).
- Content sourced from ~19 real local project folders on Emanuel's machine plus his GitHub profile (https://github.com/emanuel-git-bot). Not all are public repos; some (e.g. the legislative system, the law firm site) are private/client work and are presented as case studies without a public code link.
- Portuguese (pt-BR) is the primary language — all source projects, READMEs, and target audience (Brazilian tech market, Brazilian municipal client) are Portuguese. No i18n requirement was confirmed; site ships pt-BR only.
- No live demo URLs are confirmed for most projects (several are local-only apps, government-internal systems, or client work with no public staging URL). Screenshots are the primary proof where real screenshots exist; otherwise a text case study.

## Capabilities and Constraints

- Static site: no backend, no database, no auth, no forms that persist anywhere. A contact path (email/GitHub/LinkedIn) substitutes for a working contact form unless the user supplies one later.
- Real assets available: product screenshots for "Mundo das Coisas" (light + dark mode, product page, cart) and "MediaFlow" (downloader UI), found in `Projetos/portifolio-pessoal/imagens/`. Most other projects have no screenshot on hand — do not fabricate UI screenshots; represent those projects with text/diagram-driven case studies instead.
- GitHub is the evidence source for code links: profile is https://github.com/emanuel-git-bot. Confirmed public repos include Financeiro, Harpa-Crista-Cifrada-App-mobile, SafeTrain, spacefy, tech-hub-manage, secspec-verify, MediaFlow, cidade-hype, pyzapzure, PI-2026-Loja-Ti, P2_Atividade2025_LojaVirtual, POO, portfolio-pessoal, Navega-o-map.
- The legislative system (Sistema de Tramitação — Câmara Municipal de Terra Roxa/SP) and the Cervi e Gabriel Advogados site have no confirmed public repo; link to GitHub profile generally or omit the code link for these two.
- Academic/exam exercises (P2_Atividade2025_LojaVirtual, POO) and thin/early-stage scaffolds (Tech-Hub-Manage, PI-2026-Loja-Ti) exist and should be included per the user's "use everything you found" instruction, but are weighted lower (compact list) rather than given full case-study treatment, since they're not comparable in depth to the shipped products.
- Ideas/concepts with no working build (Navega-o-map / "Project_City", mercado-pavam as a separate line from "Mundo das Coisas") are not presented as shipped work.

## Evidence on Hand

- Local project folders (paths on Emanuel's machine, not in this repo): `Financeiro_App`, `Harpa_Cifra`, `Camara-Tr/Sistema-de-Tramita-o` (+ `relatorio.md` audit), `Projetos/Vereador` (+ `ideia.md` product spec), `oab_diarios_bot`, `Projetos/CerviEGabriel/Cervi-e-Gabriel-Advogados`, `studioflow-main`, `sites`, `Projetos/portifolio-pessoal` (prior unfinished attempt, source of real screenshots).
- Real screenshots: `Projetos/portifolio-pessoal/imagens/` — `tela inicial.jpeg`, `tela produto.jpeg`, `carinho.jpeg`, `modo escuro.jpeg`, `tl p escuro.jpeg` (all "Mundo das Coisas" hardware e-commerce store); `mflow1.PNG`, `mflowprogress.PNG`, `mflowvideo.PNG` (MediaFlow).
- GitHub repo descriptions fetched live from https://github.com/emanuel-git-bot for repos not present locally (SafeTrain, spacefy, tech-hub-manage, secspec-verify, MediaFlow, cidade-hype, pyzapzure, PI-2026-Loja-Ti).
- No testimonials, press, case-study metrics (users, revenue, uptime), or client quotes exist anywhere in the source material — none should be fabricated. The legislative-system audit report (`relatorio.md`) is the closest thing to third-party validation and can be paraphrased factually (state machine, RBAC, backup/CI-CD architecture) without inventing numbers it doesn't contain.
- Assumption flagged: professional title is stated as "Desenvolvedor Fullstack" without a seniority qualifier (avoiding the unconfirmed "Júnior" label carried over from the abandoned prior portfolio). Correct if the user wants a specific level stated.

## Product Principles

1. Evidence over adjectives — every claim traces to a real file, repo, or screenshot found during research; no invented metrics, testimonials, or user counts.
2. One flagship, ranked honestly — the legislative system leads because it's genuinely the deepest engineering, not because it's newest or prettiest.
3. Range is the pitch — deliberately show breadth (gov backend, mobile, e-commerce, automation bots, dev tooling) rather than hiding smaller projects; that breadth is Emanuel's differentiator versus single-stack portfolios.
4. No screenshot fabrication — projects without a real screenshot get a text/diagram case study, never a mocked-up or generic stock UI passed off as the product.
5. Static and maintainable — content lives in plain HTML/CSS/JS Emanuel can hand-edit later to add new projects, matching his explicit stack choice over the DB-backed admin approach he already tried once and abandoned.

## Accessibility & Inclusion

No project-specific requirement was established; build to standard WCAG AA baseline (semantic HTML, sufficient contrast, keyboard-navigable) as general good practice.
