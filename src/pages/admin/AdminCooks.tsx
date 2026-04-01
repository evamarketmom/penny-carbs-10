import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, ChefHat, Phone, MapPin, Loader2, Calendar, Users, Search, User, CheckCircle, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Cook } from '@/types/cook';
import CookDishesTab from '@/components/admin/CookDishesTab';
import DishRequestsTab from '@/components/admin/DishRequestsTab';

interface StaffProfile {
  id: string;
  user_id: string;
  name: string;
  mobile_number: string;
  panchayat_id: string | null;
  ward_number: number | null;
  panchayat?: { name: string };
}

const cookSchema = z.object({
  kitchenName: z.string().min(2, 'Kitchen name is required'),
  mobileNumber: z.string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
  panchayatId: z.string().min(1, 'Please select a primary panchayat'),
  assignedPanchayatIds: z.array(z.string()).min(1, 'Select at least one panchayat'),
  allowedOrderTypes: z.array(z.string()).min(1, 'Select at least one order type'),
  userId: z.string().min(1, 'Please select a staff member first'),
});

type CookFormData = z.infer<typeof cookSchema>;

interface CookAssignment {
  id: string;
  order_id: string;
  cook_id: string;
  cook_status: string;
  assigned_at: string;
  order?: {
    order_number: string;
    status: string;
    total_amount: number;
    guest_count: number | null;
    event_date: string | null;
    service_type: string;
    customer_id: string;
  };
  customer?: {
    name: string;
    mobile_number: string;
  };
  cook?: Cook;
}

const orderTypes = [
  { value: 'indoor_events', label: 'Indoor Events' },
  { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
  { value: 'homemade', label: 'Homemade Food' },
];

const AdminCooks: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { panchayats } = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('cooks');
  
  // Staff search state
  const [searchMobile, setSearchMobile] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StaffProfile[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);

  const { data: cooks, isLoading: cooksLoading } = useQuery({
    queryKey: ['admin-cooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooks')
        .select(`
          *,
          panchayat:panchayats(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Cook[];
    },
  });

  // Fetch pending orders (assigned to cooks but not finished)
  const { data: pendingAssignments, isLoading: pendingLoading } = useQuery({
    queryKey: ['cook-pending-orders'],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from('order_assigned_cooks')
        .select(`
          id, order_id, cook_id, cook_status, assigned_at,
          order:orders(order_number, status, total_amount, guest_count, event_date, service_type, customer_id)
        `)
        .in('cook_status', ['pending', 'accepted', 'preparing', 'cooked'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Fetch cook details
      const cookIds = [...new Set(assignments?.map((a: any) => a.cook_id) || [])];
      const { data: cooksData } = await supabase
        .from('cooks')
        .select('id, kitchen_name, mobile_number')
        .in('id', cookIds);

      const cookMap = new Map(cooksData?.map((c: any) => [c.id, c]) || []);

      // Fetch customer profiles
      const customerIds = [...new Set(assignments?.map((a: any) => a.order?.customer_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, mobile_number')
        .in('user_id', customerIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return assignments?.map((a: any) => ({
        ...a,
        cook: cookMap.get(a.cook_id),
        customer: a.order?.customer_id ? profileMap.get(a.order.customer_id) : null,
      })) as CookAssignment[];
    },
  });

  // Fetch finished orders
  const { data: finishedAssignments, isLoading: finishedLoading } = useQuery({
    queryKey: ['cook-finished-orders'],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from('order_assigned_cooks')
        .select(`
          id, order_id, cook_id, cook_status, assigned_at,
          order:orders(order_number, status, total_amount, guest_count, event_date, service_type, customer_id)
        `)
        .eq('cook_status', 'ready')
        .order('assigned_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch cook details
      const cookIds = [...new Set(assignments?.map((a: any) => a.cook_id) || [])];
      const { data: cooksData } = await supabase
        .from('cooks')
        .select('id, kitchen_name, mobile_number')
        .in('id', cookIds);

      const cookMap = new Map(cooksData?.map((c: any) => [c.id, c]) || []);

      // Fetch customer profiles
      const customerIds = [...new Set(assignments?.map((a: any) => a.order?.customer_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, mobile_number')
        .in('user_id', customerIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return assignments?.map((a: any) => ({
        ...a,
        cook: cookMap.get(a.cook_id),
        customer: a.order?.customer_id ? profileMap.get(a.order.customer_id) : null,
      })) as CookAssignment[];
    },
  });

  const form = useForm<CookFormData>({
    resolver: zodResolver(cookSchema),
    defaultValues: {
      kitchenName: '',
      mobileNumber: '',
      panchayatId: '',
      assignedPanchayatIds: [],
      allowedOrderTypes: ['indoor_events', 'cloud_kitchen', 'homemade'],
      userId: '',
    },
  });

  // Search staff by mobile number
  const handleSearchStaff = useCallback(async () => {
    if (searchMobile.length < 3) {
      toast({
        title: "Enter at least 3 digits",
        description: "Please enter at least 3 digits to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, user_id, name, mobile_number, panchayat_id, ward_number,
          panchayat:panchayats(name)
        `)
        .ilike('mobile_number', `%${searchMobile}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data as StaffProfile[]);
      
      if (data.length === 0) {
        toast({
          title: "No results",
          description: "No staff found with this mobile number",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search for staff",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchMobile]);

  // Select a staff member and prefill form
  const handleSelectStaff = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    form.setValue('mobileNumber', staff.mobile_number);
    form.setValue('kitchenName', staff.name + "'s Kitchen");
    if (staff.panchayat_id) {
      form.setValue('panchayatId', staff.panchayat_id);
      form.setValue('assignedPanchayatIds', [staff.panchayat_id]);
    }
    form.setValue('userId', staff.user_id);
    setSearchResults([]);
  };

  // Clear selected staff
  const handleClearSelection = () => {
    setSelectedStaff(null);
    form.reset();
    setSearchMobile('');
  };

  // Reset dialog state when closing
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      handleClearSelection();
    }
  };

  const handleSubmit = async (data: CookFormData) => {
    setIsSubmitting(true);
    try {
      if (!data.userId) {
        throw new Error('Please select a staff member first');
      }

      // Check if cook with this mobile already exists
      const { data: existingCook } = await supabase
        .from('cooks')
        .select('id')
        .eq('mobile_number', data.mobileNumber)
        .maybeSingle();
      
      if (existingCook) {
        throw new Error('A cook with this mobile number already exists');
      }

      // Check if user is already a delivery staff
      const { data: existingDelivery } = await supabase
        .from('delivery_staff')
        .select('id')
        .eq('user_id', data.userId)
        .maybeSingle();
      
      if (existingDelivery) {
        throw new Error('This user is already registered as delivery staff. A user can only be cook OR delivery staff.');
      }

      // Create cook record linked to the existing user
      const { error: cookError } = await supabase
        .from('cooks')
        .insert({
          kitchen_name: data.kitchenName,
          mobile_number: data.mobileNumber,
          panchayat_id: data.panchayatId,
          assigned_panchayat_ids: data.assignedPanchayatIds,
          allowed_order_types: data.allowedOrderTypes,
          user_id: data.userId,
          created_by: user?.id,
        });

      if (cookError) throw cookError;

      // Add cook role to the user
      await supabase
        .from('user_roles')
        .upsert({
          user_id: data.userId,
          role: 'cook',
        }, { onConflict: 'user_id' });

      toast({
        title: "Cook Registered",
        description: `${data.kitchenName} has been registered. They can now login via Staff Login.`,
      });

      handleClearSelection();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-cooks'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register cook",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCookStatus = async (cookId: string, isActive: boolean) => {
    try {
      await supabase
        .from('cooks')
        .update({ is_active: !isActive })
        .eq('id', cookId);

      queryClient.invalidateQueries({ queryKey: ['admin-cooks'] });
      toast({
        title: "Status Updated",
        description: `Cook ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      accepted: 'bg-blue-500',
      preparing: 'bg-orange-500',
      cooked: 'bg-purple-500',
      ready: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const renderAssignmentCard = (assignment: CookAssignment) => (
    <Card key={assignment.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-medium">{assignment.order?.order_number}</span>
              <Badge variant="outline" className="text-xs capitalize">
                <span className={`mr-1.5 h-2 w-2 rounded-full ${getStatusColor(assignment.cook_status)}`} />
                {assignment.cook_status}
              </Badge>
            </div>
            <p className="text-sm font-medium">{assignment.cook?.kitchen_name}</p>
            <p className="text-xs text-muted-foreground">
              Customer: {assignment.customer?.name || 'Unknown'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              {assignment.order?.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(assignment.order.event_date), 'dd MMM yyyy')}
                </span>
              )}
              {assignment.order?.guest_count && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {assignment.order.guest_count} guests
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-primary">₹{assignment.order?.total_amount?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{assignment.order?.service_type?.replace('_', ' ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Cook Management</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Cook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Register New Cook
                </DialogTitle>
              </DialogHeader>

              {/* Staff Search Section */}
              <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
                <p className="text-sm font-medium">Search from Staff Database</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter mobile number..."
                      className="pl-10"
                      value={searchMobile}
                      onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleSearchStaff}
                    disabled={isSearching}
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => handleSelectStaff(staff)}
                        className="flex items-center gap-3 p-2 rounded-md border bg-card cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.mobile_number}</p>
                        </div>
                        {staff.panchayat && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {staff.panchayat.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Staff Indicator */}
                {selectedStaff && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {selectedStaff.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedStaff.mobile_number}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Only show form when a staff member is selected */}
              {selectedStaff ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                  <FormField
                    control={form.control}
                    name="kitchenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kitchen Name (Unique)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter kitchen name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="10-digit mobile" 
                              className="pl-10" 
                              disabled={!!selectedStaff}
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Note: No password field - cook uses their existing staff login credentials */}
                  {selectedStaff && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      📝 Cook will login via Staff Login using their existing credentials
                    </p>
                  )}

                  <FormField
                    control={form.control}
                    name="panchayatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Panchayat</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-add to assigned list if not present
                          const current = form.getValues('assignedPanchayatIds');
                          if (!current.includes(value)) {
                            form.setValue('assignedPanchayatIds', [...current, value]);
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary panchayat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover">
                            {panchayats.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedPanchayatIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Assigned Panchayats (Multi-select)</FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {panchayats.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`panchayat-${p.id}`}
                                checked={form.watch('assignedPanchayatIds').includes(p.id)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('assignedPanchayatIds');
                                  if (checked) {
                                    form.setValue('assignedPanchayatIds', [...current, p.id]);
                                  } else {
                                    form.setValue('assignedPanchayatIds', current.filter(id => id !== p.id));
                                  }
                                }}
                              />
                              <label htmlFor={`panchayat-${p.id}`} className="text-sm">
                                {p.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowedOrderTypes"
                    render={() => (
                      <FormItem>
                        <FormLabel>Allowed Order Types</FormLabel>
                        <div className="space-y-2">
                          {orderTypes.map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.value}
                                checked={form.watch('allowedOrderTypes').includes(type.value)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('allowedOrderTypes');
                                  if (checked) {
                                    form.setValue('allowedOrderTypes', [...current, type.value]);
                                  } else {
                                    form.setValue('allowedOrderTypes', current.filter(t => t !== type.value));
                                  }
                                }}
                              />
                              <label htmlFor={type.value} className="text-sm">
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Cook
                  </Button>
                </form>
              </Form>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Search and select a registered staff member above to add them as a cook</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 grid grid-cols-5">
            <TabsTrigger value="cooks">
              <ChefHat className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Cooks</span>
            </TabsTrigger>
            <TabsTrigger value="dishes">
              <UtensilsCrossed className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dishes</span>
            </TabsTrigger>
            <TabsTrigger value="requests">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
            </TabsTrigger>
            <TabsTrigger value="finished">
              Finished
            </TabsTrigger>
          </TabsList>

          {/* Cooks Tab */}
          <TabsContent value="cooks" className="space-y-4">
            {cooksLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : cooks && cooks.length > 0 ? (
              cooks.map((cook) => (
                <Card 
                  key={cook.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/cooks/${cook.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <ChefHat className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cook.kitchen_name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {cook.mobile_number}
                          </p>
                          {cook.panchayat && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cook.panchayat.name}
                              {cook.assigned_panchayat_ids?.length > 1 && (
                                <Badge variant="outline" className="text-xs ml-1">
                                  +{cook.assigned_panchayat_ids.length - 1} more
                                </Badge>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={cook.is_active ? "default" : "secondary"}>
                        {cook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {cook.allowed_order_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        ⭐ {cook.rating?.toFixed(1) || '0.0'} • {cook.total_orders || 0} orders
                      </p>
                      <Button
                        size="sm"
                        variant={cook.is_active ? "destructive" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCookStatus(cook.id, cook.is_active);
                        }}
                      >
                        {cook.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No cooks registered yet</p>
              </Card>
            )}
          </TabsContent>


          {/* Dishes Tab */}
          <TabsContent value="dishes">
            <CookDishesTab cooks={cooks} cooksLoading={cooksLoading} />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <DishRequestsTab />
          </TabsContent>

          {/* Pending Orders Tab */}
          <TabsContent value="pending" className="space-y-3">
            {pendingLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : pendingAssignments && pendingAssignments.length > 0 ? (
              pendingAssignments.map(renderAssignmentCard)
            ) : (
              <Card className="p-6 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No pending orders</p>
              </Card>
            )}
          </TabsContent>

          {/* Finished Orders Tab */}
          <TabsContent value="finished" className="space-y-3">
            {finishedLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : finishedAssignments && finishedAssignments.length > 0 ? (
              finishedAssignments.map(renderAssignmentCard)
            ) : (
              <Card className="p-6 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No finished orders yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminCooks;