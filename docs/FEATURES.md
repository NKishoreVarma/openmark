# OpenMark Feature Matrix & Implementation Verification

This document catalogs OpenMark's functional capabilities based on verified source-code inspection. Every capability is categorized by its precise implementation and verification status.

---

## Verification Status Legend

| Status Indicator | Definition |
|---|---|
| **IMPLEMENTED** | Complete, readable source code exists in the repository with structural integration. |
| **TESTED** | Covered by automated unit, integration, or end-to-end tests in the repository test suite. |
| **EXPERIMENTAL** | Feature-complete or dark-launched code requiring explicit activation or qualification thresholds. |
| **VERIFIED_RUNTIME** | Formally validated inside a live running binary build with smoke verification. |
| **PLANNED** | Architectural stub or external infrastructure prerequisite not yet realized in source. |

---

## 1. Desktop Application & Native Integration

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Tauri v2 Desktop Shell** | `crates/openhuman-app/` | **IMPLEMENTED, TESTED** | Native window management, system tray, and macOS/Windows app lifecycle. |
| **Custom Deep Linking** | `crates/openhuman-app/src/deep_link_ipc.rs` | **IMPLEMENTED, TESTED** | Handles `openmark://` URL schemes with security checks and registration verification. |
| **Dynamic Theming & Contrast** | `app/src/lib/theme/` | **IMPLEMENTED, TESTED** | Dark, light, and system themes with automated contrast ratio validation tests. |
| **Native Notifications** | `crates/openhuman-app/src/native_notifications/` | **IMPLEMENTED, TESTED** | OS-level notification dispatching for background task completions and approvals. |
| **Process Crash Recovery** | `crates/openhuman-app/src/process_recovery.rs` | **IMPLEMENTED, TESTED** | Automated restart handling and recovery state emission when the core sidecar stops responding. |
| **Cryptographic Auto-Updater** | `crates/openhuman-app/tauri.conf.json` | **IMPLEMENTED** | Minisign public key signature verification for release bundles. |

---

## 2. Agent Execution & Orchestration

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Checkpointed Execution Graphs** | `vendor/tinyagents/` | **IMPLEMENTED, TESTED** | Execution turns run as durable state machines that survive restarts and support resumption mid-turn. |
| **Depth-Bounded Sub-Agents** | `vendor/tinyagents/` | **IMPLEMENTED** | Primary agents can dispatch specialized sub-agents with hierarchical task contexts and bounded recursion. |
| **Turn Timeline & Tool Narration** | `app/src/features/conversations/` | **IMPLEMENTED, TESTED** | Real-time tool invocation rails, status spinners, and step-by-step reasoning narration in the UI. |
| **Human-in-the-Loop Approvals** | `app/src/components/approvals/` | **IMPLEMENTED, TESTED** | Interactive confirmation modals for external filesystem writes, bash commands, and network calls. |

---

## 3. Laya Adaptive Model Routing (Exclusive)

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Turn Complexity Scorer** | `app/src/features/laya/layaScorer.ts` | **IMPLEMENTED, TESTED, EXPERIMENTAL** | Heuristic prompt evaluation calculating token density, technical keywords, and reasoning requirements. |
| **Tier Decision Engine** | `app/src/features/laya/layaRouter.ts` | **IMPLEMENTED, TESTED, EXPERIMENTAL** | Dynamic assignment to Local, Light, or Frontier model tiers with deterministic fallbacks. |
| **Shadow Evidence Gate** | `app/src/features/laya/layaRouter.ts` | **IMPLEMENTED, TESTED, EXPERIMENTAL** | Dark-launch safety gate: requires ≥200 shadow observations and ≥75% estimated precision before activation. |
| **Turn Badge & Frontier Redo** | `app/src/components/chat/LayaRoutingBadge.tsx` | **IMPLEMENTED, TESTED, EXPERIMENTAL** | Visual chip displaying the routed tier and an instant "Redo with frontier model" override button. |
| **Observability Dashboard** | `app/src/components/settings/panels/LayaRoutingPanel.tsx` | **IMPLEMENTED, TESTED, EXPERIMENTAL** | User settings panel displaying historical observations, routing distribution, and precision metrics. |

---

## 4. Model & Provider Integration

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Bring Your Own Key (BYOK)** | `app/src/components/settings/panels/ai/` | **IMPLEMENTED, TESTED** | Direct user API key entry for OpenAI, Anthropic, OpenRouter, Groq, and DeepSeek. |
| **Local Inference (Ollama)** | `crates/openhuman-core/src/api/config.rs` | **IMPLEMENTED, TESTED** | Loopback detection and endpoint routing for locally running Ollama or compatible LLM servers. |
| **Dynamic Model Picker** | `app/src/components/settings/panels/ai/ProviderModelPickerDialog.tsx` | **IMPLEMENTED, TESTED** | Searchable model browser with context window sizes, pricing metrics, and capability tags. |

---

## 5. Memory & Context Retrieval

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Hierarchical Memory Trees** | `vendor/tinymemory/` | **IMPLEMENTED** | Periodic summarization of conversation turns and documents into structured memory hierarchies. |
| **Markdown File Store** | `vendor/tinymemory/` | **IMPLEMENTED** | User memory stored as transparent, editable Markdown files on the local filesystem. |
| **AgentMemory Proxy Integration** | `crates/openhuman-core/src/api/` | **IMPLEMENTED** | Optional proxy bridge to share memory with external tools (Claude Code, Cursor, Codex). |

---

## 6. Tools, Skills & Model Context Protocol (MCP)

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Model Context Protocol (MCP)** | `vendor/tinymcp/` | **IMPLEMENTED, TESTED** | Connects to standard MCP servers over stdio and SSE protocols to surface external tools. |
| **Sandboxed QuickJS Skills** | `vendor/tinyskills/` | **IMPLEMENTED, TESTED** | Runs custom JavaScript skill scripts inside an isolated QuickJS sandbox. |
| **Filesystem & System Tools** | `vendor/tinytools/` | **IMPLEMENTED, TESTED** | Safe file reading, writing, path resolution, and terminal command execution under user consent. |

---

## 7. Workflows & Visual Automation

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Visual Workflow Canvas** | `vendor/tinyflows/` | **IMPLEMENTED** | React-based flow canvas for viewing and modifying multi-step trigger and tool graphs. |
| **Trigger-Driven Automation** | `vendor/tinyflows/` | **IMPLEMENTED** | Supports cron schedules, webhook events, and channel messages as execution triggers. |
| **Agent-Authored Automations** | `app/src/components/flows/` | **IMPLEMENTED** | Conversational prompting where the agent drafts a workflow graph for human inspection before saving. |

---

## 8. Communication Channels

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Direct Webhook Receivers** | `crates/openhuman-core/` | **IMPLEMENTED, TESTED** | Inbound HTTP webhook endpoints for triggering automated agent turns. |
| **Telegram Bot Integration** | `app/src/components/channels/` | **IMPLEMENTED, TESTED** | Connects personal Telegram bot tokens to dispatch turns and receive voice notes. |
| **Managed Cloud Relay** | `app/src/utils/config.ts` | **PLANNED** | Requires hosted backend infrastructure deployment (F3); BYOK modes function independently. |

---

## 9. Security & Sandboxing

| Feature | Implementation Path | Status | Notes |
|---|---|---|---|
| **Telemetry Stripping** | `app/src/utils/config.ts` | **IMPLEMENTED, TESTED** | Upstream telemetry and analytics identifiers disabled by default. |
| **Safe Backend Fallback** | `crates/openhuman-core/src/api/config.rs` | **IMPLEMENTED, TESTED** | Empty default endpoints prevent accidental requests to unauthorized third-party servers. |
| **Local Credential Storage** | `app/src/store/` | **IMPLEMENTED, TESTED** | Encrypted token storage leveraging operating system credential managers. |
| **GPL-3.0 Attribution Panel** | `app/src/components/settings/panels/AboutPanel.tsx` | **IMPLEMENTED, TESTED** | Prominent in-app legal notice and links to the upstream repository. |
