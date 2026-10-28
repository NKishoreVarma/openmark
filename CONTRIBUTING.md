# Contributing to OpenMark

Thank you for your interest in contributing to OpenMark! OpenMark is an open-source, local-first desktop AI assistant and agent runtime licensed under GPL-3.0.

OpenMark derives from [OpenHuman](https://github.com/tinyhumansai/openhuman). We welcome contributions from developers, designers, and AI researchers across our frontend, native desktop shell, and modular agent subsystems.

---

## 1. Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat others with respect and professional courtesy.

---

## 2. Getting Started

- Review [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) to understand the boundary between the React frontend, Tauri v2 shell, and the Rust core.
- Follow [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for local environment setup, toolchain requirements, and running the app.
- Check the [Issue Tracker](https://github.com/NKishoreVarma/openmark/issues) for open tasks, bugs, and feature discussions before beginning major work.
- For security vulnerabilities, review [SECURITY.md](SECURITY.md) and report them privately.

---

## 3. Development Workflow

1. **Fork & Branch:** Create a feature branch off `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Submodules:** Ensure submodules are recursively updated:
   ```bash
   git submodule update --init --recursive
   ```
3. **Keep Commits Coherent:** Make small, logical commits with descriptive messages following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New user-facing capabilities
   - `fix:` Bug fixes
   - `refactor:` Code improvements without behavioral changes
   - `docs:` Documentation additions or corrections
   - `test:` Adding or repairing tests
4. **Run Pre-Commit Checks:**
   ```bash
   # TypeScript typecheck
   cd app && pnpm compile
   # Unit tests
   pnpm test
   # Rust checks
   pnpm --filter openhuman-app rust:check
   ```

---

## 4. Legal & Licensing Guidelines

OpenMark is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.
- Any new files or contributions you submit will be licensed under GPL-3.0.
- Do NOT remove existing copyright notices or licenses from upstream OpenHuman or third-party crates.
- If introducing third-party libraries, verify that their licenses are compatible with GPL-3.0 (e.g., MIT, Apache-2.0, BSD).
- Review [`fork/COMPLIANCE.md`](fork/COMPLIANCE.md) for detailed compliance policies.
