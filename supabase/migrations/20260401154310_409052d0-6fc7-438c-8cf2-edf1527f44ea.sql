
ALTER TABLE public.cooks 
ADD COLUMN IF NOT EXISTS assigned_panchayat_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- Backfill: copy existing panchayat_id into the array
UPDATE public.cooks 
SET assigned_panchayat_ids = ARRAY[panchayat_id]
WHERE panchayat_id IS NOT NULL AND assigned_panchayat_ids = '{}'::uuid[];
