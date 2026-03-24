import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

const APP_NAME = 'InterSign Pro'

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(email: string): { secret: string; uri: string } {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  })

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  }
}

/**
 * Generate QR code data URL from TOTP URI
 */
export async function generateQRCodeDataURL(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/**
 * Verify a TOTP code
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  // Allow 1 period tolerance (30 seconds before/after)
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Array.from(
      { length: 8 },
      () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('')
    codes.push(code)
  }
  return codes
}

/**
 * Setup 2FA for a user (step 1: generate secret and QR code)
 */
export async function setup2FA(userId: string, email: string) {
  const supabase = await createClient()
  
  // Generate new secret
  const { secret, uri } = generateTOTPSecret(email)
  const qrCodeDataURL = await generateQRCodeDataURL(uri)
  
  // Check if user already has 2FA setup
  const { data: existing } = await supabase
    .from('user_two_factor')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Update existing record (not yet verified)
    await supabase
      .from('user_two_factor')
      .update({
        secret,
        is_enabled: false,
        verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    // Insert new record
    await supabase
      .from('user_two_factor')
      .insert({
        user_id: userId,
        secret,
        is_enabled: false,
      })
  }

  return {
    qrCodeDataURL,
    secret, // Show manual entry option
  }
}

/**
 * Enable 2FA after verifying the first code (step 2)
 */
export async function enable2FA(userId: string, code: string) {
  const supabase = await createClient()

  // Get the user's secret
  const { data: twoFactor, error } = await supabase
    .from('user_two_factor')
    .select('secret')
    .eq('user_id', userId)
    .single()

  if (error || !twoFactor) {
    return { success: false, error: 'Configuration 2FA non trouvee' }
  }

  // Verify the code
  if (!verifyTOTPCode(twoFactor.secret, code)) {
    return { success: false, error: 'Code invalide' }
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  // Enable 2FA
  await supabase
    .from('user_two_factor')
    .update({
      is_enabled: true,
      verified_at: new Date().toISOString(),
      backup_codes: backupCodes,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return { 
    success: true, 
    backupCodes,
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string, code: string) {
  const supabase = await createClient()

  // Get the user's secret
  const { data: twoFactor, error } = await supabase
    .from('user_two_factor')
    .select('secret, backup_codes')
    .eq('user_id', userId)
    .single()

  if (error || !twoFactor) {
    return { success: false, error: 'Configuration 2FA non trouvee' }
  }

  // Verify the code (or backup code)
  const isValidCode = verifyTOTPCode(twoFactor.secret, code)
  const isValidBackup = twoFactor.backup_codes?.includes(code.toUpperCase())

  if (!isValidCode && !isValidBackup) {
    return { success: false, error: 'Code invalide' }
  }

  // Delete 2FA config
  await supabase
    .from('user_two_factor')
    .delete()
    .eq('user_id', userId)

  return { success: true }
}

/**
 * Check if a user has 2FA enabled
 */
export async function check2FAStatus(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_two_factor')
    .select('is_enabled, verified_at')
    .eq('user_id', userId)
    .single()

  return {
    isEnabled: data?.is_enabled ?? false,
    verifiedAt: data?.verified_at ?? null,
  }
}

/**
 * Verify 2FA code during login
 */
export async function verify2FALogin(userId: string, code: string) {
  const supabase = await createClient()

  const { data: twoFactor, error } = await supabase
    .from('user_two_factor')
    .select('secret, backup_codes, is_enabled')
    .eq('user_id', userId)
    .single()

  if (error || !twoFactor || !twoFactor.is_enabled) {
    return { success: false, error: '2FA non configure' }
  }

  // Check TOTP code
  if (verifyTOTPCode(twoFactor.secret, code)) {
    return { success: true }
  }

  // Check backup code
  const upperCode = code.toUpperCase()
  if (twoFactor.backup_codes?.includes(upperCode)) {
    // Remove used backup code
    const newBackupCodes = twoFactor.backup_codes.filter((c: string) => c !== upperCode)
    await supabase
      .from('user_two_factor')
      .update({ backup_codes: newBackupCodes })
      .eq('user_id', userId)
    
    return { success: true, usedBackupCode: true }
  }

  return { success: false, error: 'Code invalide' }
}
