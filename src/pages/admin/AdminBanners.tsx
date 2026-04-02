import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, Image, Calendar as CalendarIcon, Settings, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AdminNavbar from '@/components/admin/AdminNavbar';
import ImageUpload from '@/components/admin/ImageUpload';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  service_type: 'indoor_events' | 'cloud_kitchen' | 'homemade' | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

const AdminBanners: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'super_admin' || role === 'admin';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    service_type: 'all' as string,
    is_active: true,
    display_order: 0,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title: data.title,
        image_url: data.image_url,
        link_url: data.link_url || null,
        service_type: data.service_type === 'all' ? null : data.service_type as 'indoor_events' | 'cloud_kitchen' | 'homemade',
        is_active: data.is_active,
        display_order: data.display_order,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
      };

      if (data.id) {
        const { error } = await supabase.from('banners').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editingBanner ? 'Banner updated' : 'Banner added');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to save banner: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete banner: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      service_type: 'all',
      is_active: true,
      display_order: (banners?.length || 0) + 1,
      start_date: undefined,
      end_date: undefined,
    });
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      service_type: banner.service_type || 'all',
      is_active: banner.is_active,
      display_order: banner.display_order,
      start_date: banner.start_date ? new Date(banner.start_date) : undefined,
      end_date: banner.end_date ? new Date(banner.end_date) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      toast.error('Title and Image URL are required');
      return;
    }
    saveMutation.mutate({ ...formData, id: editingBanner?.id });
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Settings className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <Button className="mt-6" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28">
      <AdminNavbar />

      {/* Page Header */}
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Banner Management</h2>
            <p className="text-sm text-muted-foreground">Manage homepage carousel banners</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="Banner title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banner Image *</Label>
                  <ImageUpload
                    bucket="banners"
                    currentImageUrl={formData.image_url || null}
                    onUploadComplete={(url) => setFormData(f => ({ ...f, image_url: url }))}
                    onRemove={() => setFormData(f => ({ ...f, image_url: '' }))}
                  />
                  <p className="text-xs text-muted-foreground">Or paste an image URL below</p>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://example.com/banner.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2 aspect-[3/4] max-h-64 overflow-hidden rounded-lg border bg-muted">
                      <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_url">Link URL (optional)</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(f => ({ ...f, link_url: e.target.value }))}
                    placeholder="/book-event or https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={formData.service_type} onValueChange={(v) => setFormData(f => ({ ...f, service_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="indoor_events">Indoor Events</SelectItem>
                      <SelectItem value="cloud_kitchen">Cloud Kitchen</SelectItem>
                      <SelectItem value="homemade">Homemade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !formData.start_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "PP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.start_date} onSelect={(d) => setFormData(f => ({ ...f, start_date: d }))} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !formData.end_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.end_date} onSelect={(d) => setFormData(f => ({ ...f, end_date: d }))} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : editingBanner ? 'Update' : 'Add Banner'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Banners ({banners?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : banners && banners.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4" />
                          {banner.display_order}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-12 w-20 overflow-hidden rounded border bg-muted">
                          <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                          banner.service_type === 'indoor_events' && "bg-indoor-events/10 text-indoor-events",
                          banner.service_type === 'cloud_kitchen' && "bg-cloud-kitchen/10 text-cloud-kitchen",
                          banner.service_type === 'homemade' && "bg-homemade/10 text-homemade",
                          !banner.service_type && "bg-muted text-muted-foreground"
                        )}>
                          {banner.service_type?.replace('_', ' ') || 'All'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {banner.start_date || banner.end_date ? (
                          <>
                            {banner.start_date && format(new Date(banner.start_date), "MMM d")}
                            {banner.start_date && banner.end_date && ' - '}
                            {banner.end_date && format(new Date(banner.end_date), "MMM d")}
                          </>
                        ) : (
                          'Always'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: banner.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this banner?')) {
                                deleteMutation.mutate(banner.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No banners yet</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add First Banner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminBanners;
