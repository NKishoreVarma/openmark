# Security Policy

OpenMark takes the security and privacy of its users seriously. As a local-first application dealing with sensitive workspaces, API keys, and personal data, we welcome responsible vulnerability disclosures.

---

## Supported Versions

| Version | Supported | Status |
|---|---|---|
| `main` (active dev) | :white_check_mark: | Actively maintained |
| `< 0.63.31` | :x: | Unsupported |

---

## Reporting a Vulnerability

If you discover a security vulnerability or privacy leak in OpenMark:

1. **Do NOT open a public issue.** Please do not disclose vulnerabilities through public GitHub issues, discussions, or social channels.
2. **Report Privately:** Use [GitHub Private Vulnerability Reporting](https://github.com/NKishoreVarma/openmark/security/advisories/new) on the repository.
3. **Include Details:**
   - Affected component (React UI, Tauri IPC bridge, Rust core, or a specific vendor submodule).
   - Detailed reproduction steps or proof-of-concept payload.
   - Any potential impact on local filesystem isolation or credential leakage.

---

## Security Principles in OpenMark

- **Local Storage by Default:** Conversation logs, memory graphs, and user settings are stored locally on the user's filesystem and are never uploaded without explicit consent.
- **Keyring Storage:** API keys and credentials are stored in operating system keychains, not in plaintext config files.
- **Sandboxed Execution:** Untrusted tool and skill invocations run within isolated memory-limited runtimes.
- **Telemetry Independence:** Third-party analytics and error reporting are disabled by default.
