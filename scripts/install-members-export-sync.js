#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(os.homedir(), 'Desktop', 'MB Assets', 'members details');
const envPath = path.join(outputDir, 'member-export-settings.txt');
const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(launchAgentsDir, 'com.sca.members-export.plist');
const logPath = path.join(outputDir, 'members-export.log');
const errorLogPath = path.join(outputDir, 'members-export-error.log');
const nodeScript = path.join(repoRoot, 'scripts', 'export-members-details.js');

const command = [
  '/bin/zsh',
  '-lc',
  `source "$HOME/.nvm/nvm.sh" && nvm use 20 >/dev/null && node "${nodeScript}"`,
];

function xml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.sca.members-export</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(command[0])}</string>
    <string>${xml(command[1])}</string>
    <string>${xml(command[2])}</string>
  </array>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${xml(logPath)}</string>
  <key>StandardErrorPath</key>
  <string>${xml(errorLogPath)}</string>
</dict>
</plist>
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(launchAgentsDir, { recursive: true });

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, [
    'MB_BASE_URL=https://trainingclub.example',
    'MB_ADMIN_EMAIL=your-admin-email@example.com',
    'MB_ADMIN_PASSWORD=your-admin-password',
    `MB_MEMBERS_OUTPUT_DIR=${outputDir}`,
    '',
  ].join('\n'));
  console.log(`Created settings file: ${envPath}`);
  console.log('Add your real admin email and password to that file before using the sync.');
}

fs.writeFileSync(plistPath, plist);

console.log(`Created auto-sync: ${plistPath}`);
console.log('To start it, run:');
console.log(`launchctl unload "${plistPath}" 2>/dev/null || true`);
console.log(`launchctl load "${plistPath}"`);
console.log('');
console.log('It will refresh registered-members.csv every 5 minutes while this Mac is on.');
