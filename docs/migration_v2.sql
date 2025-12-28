-- ============================================
-- MIGRATION: Add new business columns
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- 1. VENDORS - New Columns
-- =====================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'advance';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================
-- 2. ORDERS - New Columns
-- =====================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================
-- 3. PAYMENTS - New Columns
-- =====================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(100);

-- =====================
-- 4. PROCUREMENT - New Columns
-- =====================
ALTER TABLE procurement ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE procurement ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE procurement ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- =====================
-- 5. FILAMENTS - New Columns
-- =====================
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS print_temp_min INTEGER;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS print_temp_max INTEGER;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS bed_temp INTEGER;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(20) DEFAULT 'standard';
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================
-- 6. PRINT USAGE - New Columns
-- =====================
ALTER TABLE print_usage ADD COLUMN IF NOT EXISTS print_duration_mins INTEGER;
ALTER TABLE print_usage ADD COLUMN IF NOT EXISTS print_status VARCHAR(20) DEFAULT 'success';
ALTER TABLE print_usage ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE print_usage ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================
-- NEW INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(state);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_filaments_is_active ON filaments(is_active);
CREATE INDEX IF NOT EXISTS idx_print_usage_status ON print_usage(print_status);
