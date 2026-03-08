import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import type { PendingCookOrder } from '@/hooks/useCookNotifications';

interface NewCookOrderAlertProps {
  open: boolean;
  orders: PendingCookOrder[];
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onDismiss: () => void;
  isUpdating: boolean;
  cutoffSeconds: number;
}

const NewCookOrderAlert: React.FC<NewCookOrderAlertProps> = ({
  open,
  orders,
  onAccept,
  onReject,
  onDismiss,
  isUpdating,
  cutoffSeconds,
}) => {
  if (orders.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-0 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 px-6 pt-6 pb-5">
          <DialogTitle className="flex items-center gap-3 text-lg text-white">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce shadow-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="block">🍳 New Order Assignment!</span>
              <span className="block text-xs font-normal text-white/80">You've got orders to cook</span>
            </div>
            <Badge className="ml-auto bg-white/25 text-white border-white/30 backdrop-blur-sm text-sm px-3 py-1">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {orders.map((order) => {
            const progressPercent = (order.seconds_remaining / cutoffSeconds) * 100;
            const isUrgent = order.seconds_remaining < 30;

            return (
              <Card
                key={order.id}
                className={`border-2 transition-all shadow-md ${
                  isUrgent
                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20'
                    : 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">#{order.order_number}</span>
                      <Badge className="capitalize text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
                        {order.service_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      ₹{order.total_amount}
                    </span>
                  </div>

                  {order.guest_count && (
                    <div className="flex items-center gap-1.5 text-sm p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-100 dark:border-indigo-900/30">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-indigo-800 dark:text-indigo-300 font-medium">👥 {order.guest_count} guests</span>
                    </div>
                  )}

                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="rounded-lg p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3" />
                        🍽️ Dishes to Prepare
                      </p>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="font-medium text-emerald-900 dark:text-emerald-200">{item.food_item?.name || 'Unknown'}</span>
                            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:text-emerald-300">
                              Qty: {item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Countdown */}
                  <div className="space-y-1.5 p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        ⏱ Time to respond
                      </span>
                      <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
                        {Math.floor(order.seconds_remaining / 60)}:{(order.seconds_remaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <Progress
                      value={progressPercent}
                      className={`h-2.5 rounded-full ${isUrgent ? '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500' : '[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500'}`}
                    />
                    {isUrgent && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        ⚡ Respond quickly before time runs out!
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => onReject(order.id)}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/25 border-0 font-semibold"
                      onClick={() => onAccept(order.id)}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      ✅ Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewCookOrderAlert;
