import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'
import { DATABASE_URL } from './env.js'

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in the environment.')
  process.exit(1)
}

/**
 * Validates migration files and ensures snapshots exist
 * @throws Error if validation fails
 */
function validateMigrations(migrationsFolder: string): void {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found at: ${migrationsFolder}`)
  }

  const files = fs.readdirSync(migrationsFolder)
  console.log(`✅ Migrations folder found at: ${migrationsFolder}`)
  console.log(`📁 Migrations found: ${files.length}`)
  for (const file of files) {
    console.log(`  - ${file}`)
  }

  // Check meta directory
  const metaDir = path.join(migrationsFolder, 'meta')
  if (!fs.existsSync(metaDir)) {
    throw new Error('Meta directory not found! This is critical for migrations.')
  }

  console.log('\n📁 Checking meta directory...')
  const metaFiles = fs.readdirSync(metaDir)
  console.log(`Found ${metaFiles.length} files in meta directory:`)
  for (const file of metaFiles) {
    console.log(`  - ${file}`)
  }

  // Get migration files (only .sql files)
  const migrationFiles = files.filter((f) => f.endsWith('.sql'))
  console.log(`\n📝 SQL Migration files: ${migrationFiles.length}`)

  // Get snapshot files (exclude _journal.json)
  const snapshotFiles = metaFiles.filter(
    (f) => f.includes('_snapshot.json') && f !== '_journal.json',
  )
  console.log(`📝 Snapshot files: ${snapshotFiles.length}`)

  // Check for missing snapshots
  if (migrationFiles.length > snapshotFiles.length) {
    // Determine which snapshots are missing
    const missingSnapshots = []
    for (const migFile of migrationFiles) {
      // Extract the migration number (e.g., "0001" from "0001_cooing_cassandra_nova.sql")
      const migrationNumber = migFile.split('_')[0]
      const expectedSnapshot = `${migrationNumber}_snapshot.json`

      if (!metaFiles.includes(expectedSnapshot)) {
        missingSnapshots.push({
          migration: migFile,
          expectedSnapshot,
        })
      }
    }

    if (missingSnapshots.length > 0) {
      console.error('\n❌ Missing snapshot files detected:')
      for (const missing of missingSnapshots) {
        console.error(
          `  - Migration "${missing.migration}" is missing snapshot "${missing.expectedSnapshot}"`,
        )
      }

      throw new Error('Migration snapshots are missing. Run "bun run generate" to fix.')
    }
  }
}

async function runMigrations() {
  // Create a MySQL connection with a single connection (ideal for migrations)
  const connection = await mysql.createConnection(DATABASE_URL)
  const db = drizzle(connection, { mode: 'default' })

  try {
    // Determine migrations folder path and validate
    const moduleDir = path.dirname(fileURLToPath(import.meta.url))
    const migrationsFolder = path.resolve(moduleDir, '../drizzle')
    validateMigrations(migrationsFolder)

    // Check current migration state in the database
    console.log('\n🔍 Checking current migration state in database...')
    const [result] = await connection
      .query(
        'SELECT * FROM `drizzle`.`__drizzle_migrations` ORDER BY `id` ASC;'
      )
      .catch((err: Error) => {
        console.log('Migration table not found or cannot be queried:', err.message)
        return [[]]
      })

    if (Array.isArray(result) && result.length > 0) {
      console.log(`Found ${result.length} applied migrations in the database:`)
      for (const row of result as Array<{ hash: string; created_at: string }>) {
        console.log(`  - ${row.hash} (applied at ${row.created_at})`)
      }
    } else {
      console.log('No migrations found in the database.')
    }

    // Run migrations
    console.log('\n🚀 Running migrations...')
    await migrate(db, { migrationsFolder })
    console.log('✅ Migrations complete!')
  } finally {
    // Ensure the connection is closed even if migration fails
    await connection.end()
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Migration failed!', err instanceof Error ? err.message : String(err))
    console.error('Run `bun run generate` to regenerate migration files correctly.')
    process.exit(1)
  })
