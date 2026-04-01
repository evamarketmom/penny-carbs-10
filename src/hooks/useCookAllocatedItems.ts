import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns a Set of food_item_ids that are allocated to at least one active & available cook.
 * If customerPanchayatId is provided, only includes items from cooks assigned to that panchayat.
 */
export function useCookAllocatedItemIds(customerPanchayatId?: string | null) {
  return useQuery({
    queryKey: ['cook-allocated-item-ids', customerPanchayatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cook_dishes')
        .select(`
          food_item_id,
          cooks!inner(is_active, is_available, panchayat_id, assigned_panchayat_ids)
        `);

      if (error) throw error;

      // Filter to only active+available cooks, optionally by panchayat
      const ids = new Set<string>();
      (data || []).forEach((cd: any) => {
        if (cd.cooks?.is_active && cd.cooks?.is_available) {
          if (customerPanchayatId) {
            const assignedPanchayats: string[] = cd.cooks.assigned_panchayat_ids || [];
            const cookPanchayat = cd.cooks.panchayat_id;
            if (assignedPanchayats.includes(customerPanchayatId) || cookPanchayat === customerPanchayatId) {
              ids.add(cd.food_item_id);
            }
          } else {
            ids.add(cd.food_item_id);
          }
        }
      });
      return ids;
    },
    staleTime: 60000,
  });
}
