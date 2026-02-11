import { config } from 'dotenv-vault'
import { requireEnv } from 'require-env-variable'

if (process.env.DOTENV_KEY) {
  console.log('Loading environment variables from dotenv vault...')
  config()
  console.log('Environment loaded from vault')
  console.log('DOTENV_ENVIRONMENT:', process.env.DOTENV_ENVIRONMENT)
}

export const { DATABASE_URL } = requireEnv('DATABASE_URL')
