-- ============================================
-- 3D PRINTING BUSINESS MANAGEMENT - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. VENDORS TABLE
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50),
    address TEXT,
    gst VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FILAMENTS TABLE (Inventory Items)
CREATE TABLE IF NOT EXISTS filaments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,           -- PLA, ABS, PETG, TPU, etc.
    brand VARCHAR(100),
    color VARCHAR(50),
    diameter VARCHAR(20) DEFAULT '1.75mm',
    weight_per_spool_kg DECIMAL(10,2),
    cost_per_kg DECIMAL(10,2),
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    min_stock_alert_kg DECIMAL(10,2) DEFAULT 1,
    current_stock_kg DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    order_description TEXT,
    print_type VARCHAR(50),              -- Prototype, Bulk, Custom, etc.
    filament_type VARCHAR(50),
    filament_color VARCHAR(100),
    estimated_quantity_units INTEGER,
    estimated_filament_usage_kg DECIMAL(10,3),
    order_date DATE DEFAULT CURRENT_DATE,
    eta_delivery DATE,
    total_amount DECIMAL(12,2),
    advance_percentage DECIMAL(5,2) DEFAULT 0,
    advance_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',  -- pending, partial, fully_paid
    status VARCHAR(50) DEFAULT 'pending',          -- pending, in_progress, delivered, cancelled
    final_delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(50),            -- advance, balance, refund
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROCUREMENT TABLE (Filament Purchases)
CREATE TABLE IF NOT EXISTS procurement (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    filament_id INTEGER REFERENCES filaments(id) ON DELETE SET NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2),
    order_date DATE DEFAULT CURRENT_DATE,
    eta_delivery DATE,
    invoice_number VARCHAR(100),
    total_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'pending',  -- pending, shipped, delivered, delayed
    final_delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRINT USAGE TABLE (Material Consumption)
CREATE TABLE IF NOT EXISTS print_usage (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    filament_id INTEGER REFERENCES filaments(id) ON DELETE SET NULL,
    quantity_used_kg DECIMAL(10,3) NOT NULL,
    print_date DATE DEFAULT CURRENT_DATE,
    cost_consumed DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_filaments_vendor ON filaments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_filaments_type ON filaments(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_procurement_vendor ON procurement(vendor_id);
CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement(status);
CREATE INDEX IF NOT EXISTS idx_print_usage_order ON print_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_print_usage_filament ON print_usage(filament_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to filaments and orders tables
DROP TRIGGER IF EXISTS filaments_updated_at ON filaments;
CREATE TRIGGER filaments_updated_at
    BEFORE UPDATE ON filaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enable for API access
-- ============================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for local dev)
DROP POLICY IF EXISTS "Allow all for vendors" ON vendors;
CREATE POLICY "Allow all for vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for filaments" ON filaments;
CREATE POLICY "Allow all for filaments" ON filaments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for orders" ON orders;
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for payments" ON payments;
CREATE POLICY "Allow all for payments" ON payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for procurement" ON procurement;
CREATE POLICY "Allow all for procurement" ON procurement FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for print_usage" ON print_usage;
CREATE POLICY "Allow all for print_usage" ON print_usage FOR ALL USING (true) WITH CHECK (true);
