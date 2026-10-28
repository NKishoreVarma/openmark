# OpenMark Development & Setup Guide

This guide details the complete local development environment setup, prerequisites, build commands, and testing workflows for OpenMark.

---

## 1. Prerequisites & Toolchain

Verify that your workstation meets the following toolchain requirements:

| Tool | Recommended Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | `v24.x` (LTS or current) | `node --version` | Managed via `nvm`, `fnm`, or `asdf`. |
| **pnpm** | `10.10.0` | `pnpm --version` | Package manager for frontend and workspace packages. |
| **Rust** | `1.96.1` (stable) | `rustc --version` | Managed via `rustup`. Includes `cargo`, `rustfmt`, `clippy`. |
| **Xcode CLI Tools** | Latest stable | `xcode-select -p` | Required on macOS for Tauri binary compilation. |

> [!IMPORTANT]
> **Filesystem Warning (macOS):** Avoid cloning or running the project inside iCloud-synced directories (`~/Desktop`, `~/Documents` when iCloud Drive sync is enabled). iCloud's background synchronization locks files, causes severe SQLite contention, and significantly degrades build performance. Keep your repository in a non-synced location such as `~/dev/openmark`.

---

## 2. Initial Setup & Dependency Installation

### Step 1: Clone with Recursive Submodules
OpenMark relies on 16 modular submodules in `vendor/`:

```bash
git clone --recurse-submodules https://github.com/NKishoreVarma/openmark.git ~/dev/openmark
cd ~/dev/openmark
```

If already cloned without submodules:
```bash
git submodule update --init --recursive
```

### Step 2: Install Node Dependencies
Install root and frontend dependencies with frozen lockfiles to guarantee reproducible builds:

```bash
# Install root workspace tooling
pnpm install --frozen-lockfile

# Install frontend application dependencies
cd app && pnpm install --frozen-lockfile && cd ..
```

### Step 3: Environment Configuration
Create local development environment files from the sanitized templates:

```bash
# Root environment (read by Rust core and Docker)
cp .env.example .env

# Frontend environment (read by Vite)
cp app/.env.example app/.env.local
```

Both `.env` and `app/.env.local` are gitignored. Never commit real API keys or credentials.

---

## 3. Development Workflows

### Running the Frontend (Web Preview)
To iterate rapidly on the React UI and theme system without compiling native Rust binaries:

```bash
cd app
pnpm dev
```
The Vite development server will start at `http://localhost:1420`.

### Running the Full Tauri Desktop App
To run the full desktop application (React UI + bundled native Rust core):

```bash
cd app
pnpm dev:app
```
This script launches the Tauri development watcher, starts the backend JSON-RPC sidecar on `http://127.0.0.1:7788`, and opens the native desktop window with hot module replacement (HMR).

---

## 4. Code Quality & Type Checking

Run static analysis checks before submitting pull requests:

```bash
# TypeScript compilation check across all frontend components
cd app && pnpm compile

# Run ESLint on TypeScript and TSX sources
cd app && pnpm lint

# Check design tokens and CSS variable conventions
cd app && pnpm lint:ui-tokens

# Validate i18n locale coverage across all 14 languages
pnpm i18n:check

# Rust static analysis and type checking
pnpm rust:check

# Rust formatting check
pnpm --filter openhuman-app rust:format:check
```

---

## 5. Testing Suite

OpenMark includes comprehensive unit and integration test coverage across both frontend and native layers.

### Frontend Unit Tests (Vitest)
Executes component tests, hook tests, and utility tests:

```bash
cd app
pnpm test
```

To run a targeted test suite (e.g. Laya adaptive router):
```bash
cd app
pnpm test app/src/features/laya/__tests__/layaRouter.test.ts
```

### Rust Core Unit Tests
Runs unit tests with mocked external services:

```bash
cd app
pnpm test:rust
```

---

## 6. Building for Release

### Desktop Application Packaging

#### macOS Release Build (Universal / Apple Silicon)
```bash
cd app
pnpm macos:build:release -- --target aarch64-apple-darwin
```
Outputs:
- App Bundle: `crates/openhuman-app/target/aarch64-apple-darwin/release/bundle/macos/openmark.app`
- Disk Image: `crates/openhuman-app/target/aarch64-apple-darwin/release/bundle/dmg/openmark.dmg`

#### Windows Release Build (x64)
```cmd
cd app
pnpm tauri:build:ui
```
Outputs:
- NSIS Installer: `crates/openhuman-app/target/release/bundle/nsis/openmark-setup.exe`

---

## 7. Troubleshooting Common Issues

### 1. Port 1420 or Port 7788 Already in Use
If an orphaned process is holding the dev ports:
```bash
lsof -i :1420 -i :7788
kill -9 <PID>
```

### 2. Submodule Missing or Detached
If a vendor crate fails to compile due to missing headers:
```bash
git submodule sync --recursive
git submodule update --init --recursive --force
```

### 3. macOS Keychain Permission Denied
For local ad-hoc codesigning during development:
```bash
bash scripts/setup-dev-codesign.sh
```
