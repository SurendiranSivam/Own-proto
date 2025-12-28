-- ============================================
-- MIGRATION: Add Users & Authentication
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- 1. CREATE TRIGGER FUNCTION (if not exists)
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- 2. USERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'executive',
    is_active BOOLEAN DEFAULT true,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all for now)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- 3. SEED DEFAULT USERS
-- Password for all: Admin@123
-- =====================

-- Delete existing users first to reset
DELETE FROM users WHERE email IN ('admin@ownproto.com', 'manager@ownproto.com', 'exec@ownproto.com');

-- Insert fresh users with correct hash
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@ownproto.com', '$2b$10$kd1d/hTnn5aXrLdnIbVgIecBpakaSnzTq91dnTIcehLWDJpCfqebO', 'Super Admin', 'super_admin'),
    ('manager@ownproto.com', '$2b$10$kd1d/hTnn5aXrLdnIbVgIecBpakaSnzTq91dnTIcehLWDJpCfqebO', 'Manager User', 'manager'),
    ('exec@ownproto.com', '$2b$10$kd1d/hTnn5aXrLdnIbVgIecBpakaSnzTq91dnTIcehLWDJpCfqebO', 'Executive User', 'executive');
