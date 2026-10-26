# telemed-ia-notifications-portal

> notifications bounded context: web UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

## Development

The portal is written in React and is mounted by the Angular shell (`telemed-ia-front`) through
Native Federation. It exposes `./mount`: the shell calls `mount(element, bridge)` and gets back the
function that unmounts it. The portal has no HTTP client or session of its own; it uses the shell
bridge (`src/shell-bridge.ts`).

Requires Node 22 (`.nvmrc`).

```bash
npm ci
npm run start   # development build into dist/, rebuilt on every change in src/
npm run serve   # serves dist/ on http://localhost:4208 for the shell on http://localhost:4200
```

The shell manifest (`public/federation.manifest.json`) points `notifications` at
`http://localhost:4208/remoteEntry.json`; the page is `/notifications`.

| Script | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run typecheck` | TypeScript check |
| `npm test` / `npm run test:ci` | Vitest (watch / single run) |

`serve` reads `PORT`, `HOST` and `SHELL_ORIGIN` (the only origin allowed by CORS).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `library-docs`.
