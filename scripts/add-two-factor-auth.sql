-- Add Two-Factor Authentication support
-- Table to store 2FA settings per user

CREATE TABLE IF NOT EXISTS user_two_factor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Encrypted TOTP secret
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Encrypted backup codes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ, -- When the user first verified their 2FA
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE user_two_factor ENABLE ROW LEVEL SECURITY;

-- Users can only see their own 2FA settings
CREATE POLICY "Users can view own 2FA settings"
  ON user_two_factor FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own 2FA settings
CREATE POLICY "Users can insert own 2FA settings"
  ON user_two_factor FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own 2FA settings
CREATE POLICY "Users can update own 2FA settings"
  ON user_two_factor FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own 2FA settings
CREATE POLICY "Users can delete own 2FA settings"
  ON user_two_factor FOR DELETE
  USING (auth.uid() = user_id);

-- Table to track 2FA verification during login sessions
CREATE TABLE IF NOT EXISTS two_factor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for 2FA sessions
ALTER TABLE two_factor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own 2FA sessions"
  ON two_factor_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_token ON two_factor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_expires ON two_factor_sessions(expires_at);

-- Clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM two_factor_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
