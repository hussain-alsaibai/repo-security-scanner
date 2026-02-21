#!/usr/bin/env node

const RepoScanner = require('../lib/scanner');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const target = args[0] || '.';

function showHelp() {
  console.log(`
Repo Security Scanner v1.0.0

Lightweight scanner for hardcoded secrets and security misconfigurations

Usage:
  repo-scan [path] [options]

Options:
  --json     Output results as JSON
  --help     Show this help

Examples:
  repo-scan                    # Scan current directory
  repo-scan /path/to/repo    # Scan specific repo
  repo-scan . --json         # Output as JSON
`);
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const targetPath = path.resolve(target);

if (!fs.existsSync(targetPath)) {
  console.error(`Error: Path not found: ${targetPath}`);
  process.exit(1);
}

const isJson = args.includes('--json');

if (!isJson) {
  console.log('\n🔍 Scanning for security issues...\n');
}

const scanner = new RepoScanner(targetPath);
const results = scanner.scan();

if (isJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  // Pretty print
  console.log(`📁 Scanned ${results.scanned} files\n`);

  if (results.secrets.length > 0) {
    console.log('⚠️  POTENTIAL SECRETS FOUND:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.secrets.forEach(secret => {
      console.log(`\n${secret.type}`);
      console.log(`  📄 ${secret.file}:${secret.line}`);
      console.log(`  👁️  ${secret.preview}`);
    });
    console.log('\n');
  }

  if (results.riskyFiles.length > 0) {
    console.log('📋 RISKY FILES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.riskyFiles.forEach(file => {
      console.log(`  ⚠️  ${file.file} - ${file.reason}`);
    });
    console.log('\n');
  }

  const totalIssues = results.secrets.length + results.riskyFiles.length;
  
  if (totalIssues === 0) {
    console.log('✅ No obvious security issues found.');
    console.log('   (This does not guarantee security - manual review recommended)\n');
  } else {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total issues found: ${totalIssues}`);
    console.log(`  - Secrets: ${results.secrets.length}`);
    console.log(`  - Risky files: ${results.riskyFiles.length}`);
    console.log(`\n⚡ Review and fix before committing\n`);
  }
}
