import { readFileSync } from 'node:fs';
import { lookup } from 'node:dns/promises';

const requiredRoot = [
  'VITE_API_URL',
  'VITE_AUTH_DISABLED',
  'VITE_USE_MOCK_AUTH',
];

const requiredBackend = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ENVIRONMENT',
  'ALLOWED_ORIGINS',
  'AUTH_DISABLED',
  'BACKEND_PORT',
];

function parseEnv(path) {
  const values = new Map();
  const content = readFileSync(path, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    values.set(key, valueParts.join('=').trim());
  }

  return values;
}

function assertRequired(values, keys, path) {
  const missing = keys.filter((key) => !values.has(key));
  const empty = keys.filter((key) => values.has(key) && !values.get(key));

  if (missing.length) {
    throw new Error(`${path} is missing: ${missing.join(', ')}`);
  }

  if (empty.length) {
    throw new Error(`${path} has empty values for: ${empty.join(', ')}`);
  }
}

function assertNoPlaceholders(values, path) {
  for (const [key, value] of values.entries()) {
    if (/[<[].+[>\]]/.test(value) || value.includes('YOUR_') || value.includes('CHANGE_ME')) {
      throw new Error(`${path} still contains a placeholder for ${key}`);
    }
  }
}

async function assertBackend(values) {
  const databaseUrl = values.get('DATABASE_URL') || '';
  const jwtSecret = values.get('JWT_SECRET') || '';
  let parsedDatabaseUrl;

  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error('backend_python/.env DATABASE_URL must start with postgresql://');
  }

  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('backend_python/.env DATABASE_URL is not a valid URL');
  }

  if (databaseUrl.includes('<supabase_project_ref>') || databaseUrl.includes('[PROJECT]')) {
    throw new Error('backend_python/.env DATABASE_URL still contains the Supabase project placeholder');
  }

  try {
    await lookup(parsedDatabaseUrl.hostname);
  } catch {
    throw new Error(`backend_python/.env DATABASE_URL host does not resolve: ${parsedDatabaseUrl.hostname}`);
  }

  if (jwtSecret.length < 32) {
    throw new Error('backend_python/.env JWT_SECRET must be at least 32 characters');
  }
}

try {
  const root = parseEnv('.env');
  const backend = parseEnv('backend_python/.env');

  assertRequired(root, requiredRoot, '.env');
  assertRequired(backend, requiredBackend, 'backend_python/.env');
  assertNoPlaceholders(root, '.env');
  assertNoPlaceholders(backend, 'backend_python/.env');
  await assertBackend(backend);

  console.log('Local env check passed.');
} catch (error) {
  console.error(`Local env check failed: ${error.message}`);
  process.exit(1);
}
