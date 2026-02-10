import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { DATABASE_URL } from './env'
import * as schema from './schema.js'

const connectionLimit = process.env.NODE_ENV === 'production' ? 10 : 5
const queryClient = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit,
})
export const db = drizzle(queryClient, { schema, mode: 'default' })

// Export cleanup function for graceful shutdown
export const closeConnection = async () => {
  await queryClient.end()
}

export * from './schema.js'
