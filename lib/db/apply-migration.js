import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  const migrationPath = path.join(__dirname, 'drizzle', '0000_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Applying migration...');
    // Split by statement-breakpoint and execute each statement
    const statements = sql.split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('✓ Applied:', statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));
      } catch (err) {
        if (err.code === '42P07' || err.message.includes('already exists')) {
          console.log('⚠ Skipped (already exists):', statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));
        } else {
          throw err;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
