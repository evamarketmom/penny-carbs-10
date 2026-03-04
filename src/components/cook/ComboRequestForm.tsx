import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useMyCookComboRequests,
  useCreateCookComboRequest,
  type CookComboRequest,
} from '@/hooks/useComboFoods';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, Trash2, Search, Leaf, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ComboRequestFormProps {
  cookId: string;
}

const ComboRequestForm: React.FC<ComboRequestFormProps> = ({ cookId }) => {
  const { data: myRequests, isLoading } = useMyCookComboRequests(cookId);
  const createRequest = useCreateCookComboRequest();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ food_item_id: string; quantity: number; name: string; price: number }[]>([]);
  const [formData, setFormData] = useState({
    combo_name: '',
    combo_description: '',
    discount_type: 'percent',
    discount_value: '10',
    combo_price: '',
  });

  // Fetch cook's allocated dishes
  const { data: allocatedDishes } = useQuery({
    queryKey: ['cook-allocated-dishes-for-combo', cookId],
    enabled: !!cookId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cook_dishes')
        .select('food_item_id, food_item:food_items(id, name, price, is_vegetarian)')
        .eq('cook_id', cookId);
      if (error) throw error;
      return data?.map(d => d.food_item).filter(Boolean) || [];
    },
  });

  const filteredDishes = allocatedDishes?.filter((item: any) =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) &&
    !selectedItems.some(s => s.food_item_id === item.id)
  ) || [];

  const itemsTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const comboTotal = formData.discount_type === 'custom_price' && formData.combo_price
    ? parseFloat(formData.combo_price)
    : formData.discount_type === 'percent'
      ? itemsTotal * (1 - parseFloat(formData.discount_value || '0') / 100)
      : itemsTotal - parseFloat(formData.discount_value || '0');

  const handleSubmit = async () => {
    if (!formData.combo_name || selectedItems.length < 2) {
      toast({ title: 'Enter name and select at least 2 items', variant: 'destructive' });
      return;
    }
    await createRequest.mutateAsync({
      cook_id: cookId,
      combo_name: formData.combo_name,
      combo_description: formData.combo_description || undefined,
      combo_price: formData.discount_type === 'custom_price' && formData.combo_price
        ? parseFloat(formData.combo_price) : undefined,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value || '0'),
      items: selectedItems.map(i => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
    });
    setIsDialogOpen(false);
    setSelectedItems([]);
    setFormData({ combo_name: '', combo_description: '', discount_type: 'percent', discount_value: '10', combo_price: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          My Combo Requests
        </h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Combo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : myRequests?.length === 0 ? (
        <Card className="p-6 text-center">
          <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No combo requests yet. Create a combo from your allocated dishes!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {myRequests?.map(request => (
            <Card key={request.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{request.combo_name}</span>
                  <Badge variant={
                    request.status === 'pending' ? 'default' :
                      request.status === 'approved' ? 'secondary' : 'destructive'
                  } className="text-xs">
                    {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                    {request.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {request.items?.map(item => (
                    <Badge key={item.id} variant="outline" className="text-xs">
                      {item.food_item?.name} ×{item.quantity}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {request.discount_type === 'custom_price' ? `₹${request.combo_price}` :
                    request.discount_type === 'percent' ? `${request.discount_value}% off` : `₹${request.discount_value} off`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Combo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request New Combo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Combo Name *</Label>
              <Input
                value={formData.combo_name}
                onChange={(e) => setFormData({ ...formData, combo_name: e.target.value })}
                placeholder="e.g., Special Meal Deal"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.combo_description}
                onChange={(e) => setFormData({ ...formData, combo_description: e.target.value })}
                placeholder="Describe your combo..."
                rows={2}
              />
            </div>

            {/* Select from allocated dishes */}
            <div className="space-y-2">
              <Label>Select Items (from your dishes) *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your dishes..."
                  className="pl-10"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                />
              </div>
              {itemSearchQuery && filteredDishes.length > 0 && (
                <ScrollArea className="h-[120px] border rounded-lg p-2">
                  {filteredDishes.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedItems(prev => [...prev, {
                          food_item_id: item.id,
                          quantity: 1,
                          name: item.name,
                          price: item.price,
                        }]);
                        setItemSearchQuery('');
                      }}
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

              {selectedItems.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.food_item_id} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">₹{item.price}</span>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setSelectedItems(prev =>
                            prev.map(i => i.food_item_id === item.food_item_id
                              ? { ...i, quantity: Math.max(1, parseInt(e.target.value) || 1) } : i)
                          )}
                          className="w-14 h-7 text-center text-xs"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setSelectedItems(prev => prev.filter(i => i.food_item_id !== item.food_item_id))}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-3 rounded-lg border p-3">
              <Label className="text-xs">Pricing</Label>
              <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="percent">Percentage Discount</SelectItem>
                  <SelectItem value="flat">Flat Discount (₹)</SelectItem>
                  <SelectItem value="custom_price">Custom Price</SelectItem>
                </SelectContent>
              </Select>

              {formData.discount_type !== 'custom_price' ? (
                <Input
                  type="number"
                  min={0}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'}
                  className="h-8"
                />
              ) : (
                <Input
                  type="number"
                  min={0}
                  value={formData.combo_price}
                  onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                  placeholder="Combo price ₹"
                  className="h-8"
                />
              )}

              {selectedItems.length > 0 && (
                <div className="bg-muted rounded-md p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Items Total:</span><span>₹{itemsTotal}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Combo Price:</span><span>₹{comboTotal.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your combo request will be sent to admin for approval. Once approved, it will be assigned to divisions.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createRequest.isPending}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComboRequestForm;
