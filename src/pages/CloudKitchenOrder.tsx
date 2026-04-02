import React, { useState, useMemo } from 'react';
import { useServiceModuleGuard } from '@/hooks/useServiceModuleGuard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChefHat, ShoppingBag } from 'lucide-react';
import BottomNav from '@/components/customer/BottomNav';
import CustomerDivisionCard from '@/components/cloud-kitchen/CustomerDivisionCard';
import SetItemCard, { type GroupedFoodItem } from '@/components/cloud-kitchen/SetItemCard';
import {
  useCustomerDivisions,
  useCustomerDivisionItems,
  type ActiveDivision,
  type CustomerCloudKitchenItem,
} from '@/hooks/useCustomerCloudKitchen';
import { toast } from '@/hooks/use-toast';
import { calculatePlatformMargin } from '@/lib/priceUtils';

const getCustomerPrice = (item: CustomerCloudKitchenItem): number => {
  const marginType = (item.platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = item.platform_margin_value || 0;
  const margin = calculatePlatformMargin(item.price, marginType, marginValue);
  return item.price + margin;
};

interface CartItem {
  item: CustomerCloudKitchenItem;
  quantity: number;
}

const CloudKitchenOrder: React.FC = () => {
  useServiceModuleGuard('cloud_kitchen');
  const navigate = useNavigate();
  const [selectedDivision, setSelectedDivision] = useState<ActiveDivision | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const { data: divisions, isLoading: divisionsLoading } = useCustomerDivisions();
  const { data: items, isLoading: itemsLoading } = useCustomerDivisionItems(
    selectedDivision?.id || null
  );

  // Group items by food_item_id
  const groupedItems = useMemo<GroupedFoodItem[]>(() => {
    if (!items) return [];
    const map = new Map<string, GroupedFoodItem>();

    items.forEach((item) => {
      const existing = map.get(item.id);
      if (existing) {
        existing.cooks.push(item);
        if (item.is_orderable) existing.hasNoCook = false;
      } else {
        map.set(item.id, {
          id: item.id,
          name: item.name,
          description: item.description,
          is_vegetarian: item.is_vegetarian,
          is_coming_soon_cloud_kitchen: item.is_coming_soon_cloud_kitchen || false,
          set_size: item.set_size,
          min_order_sets: item.min_order_sets,
          images: item.images,
          cooks: [item],
          hasNoCook: !item.is_orderable,
        });
      }
    });

    // Sort: orderable first, then alphabetically
    return Array.from(map.values()).sort((a, b) => {
      if (a.hasNoCook !== b.hasNoCook) return a.hasNoCook ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  const handleQuantityChange = (item: CustomerCloudKitchenItem, quantity: number) => {
    const key = item.unique_key;
    if (quantity === 0) {
      const newCart = { ...cart };
      delete newCart[key];
      setCart(newCart);
    } else {
      setCart({ ...cart, [key]: { item, quantity } });
    }
  };

  const cartItems = Object.values(cart);
  const totalSets = cartItems.reduce((sum, c) => sum + c.quantity, 0);
  const totalAmount = cartItems.reduce((sum, c) => {
    const setSize = c.item.set_size || 1;
    return sum + c.quantity * getCustomerPrice(c.item) * setSize;
  }, 0);

  const handleProceed = () => {
    if (cartItems.length === 0) {
      toast({ title: 'Cart is empty', description: 'Please add items to your cart', variant: 'destructive' });
      return;
    }
    if (!selectedDivision) {
      toast({ title: 'Select a meal time', description: 'Please select a meal slot first', variant: 'destructive' });
      return;
    }
    if (!selectedDivision.is_ordering_open) {
      toast({ title: 'Slot Closed', description: 'This meal slot is no longer accepting orders', variant: 'destructive' });
      return;
    }
    navigate('/cloud-kitchen/checkout', {
      state: { cartItems, division: selectedDivision, totalAmount },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ChefHat className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Cloud Kitchen</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Division Selection */}
        <section>
          <h2 className="text-base font-semibold mb-3">Select Meal Time</h2>
          {divisionsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : divisions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No meal times available</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {divisions?.map((division) => (
                <CustomerDivisionCard
                  key={division.id}
                  division={division}
                  isSelected={selectedDivision?.id === division.id}
                  onSelect={() => setSelectedDivision(division)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Grouped Items List */}
        {selectedDivision && (
          <section>
            <h2 className="text-base font-semibold mb-3">{selectedDivision.name} Menu</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Select dishes and choose your preferred kitchen
            </p>
            {itemsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : groupedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items available for this meal time
              </div>
            ) : (
              <div className="space-y-3">
                {groupedItems.map((group) => (
                  <SetItemCard
                    key={group.id}
                    group={group}
                    cart={cart}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-card border-t shadow-lg">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">₹{totalAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  {totalSets} sets • {cartItems.length} items
                </p>
              </div>
              <Button onClick={handleProceed}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CloudKitchenOrder;
