-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow inserts (trigger will handle this with SECURITY DEFINER)
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Extract name from metadata or use email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, user_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update debtors RLS policy to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own debtors" ON public.debtors;
CREATE POLICY "Users can view their own debtors" 
  ON public.debtors 
  FOR ALL 
  USING (user_id = auth.uid());

-- Update debts RLS policy (through debtors)
DROP POLICY IF EXISTS "Users can view debts of their debtors" ON public.debts;
CREATE POLICY "Users can view debts of their debtors" 
  ON public.debts 
  FOR ALL 
  USING (
    debtor_id IN (
      SELECT id FROM public.debtors WHERE user_id = auth.uid()
    )
  );

-- Update payments RLS policy (through debts -> debtors)
DROP POLICY IF EXISTS "Users can view payments of their debts" ON public.payments;
CREATE POLICY "Users can view payments of their debts" 
  ON public.payments 
  FOR ALL 
  USING (
    debt_id IN (
      SELECT d.id FROM public.debts d
      JOIN public.debtors dt ON d.debtor_id = dt.id
      WHERE dt.user_id = auth.uid()
    )
  );
