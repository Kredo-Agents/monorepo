import { defineConfig } from 'drizzle-kit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run drizzle commands')
}

const configDir = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(configDir, 'drizzle', 'schema.ts')
const outDir = path.join(configDir, 'drizzle')
const schema = path.relative(process.cwd(), schemaPath)
const out = path.relative(process.cwd(), outDir)

export default defineConfig({
  schema,
  out,
  dialect: 'mysql',
  dbCredentials: {
    url: connectionString,
  },
})
