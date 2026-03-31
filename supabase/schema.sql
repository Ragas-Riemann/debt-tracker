-- UPDATED Supabase SQL Schema for Debt Tracker with Auth, Partial Payments, and RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Debtors table (with user_id for ownership)
CREATE TABLE debtors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debts table (with user_id for ownership and updated status tracking)
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table for partial payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_debtors_user_id ON debtors(user_id);
CREATE INDEX idx_debtors_name ON debtors(name);

CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_debtor_id ON debts(debtor_id);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debts_status ON debts(status);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Debtors policies
CREATE POLICY "Users can only access their own debtors" ON debtors
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can only access their own debts" ON debts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can only access their own payments" ON payments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update debt status based on payments and due date
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    original_amount NUMERIC;
    due DATE;
    target_debt_id UUID;
BEGIN
    -- Determine which debt_id to use based on trigger type
    IF TG_OP = 'DELETE' THEN
        target_debt_id := OLD.debt_id;
    ELSE
        target_debt_id := NEW.debt_id;
    END IF;
    
    -- Get debt info
    SELECT d.total_amount, d.due_date INTO original_amount, due
    FROM debts d WHERE d.id = target_debt_id;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments WHERE debt_id = target_debt_id;
    
    -- Calculate days until due
    -- NOTE: status is derived from due_date vs CURRENT_DATE below.
    
    -- Update status and remaining amount based on payments and due date
    UPDATE debts
      SET
        remaining_amount = GREATEST(original_amount - total_paid, 0),
        status = CASE
          WHEN total_paid >= original_amount THEN 'paid'
          WHEN due IS NOT NULL AND due < CURRENT_DATE THEN 'overdue'
          WHEN total_paid > 0 THEN 'partial'
          ELSE 'pending'
        END,
        updated_at = NOW()
      WHERE id = target_debt_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update debt status after payment insert
CREATE TRIGGER after_payment_insert_update_status
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_debt_status();

-- Trigger to update debt status after payment deletion
CREATE TRIGGER after_payment_delete_update_status
    AFTER DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_debt_status();

-- Trigger to update debt status after payment updates
CREATE TRIGGER after_payment_update_update_status
    AFTER UPDATE OF amount, debt_id ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_debt_status();

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Create storage bucket for avatars (run in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS policies for avatars (users can only access their own folder)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
