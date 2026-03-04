
-- Combo Foods table
CREATE TABLE public.combo_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  combo_price NUMERIC,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent', 'flat', 'custom_price'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  service_types TEXT[] NOT NULL DEFAULT ARRAY['cloud_kitchen']::TEXT[],
  division_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  cook_id UUID REFERENCES public.cooks(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Combo Food Items (junction table)
CREATE TABLE public.combo_food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.combo_foods(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(combo_id, food_item_id)
);

-- Cook Combo Requests
CREATE TABLE public.cook_combo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cook_id UUID NOT NULL REFERENCES public.cooks(id) ON DELETE CASCADE,
  combo_name TEXT NOT NULL,
  combo_description TEXT,
  combo_price NUMERIC,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_combo_id UUID REFERENCES public.combo_foods(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cook Combo Request Items
CREATE TABLE public.cook_combo_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.cook_combo_requests(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, food_item_id)
);

-- Enable RLS
ALTER TABLE public.combo_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_combo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_combo_request_items ENABLE ROW LEVEL SECURITY;

-- RLS for combo_foods
CREATE POLICY "Anyone can view available combos" ON public.combo_foods
  FOR SELECT USING (is_available = true AND is_active = true);

CREATE POLICY "Admins can manage combos" ON public.combo_foods
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for combo_food_items
CREATE POLICY "Anyone can view combo items" ON public.combo_food_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage combo items" ON public.combo_food_items
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for cook_combo_requests
CREATE POLICY "Admins can manage combo requests" ON public.cook_combo_requests
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cooks can view their own combo requests" ON public.cook_combo_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM cooks c WHERE c.id = cook_combo_requests.cook_id AND c.user_id = auth.uid()));

CREATE POLICY "Cooks can create combo requests" ON public.cook_combo_requests
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM cooks c WHERE c.id = cook_combo_requests.cook_id AND c.user_id = auth.uid()));

-- RLS for cook_combo_request_items
CREATE POLICY "Anyone can view combo request items" ON public.cook_combo_request_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage combo request items" ON public.cook_combo_request_items
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cooks can insert their request items" ON public.cook_combo_request_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM cook_combo_requests ccr
    JOIN cooks c ON c.id = ccr.cook_id
    WHERE ccr.id = cook_combo_request_items.request_id AND c.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_combo_foods_updated_at BEFORE UPDATE ON public.combo_foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cook_combo_requests_updated_at BEFORE UPDATE ON public.cook_combo_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
