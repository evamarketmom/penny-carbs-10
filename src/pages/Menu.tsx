import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLocation } from '@/contexts/LocationContext';
import CustomerLoginDialog from '@/components/customer/CustomerLoginDialog';
import type { FoodItemWithImages, ServiceType, FoodCategory } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Clock, Search, Leaf, Filter } from 'lucide-react';
import CartButton from '@/components/customer/CartButton';
import BottomNav from '@/components/customer/BottomNav';
import { calculatePlatformMargin } from '@/lib/priceUtils';
import { useCookAllocatedItemIds } from '@/hooks/useCookAllocatedItems';
import { useLowestCookPrices } from '@/hooks/useLowestCookPrices';

// Helper to calculate customer display price, using lowest cook price for homemade
const getCustomerPrice = (item: FoodItemWithImages, lowestCookPrices?: Map<string, number | null>): number => {
  const itemWithMargin = item as FoodItemWithImages & { platform_margin_type?: string; platform_margin_value?: number };
  const marginType = (itemWithMargin.platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = itemWithMargin.platform_margin_value || 0;
  
  let basePrice = item.price;
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

const serviceTypeLabels: Record<ServiceType, { title: string; emoji: string }> = {
  indoor_events: { title: 'Indoor Events', emoji: '🎉' },
  cloud_kitchen: { title: 'Cloud Kitchen', emoji: '👨‍🍳' },
  homemade: { title: 'Homemade Food', emoji: '🏠' },
};

const Menu: React.FC = () => {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { requireAuth, showLoginDialog, setShowLoginDialog, onLoginSuccess } = useAuthCheck();
  const { selectedPanchayat } = useLocation();
  const { data: allocatedIds } = useCookAllocatedItemIds(selectedPanchayat?.id);
  const { lowestCookPrices } = useLowestCookPrices();
  
  const [items, setItems] = useState<FoodItemWithImages[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const validServiceType = serviceType as ServiceType;
  const serviceInfo = serviceTypeLabels[validServiceType] || { title: 'Menu', emoji: '🍽️' };

  // For homemade, wait for allocatedIds to load before fetching
  const isHomemade = validServiceType === 'homemade';
  const allocatedIdsReady = !isHomemade || allocatedIds !== undefined;

  useEffect(() => {
    const fetchData = async () => {
      if (!validServiceType || !allocatedIdsReady) return;
      
      setIsLoading(true);
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          supabase
            .from('food_items')
            .select(`
              *,
              images:food_item_images(*),
              category:food_categories(*)
            `)
            .or(`service_type.eq.${validServiceType},service_types.cs.{${validServiceType}}`)
            .eq('is_available', true),
          supabase
            .from('food_categories')
            .select('*')
            .eq('is_active', true)
            .or(`service_types.cs.{${validServiceType}},service_types.eq.{}`)
            .order('display_order'),
        ]);

        if (itemsRes.data) {
          let filtered = itemsRes.data as FoodItemWithImages[];
          // For homemade, only show items allocated to an active cook
          if (isHomemade && allocatedIds) {
            filtered = filtered.filter(item => allocatedIds.has(item.id));
          }
          setItems(filtered);
        }
        if (categoriesRes.data) {
          setCategories(categoriesRes.data as FoodCategory[]);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [validServiceType, allocatedIds, allocatedIdsReady, isHomemade]);

  const handleAddToCart = async (e: React.MouseEvent, item: FoodItemWithImages) => {
    e.stopPropagation();
    requireAuth(() => addToCart(item.id));
  };

  const handleItemClick = (itemId: string) => {
    requireAuth(() => navigate(`/item/${itemId}`));
  };

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-lg font-semibold">
              {serviceInfo.emoji} {serviceInfo.title}
            </h1>
          </div>
        </div>
        
        {/* Search & Filters */}
        <div className="space-y-3 border-t px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search dishes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl">🍽️</span>
            <h2 className="mt-4 text-lg font-semibold">No items found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
              
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="relative h-40 w-full overflow-hidden bg-secondary">
                    {primaryImage ? (
                      <img
                        src={primaryImage.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🍽️
                      </div>
                    )}
                    {item.is_vegetarian && (
                      <Badge className="absolute left-2 top-2 gap-1 bg-success">
                        <Leaf className="h-3 w-3" />
                        Veg
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    {item.preparation_time_minutes && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{item.preparation_time_minutes} min</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold">₹{getCustomerPrice(item, lowestCookPrices).toFixed(0)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={(e) => handleAddToCart(e, item)}
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <CartButton />
      <BottomNav />
      
      <CustomerLoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={onLoginSuccess}
      />
    </div>
  );
};

export default Menu;
