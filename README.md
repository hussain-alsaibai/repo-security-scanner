# Repo Security Scanner

Lightweight CLI scanner for hardcoded secrets and security misconfigurations.

## Why?

Secrets accidentally committed to repos are one of the most common security vulnerabilities. This tool catches them **before** they become incidents.

- **Fast** — scans thousands of files in seconds
- **Zero config** — works out of the box
- **Clear output** — actionable results, no noise
- **CI/CD ready** — fail builds on secrets

## Install

```bash
npm install -g repo-security-scanner
```

Or use npx:
```bash
npx repo-security-scanner
```

## Quick Start

```bash
# Scan current directory
repo-scan

# Scan specific repo
repo-scan /path/to/repo

# JSON output for CI/CD
repo-scan . --json
```

## What It Finds

### Secrets
- AWS Access Keys (`AKIA...`)
- AWS Secret Keys
- GitHub Tokens (`ghp_...`, `gho_...`, etc.)
- Slack Tokens (`xoxb-...`, `xoxp-...`)
- Private Keys (`-----BEGIN RSA PRIVATE KEY-----`)
- Bearer tokens
- Generic API keys
- Database connection strings

### Risky Files
- `.env` files
- `.env.production`
- SSH private keys (`id_rsa`, `id_dsa`)
- AWS credentials
- `credentials.json`

## Usage

### Interactive Mode

```bash
$ repo-scan

🔍 Scanning for security issues...

📁 Scanned 47 files

⚠️  POTENTIAL SECRETS FOUND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

AWS Access Key
  📄 config/production.js:23
  👁️  const key = "AKIAIOSFODNN7EXAMPLE"

GitHub Token
  📄 lib/github.js:15
  👁️  auth: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total issues found: 2
  - Secrets: 2
  - Risky files: 0

⚡ Review and fix before committing
```

### JSON Output

```bash
$ repo-scan . --json
{
  "secrets": [
    {
      "type": "AWS Access Key",
      "file": "config/production.js",
      "line": 23,
      "preview": "const key = \"AKIAIOSFODNN7EXAMPLE\""
    }
  ],
  "riskyFiles": [],
  "scanned": 47
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g repo-security-scanner
      - run: repo-scan . --json
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
if repo-scan . | grep -q "POTENTIAL SECRETS"; then
  echo "Secrets detected! Commit aborted."
  exit 1
fi
```

## How It Works

1. **Walks directory tree** — recursively scans all files
2. **Pattern matching** — regex detection for known secret formats
3. **File inspection** — identifies risky file names
4. **Deduplication** — avoids reporting same finding twice
5. **Skips safe files** — ignores node_modules, .git, etc.

## Limitations

- **Pattern-based** — may miss novel secret formats
- **No entropy analysis** — doesn't use Shannon entropy
- **Regex only** — simple but fast

For deep scanning, use [gitleaks](https://github.com/gitleaks/gitleaks) or [trufflehog](https://github.com/trufflesecurity/trufflehog). This tool is for quick pre-commit checks.

## Security

This tool:
- ✅ Runs locally, no data sent anywhere
- ✅ Read-only, never modifies files
- ✅ Fast exit on permission errors

## License

MIT

## Contributing

Issues and PRs welcome. Focus: fast, lightweight, zero-config.
