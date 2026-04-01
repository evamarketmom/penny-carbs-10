// Types for Cook / Food Partner module

export interface Cook {
  id: string;
  user_id: string | null;
  kitchen_name: string;
  mobile_number: string;
  panchayat_id: string | null;
  assigned_panchayat_ids: string[];
  allowed_order_types: string[];
  is_active: boolean;
  is_available: boolean;
  rating: number;
  total_orders: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  panchayat?: {
    id: string;
    name: string;
  };
}

export type CookStatus = 'pending' | 'accepted' | 'preparing' | 'cooked' | 'ready' | 'rejected';

export interface CookOrderItem {
  id: string;
  food_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  food_item?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface CookOrder {
  id: string;
  order_number: string;
  service_type: string;
  total_amount: number;
  cook_status: CookStatus;
  event_date: string | null;
  event_details: string | null;
  delivery_address: string | null;
  guest_count: number | null;
  created_at: string;
  customer?: {
    name: string;
    mobile_number: string;
  };
  order_items?: CookOrderItem[];
}

export interface CookEarnings {
  total_orders_completed: number;
  total_earnings: number;
  pending_payout: number;
}
