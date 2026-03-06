-- Migration 009: Device tokens for iOS push notifications (APNs)
-- Stores one token per user (upserted on every app launch).

CREATE TABLE IF NOT EXISTS device_tokens (
    user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    token      TEXT        NOT NULL,
    platform   TEXT        NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios', 'android', 'web')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the owning user can read/write their own token.
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device token"
    ON device_tokens
    FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role (used by API routes) can read all tokens to send push notifications.
CREATE POLICY "Service role reads all tokens"
    ON device_tokens
    FOR SELECT
    TO service_role
    USING (true);

-- Index for quick lookup by token value (dedup guard)
CREATE INDEX IF NOT EXISTS device_tokens_token_idx ON device_tokens (token);

COMMENT ON TABLE device_tokens IS
    'APNs device tokens for iOS push notifications. One row per user, upserted on app launch.';
