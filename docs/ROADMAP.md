# OpenMark Engineering Roadmap & Milestone Status

This document tracks engineering achievements, active milestones, known technical limitations, and the forward-looking roadmap for OpenMark.

---

## 1. Completed Engineering Work

### Foundation & Fork Integrity (Milestone F0–F2)
- [x] **Submodule Pinning & Synchronization:** Cloned and verified all 16 modular submodules in `vendor/tiny*` at specific upstream Git SHAs.
- [x] **License Audit & Upstream Attribution:** Completed a comprehensive GPL-3.0 audit across all submodules; embedded mandatory §5(a) interactive attribution notice with links in `AboutPanel.tsx`.
- [x] **Independent Configuration Layer:** Decoupled the codebase from upstream cloud services, remote telemetry endpoints, and hardcoded analytics identifiers (`app/src/utils/config.ts`).

### Rebranding & Visual Identity (Milestone F4)
- [x] **Application Identification:** Standardized app identifier as `com.openmark.app` and executable name as `openmark` across `tauri.conf.json`, `Cargo.toml`, and `package.json`.
- [x] **Multi-Resolution Icon Suite:** Authored custom OpenMark visual icon sets across macOS (`.icns`), Windows (`.ico`), PNG scales (16x16 to 512x512), and mobile formats.
- [x] **Theme Token Refactoring:** Fixed design token leaks, contrast ratios, and dark/light mode palette transitions in `tokens.css` and `shadcn-tokens.css`.
- [x] **Global Localization:** Migrated application identity across all 14 supported localization bundles (`app/src/lib/i18n/*.ts`).

### Laya Adaptive Model Routing (Milestone F8.4)
- [x] **Heuristic Complexity Scoring:** Engineered `layaScorer.ts` to evaluate prompt tokens, code blocks, technical density, and tool invocation markers.
- [x] **Dynamic Routing Engine:** Built `layaRouter.ts` with tier mapping (Local, Light, Frontier) and deterministic fallbacks.
- [x] **Shadow Observation Gate:** Gated live execution behind an evidence threshold requiring ≥200 shadow observations and ≥75% estimated precision.
- [x] **Interactive Turn Overrides:** Implemented `LayaRoutingBadge.tsx` and "Redo with frontier model" action in conversation threads.
- [x] **Observability Panel:** Created `LayaRoutingPanel.tsx` in Settings to inspect routing accuracy and historical tier distributions.

### CI & Release Automation (Milestone F11)
- [x] **Multi-Platform CI Pipeline:** Authored `.github/workflows/openmark-build.yml` supporting macOS (Apple Silicon + Intel) and Windows builds.
- [x] **Automated Code Quality Checks:** Integrated TypeScript typechecking, Vitest suites, and Rust checks into CI.

---

## 2. Current Active Milestones

### Milestone A: Test Certification & Baseline Hardening
- [ ] Run and document fresh post-migration test suites across the full matrix (frontend, Rust core, integration).
- [ ] Verify test idempotency and zero-leak guarantees without relying on historical upstream counts.

### Milestone B: Laya Empirical Qualification
- [ ] Accumulate shadow observation datasets against standard developer workloads.
- [ ] Tune heuristic scoring thresholds based on empirical token usage and model response benchmarks.

### Milestone C: Code Signing & Release Gate
- [ ] Configure Apple Developer ID Application certificates for macOS Gatekeeper notarization.
- [ ] Configure Windows Authenticode code signing credentials.
- [ ] Generate Minisign updater key pairs and verify the live auto-update pipeline.

---

## 3. Forward Roadmap

### Phase 1: Self-Hosted Cloud Core
- Deployment recipes for self-hosted headless cores on Kubernetes, Fly.io, and Docker Compose.
- Multi-device state synchronization allowing desktop clients to connect to a persistent home server.

### Phase 2: Autonomous Tooling & MCP Ecosystem
- First-class MCP server manager UI to discover, install, and configure Model Context Protocol plugins.
- Enhanced sandboxing for local tool execution with fine-grained directory permissions.

### Phase 3: Mobile Experience (Tauri Mobile)
- React Native / Tauri mobile targets for iOS and Android, leveraging the shared TypeScript frontend and mobile push notifications.

---

## 4. Current Limitations & Transparent Disclosures

1. **Release Gate Status:** Production binary releases are not yet notarized for public distribution. Users building from source should use local dev builds.
2. **Managed Cloud Services:** Managed authentication and cloud-hosted DM linking are not yet deployed; users should operate in BYOK (Bring Your Own Key) or local inference mode.
3. **Hardware Requirements:** Local inference features require an active local Ollama daemon or compatible server with sufficient GPU/RAM resources.
