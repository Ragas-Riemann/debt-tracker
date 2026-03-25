-- ============================================================
-- RESET DATABASE - COMPLETE SCHEMA RECREATION
-- Run this in your Supabase SQL Editor to reset everything
-- ============================================================

-- Step 1: Drop all existing tables (if they exist)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.debtors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for public access (no auth required)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEBTORS TABLE
-- ============================================================
CREATE TABLE public.debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::UUID,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for public access
ALTER TABLE public.debtors DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEBTS TABLE
-- ============================================================
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id UUID NOT NULL REFERENCES public.debtors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for public access
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for public access
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE SETUP FOR AVATARS
-- ============================================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public access to avatars bucket (drop first if exists)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR ALL TO public USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Optional - if you want auth later)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_debtors_user_id ON public.debtors(user_id);
CREATE INDEX idx_debts_debtor_id ON public.debts(debtor_id);
CREATE INDEX idx_payments_debt_id ON public.payments(debt_id);

-- ============================================================
-- DEFAULT DATA (Optional test data)
-- ============================================================
-- Uncomment if you want default test data
/*
INSERT INTO public.profiles (id, name, email, created_at, updated_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default User', 'user@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================
-- ENABLE REALTIME (Optional)
-- ============================================================
-- Add tables to publication for realtime updates
BEGIN;
  -- Drop the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a new publication
  CREATE PUBLICATION supabase_realtime;
  
  -- Add tables to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.debtors;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
COMMIT;
