-- Create OR tables (safe - ignores if already exists)

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their repair orders" ON repair_orders;
DROP POLICY IF EXISTS "Users can insert their repair orders" ON repair_orders;
DROP POLICY IF EXISTS "Users can update their repair orders" ON repair_orders;
DROP POLICY IF EXISTS "Users can delete their repair orders" ON repair_orders;

DROP POLICY IF EXISTS "Users can view their repair order tasks" ON repair_order_tasks;
DROP POLICY IF EXISTS "Users can insert their repair order tasks" ON repair_order_tasks;
DROP POLICY IF EXISTS "Users can update their repair order tasks" ON repair_order_tasks;
DROP POLICY IF EXISTS "Users can delete their repair order tasks" ON repair_order_tasks;

DROP POLICY IF EXISTS "Users can view their intervenants" ON intervenants;
DROP POLICY IF EXISTS "Users can insert their intervenants" ON intervenants;
DROP POLICY IF EXISTS "Users can update their intervenants" ON intervenants;
DROP POLICY IF EXISTS "Users can delete their intervenants" ON intervenants;

DROP POLICY IF EXISTS "Users can view their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can insert their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can update their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can delete their task assignments" ON task_assignments;

-- Create repair_orders table
CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  or_number text NOT NULL,
  title text,
  description text,
  status text DEFAULT 'draft',
  priority text DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  converted_document_id uuid REFERENCES documents(id),
  notes text,
  internal_notes text
);

ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their repair orders" ON repair_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their repair orders" ON repair_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their repair orders" ON repair_orders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their repair orders" ON repair_orders
  FOR DELETE USING (auth.uid() = user_id);

-- Create repair_order_tasks table
CREATE TABLE IF NOT EXISTS repair_order_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id uuid REFERENCES repair_orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  task_order integer DEFAULT 0,
  estimated_hours numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE repair_order_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their repair order tasks" ON repair_order_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their repair order tasks" ON repair_order_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their repair order tasks" ON repair_order_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their repair order tasks" ON repair_order_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create intervenants table
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

ALTER TABLE intervenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their intervenants" ON intervenants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their intervenants" ON intervenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their intervenants" ON intervenants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their intervenants" ON intervenants
  FOR DELETE USING (auth.uid() = user_id);

-- Create task_assignments table
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

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their task assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their task assignments" ON task_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their task assignments" ON task_assignments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their task assignments" ON task_assignments
  FOR DELETE USING (auth.uid() = user_id);

-- Add hide_prices to documents if not exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS hide_prices boolean DEFAULT false;

-- Add linked_document_id to interventions if not exists  
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS linked_document_id uuid REFERENCES documents(id);
