import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails the build if anything that looks like a server-only secret reaches the
 * public bundle. Only the offending rule and file are printed — never a value.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'client', 'dist');

const forbiddenPatterns = [
  { label: 'MongoDB connection string', pattern: /mongodb(?:\+srv)?:\/\//i },
  { label: 'JWT_SECRET reference', pattern: /JWT_SECRET/ },
  { label: 'MONGODB_URI reference', pattern: /MONGODB_URI/ },
  { label: 'Cloudinary API secret reference', pattern: /CLOUDINARY_API_SECRET/ },
  { label: 'Cloudinary API key reference', pattern: /CLOUDINARY_API_KEY/ },
  { label: 'Bootstrap secret reference', pattern: /ADMIN_BOOTSTRAP_SECRET/ },
  { label: 'password hash reference', pattern: /passwordHash/ },
  { label: 'Cloudinary api_secret field', pattern: /api_secret/ },
  { label: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: 'secret-like VITE variable', pattern: /VITE_[A-Z0-9_]*(SECRET|PASSWORD|PRIVATE)/ },
];

const envValues = [
  process.env.MONGODB_URI,
  process.env.JWT_SECRET,
  process.env.CLOUDINARY_API_SECRET,
  process.env.CLOUDINARY_API_KEY,
  process.env.ADMIN_BOOTSTRAP_SECRET,
]
  .filter((value) => typeof value === 'string' && value.length >= 12)
  .map((value) => value);

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

const findings = [];

for await (const file of walk(distDir)) {
  if (/\.(png|jpe?g|webp|gif|ico|woff2?|ttf|otf)$/i.test(file)) continue;

  const contents = await readFile(file, 'utf8');

  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(contents)) {
      findings.push(`${path.relative(distDir, file)}: ${rule.label}`);
    }
  }

  if (envValues.some((value) => contents.includes(value))) {
    findings.push(`${path.relative(distDir, file)}: a server environment value`);
  }
}

if (findings.length > 0) {
  console.error('[security] Refusing to publish a bundle containing server-only data:');
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}

console.log('[security] Public bundle contains no server secrets.');
