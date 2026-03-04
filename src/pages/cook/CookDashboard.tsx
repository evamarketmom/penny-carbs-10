import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookProfile, useCookOrders, useUpdateCookStatus, useUpdateCookAvailability, useCookEarnings, useCookOrderHistory, useCookSettlements } from '@/hooks/useCook';
import { useCookNotifications } from '@/hooks/useCookNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  ChefHat, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  UtensilsCrossed,
  Package,
  Phone,
  MapPin,
  Users,
  Wallet,
  IndianRupee,
  TrendingUp,
  History,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import type { CookStatus } from '@/types/cook';
import DishRequestForm from '@/components/cook/DishRequestForm';
import CookAllocatedDishes from '@/components/cook/CookAllocatedDishes';
import ComboRequestForm from '@/components/cook/ComboRequestForm';
import NewCookOrderAlert from '@/components/cook/NewCookOrderAlert';
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner';

const statusConfig: Record<CookStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'New Order', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: <Flame className="h-4 w-4" /> },
  cooked: { label: 'Cooked', color: 'bg-purple-100 text-purple-800', icon: <UtensilsCrossed className="h-4 w-4" /> },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
};

const CookDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCookProfile();
  const { data: orders, isLoading: ordersLoading } = useCookOrders();
  const { data: earnings, isLoading: earningsLoading } = useCookEarnings();
  const { data: orderHistory, isLoading: historyLoading } = useCookOrderHistory();
  const { data: settlements, isLoading: settlementsLoading } = useCookSettlements();
  const updateStatus = useUpdateCookStatus();
  const updateAvailability = useUpdateCookAvailability();
  const { pendingOrders: notificationOrders, showAlert, dismissAlert, removeOrder, ORDER_ACCEPT_CUTOFF_SECONDS } = useCookNotifications();
  const [activeTab, setActiveTab] = useState('active');

  // Calculate dish summary from order history
  const dishSummary = useMemo(() => {
    if (!orderHistory) return [];
    const map = new Map<string, { name: string; totalQty: number; totalAmount: number }>();
    orderHistory.forEach(assignment => {
      assignment.order_items?.forEach(item => {
        const name = item.food_item?.name || 'Unknown';
        const existing = map.get(name);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalAmount += (item.food_item?.price || item.unit_price) * item.quantity;
        } else {
          map.set(name, { name, totalQty: item.quantity, totalAmount: (item.food_item?.price || item.unit_price) * item.quantity });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [orderHistory]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleStatusUpdate = async (orderId: string, newStatus: CookStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Order status changed to ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleAvailabilityChange = async (checked: boolean) => {
    try {
      await updateAvailability.mutateAsync(checked);
      toast({
        title: checked ? "You're Online" : "You're Offline",
        description: checked ? "You can now receive orders" : "You won't receive new orders",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const getNextStatus = (currentStatus: CookStatus): CookStatus | null => {
    const flow: Record<CookStatus, CookStatus | null> = {
      pending: 'accepted',
      accepted: 'preparing',
      preparing: 'cooked',
      cooked: 'ready',
      ready: null,
      rejected: null, // No next status for rejected orders
    };
    return flow[currentStatus];
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Not a Cook</h2>
          <p className="text-muted-foreground mb-4">
            You don't have cook privileges. Please contact admin.
          </p>
          <Button onClick={handleLogout}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-semibold">{profile.kitchen_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <NewCookOrderAlert
        open={showAlert}
        orders={notificationOrders}
        onAccept={(orderId) => {
          handleStatusUpdate(orderId, 'accepted');
          removeOrder(orderId);
        }}
        onReject={(orderId) => {
          handleStatusUpdate(orderId, 'rejected');
          removeOrder(orderId);
        }}
        onDismiss={dismissAlert}
        isUpdating={updateStatus.isPending}
        cutoffSeconds={ORDER_ACCEPT_CUTOFF_SECONDS}
      />

      <main className="container px-4 py-4 space-y-4">
        {/* Notification Permission Banner */}
        <NotificationPermissionBanner />

        {/* Availability Toggle */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Availability Status</p>
              <p className="text-sm text-muted-foreground">
                {profile.is_available ? "You're receiving orders" : "You're not receiving orders"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={profile.is_available ? "default" : "secondary"}>
                {profile.is_available ? "Online" : "Offline"}
              </Badge>
              <Switch
                checked={profile.is_available}
                onCheckedChange={handleAvailabilityChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wallet / Earnings Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet & Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earningsLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {earnings?.total_earnings?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-orange-600">
                    <IndianRupee className="h-4 w-4" />
                    {earnings?.pending_payout?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending Payout</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {earnings?.total_orders_completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{orders?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Active Orders</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{profile.total_orders}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="active" className="gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
            </TabsTrigger>
            <TabsTrigger value="dishes" className="gap-1">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Dishes</span>
            </TabsTrigger>
            <TabsTrigger value="combos" className="gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Combos</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-3 mt-4">
            {ordersLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)
            ) : orders && orders.length > 0 ? (
              orders.map((order) => {
                const status = statusConfig[order.cook_status as CookStatus] || statusConfig.pending;
                const nextStatus = getNextStatus(order.cook_status as CookStatus);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">#{order.order_number}</CardTitle>
                        <Badge className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Order Info */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UtensilsCrossed className="h-3 w-3" />
                          <span className="capitalize">{order.service_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        {order.guest_count && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{order.guest_count} guests</span>
                          </div>
                        )}
                      </div>

                      {/* Order Items - Dishes assigned to this cook */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="border rounded-lg p-3 bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            Your Dishes to Prepare
                          </p>
                          <div className="space-y-1.5">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="font-medium">{item.food_item?.name || 'Unknown Dish'}</span>
                                <span className="text-muted-foreground">
                                  Qty: {item.quantity} × ₹{item.food_item?.price || item.unit_price}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t flex justify-between text-sm font-medium">
                            <span>Your Items Total</span>
                            <span className="text-primary">
                              ₹{order.order_items.reduce((sum, item) => sum + (item.food_item?.price || item.unit_price) * item.quantity, 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Customer Info - Hidden for privacy */}
                      {/* Delivery Address - Hidden for privacy */}

                      {/* Amount */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold">Order Total: ₹{order.total_amount}</span>

                        {/* Action Buttons - Accept/Processing/Complete flow */}
                        <div className="flex gap-2">
                          {order.cook_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(order.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'accepted')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                            </>
                          )}
                          {order.cook_status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            >
                              <Flame className="h-4 w-4 mr-1" />
                              Start Processing
                            </Button>
                          )}
                          {order.cook_status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'cooked')}
                            >
                              <UtensilsCrossed className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {order.cook_status === 'cooked' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Cooked - Waiting for Pickup
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="p-6 text-center">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No active orders</p>
              </Card>
            )}
          </TabsContent>

          {/* My Dishes Tab */}
          <TabsContent value="dishes" className="space-y-4 mt-4">
            <CookAllocatedDishes />
            <DishRequestForm />
          </TabsContent>

          {/* Combos Tab */}
          <TabsContent value="combos" className="space-y-4 mt-4">
            {profile && <ComboRequestForm cookId={profile.id} />}
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Dish Summary */}
            {dishSummary.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Dish Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish Name</TableHead>
                        <TableHead className="text-right">Total Qty</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dishSummary.slice(0, 10).map((dish, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{dish.name}</TableCell>
                          <TableCell className="text-right">{dish.totalQty}</TableCell>
                          <TableCell className="text-right">₹{dish.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Order History List */}
            {historyLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : orderHistory && orderHistory.length > 0 ? (
              orderHistory.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">{assignment.order?.order_number}</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {assignment.customer?.name || 'Unknown'}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
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
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(assignment.assigned_at), 'dd MMM, HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{assignment.order?.total_amount?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground capitalize">{assignment.order?.service_type?.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Dishes prepared */}
                    {assignment.order_items && assignment.order_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dishes Prepared:</p>
                        <div className="space-y-1">
                          {assignment.order_items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span>{item.food_item?.name || 'Unknown'}</span>
                              <span className="text-muted-foreground">Qty: {item.quantity} × ₹{item.food_item?.price || item.unit_price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between text-sm font-medium">
                          <span>Your Earnings</span>
                          <span className="text-primary">
                            ₹{assignment.order_items.reduce((sum, item) => sum + (item.food_item?.price || item.unit_price) * item.quantity, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <History className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No order history yet</p>
              </Card>
            )}
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-4">
            {settlementsLoading ? (
              <Skeleton className="h-48" />
            ) : settlements && settlements.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Settlement History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settlements.map(settlement => (
                        <TableRow key={settlement.id}>
                          <TableCell>{format(new Date(settlement.created_at), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="font-medium">₹{Number(settlement.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={settlement.status === 'approved' || settlement.status === 'paid' ? 'default' : 'secondary'}>
                              {settlement.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <Wallet className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No settlements yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CookDashboard;
