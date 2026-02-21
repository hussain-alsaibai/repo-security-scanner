const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = {
  'AWS Access Key': /AKIA[0-9A-Z]{16}/,
  'AWS Secret Key': /[0-9a-zA-Z/+]{40}/,
  'GitHub Token': /gh[pousr]_[A-Za-z0-9_]{36,}/,
  'GitHub Classic Token': /[0-9a-zA-Z]{35,40}/,
  'Slack Token': /xox[baprs]-[0-9a-zA-Z]{10,48}/,
  'Private Key': /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  'API Key': /['\"][0-9a-zA-Z_-]{32,}['\"].{0,10}(api|key|token|secret)/i,
  'Bearer Token': /bearer\s+[0-9a-zA-Z_.-]+/i,
  'Password': /password\s*[=:]\s*['\"][^'\"]{4,}['\"]/i,
  'Connection String': /(mongodb|mysql|postgres|redis):\/\/[^:]+:[^@]+@/i,
};

const RISKY_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'id_rsa',
  'id_dsa',
  '.aws/credentials',
  'credentials.json',
  'secrets.json'
];

class RepoScanner {
  constructor(targetPath) {
    this.targetPath = targetPath;
    this.results = {
      secrets: [],
      riskyFiles: [],
      misconfigs: [],
      scanned: 0
    };
  }

  scan() {
    this.walkDirectory(this.targetPath);
    return this.results;
  }

  walkDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.targetPath, fullPath);

      // Skip node_modules, .git, etc
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'repo-security-scanner') {
        continue;
      }

      if (entry.isDirectory()) {
        this.walkDirectory(fullPath);
      } else {
        this.scanFile(fullPath, relativePath);
      }
    }
  }

  scanFile(fullPath, relativePath) {
    this.results.scanned++;

    // Check for risky file names
    if (RISKY_FILES.some(risky => relativePath.includes(risky))) {
      this.results.riskyFiles.push({
        file: relativePath,
        reason: 'Potentially sensitive file'
      });
    }

    // Check file extensions
    const ext = path.extname(fullPath).toLowerCase();
    const scanExts = ['.js', '.ts', '.py', '.go', '.java', '.rb', '.php', '.json', '.yaml', '.yml', '.env', '.txt', '.md'];
    
    if (!scanExts.includes(ext) && !RISKY_FILES.some(r => relativePath.includes(r))) {
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        for (const [name, pattern] of Object.entries(SECRET_PATTERNS)) {
          if (pattern.test(line)) {
            // Avoid duplicates
            const alreadyFound = this.results.secrets.find(s => 
              s.file === relativePath && s.line === idx + 1 && s.type === name
            );
            if (!alreadyFound) {
              this.results.secrets.push({
                type: name,
                file: relativePath,
                line: idx + 1,
                preview: line.trim().substring(0, 50)
              });
            }
          }
        }
      });
    } catch (err) {
      // Binary file or permission error, skip
    }
  }
}

module.exports = RepoScanner;
