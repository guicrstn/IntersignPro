import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export interface ApiUser {
  id: string
  email: string
}

// Hash an API key
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Generate a new API key
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'isp_'
  const randomPart = Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
      Math.floor(Math.random() * 62)
    )
  ).join('')
  
  const key = `${prefix}${randomPart}`
  const hash = hashApiKey(key)
  
  return { key, prefix, hash }
}

// Validate API key and return user
export async function validateApiKey(apiKey: string): Promise<ApiUser | null> {
  if (!apiKey || !apiKey.startsWith('isp_')) {
    return null
  }
  
  const keyHash = hashApiKey(apiKey)
  const supabase = await createClient()
  
  // Find the API key
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single()
  
  if (error || !apiKeyData) {
    return null
  }
  
  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
  
  // Get user info
  const { data: userData } = await supabase.auth.admin.getUserById(apiKeyData.user_id)
  
  if (!userData?.user) {
    // Fallback: get from companies table
    const { data: company } = await supabase
      .from('companies')
      .select('user_id')
      .eq('user_id', apiKeyData.user_id)
      .single()
    
    if (company) {
      return {
        id: apiKeyData.user_id,
        email: 'unknown',
      }
    }
    return null
  }
  
  return {
    id: userData.user.id,
    email: userData.user.email || 'unknown',
  }
}

// Middleware helper to get user from API key in request
export async function getApiUser(request: Request): Promise<ApiUser | null> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const apiKey = authHeader.substring(7)
  return validateApiKey(apiKey)
}
