import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ComboFood {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  combo_price: number | null;
  discount_type: string;
  discount_value: number;
  is_vegetarian: boolean;
  is_available: boolean;
  is_active: boolean;
  service_types: string[];
  division_ids: string[];
  cook_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: ComboFoodItem[];
  cook?: { id: string; kitchen_name: string } | null;
}

export interface ComboFoodItem {
  id: string;
  combo_id: string;
  food_item_id: string;
  quantity: number;
  food_item?: {
    id: string;
    name: string;
    price: number;
    is_vegetarian: boolean;
    category?: { name: string } | null;
  };
}

export interface ComboFormData {
  name: string;
  description?: string;
  image_url?: string;
  combo_price?: number | null;
  discount_type: string;
  discount_value: number;
  is_vegetarian: boolean;
  is_available: boolean;
  service_types: string[];
  division_ids: string[];
  items: { food_item_id: string; quantity: number }[];
}

export function useComboFoods() {
  return useQuery({
    queryKey: ['combo-foods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('combo_foods')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch items for each combo
      const combos = data || [];
      if (combos.length === 0) return [] as ComboFood[];

      const comboIds = combos.map(c => c.id);
      const { data: items, error: itemsError } = await supabase
        .from('combo_food_items')
        .select('*, food_item:food_items(id, name, price, is_vegetarian, category:food_categories(name))')
        .in('combo_id', comboIds);

      if (itemsError) throw itemsError;

      return combos.map(combo => ({
        ...combo,
        items: (items || []).filter(i => i.combo_id === combo.id) as ComboFoodItem[],
      })) as ComboFood[];
    },
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ComboFormData & { created_by?: string }) => {
      const { items, ...comboData } = data;

      const { data: combo, error } = await supabase
        .from('combo_foods')
        .insert({
          name: comboData.name,
          description: comboData.description || null,
          image_url: comboData.image_url || null,
          combo_price: comboData.combo_price ?? null,
          discount_type: comboData.discount_type,
          discount_value: comboData.discount_value,
          is_vegetarian: comboData.is_vegetarian,
          is_available: comboData.is_available,
          service_types: comboData.service_types,
          division_ids: comboData.division_ids,
          created_by: comboData.created_by || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('combo_food_items')
          .insert(items.map(i => ({
            combo_id: combo.id,
            food_item_id: i.food_item_id,
            quantity: i.quantity,
          })) as any);
        if (itemsError) throw itemsError;
      }

      return combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combo-foods'] });
      toast({ title: 'Combo created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create combo', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ComboFormData }) => {
      const { items, ...comboData } = data;

      const { error } = await supabase
        .from('combo_foods')
        .update({
          name: comboData.name,
          description: comboData.description || null,
          image_url: comboData.image_url || null,
          combo_price: comboData.combo_price ?? null,
          discount_type: comboData.discount_type,
          discount_value: comboData.discount_value,
          is_vegetarian: comboData.is_vegetarian,
          is_available: comboData.is_available,
          service_types: comboData.service_types,
          division_ids: comboData.division_ids,
        } as any)
        .eq('id', id);

      if (error) throw error;

      // Replace items
      await supabase.from('combo_food_items').delete().eq('combo_id', id);
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('combo_food_items')
          .insert(items.map(i => ({
            combo_id: id,
            food_item_id: i.food_item_id,
            quantity: i.quantity,
          })) as any);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combo-foods'] });
      toast({ title: 'Combo updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update combo', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('combo_foods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combo-foods'] });
      toast({ title: 'Combo deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete combo', description: error.message, variant: 'destructive' });
    },
  });
}

export function useToggleComboAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from('combo_foods')
        .update({ is_available } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combo-foods'] });
      toast({ title: 'Combo availability updated' });
    },
  });
}

// Cook combo requests
export interface CookComboRequest {
  id: string;
  cook_id: string;
  combo_name: string;
  combo_description: string | null;
  combo_price: number | null;
  discount_type: string;
  discount_value: number;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_combo_id: string | null;
  created_at: string;
  updated_at: string;
  items?: { id: string; food_item_id: string; quantity: number; food_item?: { id: string; name: string; price: number } }[];
  cook?: { id: string; kitchen_name: string; mobile_number: string };
}

export function useCookComboRequests() {
  return useQuery({
    queryKey: ['cook-combo-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cook_combo_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const requests = data || [];
      if (requests.length === 0) return [] as CookComboRequest[];

      // Fetch items and cook info
      const requestIds = requests.map(r => r.id);
      const cookIds = [...new Set(requests.map(r => r.cook_id))];

      const [itemsRes, cooksRes] = await Promise.all([
        supabase
          .from('cook_combo_request_items')
          .select('*, food_item:food_items(id, name, price)')
          .in('request_id', requestIds),
        supabase
          .from('cooks')
          .select('id, kitchen_name, mobile_number')
          .in('id', cookIds),
      ]);

      return requests.map(r => ({
        ...r,
        items: (itemsRes.data || []).filter(i => i.request_id === r.id),
        cook: (cooksRes.data || []).find(c => c.id === r.cook_id),
      })) as CookComboRequest[];
    },
  });
}

export function useMyCookComboRequests(cookId: string | null) {
  return useQuery({
    queryKey: ['my-cook-combo-requests', cookId],
    enabled: !!cookId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cook_combo_requests')
        .select('*')
        .eq('cook_id', cookId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const requests = data || [];
      if (requests.length === 0) return [] as CookComboRequest[];

      const requestIds = requests.map(r => r.id);
      const { data: items } = await supabase
        .from('cook_combo_request_items')
        .select('*, food_item:food_items(id, name, price)')
        .in('request_id', requestIds);

      return requests.map(r => ({
        ...r,
        items: (items || []).filter(i => i.request_id === r.id),
      })) as CookComboRequest[];
    },
  });
}

export function useCreateCookComboRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cook_id: string;
      combo_name: string;
      combo_description?: string;
      combo_price?: number;
      discount_type: string;
      discount_value: number;
      items: { food_item_id: string; quantity: number }[];
    }) => {
      const { items, ...requestData } = data;
      const { data: request, error } = await supabase
        .from('cook_combo_requests')
        .insert({
          cook_id: requestData.cook_id,
          combo_name: requestData.combo_name,
          combo_description: requestData.combo_description || null,
          combo_price: requestData.combo_price ?? null,
          discount_type: requestData.discount_type,
          discount_value: requestData.discount_value,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('cook_combo_request_items')
          .insert(items.map(i => ({
            request_id: request.id,
            food_item_id: i.food_item_id,
            quantity: i.quantity,
          })) as any);
        if (itemsError) throw itemsError;
      }
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cook-combo-requests'] });
      toast({ title: 'Combo request submitted for admin approval' });
    },
    onError: (error) => {
      toast({ title: 'Failed to submit combo request', description: error.message, variant: 'destructive' });
    },
  });
}

export function useApproveComboRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId, divisionIds, serviceTypes }: {
      requestId: string;
      userId: string;
      divisionIds: string[];
      serviceTypes: string[];
    }) => {
      // Fetch the request with items
      const { data: request, error: fetchError } = await supabase
        .from('cook_combo_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      if (fetchError) throw fetchError;

      const { data: reqItems } = await supabase
        .from('cook_combo_request_items')
        .select('*')
        .eq('request_id', requestId);

      // Create the combo
      const { data: combo, error: comboError } = await supabase
        .from('combo_foods')
        .insert({
          name: request.combo_name,
          description: request.combo_description,
          combo_price: request.combo_price,
          discount_type: request.discount_type,
          discount_value: request.discount_value,
          cook_id: request.cook_id,
          is_available: true,
          service_types: serviceTypes,
          division_ids: divisionIds,
          created_by: userId,
        } as any)
        .select()
        .single();
      if (comboError) throw comboError;

      // Add items
      if (reqItems && reqItems.length > 0) {
        await supabase.from('combo_food_items').insert(
          reqItems.map(i => ({
            combo_id: combo.id,
            food_item_id: i.food_item_id,
            quantity: i.quantity,
          })) as any
        );
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('cook_combo_requests')
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          created_combo_id: combo.id,
        } as any)
        .eq('id', requestId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cook-combo-requests'] });
      queryClient.invalidateQueries({ queryKey: ['combo-foods'] });
      toast({ title: 'Combo request approved and combo created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to approve', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRejectComboRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId, adminNotes }: {
      requestId: string;
      userId: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase
        .from('cook_combo_requests')
        .update({
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        } as any)
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cook-combo-requests'] });
      toast({ title: 'Combo request rejected' });
    },
    onError: (error) => {
      toast({ title: 'Failed to reject', description: error.message, variant: 'destructive' });
    },
  });
}
