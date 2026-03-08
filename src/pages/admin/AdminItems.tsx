import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FoodItemWithImages, ServiceType, FoodCategory, Panchayat } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Leaf,
  Star,
  Percent,
  Building2,
  ChefHat,
  User,
  UtensilsCrossed,
  Package
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminNavbar from '@/components/admin/AdminNavbar';
import ImageUpload from '@/components/admin/ImageUpload';
import ComboFoodsTab from '@/components/admin/ComboFoodsTab';
import { calculatePlatformMargin } from '@/lib/priceUtils';
import ViewItemCooksDialog from '@/components/admin/ViewItemCooksDialog';

// Helper to calculate customer price
const getCustomerPrice = (item: FoodItemWithImages): number => {
  const marginType = ((item as any).platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = (item as any).platform_margin_value || 0;
  const margin = calculatePlatformMargin(item.price, marginType, marginValue);
  return item.price + margin;
};

// Helper to get margin amount
const getMarginAmount = (item: FoodItemWithImages): number => {
  const marginType = ((item as any).platform_margin_type || 'percent') as 'percent' | 'fixed';
  const marginValue = (item as any).platform_margin_value || 0;
  return calculatePlatformMargin(item.price, marginType, marginValue);
};

const serviceTypes: { value: ServiceType; label: string }[] = [
  { value: 'indoor_events', label: 'Indoor Events' },
  { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
  { value: 'homemade', label: 'Homemade Food' },
];

const AdminItems: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [items, setItems] = useState<FoodItemWithImages[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [activeMainTab, setActiveMainTab] = useState<'items' | 'combos'>('items');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemWithImages | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    service_type: 'cloud_kitchen' as ServiceType,
    service_types: [] as string[],
    category_id: '',
    is_vegetarian: false,
    is_available: false,
    preparation_time_minutes: '',
    available_all_panchayats: true,
    available_panchayat_ids: [] as string[],
    discount_percent: '',
    discount_amount: '',
    is_featured: false,
    serves_persons: '',
    platform_margin_type: 'percent' as 'percent' | 'fixed',
    platform_margin_value: '',
  });

  const isAdmin = role === 'super_admin' || role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes, panchayatsRes] = await Promise.all([
        supabase
          .from('food_items')
          .select(`
            *,
            images:food_item_images(*),
            category:food_categories(*)
          `)
          .order('name'),
        supabase
          .from('food_categories')
          .select('*')
          .order('name'),
        supabase
          .from('panchayats')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (itemsRes.data) setItems(itemsRes.data as FoodItemWithImages[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as FoodCategory[]);
      if (panchayatsRes.data) setPanchayats(panchayatsRes.data as Panchayat[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (item: FoodItemWithImages) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;

      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_available: !i.is_available } : i
      ));

      toast({
        title: item.is_available ? 'Item disabled' : 'Item enabled',
        description: `${item.name} is now ${item.is_available ? 'unavailable' : 'available'}`,
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (item?: FoodItemWithImages) => {
    if (item) {
      setEditingItem(item);
      const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
      setUploadedImageUrl(primaryImage?.image_url || null);
      // Get service_types from item or fallback to service_type
      const itemWithExtras = item as FoodItemWithImages & { 
        service_types?: string[]; 
        available_all_panchayats?: boolean;
        available_panchayat_ids?: string[];
        discount_percent?: number;
        discount_amount?: number;
        is_featured?: boolean;
        serves_persons?: number;
        platform_margin_type?: string;
        platform_margin_value?: number;
      };
      const serviceTypesArray = itemWithExtras.service_types?.length 
        ? itemWithExtras.service_types 
        : [item.service_type];
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        service_type: item.service_type,
        service_types: serviceTypesArray,
        category_id: item.category_id || '',
        is_vegetarian: item.is_vegetarian,
        is_available: item.is_available,
        preparation_time_minutes: item.preparation_time_minutes?.toString() || '',
        available_all_panchayats: itemWithExtras.available_all_panchayats ?? true,
        available_panchayat_ids: itemWithExtras.available_panchayat_ids || [],
        discount_percent: itemWithExtras.discount_percent?.toString() || '',
        discount_amount: itemWithExtras.discount_amount?.toString() || '',
        is_featured: itemWithExtras.is_featured ?? false,
        serves_persons: itemWithExtras.serves_persons?.toString() || '',
        platform_margin_type: (itemWithExtras.platform_margin_type as 'percent' | 'fixed') || 'percent',
        platform_margin_value: itemWithExtras.platform_margin_value?.toString() || '',
      });
    } else {
      setEditingItem(null);
      setUploadedImageUrl(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        service_type: 'cloud_kitchen',
        service_types: [],
        category_id: '',
        is_vegetarian: false,
        is_available: false,
        preparation_time_minutes: '',
        available_all_panchayats: true,
        available_panchayat_ids: [],
        discount_percent: '',
        discount_amount: '',
        is_featured: false,
        serves_persons: '',
        platform_margin_type: 'percent',
        platform_margin_value: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Name and price are required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.service_types.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one service type',
        variant: 'destructive',
      });
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        service_type: formData.service_types[0] as ServiceType, // Primary service type
        service_types: formData.service_types,
        category_id: formData.category_id || null,
        is_vegetarian: formData.is_vegetarian,
        is_available: formData.is_available,
        preparation_time_minutes: formData.preparation_time_minutes 
          ? parseInt(formData.preparation_time_minutes) 
          : null,
        available_all_panchayats: formData.available_all_panchayats,
        available_panchayat_ids: formData.available_all_panchayats ? [] : formData.available_panchayat_ids,
        discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : 0,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : 0,
        is_featured: formData.is_featured,
        serves_persons: formData.serves_persons ? parseInt(formData.serves_persons) : null,
        platform_margin_type: formData.platform_margin_type,
        platform_margin_value: formData.platform_margin_value ? parseFloat(formData.platform_margin_value) : 0,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('food_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        // Handle image update
        if (uploadedImageUrl) {
          // Delete existing images for this item
          await supabase
            .from('food_item_images')
            .delete()
            .eq('food_item_id', editingItem.id);

          // Add new image
          await supabase
            .from('food_item_images')
            .insert({
              food_item_id: editingItem.id,
              image_url: uploadedImageUrl,
              is_primary: true,
            });
        }

        toast({ title: 'Item updated successfully' });
      } else {
        const { data: newItem, error } = await supabase
          .from('food_items')
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;

        // Add image for new item
        if (uploadedImageUrl && newItem) {
          await supabase
            .from('food_item_images')
            .insert({
              food_item_id: newItem.id,
              image_url: uploadedImageUrl,
              is_primary: true,
            });
        }

        toast({ title: 'Item created successfully' });
      }

      setIsDialogOpen(false);
      setUploadedImageUrl(null);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (item: FoodItemWithImages) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== item.id));
      toast({ title: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterServiceType === 'all' || item.service_type === filterServiceType;
    return matchesSearch && matchesType;
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28">
      <AdminNavbar />

      {/* Page Header */}
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Food Items</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/categories')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
            {activeMainTab === 'items' && (
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Items/Combos */}
        <div className="mt-3 flex gap-2">
          <Button
            variant={activeMainTab === 'items' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMainTab('items')}
          >
            <UtensilsCrossed className="h-4 w-4 mr-1" />
            Items
          </Button>
          <Button
            variant={activeMainTab === 'combos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMainTab('combos')}
          >
            <Package className="h-4 w-4 mr-1" />
            Combos
          </Button>
        </div>

        {/* Filters - only for items tab */}
        {activeMainTab === 'items' && (
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterServiceType} onValueChange={setFilterServiceType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Types</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <main className="p-4">
        {activeMainTab === 'combos' ? (
          <ComboFoodsTab />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-6xl">🍽️</span>
            <h2 className="mt-4 text-lg font-semibold">No items found</h2>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
              
              return (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {primaryImage ? (
                        <img
                          src={primaryImage.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        {item.is_vegetarian && (
                          <Leaf className="h-4 w-4 text-success flex-shrink-0" />
                        )}
                        {(item as any).is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {/* Pricing breakdown */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <ChefHat className="h-3 w-3" />
                            ₹{item.price}
                          </span>
                          {getMarginAmount(item) > 0 && (
                            <>
                              <span className="text-muted-foreground">+</span>
                              <span className="flex items-center gap-0.5 text-primary">
                                <Building2 className="h-3 w-3" />
                                ₹{getMarginAmount(item).toFixed(0)}
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground">=</span>
                          <span className="flex items-center gap-0.5 font-semibold text-foreground">
                            <User className="h-3 w-3" />
                            ₹{getCustomerPrice(item).toFixed(0)}
                          </span>
                        </div>
                        {((item as any).discount_percent > 0 || (item as any).discount_amount > 0) && (
                          <Badge variant="destructive" className="text-xs">
                            <Percent className="h-3 w-3 mr-0.5" />
                            {(item as any).discount_percent > 0 
                              ? `${(item as any).discount_percent}% off` 
                              : `₹${(item as any).discount_amount} off`}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {((item as any).service_types?.length ? (item as any).service_types : [item.service_type]).map((st: string) => (
                          <Badge key={st} variant="outline" className="text-xs">
                            {st.replace('_', ' ')}
                          </Badge>
                        ))}
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        {(item as any).is_featured && (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ViewItemCooksDialog
                        foodItemId={item.id}
                        foodItemName={item.name}
                        trigger={
                          <Button variant="ghost" size="icon" title="View Cooks">
                            <ChefHat className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => handleToggleAvailability(item)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUpload
                bucket="food-items"
                folder="items"
                currentImageUrl={uploadedImageUrl}
                onUploadComplete={(url) => setUploadedImageUrl(url)}
                onRemove={() => setUploadedImageUrl(null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep_time">Prep Time (mins)</Label>
                <Input
                  id="prep_time"
                  type="number"
                  value={formData.preparation_time_minutes}
                  onChange={(e) => setFormData({ ...formData, preparation_time_minutes: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serves_persons">Serves (persons per unit)</Label>
              <p className="text-xs text-muted-foreground">How many persons can 1 unit serve? (e.g., 1 kg biryani serves 6 persons)</p>
              <Input
                id="serves_persons"
                type="number"
                min="1"
                value={formData.serves_persons}
                onChange={(e) => setFormData({ ...formData, serves_persons: e.target.value })}
                placeholder="e.g., 6"
              />
            </div>

            <div className="space-y-3">
              <Label>Service Types *</Label>
              <p className="text-xs text-muted-foreground">Select all modules where this item is available</p>
              <div className="space-y-2">
                {serviceTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${type.value}`}
                      checked={formData.service_types.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ 
                            ...formData, 
                            service_types: [...formData.service_types, type.value] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            service_types: formData.service_types.filter(t => t !== type.value) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`service-${type.value}`} className="font-normal cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories
                    .filter(c => 
                      formData.service_types.some(st => c.service_types?.includes(st)) || 
                      (c.service_types?.length === 0)
                    )
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Panchayat Availability */}
            <div className="space-y-3">
              <Label>Panchayat Availability</Label>
              <RadioGroup
                value={formData.available_all_panchayats ? 'all' : 'selected'}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  available_all_panchayats: v === 'all',
                  available_panchayat_ids: v === 'all' ? [] : formData.available_panchayat_ids
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="panchayat-all" />
                  <Label htmlFor="panchayat-all" className="font-normal cursor-pointer">
                    Available in all Panchayats
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="panchayat-selected" />
                  <Label htmlFor="panchayat-selected" className="font-normal cursor-pointer">
                    Available in selected Panchayats only
                  </Label>
                </div>
              </RadioGroup>

              {!formData.available_all_panchayats && (
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {panchayats.map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`panchayat-${p.id}`}
                        checked={formData.available_panchayat_ids.includes(p.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              available_panchayat_ids: [...formData.available_panchayat_ids, p.id] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              available_panchayat_ids: formData.available_panchayat_ids.filter(id => id !== p.id) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`panchayat-${p.id}`} className="font-normal text-sm cursor-pointer">
                        {p.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="rounded-lg border border-dashed p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Discount & Featured</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percent">Discount %</Label>
                  <Input
                    id="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount ₹</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-yellow-500/10 p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <Label htmlFor="featured" className="cursor-pointer">Featured Item</Label>
                    <p className="text-xs text-muted-foreground">Show in Special Offers</p>
                  </div>
                </div>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
              </div>
            </div>

            {/* Platform Margin Section */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Platform Margin</Label>
                  <p className="text-xs text-muted-foreground">Platform charge added to item price (not shown to cook)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Margin Type</Label>
                  <Select 
                    value={formData.platform_margin_type} 
                    onValueChange={(v) => setFormData({ ...formData, platform_margin_type: v as 'percent' | 'fixed' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_margin_value">
                    {formData.platform_margin_type === 'percent' ? 'Margin %' : 'Margin ₹'}
                  </Label>
                  <Input
                    id="platform_margin_value"
                    type="number"
                    min="0"
                    max={formData.platform_margin_type === 'percent' ? '100' : undefined}
                    value={formData.platform_margin_value}
                    onChange={(e) => setFormData({ ...formData, platform_margin_value: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.price && parseFloat(formData.platform_margin_value || '0') > 0 && (() => {
                const basePrice = parseFloat(formData.price);
                const marginVal = parseFloat(formData.platform_margin_value);
                const calculatedMargin = formData.platform_margin_type === 'percent' 
                  ? basePrice * marginVal / 100 
                  : marginVal;
                const calculatedCustomerPrice = basePrice + calculatedMargin;
                
                return (
                  <div className="rounded-md bg-muted p-3 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cook receives:</span>
                      <span className="font-medium">₹{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform margin:</span>
                      <span className="font-medium text-primary">
                        +₹{calculatedMargin.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-medium">Customer pays:</span>
                      <span className="font-bold text-success">
                        ₹{calculatedCustomerPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Manual Round Off */}
                    <div className="border-t border-border pt-2 space-y-2">
                      <Label className="text-xs text-muted-foreground">Round off customer price</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={basePrice}
                          placeholder={Math.round(calculatedCustomerPrice).toString()}
                          className="h-8 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const roundedPrice = parseFloat(e.target.value);
                            if (!isNaN(roundedPrice) && roundedPrice >= basePrice) {
                              const newMargin = roundedPrice - basePrice;
                              setFormData(prev => ({
                                ...prev,
                                platform_margin_type: 'fixed',
                                platform_margin_value: newMargin.toString(),
                              }));
                            }
                          }}
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          {[1, 5, 10].map((r) => {
                            const rounded = Math.ceil(calculatedCustomerPrice / r) * r;
                            if (rounded === calculatedCustomerPrice) return null;
                            return (
                              <Button
                                key={r}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-2"
                                onClick={() => {
                                  const newMargin = rounded - basePrice;
                                  setFormData(prev => ({
                                    ...prev,
                                    platform_margin_type: 'fixed',
                                    platform_margin_value: newMargin.toString(),
                                  }));
                                }}
                              >
                                ₹{rounded}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="vegetarian">Vegetarian</Label>
              <Switch
                id="vegetarian"
                checked={formData.is_vegetarian}
                onCheckedChange={(v) => setFormData({ ...formData, is_vegetarian: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available</Label>
              <Switch
                id="available"
                checked={formData.is_available}
                onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminItems;
