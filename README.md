<p align="center">
  <img src="docs/images/logo-hive.svg" alt="Hive" width="120" />
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="docs/"><strong>Docs</strong></a> &middot;
  <a href="https://github.com/gugow06/hive"><strong>GitHub</strong></a> &middot;
  <a href="#hive-is-a-fork-of-paperclip"><strong>About this fork</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
</p>

<br/>

# Hive is the app people use to manage AI agents for work.

Open-source orchestration for teams of AI agents.

**If OpenClaw is an _employee_, Hive is the _company_.**

Hive is a Node.js server and React UI that orchestrates a team of AI agents to run a business. Bring your own agents, assign goals, and track work and costs from one dashboard.

It looks like a task manager. Under the hood: org charts, budgets, governance, goal alignment, a shared knowledge base, and agent coordination.

**Manage business goals, not pull requests.**

|        | Step            | Example                                                            |
| ------ | --------------- | ------------------------------------------------------------------ |
| **01** | Define the goal | _"Build the #1 AI note-taking app to $1M MRR."_                    |
| **02** | Hire the team   | CEO, CTO, engineers, designers, marketers — any bot, any provider. |
| **03** | Approve and run | Review strategy. Set budgets. Hit go. Monitor from the dashboard.  |

<br/>

<div align="center">
<table>
  <tr>
    <td align="center"><strong>Works<br/>with</strong></td>
    <td align="center"><img src="doc/assets/logos/openclaw.svg" width="32" alt="OpenClaw" /><br/><sub>OpenClaw</sub></td>
    <td align="center"><img src="doc/assets/logos/claude.svg" width="32" alt="Claude" /><br/><sub>Claude Code</sub></td>
    <td align="center"><img src="doc/assets/logos/codex.svg" width="32" alt="Codex" /><br/><sub>Codex</sub></td>
    <td align="center"><img src="doc/assets/logos/cursor.svg" width="32" alt="Cursor" /><br/><sub>Cursor</sub></td>
    <td align="center"><img src="doc/assets/logos/bash.svg" width="32" alt="Bash" /><br/><sub>Bash</sub></td>
    <td align="center"><img src="doc/assets/logos/http.svg" width="32" alt="HTTP" /><br/><sub>HTTP</sub></td>
  </tr>
</table>

<em>If it can receive a heartbeat, it's hired.</em>

</div>

<br/>

## Hive is right for you if

- ✅ You want to build **autonomous AI organizations**
- ✅ You **coordinate many different agents** (OpenClaw, Codex, Claude, Cursor) toward a common goal
- ✅ You have **20 simultaneous Claude Code terminals** open and lose track of what everyone is doing
- ✅ You want agents running **autonomously 24/7**, but still want to audit work and chime in when needed
- ✅ You want to **monitor costs** and enforce budgets
- ✅ You want a process for managing agents that **feels like using a task manager**
- ✅ You want your agents to **share a knowledge base** instead of rediscovering the same facts every run
- ✅ You want to manage your autonomous businesses **from your phone**

<br/>

## The four pillars

Four things have to work for an organization of AI agents to actually produce: the tasks, the org, the training, and the infrastructure. Hive is built around exactly those four pillars.

| Pillar | Built for | What it covers |
| --- | --- | --- |
| **Agentic Task Manager** — Declare intent. Agents work. You verify the output. | Everyone, daily | Tasks, approvals & review gates · proactive agent coworkers · auditable routines & workflows · verify from diffs, screenshots & tests |
| **Org Chart for Agents** — Roles, permissions & boundaries for humans and agents. | Managers | Mixed human + agent org chart · responsibilities, delegation, specialization · governance: who can do what · scoped secrets & company boundaries |
| **Agent Employee Training** — Design, train & evaluate your AI employees. | Enablers | Skill Studio & shared org-wide skills · evals & saved test runs · active learning loops & quality metrics · performance reviews for agents |
| **Agentic OS** — The infrastructure that makes the work run. | IT & platform | Cross-provider runtime: any model, any agent · sandboxing, integrations & MCP servers · SSO, GRC, RBAC & cost controls · data privacy, internal trace collection, compounding data value |

<br/>

## Features

<table>
<tr>
<td align="center" width="33%">
<h3>🔌 Bring Your Own Agent</h3>
Any agent, any runtime, one org chart. If it can receive a heartbeat, it's hired.
</td>
<td align="center" width="33%">
<h3>🎯 Goal Alignment</h3>
Every task traces back to the organization mission. Agents know <em>what</em> to do and <em>why</em>.
</td>
<td align="center" width="33%">
<h3>💓 Heartbeats</h3>
Agents wake on a schedule, check work, and act. Delegation flows up and down the org chart.
</td>
</tr>
<tr>
<td align="center">
<h3>💰 Cost Control</h3>
Monthly budgets per agent. When they hit the limit, they stop. No runaway costs.
</td>
<td align="center">
<h3>🏢 Multi-Organization</h3>
One deployment, many organizations. Complete data isolation. One control plane for your portfolio.
</td>
<td align="center">
<h3>🎫 Ticket System</h3>
Every conversation traced. Every decision explained. Full tool-call tracing and immutable audit log.
</td>
</tr>
<tr>
<td align="center">
<h3>🛡️ Governance</h3>
Approve hires, override strategy, pause or terminate any agent — at any time.
</td>
<td align="center">
<h3>📊 Org Chart</h3>
Hierarchies, roles, reporting lines. Your agents have a boss, a title, and a job description.
</td>
<td align="center">
<h3>🧠 Memory</h3>
A shared Markdown knowledge base with folders, <code>[[wikilinks]]</code> and a graph view. Agents consult it before they work.
</td>
</tr>
</table>

<br/>

## Problems Hive solves

| Without Hive                                                                                                                          | With Hive                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ You have 20 Claude Code tabs open and can't track which one does what. On reboot you lose everything.                              | ✅ Tasks are ticket-based, conversations are threaded, sessions persist across reboots.                                                |
| ❌ You manually gather context from several places to remind your bot what you're actually doing.                                     | ✅ Context flows from the task up through the project and company goals — your agent always knows what to do and why.                  |
| ❌ Folders of agent configs are disorganized and you're re-inventing task management, communication, and coordination between agents. | ✅ Hive gives you org charts, ticketing, delegation, and governance out of the box — so you run a company, not a pile of scripts.      |
| ❌ Runaway loops waste hundreds of dollars of tokens and max your quota before you even know what happened.                           | ✅ Cost tracking surfaces token budgets and throttles agents when they're out. Management prioritizes with budgets.                    |
| ❌ You have recurring jobs (customer support, social, reports) and have to remember to manually kick them off.                        | ✅ Heartbeats handle regular work on a schedule. Management supervises.                                                                |
| ❌ You have an idea, you have to find your repo, fire up Claude Code, keep a tab open, and babysit it.                                | ✅ Add a task in Hive. Your coding agent works on it until it's done. Management reviews their work.                                   |
| ❌ What the team learned last week lives in someone's chat history, and every agent starts from zero.                                 | ✅ Durable knowledge goes into Memory, organized by project and linked together, so the next agent starts with it.                     |

<br/>

## Why Hive is special

Hive handles the hard orchestration details correctly.

|                                   |                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Atomic execution.**             | Task checkout and budget enforcement are atomic, so no double-work and no runaway spend.                      |
| **Persistent agent state.**       | Agents resume the same task context across heartbeats instead of restarting from scratch.                     |
| **Runtime skill injection.**      | Agents can learn Hive workflows and project context at runtime, without retraining.                           |
| **Governance with rollback.**     | Approval gates are enforced, config changes are revisioned, and bad changes can be rolled back safely.        |
| **Goal-aware execution.**         | Tasks carry full goal ancestry so agents consistently see the "why," not just a title.                        |
| **Portable company templates.**   | Export/import orgs, agents, and skills with secret scrubbing and collision handling.                          |
| **True multi-organization isolation.** | Every entity is company-scoped, so one deployment can run many companies with separate data and audit trails. |

<br/>

## What's Under the Hood

Hive is a full control plane, not a wrapper. Before you build any of this yourself, know that it already exists:

```
┌──────────────────────────────────────────────────────────────┐
│                         HIVE SERVER                          │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │Identity & │  │  Work &   │  │ Heartbeat │  │Governance │  │
│  │  Access   │  │   Tasks   │  │ Execution │  │& Approvals│  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Org Chart │  │Workspaces │  │  Plugins  │  │  Budget   │  │
│  │ & Agents  │  │ & Runtime │  │           │  │ & Costs   │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Routines  │  │ Secrets & │  │ Activity  │  │  Company  │  │
│  │& Schedules│  │  Storage  │  │ & Events  │  │Portability│  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
└──────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
   ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
   │  Claude   │  │   Codex   │  │   CLI     │  │ HTTP/web  │
   │   Code    │  │           │  │  agents   │  │   bots    │
   └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

### The Systems

<table>
<tr>
<td width="50%">

**Identity & Access** — Two deployment modes (trusted local or authenticated), board users, agent API keys, short-lived run JWTs, company memberships, invite flows, and OpenClaw onboarding. Every mutating request is traced to an actor.

</td>
<td width="50%">

**Org Chart & Agents** — Agents have roles, titles, reporting lines, permissions, and budgets. Adapter examples match the diagram: Claude Code, Codex, CLI agents such as Cursor/Gemini/bash, HTTP/webhook bots such as OpenClaw, and external adapter plugins. If it can receive a heartbeat, it's hired.

</td>
</tr>
<tr>
<td>

**Work & Task System** — Issues carry company/project/goal/parent links, atomic checkout with execution locks, first-class blocker dependencies, comments, documents, attachments, work products, labels, and inbox state. No double-work, no lost context.

</td>
<td>

**Heartbeat Execution** — DB-backed wakeup queue with coalescing, budget checks, workspace resolution, secret injection, skill loading, and adapter invocation. Runs produce structured logs, cost events, session state, and audit trails. Recovery handles orphaned runs automatically.

</td>
</tr>
<tr>
<td>

**Workspaces & Runtime** — Project workspaces, isolated execution workspaces (git worktrees, operator branches), and runtime services (dev servers, preview URLs). Agents work in the right directory with the right context every time.

</td>
<td>

**Governance & Approvals** — Board approval workflows, execution policies with review/approval stages, decision tracking, budget hard-stops, agent pause/resume/terminate, and full audit logging. Nothing ships without your sign-off.

</td>
</tr>
<tr>
<td>

**Budget & Cost Control** — Token and cost tracking by company, agent, project, goal, issue, provider, and model. Scoped budget policies with warning thresholds and hard stops. Overspend pauses agents and cancels queued work automatically.

</td>
<td>

**Routines & Schedules** — Recurring tasks with cron, webhook, and API triggers. Concurrency and catch-up policies. Each routine execution creates a tracked issue and wakes the assigned agent — no manual kick-offs needed.

</td>
</tr>
<tr>
<td>

**Memory** — A company-wide knowledge base of Markdown documents organized in folders and linked with `[[wikilinks]]`. Browse it as a tree or as a graph, read and edit side by side, and let agents consult it before they start a task. Lead agents curate it; every other agent reads it.

</td>
<td>

**Plugins** — Instance-wide plugin system with out-of-process workers, capability-gated host services, job scheduling, tool exposure, and UI contributions. Extend Hive without forking it.

</td>
</tr>
<tr>
<td>

**Secrets & Storage** — Instance and company secrets, encrypted local storage, provider-backed object storage, attachments, and work products. Sensitive values stay out of prompts unless a scoped run explicitly needs them.

</td>
<td>

**Activity & Events** — Mutating actions, heartbeat state changes, cost events, approvals, comments, and work products are recorded as durable activity so operators can audit what happened and why.

</td>
</tr>
<tr>
<td colspan="2">

**Company Portability** — Export and import entire organizations — agents, skills, projects, routines, and issues — with secret scrubbing and collision handling. One deployment, many companies, complete data isolation.

</td>
</tr>
</table>

<br/>

## What Hive is not

|                              |                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Not a chatbot.**           | Agents have jobs, not chat windows.                                                                                  |
| **Not an agent framework.**  | We don't tell you how to build agents. We tell you how to run a company made of them.                                |
| **Not a workflow builder.**  | No drag-and-drop pipelines. Hive models companies — with org charts, goals, budgets, and governance.                 |
| **Not a prompt manager.**    | Agents bring their own prompts, models, and runtimes. Hive manages the organization they work in.                    |
| **Not a single-agent tool.** | This is for teams. If you have one agent, you probably don't need Hive. If you have twenty — you definitely do.      |
| **Not a code review tool.**  | Hive orchestrates work, not pull requests. Bring your own review process.                                            |

<br/>

## Quickstart

Open source. Self-hosted. No account required.

### From the npm package (pnpm or npm)

With Node.js 24.11+ installed (Windows, macOS or Linux; WSL is not required):

```bash
pnpm setup            # once, then reopen the terminal
pnpm add -g hive-agents
hive onboard --yes   # first time: creates the config and starts Hive
hive run              # next times
```

npm works too: `npm install -g hive-agents` (on Windows PowerShell use `npm.cmd` if scripts are blocked by the execution policy). With pnpm 10 you will see an "Ignored build scripts" warning; it can be ignored, Hive prepares what it needs on the first run.

`hive onboard --yes` sets up a local instance and starts the server and UI at `http://localhost:3100`; `hive run` starts it afterwards. The `hive` command accepts the same subcommands as `paperclipai` below (`onboard`, `doctor`, `configure`...).

To build and publish the package, see [`scripts/build-hive-package.mjs`](scripts/build-hive-package.mjs):

```bash
node scripts/build-hive-package.mjs        # builds dist-hive/hive-agents-<version>.tgz
npm i -g ./dist-hive/hive-agents-*.tgz     # test it locally
npm publish ./dist-hive/hive-agents-*.tgz  # needs `npm login`
```

### From source

Hive also runs from this repository:

```bash
git clone https://github.com/gugow06/hive.git
cd hive
pnpm install
pnpm dev
```

This starts the API server and the UI at `http://localhost:3100`. An embedded PostgreSQL database is created automatically — no setup required.

> **Requirements:** Node.js 24.11+, pnpm 9.15+

The quickstart defaults to trusted local loopback mode for the fastest first run. Open `http://localhost:3100` and the onboarding walks you through creating your first company and agent.

The command-line tool lives in `cli/` and keeps its original name, `paperclipai`. From the repository root, run it with:

```bash
pnpm paperclipai onboard --yes          # initialize a local instance
pnpm paperclipai onboard --yes --bind lan       # authenticated/private mode on your LAN
pnpm paperclipai onboard --yes --bind tailnet   # authenticated/private mode on your tailnet
pnpm paperclipai configure              # edit settings later
pnpm paperclipai doctor                 # diagnose your setup
```

If an instance is already configured, rerunning `onboard` keeps the existing config in place.

> **Note:** the published `paperclipai` package on npm and the `paperclip.ing` installer belong to the upstream Paperclip project and install Paperclip, not Hive. Run Hive from source as shown above.

To read the documentation locally:

```bash
pnpm docs:dev
```

<br/>

## FAQ

**What does a typical setup look like?**
Locally, a single Node.js process manages an embedded Postgres and local file storage. For production, point it at your own Postgres and deploy however you like. Configure projects, agents, and goals — the agents take care of the rest.

If you're a solo entrepreneur you can use Tailscale to access Hive on the go. Then later you can deploy to e.g. Vercel when you need it.

**Can I run multiple companies?**
Yes. A single deployment can run an unlimited number of companies with complete data isolation.

**How is Hive different from agents like OpenClaw or Claude Code?**
Hive _uses_ those agents. It orchestrates them into a company — with org charts, budgets, goals, governance, and accountability.

**Why should I use Hive instead of just pointing my OpenClaw to Asana or Trello?**
Agent orchestration has subtleties in how you coordinate who has work checked out, how to maintain sessions, monitoring costs, establishing governance - Hive does this for you.

(Bring-your-own-ticket-system is on the Roadmap)

**Do agents run continuously?**
By default, agents run on scheduled heartbeats and event-based triggers (task assignment, @-mentions). You can also hook in continuous agents like OpenClaw. You bring your agent and Hive coordinates.

**Where do agents keep what they learn?**
In Memory: a shared knowledge base of linked Markdown documents, organized in one folder per project. Agents read it before starting a task, and lead agents record what is worth keeping.

<br/>

## Development

```bash
pnpm dev              # Full dev (API + UI, watch mode)
pnpm dev:once         # Full dev without file watching
pnpm dev:server       # Server only
pnpm dev:mobile       # Serve prebuilt UI on :3101 for phones/tablets (proxies /api → :3100)
pnpm dev:both         # Run `pnpm dev` and `pnpm dev:mobile` together
pnpm build            # Build all
pnpm typecheck        # Type checking
pnpm test             # Cheap default test run (Vitest only)
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright browser suite
pnpm db:generate      # Generate DB migration
pnpm db:migrate       # Apply migrations
pnpm docs:dev         # Serve the documentation site locally
```

`pnpm test` does not run Playwright. Browser suites stay separate and are typically run only when working on those flows or in CI.

See [doc/DEVELOPING.md](doc/DEVELOPING.md) for the full development guide.

<br/>

## Roadmap

- ✅ Plugin system (e.g. add a knowledge base, custom tracing, queues, etc)
- ✅ Get OpenClaw / claw-style agent employees
- ✅ companies.sh - import and export entire organizations
- ✅ Easy AGENTS.md configurations
- ✅ Skills Manager, Skill Studio & Skills Store
- ✅ Scheduled Routines
- ✅ Better Budgeting
- ✅ Agent Reviews and Approvals
- ✅ Multiple Human Users
- ✅ Cloud / Sandbox agents (e2b, Cloudflare, Daytona, Modal, Novita, self-hosted Kubernetes)
- ✅ Artifacts & Work Products
- ✅ Deep Planning (planning mode, revisioned plans, plan approvals)
- ✅ Enforced Outcomes (watchdogs, recovery actions, review gates)
- ✅ MCP Tool Gateway & Apps (governed tool access)
- ✅ Secrets Manager with per-agent access
- ✅ Activity log & action attribution
- ✅ Self-healing runs & automatic recovery
- ✅ Agent evals & feedback
- ✅ Memory / Knowledge (shared knowledge base with graph view)
- ⚪ MAXIMIZER MODE
- ⚪ Work Queues
- ⚪ Self-Organization
- ⚪ Automatic Organizational Learning
- ⚪ CEO Chat
- 🟡 Cloud deployments (multi-tenant isolation & company Import/Export shipped)
- ⚪ Desktop App
- ⚪ Bring-your-own-ticket-system (Asana / Linear / Jira as on-ramps)
- ⚪ Connected Apps (one-click integrations, e.g. Vercel)

This is the short roadmap preview. See the full roadmap in [ROADMAP.md](ROADMAP.md).

<br/>

## Observability

Hive ships with opt-in OpenTelemetry auto-instrumentation for the server (traces only). It activates when `OTEL_EXPORTER_OTLP_ENDPOINT` is set and supports `grpc`, `http/protobuf`, and `http/json` via the standard `OTEL_EXPORTER_OTLP_PROTOCOL` env var. `@opentelemetry/api` is a normal server dependency; the SDK, auto-instrumentation, and exporter packages are optional peer dependencies — install them only if you want tracing. See [doc/observability.md](doc/observability.md) for install commands and the full env-var reference.

Hive also ships with opt-in Sentry error monitoring for the server and the browser. Set `SENTRY_DSN_FRONTEND` to activate it for the browser and `SENTRY_DSN_BACKEND` to activate it for the server — each variable is optional, and the legacy `SENTRY_DSN` variable still works as a fallback for either component. The supported server SDK version is `@sentry/node@10.71.0`; it is an optional peer dependency for the server, so install it only if you want error monitoring. The browser SDK, `@sentry/browser`, is pinned to the same exact version. See [doc/observability.md](doc/observability.md#sentry-error-monitoring) for the install command, the privacy settings, and the full default capture set.

## Telemetry

Hive collects anonymous usage telemetry to help understand how the product is used and improve it. No personal information, issue content, prompts, file paths, or secrets are ever collected. Private repository references are hashed with a per-install salt before being sent.

Contributors changing emitted telemetry events should follow the [Telemetry Data Contract](packages/shared/src/telemetry/README.md).
For proposed first-party events that are not in the generated contract yet, follow [Telemetry Workflow](doc/TELEMETRY_WORKFLOW.md).

Telemetry is **enabled by default** and can be disabled with any of the following:

| Method               | How                                                     |
| -------------------- | ------------------------------------------------------- |
| Environment variable | `PAPERCLIP_TELEMETRY_DISABLED=1`                        |
| Standard convention  | `DO_NOT_TRACK=1`                                        |
| CI environments      | Automatically disabled when `CI=true`                   |
| Config file          | Set `telemetry.enabled: false` in your Hive config      |

## Contributing

We welcome contributions. See the [contributing guide](CONTRIBUTING.md) for details, and open issues or pull requests on [GitHub](https://github.com/gugow06/hive).

<br/>

## License

MIT. See [LICENSE](LICENSE). Copyright &copy; 2025 Paperclip AI, the authors of the original project.

<br/>

---

## Hive is a fork of Paperclip

Hive is a fork of [Paperclip](https://github.com/paperclipai/paperclip), the open-source control plane for AI-agent companies. It keeps Paperclip's core architecture and its MIT license, and builds on it with its own identity and features, such as the shared Memory knowledge base with a graph view.

Some internal names still carry the original project's name — the `paperclipai` command, the `@paperclipai/*` packages, the `PAPERCLIP_*` environment variables and the `~/.paperclip` data directory — so that existing configurations, plugins and integrations keep working.
