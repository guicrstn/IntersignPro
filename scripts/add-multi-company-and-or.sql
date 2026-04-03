-- Add multi-company support and OR (Ordres de Reparation) module
-- Migration: add-multi-company-and-or.sql

-- 1. Add company_id to relevant tables for multi-company support
-- First, add company_id column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Add company_id to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Add company_id to product_catalog
ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Add company_id to interventions
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Add linked_document_id to interventions for linking to devis
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS linked_document_id uuid REFERENCES documents(id);

-- Add hide_prices option to documents for bon de livraison
ALTER TABLE documents ADD COLUMN IF NOT EXISTS hide_prices boolean DEFAULT false;

-- 2. Create user_companies table for multi-company per user
CREATE TABLE IF NOT EXISTS user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'owner', -- owner, admin, member
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_companies
CREATE POLICY "Users can view their companies" ON user_companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their companies" ON user_companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their companies" ON user_companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their companies" ON user_companies
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create OR (Ordres de Reparation) tables
CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  or_number text NOT NULL,
  title text,
  description text,
  status text DEFAULT 'draft', -- draft, in_progress, completed, cancelled, converted
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  converted_document_id uuid REFERENCES documents(id),
  notes text,
  internal_notes text
);

-- Enable RLS
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for repair_orders
CREATE POLICY "Users can view their repair orders" ON repair_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their repair orders" ON repair_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their repair orders" ON repair_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their repair orders" ON repair_orders
  FOR DELETE USING (auth.uid() = user_id);

-- Create OR tasks table
CREATE TABLE IF NOT EXISTS repair_order_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES repair_orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending', -- pending, in_progress, completed
  task_order integer DEFAULT 0,
  estimated_hours numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE repair_order_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their repair order tasks" ON repair_order_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their repair order tasks" ON repair_order_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their repair order tasks" ON repair_order_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their repair order tasks" ON repair_order_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create intervenants table (workers/technicians)
CREATE TABLE IF NOT EXISTS intervenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  email text,
  phone text,
  hourly_rate numeric(10,2),
  speciality text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE intervenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their intervenants" ON intervenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their intervenants" ON intervenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their intervenants" ON intervenants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their intervenants" ON intervenants
  FOR DELETE USING (auth.uid() = user_id);

-- Create task assignments table (link tasks to intervenants with time tracking)
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES repair_order_tasks(id) ON DELETE CASCADE NOT NULL,
  intervenant_id uuid REFERENCES intervenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_spent_minutes integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their task assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their task assignments" ON task_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their task assignments" ON task_assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their task assignments" ON task_assignments
  FOR DELETE USING (auth.uid() = user_id);

-- Create OR sequence for numbering
INSERT INTO document_sequences (user_id, document_type, prefix, current_number, year)
SELECT DISTINCT user_id, 'or', 'OR', 0, EXTRACT(YEAR FROM NOW())::integer
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM document_sequences ds 
  WHERE ds.user_id = companies.user_id AND ds.document_type = 'or'
)
ON CONFLICT DO NOTHING;
