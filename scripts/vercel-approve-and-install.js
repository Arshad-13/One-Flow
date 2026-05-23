const { execSync } = require('child_process');
const { readFileSync } = require('fs');

function run(cmd) {
  console.log('$', cmd);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // Try the simple, modern command first
  run('pnpm approve-builds --all');
} catch (e) {
  console.warn('`pnpm approve-builds --all` failed, falling back to approving specific packages...');

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const candidates = [
    '@prisma/client',
    '@prisma/engines',
    'bcrypt',
    'msw',
    'prisma',
    'sharp',
    'unrs-resolver',
  ];

  const toApprove = candidates.map((name) => {
    const v = (pkg.dependencies && pkg.dependencies[name]) || (pkg.devDependencies && pkg.devDependencies[name]);
    return v ? `${name}@${v.replace(/^\^|~/, '')}` : name;
  });

  try {
    run(`pnpm approve-builds ${toApprove.join(' ')}`);
  } catch (err) {
    console.warn('Approving specific packages failed; continuing to install anyway.');
  }
}

// Finally install
try {
  run('pnpm install --frozen-lockfile');
} catch (err) {
  // fallback without frozen lockfile
  run('pnpm install');
}

console.log('Install complete.');
