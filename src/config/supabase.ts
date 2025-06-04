
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhdtarrgtlyxwqbexhcg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZHRhcnJndGx5eHdxYmV4aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MjU5MDksImV4cCI6MjA0OTAwMTkwOX0.xDEt3-aEgmx5UKo1F_qPXaLfUOyWJV8ZtCvCgxE2Vng'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Configuração para desenvolvimento com conexão direta
export const supabaseConfig = {
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.jhdtarrgtlyxwqbexhcg',
  password: '007Clone&007b'
}
