import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import CustomerLoginDialog from '@/components/customer/CustomerLoginDialog';
import type { FoodItemWithImages, ServiceType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Clock, ChevronRight, Lock } from 'lucide-react';
import { calculatePlatformMargin } from '@/lib/priceUtils';
import { useCookAllocatedItemIds } from '@/hooks/useCookAllocatedItems';
import { useLowestCookPrices } from '@/hooks/useLowestCookPrices';

// Helper to calculate customer display price (base + margin), using lowest cook price for homemade
const getCustomerPrice = (item: FoodItemWithImages, lowestCookPrices?: Map<string, number | null>): number => {
  const marginType = ((item as any).platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = (item as any).platform_margin_value || 0;
  
  let basePrice = item.price;
  // For homemade items, use lowest cook price if available
  const serviceTypes = (item as any).service_types || [];
  const isHomemade = item.service_type === 'homemade' || serviceTypes.includes('homemade');
  if (isHomemade && lowestCookPrices) {
    const lowestPrice = lowestCookPrices.get(item.id);
    if (lowestPrice !== undefined && lowestPrice !== null) {
      basePrice = Math.min(basePrice, lowestPrice);
    }
  }
  
  const margin = calculatePlatformMargin(basePrice, marginType, marginValue);
  return basePrice + margin;
};

interface PopularItemsProps {
  serviceType: ServiceType;
  title: string;
  limit?: number;
  gradientClass?: string;
  bgGradient?: string;
}

const serviceTypeLabels: Record<ServiceType, string> = {
  indoor_events: 'Event Special',
  cloud_kitchen: "Chef's Choice",
  homemade: 'Home Fresh',
};

const PopularItems: React.FC<PopularItemsProps> = ({
  serviceType,
  title,
  limit = 6,
  gradientClass,
  bgGradient,
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { selectedPanchayat } = useLocation();
  const { requireAuth, showLoginDialog, setShowLoginDialog, onLoginSuccess } = useAuthCheck();
  const { data: allocatedIds, isLoading: allocatedIdsLoading } = useCookAllocatedItemIds(selectedPanchayat?.id);
  const { lowestCookPrices } = useLowestCookPrices();
  const [items, setItems] = useState<FoodItemWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For homemade, wait for allocatedIds to load before fetching
  const isHomemade = serviceType === 'homemade';
  const allocatedIdsReady = !isHomemade || !allocatedIdsLoading;

  useEffect(() => {
    if (!allocatedIdsReady) return;

    const fetchItems = async () => {
      try {
        let query = supabase
          .from('food_items')
          .select(`
            *,
            images:food_item_images(*)
          `)
          .eq('is_available', true)
          .or(`service_type.eq.${serviceType},service_types.cs.{${serviceType}}`);

        if (selectedPanchayat) {
          query = query.or(
            `available_all_panchayats.eq.true,available_panchayat_ids.cs.{${selectedPanchayat.id}}`
          );
        }

        const { data, error } = await query.limit(limit);

        if (error) throw error;
        // For homemade items, only show those allocated to an active cook
        let filtered = data as FoodItemWithImages[];
        if (isHomemade && allocatedIds) {
          filtered = filtered.filter(item => allocatedIds.has(item.id));
        }
        setItems(filtered);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [serviceType, limit, selectedPanchayat, allocatedIds, allocatedIdsReady, isHomemade]);

  const handleAddToCart = async (e: React.MouseEvent, item: FoodItemWithImages) => {
    e.stopPropagation();
    requireAuth(() => addToCart(item.id));
  };

  const handleItemClick = (itemId: string) => {
    requireAuth(() => navigate(`/item/${itemId}`));
  };

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="mb-4 flex items-center justify-between px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-40 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={`py-4 ${bgGradient || ''}`}>
      <div className="mb-4 flex items-center justify-between px-4">
        <h2 className={`font-display text-lg font-semibold ${gradientClass || 'text-foreground'}`}>
          {title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => navigate(`/menu/${serviceType}`)}
        >
          See More
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        {items.map((item) => {
          const primaryImage = item.images?.find((img) => img.is_primary) || item.images?.[0];
          const isIndoorEvents = serviceType === 'indoor_events';
          const isCloudKitchen = serviceType === 'cloud_kitchen';
          const isComingSoon = isCloudKitchen ? (item as any).is_coming_soon_cloud_kitchen === true : (item as any).is_coming_soon_home_delivery === true;

          return (
            <Card
              key={item.id}
              className={`w-40 flex-shrink-0 overflow-hidden transition-all ${isComingSoon ? 'opacity-75 cursor-default' : 'cursor-pointer hover:shadow-lg'}`}
              onClick={() => {
                if (isComingSoon) return;
                isIndoorEvents
                  ? requireAuth(() => navigate('/indoor-events'))
                  : isCloudKitchen
                    ? navigate('/cloud-kitchen')
                    : handleItemClick(item.id);
              }}
            >
              <div className="relative h-28 w-full overflow-hidden bg-secondary">
                {primaryImage ? (
                  <img
                    src={primaryImage.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                )}
                {isComingSoon ? (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-white">
                    Coming Soon
                  </span>
                ) : (
                  <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium">
                    {serviceTypeLabels[serviceType]}
                  </span>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight">{item.name}</h3>
                {item.preparation_time_minutes && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.preparation_time_minutes} min</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-foreground">₹{getCustomerPrice(item, lowestCookPrices).toFixed(0)}</span>
                  {isComingSoon ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full text-xs px-2 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Soon
                    </Button>
                  ) : isIndoorEvents ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full border-indoor-events text-indoor-events text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        requireAuth(() => navigate('/indoor-events'));
                      }}
                    >
                      Book
                    </Button>
                  ) : isCloudKitchen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full border-primary text-primary text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/cloud-kitchen');
                      }}
                    >
                      Order
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={(e) => handleAddToCart(e, item)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
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

export default PopularItems;
