const RepoScanner = require('../lib/scanner');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temp test repo
const TEST_DIR = path.join(os.tmpdir(), 'test-repo-' + Date.now());
fs.mkdirSync(TEST_DIR);
fs.mkdirSync(path.join(TEST_DIR, 'src'));

// Create test files
fs.writeFileSync(path.join(TEST_DIR, 'src', 'config.js'), `
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const apiKey = "sk-1234567890abcdef";
`);

fs.writeFileSync(path.join(TEST_DIR, '.env'), 'SECRET=hidden\n');

console.log('Testing repo-security-scanner...\n');

const scanner = new RepoScanner(TEST_DIR);
const results = scanner.scan();

console.log('Files scanned:', results.scanned);
console.log('Secrets found:', results.secrets.length);
console.log('Risky files:', results.riskyFiles.length);

if (results.secrets.length > 0) {
  console.log('\n✅ Test passed - secrets detected');
} else {
  console.log('\n❌ Test failed - no secrets detected');
}

// Cleanup
fs.rmSync(TEST_DIR, { recursive: true });
