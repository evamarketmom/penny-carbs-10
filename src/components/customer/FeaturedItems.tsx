import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import CustomerLoginDialog from '@/components/customer/CustomerLoginDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Star, Percent } from 'lucide-react';
import { calculatePlatformMargin } from '@/lib/priceUtils';
import { useCookAllocatedItemIds } from '@/hooks/useCookAllocatedItems';
import { useLowestCookPrices } from '@/hooks/useLowestCookPrices';

interface FeaturedItem {
  id: string;
  name: string;
  price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  service_type: string;
  available_all_panchayats: boolean | null;
  available_panchayat_ids: string[] | null;
  platform_margin_type: string | null;
  platform_margin_value: number | null;
  images: { image_url: string; is_primary: boolean }[];
}

// Helper to calculate customer display price (base + margin), using lowest cook price for homemade
const getCustomerPrice = (item: FeaturedItem, lowestCookPrices?: Map<string, number | null>): number => {
  const marginType = (item.platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = item.platform_margin_value || 0;
  
  let basePrice = item.price;
  if (item.service_type === 'homemade' && lowestCookPrices) {
    const lowestPrice = lowestCookPrices.get(item.id);
    if (lowestPrice !== undefined && lowestPrice !== null) {
      basePrice = Math.min(basePrice, lowestPrice);
    }
  }
  
  const margin = calculatePlatformMargin(basePrice, marginType, marginValue);
  return basePrice + margin;
};

const FeaturedItems: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { selectedPanchayat } = useLocation();
  const { requireAuth, showLoginDialog, setShowLoginDialog, onLoginSuccess } = useAuthCheck();
  const { data: allocatedIds } = useCookAllocatedItemIds(selectedPanchayat?.id);
  const { lowestCookPrices } = useLowestCookPrices();

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ['featured-items', selectedPanchayat?.id],
    queryFn: async () => {
      let query = supabase
        .from('food_items')
        .select(`
          id,
          name,
          price,
          discount_percent,
          discount_amount,
          service_type,
          available_all_panchayats,
          available_panchayat_ids,
          platform_margin_type,
          platform_margin_value,
          images:food_item_images(image_url, is_primary)
        `)
        .eq('is_featured', true)
        .eq('is_available', true);

      // Filter by panchayat availability
      if (selectedPanchayat) {
        query = query.or(
          `available_all_panchayats.eq.true,available_panchayat_ids.cs.{${selectedPanchayat.id}}`
        );
      }

      const { data, error } = await query.limit(8);

      if (error) throw error;
      return data as FeaturedItem[];
    },
  });

  // Filter out homemade items not allocated to any active cook
  const items = (rawItems || []).filter(item => {
    if ((item.service_type === 'homemade') && allocatedIds) {
      return allocatedIds.has(item.id);
    }
    return true; // non-homemade items pass through
  });
  const handleAddToCart = async (e: React.MouseEvent, item: FeaturedItem) => {
    e.stopPropagation();
    if (item.service_type === 'indoor_events') {
      requireAuth(() => navigate('/indoor-events'));
    } else {
      requireAuth(() => addToCart(item.id));
    }
  };

  const handleItemClick = (item: FeaturedItem) => {
    if (item.service_type === 'indoor_events') {
      requireAuth(() => navigate('/indoor-events'));
    } else {
      requireAuth(() => navigate(`/item/${item.id}`));
    }
  };

  const getDiscountedPrice = (item: FeaturedItem) => {
    const customerPrice = getCustomerPrice(item, lowestCookPrices);
    if (item.discount_percent && item.discount_percent > 0) {
      return customerPrice - (customerPrice * item.discount_percent / 100);
    }
    if (item.discount_amount && item.discount_amount > 0) {
      return customerPrice - item.discount_amount;
    }
    return customerPrice;
  };

  const hasDiscount = (item: FeaturedItem) => {
    return (item.discount_percent && item.discount_percent > 0) || 
           (item.discount_amount && item.discount_amount > 0);
  };

  if (isLoading) {
    return (
      <section className="py-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/20 dark:to-orange-950/10">
        <div className="mb-4 flex items-center gap-2 px-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-40 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="py-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/20 dark:to-orange-950/10">
      <div className="mb-4 flex items-center gap-2 px-4">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Featured Items
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        {items.map((item) => {
          const primaryImage = item.images?.find((img) => img.is_primary) || item.images?.[0];
          const discountedPrice = getDiscountedPrice(item);
          const showDiscount = hasDiscount(item);

          return (
            <Card
              key={item.id}
              className="w-40 flex-shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg border-yellow-200 dark:border-yellow-900/50"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative h-28 w-full overflow-hidden bg-secondary">
                {primaryImage ? (
                  <img
                    src={primaryImage.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                {/* Featured badge */}
                <span className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-white flex items-center gap-1">
                  <Star className="h-3 w-3 fill-white" />
                  Featured
                </span>
                {/* Discount badge */}
                {showDiscount && (
                  <Badge
                    variant="destructive"
                    className="absolute right-2 top-2 text-xs"
                  >
                    <Percent className="h-3 w-3 mr-0.5" />
                    {item.discount_percent && item.discount_percent > 0
                      ? `${item.discount_percent}%`
                      : `₹${item.discount_amount}`}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                  {item.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {showDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{getCustomerPrice(item, lowestCookPrices).toFixed(0)}
                      </span>
                    )}
                    <span className="font-semibold text-foreground">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 rounded-full border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                    onClick={(e) => handleAddToCart(e, item)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CustomerLoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={onLoginSuccess}
      />
    </section>
  );
};

export default FeaturedItems;
