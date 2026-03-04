import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  useComboFoods,
  useCreateCombo,
  useUpdateCombo,
  useDeleteCombo,
  useToggleComboAvailability,
  useCookComboRequests,
  useApproveComboRequest,
  useRejectComboRequest,
  type ComboFood,
  type ComboFormData,
  type CookComboRequest,
} from '@/hooks/useComboFoods';
import { useCloudKitchenDivisions } from '@/hooks/useCloudKitchenDivisions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Trash2, Leaf, Search, Package, UtensilsCrossed, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

const serviceTypes = [
  { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
  { value: 'homemade', label: 'Home Delivery' },
  { value: 'indoor_events', label: 'Indoor Events' },
];

const ComboFoodsTab: React.FC = () => {
  const { user } = useAuth();
  const { data: combos, isLoading } = useComboFoods();
  const { data: comboRequests, isLoading: requestsLoading } = useCookComboRequests();
  const { data: divisions } = useCloudKitchenDivisions();
  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const deleteCombo = useDeleteCombo();
  const toggleAvailability = useToggleComboAvailability();
  const approveRequest = useApproveComboRequest();
  const rejectRequest = useRejectComboRequest();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboFood | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ food_item_id: string; quantity: number; name: string; price: number }[]>([]);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CookComboRequest | null>(null);
  const [approveDivisionIds, setApproveDivisionIds] = useState<string[]>([]);
  const [approveServiceTypes, setApproveServiceTypes] = useState<string[]>(['cloud_kitchen']);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percent',
    discount_value: '0',
    combo_price: '',
    is_vegetarian: false,
    is_available: true,
    service_types: ['cloud_kitchen'] as string[],
    division_ids: [] as string[],
  });

  // Fetch all food items
  const { data: allFoodItems } = useQuery({
    queryKey: ['all-food-items-for-combo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, price, is_vegetarian, category:food_categories(name)')
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const filteredFoodItems = allFoodItems?.filter(item =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) &&
    !selectedItems.some(s => s.food_item_id === item.id)
  ) || [];

  const pendingRequests = comboRequests?.filter(r => r.status === 'pending') || [];

  const calculateTotalPrice = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (formData.discount_type === 'custom_price' && formData.combo_price) {
      return parseFloat(formData.combo_price);
    }
    if (formData.discount_type === 'percent') {
      return itemsTotal * (1 - parseFloat(formData.discount_value || '0') / 100);
    }
    if (formData.discount_type === 'flat') {
      return itemsTotal - parseFloat(formData.discount_value || '0');
    }
    return itemsTotal;
  };

  const handleOpenDialog = (combo?: ComboFood) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        name: combo.name,
        description: combo.description || '',
        discount_type: combo.discount_type,
        discount_value: combo.discount_value.toString(),
        combo_price: combo.combo_price?.toString() || '',
        is_vegetarian: combo.is_vegetarian,
        is_available: combo.is_available,
        service_types: combo.service_types,
        division_ids: combo.division_ids,
      });
      setSelectedItems(
        combo.items?.map(i => ({
          food_item_id: i.food_item_id,
          quantity: i.quantity,
          name: i.food_item?.name || '',
          price: i.food_item?.price || 0,
        })) || []
      );
    } else {
      setEditingCombo(null);
      setFormData({
        name: '',
        description: '',
        discount_type: 'percent',
        discount_value: '0',
        combo_price: '',
        is_vegetarian: false,
        is_available: true,
        service_types: ['cloud_kitchen'],
        division_ids: [],
      });
      setSelectedItems([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || selectedItems.length < 2) {
      toast({ title: 'Please enter a name and select at least 2 items', variant: 'destructive' });
      return;
    }

    const data: ComboFormData = {
      name: formData.name,
      description: formData.description || undefined,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value || '0'),
      combo_price: formData.discount_type === 'custom_price' && formData.combo_price
        ? parseFloat(formData.combo_price)
        : null,
      is_vegetarian: formData.is_vegetarian,
      is_available: formData.is_available,
      service_types: formData.service_types,
      division_ids: formData.division_ids,
      items: selectedItems.map(i => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
    };

    if (editingCombo) {
      await updateCombo.mutateAsync({ id: editingCombo.id, data });
    } else {
      await createCombo.mutateAsync({ ...data, created_by: user?.id });
    }
    setIsDialogOpen(false);
  };

  const addItem = (item: any) => {
    setSelectedItems(prev => [...prev, {
      food_item_id: item.id,
      quantity: 1,
      name: item.name,
      price: item.price,
    }]);
  };

  const removeItem = (foodItemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.food_item_id !== foodItemId));
  };

  const updateItemQuantity = (foodItemId: string, quantity: number) => {
    setSelectedItems(prev => prev.map(i =>
      i.food_item_id === foodItemId ? { ...i, quantity: Math.max(1, quantity) } : i
    ));
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || !user?.id) return;
    await approveRequest.mutateAsync({
      requestId: selectedRequest.id,
      userId: user.id,
      divisionIds: approveDivisionIds,
      serviceTypes: approveServiceTypes,
    });
    setApproveDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleRejectRequest = async (request: CookComboRequest) => {
    if (!user?.id) return;
    await rejectRequest.mutateAsync({ requestId: request.id, userId: user.id });
  };

  const itemsTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const comboTotal = calculateTotalPrice();
  const savings = itemsTotal - comboTotal;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="combos">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="combos" className="gap-1">
            <Package className="h-4 w-4" />
            Combos
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1 relative">
            <Clock className="h-4 w-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Combos Tab */}
        <TabsContent value="combos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search combos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Create Combo
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : combos?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No combos yet. Create your first combo!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {combos?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(combo => (
                <Card key={combo.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-primary" />
                          <h3 className="font-medium truncate">{combo.name}</h3>
                          {combo.is_vegetarian && <Leaf className="h-4 w-4 text-green-600" />}
                        </div>
                        {combo.description && (
                          <p className="text-xs text-muted-foreground mb-2">{combo.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-muted-foreground line-through">
                            ₹{combo.items?.reduce((s, i) => s + (i.food_item?.price || 0) * i.quantity, 0)}
                          </span>
                          <span className="font-semibold text-primary">
                            ₹{combo.combo_price || (
                              combo.discount_type === 'percent'
                                ? ((combo.items?.reduce((s, i) => s + (i.food_item?.price || 0) * i.quantity, 0) || 0) * (1 - combo.discount_value / 100)).toFixed(0)
                                : ((combo.items?.reduce((s, i) => s + (i.food_item?.price || 0) * i.quantity, 0) || 0) - combo.discount_value)
                            )}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {combo.discount_type === 'custom_price' ? 'Custom' :
                              combo.discount_type === 'percent' ? `${combo.discount_value}% off` : `₹${combo.discount_value} off`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 text-xs">
                          {combo.items?.map(item => (
                            <Badge key={item.id} variant="outline" className="text-xs">
                              {item.food_item?.name} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {combo.service_types.map(st => (
                            <Badge key={st} variant="secondary" className="text-xs">
                              {st.replace('_', ' ')}
                            </Badge>
                          ))}
                          {combo.division_ids.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {combo.division_ids.length} division(s)
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Switch
                          checked={combo.is_available}
                          onCheckedChange={(v) => toggleAvailability.mutate({ id: combo.id, is_available: v })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(combo)}>
                          <UtensilsCrossed className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Delete this combo?')) deleteCombo.mutate(combo.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : comboRequests?.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No combo requests from cooks</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {comboRequests?.map(request => (
                <Card key={request.id} className={request.status === 'pending' ? 'border-primary/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{request.combo_name}</h3>
                          <Badge variant={
                            request.status === 'pending' ? 'default' :
                              request.status === 'approved' ? 'secondary' : 'destructive'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          by {request.cook?.kitchen_name} • {request.cook?.mobile_number}
                        </p>
                        {request.combo_description && (
                          <p className="text-xs text-muted-foreground mb-2">{request.combo_description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm mb-2">
                          {request.combo_price && (
                            <span className="font-semibold">₹{request.combo_price}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {request.discount_type === 'custom_price' ? 'Custom price' :
                              request.discount_type === 'percent' ? `${request.discount_value}% off` : `₹${request.discount_value} off`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {request.items?.map(item => (
                            <Badge key={item.id} variant="outline" className="text-xs">
                              {item.food_item?.name} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setApproveDivisionIds([]);
                              setApproveServiceTypes(['cloud_kitchen']);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Combo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Edit Combo' : 'Create Combo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Combo Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Family Meal Combo"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Combo description..."
              />
            </div>

            {/* Select Food Items */}
            <div className="space-y-2">
              <Label>Food Items * (min 2)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items to add..."
                  className="pl-10"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                />
              </div>
              {itemSearchQuery && filteredFoodItems.length > 0 && (
                <ScrollArea className="h-[150px] border rounded-lg p-2">
                  {filteredFoodItems.slice(0, 20).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => { addItem(item); setItemSearchQuery(''); }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.name}</span>
                        {item.is_vegetarian && <Leaf className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className="text-xs text-muted-foreground">₹{item.price}</span>
                    </div>
                  ))}
                </ScrollArea>
              )}

              {/* Selected items */}
              {selectedItems.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.food_item_id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">₹{item.price}</span>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.food_item_id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.food_item_id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    Items Total: ₹{itemsTotal}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-3 rounded-lg border p-4">
              <Label>Pricing Method</Label>
              <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="percent">Percentage Discount</SelectItem>
                  <SelectItem value="flat">Flat Discount (₹)</SelectItem>
                  <SelectItem value="custom_price">Custom Fixed Price</SelectItem>
                </SelectContent>
              </Select>

              {formData.discount_type !== 'custom_price' ? (
                <div className="space-y-2">
                  <Label>{formData.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Combo Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.combo_price}
                    onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                  />
                </div>
              )}

              {selectedItems.length > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Items Total:</span>
                    <span>₹{itemsTotal}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Combo Price:</span>
                    <span>₹{comboTotal.toFixed(0)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Customer Saves:</span>
                      <span>₹{savings.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Types */}
            <div className="space-y-2">
              <Label>Available Services</Label>
              <div className="space-y-2">
                {serviceTypes.map(st => (
                  <div key={st.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.service_types.includes(st.value)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          service_types: checked
                            ? [...formData.service_types, st.value]
                            : formData.service_types.filter(s => s !== st.value),
                        });
                      }}
                    />
                    <Label className="font-normal cursor-pointer">{st.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Division Assignment */}
            {formData.service_types.includes('cloud_kitchen') && divisions && divisions.length > 0 && (
              <div className="space-y-2">
                <Label>Cloud Kitchen Divisions</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {divisions.map(div => (
                    <div key={div.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.division_ids.includes(div.id)}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            division_ids: checked
                              ? [...formData.division_ids, div.id]
                              : formData.division_ids.filter(id => id !== div.id),
                          });
                        }}
                      />
                      <Label className="font-normal cursor-pointer">
                        {div.name} ({div.start_time} - {div.end_time})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Vegetarian</Label>
              <Switch
                checked={formData.is_vegetarian}
                onCheckedChange={(v) => setFormData({ ...formData, is_vegetarian: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Available</Label>
              <Switch
                checked={formData.is_available}
                onCheckedChange={(v) => setFormData({ ...formData, is_available: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createCombo.isPending || updateCombo.isPending}
            >
              {editingCombo ? 'Save Changes' : 'Create Combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Combo: {selectedRequest?.combo_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Types</Label>
              {serviceTypes.map(st => (
                <div key={st.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={approveServiceTypes.includes(st.value)}
                    onCheckedChange={(checked) => {
                      setApproveServiceTypes(prev =>
                        checked ? [...prev, st.value] : prev.filter(s => s !== st.value)
                      );
                    }}
                  />
                  <Label className="font-normal cursor-pointer">{st.label}</Label>
                </div>
              ))}
            </div>
            {approveServiceTypes.includes('cloud_kitchen') && divisions && divisions.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Divisions</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {divisions.map(div => (
                    <div key={div.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={approveDivisionIds.includes(div.id)}
                        onCheckedChange={(checked) => {
                          setApproveDivisionIds(prev =>
                            checked ? [...prev, div.id] : prev.filter(id => id !== div.id)
                          );
                        }}
                      />
                      <Label className="font-normal cursor-pointer">{div.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveRequest} disabled={approveRequest.isPending}>
              Approve & Create Combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComboFoodsTab;
