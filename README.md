# Debt Tracker

A full-stack Debt Tracker web application built with Next.js (App Router), Supabase, and Tailwind CSS. Features authentication, partial payments, and PWA support.

## Features

### Authentication
- **Email/Password authentication** with Supabase Auth
- **Domain restriction**: Only emails ending with `@urios.edu.ph` can sign up
- Protected routes - unauthenticated users are redirected to login
- Secure session management with middleware

### Debtors (People)
- Add debtors with profile picture (uploaded to Supabase Storage)
- Store name, phone number, email, and notes
- View debtor list with search functionality
- View total combined debt per person (including partial payments)
- Edit and delete debtors
- User data isolation - each user only sees their own debtors

### Debts (Per Person)
- Add multiple debts under each debtor
- Track title, amount (₱ currency), due date, status, and notes
- **Partial Payments**: Record multiple payments per debt
- Auto-calculated debt status:
  - **Unpaid**: No payments recorded
  - **Partial**: Some payments made but not fully paid
  - **Paid**: Fully paid off
  - **Near Due**: Within 3 days of due date
  - **Overdue**: Past due date
- Payment history with date and notes
- Delete individual payments
- Sort debts by due date

### Dashboard
- Real-time statistics from database:
  - Total debt (sum of all original amounts)
  - Total paid (sum of all payments)
  - Total remaining (debt - paid)
  - Debtor count
  - Debt counts by status (paid, partial, unpaid, overdue)

### Reminders
- Send reminders via SMS (if phone exists) - opens SMS app with pre-filled message
- Send reminders via Gmail (if email exists) - opens Gmail compose
- Reminder message shows remaining balance (not original amount)

### PWA Support
- Installable as a Progressive Web App
- Works offline with service worker
- Mobile-responsive design
- App manifest for native-like experience

### Mobile Responsiveness
- Mobile-first design with Tailwind CSS
- Card-based layouts that adapt to screen size
- Touch-friendly buttons and interactions
- Responsive tables and forms

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with custom domain restrictions
- **Storage**: Supabase Storage (for avatars)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety with custom types

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Get your project URL and anon key from Settings > API

### 2. Set Up Database Schema

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor. This creates:
- `debtors` table with user_id for data isolation
- `debts` table with status tracking
- `payments` table for partial payments
- Row Level Security (RLS) policies for secure multi-tenant access
- Auto-update triggers for debt status based on payments

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Debtors table
CREATE TABLE debtors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debts table
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debtor_id UUID NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'near_due', 'overdue', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_debts_debtor_id ON debts(debtor_id);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debtors_name ON debtors(name);

-- Set up Row Level Security (RLS)
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on debtors" ON debtors
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on debts" ON debts
    FOR ALL USING (true) WITH CHECK (true);
```

### 3. Set Up Storage Bucket

1. In Supabase Dashboard, go to Storage
2. Click "New bucket"
3. Name it: `avatars`
4. Check "Public bucket"
5. Click "Create bucket"

6. Go to Policies tab and add these policies:

```sql
-- Policy for SELECT
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Policy for INSERT
CREATE POLICY "Anyone can upload an avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Policy for UPDATE
CREATE POLICY "Anyone can update their avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- Policy for DELETE
CREATE POLICY "Anyone can delete avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars');
```

### 4. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these from: Supabase Dashboard > Project Settings > API

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── debtors/
│   │   ├── [id]/
│   │   │   ├── edit/
│   │   │   │   └── page.tsx      # Edit debtor page
│   │   │   └── page.tsx          # Debtor detail page
│   │   ├── new/
│   │   │   └── page.tsx          # Add new debtor page
│   │   └── page.tsx              # Debtors list page
│   ├── DashboardClient.tsx       # Dashboard client component
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout with navigation
│   └── page.tsx                  # Dashboard page
├── lib/
│   └── supabase.ts               # Supabase client & types
└── ...
supabase/
└── schema.sql                    # Database schema
```

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./` (or your subdirectory)
   - Build Command: `next build`
   - Output Directory: `.next`

5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Click "Deploy"

### 3. Update Next.js Config (if needed)

If deploying to Vercel with Supabase Storage, update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
```

## Database Schema

### debtors
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Full name |
| avatar_url | text | Profile picture URL |
| phone | text | Phone number |
| email | text | Email address |
| notes | text | Additional notes |
| created_at | timestamp | Creation time |

### debts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| debtor_id | uuid | Foreign key to debtors |
| title | text | Debt description |
| amount | numeric | Amount in PHP |
| due_date | date | Due date |
| status | text | upcoming/near_due/overdue/paid |
| notes | text | Additional notes |
| created_at | timestamp | Creation time |

## Status Logic

The debt status is automatically calculated based on the due date:

- **Upcoming**: Due date is more than 3 days away
- **Near Due**: Due date is within 3 days
- **Overdue**: Due date has passed
- **Paid**: Manual status set by user (overrides other statuses)

## Reminder Feature

When you click "Remind" on a debt:

1. If the debtor has a phone number → Opens SMS app with pre-filled message
2. If no phone but has email → Opens Gmail compose with pre-filled message
3. If neither → Button is hidden

The reminder message format:
```
Hi [Name], this is a reminder about your '[debt title]' worth ₱[amount], due on [date]. Please settle soon. Thank you!
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- This app uses Row Level Security (RLS) policies that allow public access for simplicity
- For production with authentication, modify the RLS policies to check for authenticated users
- Profile pictures are stored in the public `avatars` bucket
- Currency is set to Philippine Peso (PHP/₱)

## License

MIT License - feel free to use this project for personal or commercial purposes.
#   d e b t - t r a c k e r  
 