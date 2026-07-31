import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateHash(password) {
  const salt = crypto.randomBytes(16);
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256'); // 32 bytes = 256 bits
  const saltHex = salt.toString('hex');
  const hashHex = hash.toString('hex');
  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const adminHash = generateHash(adminPassword);

const seedSqlPath = path.join(__dirname, 'seed.sql');
let seedSql = fs.readFileSync(seedSqlPath, 'utf8');

// Replace placeholder
seedSql = seedSql.replace('PLACEHOLDER_HASH_REPLACED_BY_SEED_SCRIPT', adminHash);

const tempSqlPath = path.join(__dirname, 'seed.temp.sql');
fs.writeFileSync(tempSqlPath, seedSql);

try {
  console.log('Running local seed...');
  execSync(`npx wrangler d1 execute carwash-db --remote --file=scripts/seed.temp.sql`, { stdio: 'inherit' });
  console.log('Seed completed successfully.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
} finally {
  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }
}
