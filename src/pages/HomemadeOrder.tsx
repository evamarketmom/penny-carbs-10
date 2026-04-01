import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import CustomerLoginDialog from '@/components/customer/CustomerLoginDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Clock, Search, Leaf, Filter, Lock } from 'lucide-react';
import CartButton from '@/components/customer/CartButton';
import BottomNav from '@/components/customer/BottomNav';
import { calculatePlatformMargin } from '@/lib/priceUtils';

interface HomemadeItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean;
  is_coming_soon_home_delivery: boolean;
  preparation_time_minutes: number | null;
  category_id: string | null;
  platform_margin_type: string | null;
  platform_margin_value: number | null;
  images: { id: string; image_url: string; is_primary: boolean }[];
  category: { id: string; name: string } | null;
}

const getCustomerPrice = (item: HomemadeItem): number => {
  const marginType = (item.platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = item.platform_margin_value || 0;
  const margin = calculatePlatformMargin(item.price, marginType, marginValue);
  return item.price + margin;
};

const HomemadeOrder: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { selectedPanchayat } = useLocation();
  const { requireAuth, showLoginDialog, setShowLoginDialog, onLoginSuccess } = useAuthCheck();

  const [items, setItems] = useState<HomemadeItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: cookDishes, error: cookDishesError } = await supabase
          .from('cook_dishes')
          .select(`food_item_id, cooks!inner(is_active, is_available, panchayat_id, assigned_panchayat_ids)`);

        if (cookDishesError) throw cookDishesError;

        const allocatedItemIds = [...new Set(
          (cookDishes || [])
            .filter((cd: any) => {
              if (!cd.cooks?.is_active || !cd.cooks?.is_available) return false;
              if (selectedPanchayat?.id) {
                const assignedPanchayats: string[] = cd.cooks.assigned_panchayat_ids || [];
                return assignedPanchayats.includes(selectedPanchayat.id) || cd.cooks.panchayat_id === selectedPanchayat.id;
              }
              return true;
            })
            .map((cd: any) => cd.food_item_id)
        )];

        if (allocatedItemIds.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        const { data: foodItems, error: itemsError } = await supabase
          .from('food_items')
          .select(`
            id, name, description, price, is_vegetarian, preparation_time_minutes,
            category_id, platform_margin_type, platform_margin_value, is_coming_soon_home_delivery,
            images:food_item_images(id, image_url, is_primary),
            category:food_categories(id, name)
          `)
          .or('service_types.cs.{homemade},service_type.eq.homemade')
          .eq('is_available', true)
          .in('id', allocatedItemIds)
          .order('name');

        if (itemsError) throw itemsError;

        setItems((foodItems || []) as unknown as HomemadeItem[]);

        const cats = new Map<string, string>();
        (foodItems || []).forEach((item: any) => {
          if (item.category?.id && item.category?.name) {
            cats.set(item.category.id, item.category.name);
          }
        });
        setCategories(Array.from(cats.entries()).map(([id, name]) => ({ id, name })));
      } catch (error) {
        console.error('Error fetching homemade items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, item: HomemadeItem) => {
    e.stopPropagation();
    if (item.is_coming_soon_home_delivery) return;
    requireAuth(() => addToCart(item.id));
  };

  const handleItemClick = (item: HomemadeItem) => {
    if (item.is_coming_soon_home_delivery) return;
    requireAuth(() => navigate(`/item/${item.id}`));
  };

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        default: return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold">🏠 Homemade Food</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low</SelectItem>
              <SelectItem value="price-high">Price: High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-4 text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => {
              const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
              const isComingSoon = item.is_coming_soon_home_delivery;

              return (
                <Card
                  key={item.id}
                  className={`overflow-hidden transition-all ${isComingSoon ? 'opacity-75 cursor-default' : 'cursor-pointer hover:shadow-lg'}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative h-28 w-full overflow-hidden bg-secondary">
                    {primaryImage ? (
                      <img src={primaryImage.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                    )}
                    {isComingSoon && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Badge className="bg-amber-500 text-white border-0">Coming Soon</Badge>
                      </div>
                    )}
                    {item.is_vegetarian && (
                      <span className="absolute right-2 top-2">
                        <Leaf className="h-4 w-4 text-green-600" />
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
                      <span className="font-semibold text-foreground">₹{getCustomerPrice(item).toFixed(0)}</span>
                      {isComingSoon ? (
                        <Button size="sm" variant="outline" className="h-7 rounded-full text-xs px-2 opacity-50" disabled>
                          <Lock className="h-3 w-3 mr-1" /> Soon
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
        )}
      </main>

      <CustomerLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={onLoginSuccess} />
      <CartButton />
      <BottomNav />
    </div>
  );
};

export default HomemadeOrder;
