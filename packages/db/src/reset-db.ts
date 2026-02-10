import { URL } from 'node:url'
import { sql } from 'drizzle-orm'
import { db } from '..'

// Ensure that DATABASE_URL is set.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL not found. Please set it in your environment.')
  process.exit(1)
}

// Verify that the database URL points to a local database.
const parsedUrl = new URL(databaseUrl)
const allowedHosts = ['localhost', '127.0.0.1']
if (!allowedHosts.includes(parsedUrl.hostname)) {
  console.error(
    `Refusing to reset the database on host "${parsedUrl.hostname}". This script is for local development only.`,
  )
  process.exit(1)
}

async function resetDatabase() {
  console.log('⏳ Resetting database...')
  const start = Date.now()

  const [rows] = await db.execute(
    sql`SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE()`
  )

  const tables = Array.isArray(rows)
    ? (rows as Array<{ tableName: string }>).map(row => row.tableName)
    : []

  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 0'))

  for (const table of tables) {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${table}\``))
  }

  // Clean up migration tracking schema if it exists.
  await db.execute(sql.raw('DROP DATABASE IF EXISTS `drizzle`'))
  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 1'))
  const end = Date.now()
  console.log(`✅ Reset completed in ${end - start}ms`)
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reset failed', err)
    process.exit(1)
  })
