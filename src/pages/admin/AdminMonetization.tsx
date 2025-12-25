import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Clock, CheckCircle, XCircle, MoreVertical, Users, CreditCard, Plus, Eye, EyeOff, Target, BarChart3, Play, Square, Monitor, Smartphone, Globe, Settings, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

interface MonetizationRequest {
  id: string;
  channel_id: string;
  status: string;
  is_monetized: boolean;
  total_earnings: number;
  pending_earnings: number;
  created_at: string;
  channel: {
    id: string;
    name: string;
    subscriber_count: number;
  };
}

interface AdUnit {
  id: string;
  name: string;
  gam_ad_unit_id: string;
  ad_format: string;
  sizes: any;
  ad_placement: any;
  ad_code: string;
  ad_type: string;
  video_position_seconds: number;
  page_placement: string;
  targeting: any;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface AdPerformance {
  id: string;
  ad_unit_id: string;
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
  created_at: string;
  updated_at: string;
  ad_unit: {
    id: string;
    name: string;
  };
}

interface Payout {
  id: string;
  channel_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  requested_at: string;
  processed_at: string | null;
  channel: {
    id: string;
    name: string;
  };
}

export default function AdminMonetization() {
  const { toast } = useToast();
  const [monetizationRequests, setMonetizationRequests] = useState<MonetizationRequest[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [adForm, setAdForm] = useState({
    name: '',
    ad_format: 'banner',
    ad_type: 'display',
    status: 'active',
    sizes: '300x250',
    ad_placement: '',
    ad_code: '',
    video_position_seconds: 0,
    page_placement: 'sidebar',
    targeting: '',
    priority: 10,
  });
  const [editingAdUnit, setEditingAdUnit] = useState<AdUnit | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: monetization, error: monetizationError }, { data: payoutsData, error: payoutsError }, { data: adUnitsData, error: adUnitsError }, { data: adPerformanceData, error: adPerformanceError }] = await Promise.all([
        supabase
          .from('monetization_settings')
          .select('*, channel:channels(id, name, subscriber_count)')
          .order('created_at', { ascending: false }),
        supabase
          .from('payouts')
          .select('*, channel:channels(id, name)')
          .order('requested_at', { ascending: false }),
        supabase
          .from('ad_units')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('ad_performance')
          .select('*, ad_unit:ad_units(id, name)')
          .order('date', { ascending: false })
          .limit(50) // Limit to last 50 records
      ]);

      if (monetizationError) throw monetizationError;
      if (payoutsError) throw payoutsError;
      if (adUnitsError) throw adUnitsError;
      if (adPerformanceError) throw adPerformanceError;

      if (monetization) setMonetizationRequests(monetization as MonetizationRequest[]);
      if (payoutsData) setPayouts(payoutsData as Payout[]);
      if (adUnitsData) setAdUnits(adUnitsData as AdUnit[]);
      if (adPerformanceData) setAdPerformance(adPerformanceData as AdPerformance[]);
    } catch (error) {
      console.error('Error fetching monetization data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load monetization data',
      });
    } finally {
      setLoading(false);
    }
  };



  const handleMonetizationAction = async (id: string, action: 'approve' | 'reject') => {
    const { error } = await supabase
      .from('monetization_settings')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        is_monetized: action === 'approve',
      })
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    } else {
      toast({ title: `Application ${action}d` });
      fetchData();
    }
  };

  const handlePayoutAction = async (id: string, action: 'approve' | 'reject') => {
    const { error } = await supabase
      .from('payouts')
      .update({
        status: action === 'approve' ? 'completed' : 'rejected',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update payout.' });
    } else {
      toast({ title: `Payout ${action}d` });
      fetchData();
    }
  };

  const handleAdUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result;
      if (editingAdUnit) {
        // Update existing ad unit
        result = await supabase
          .from('ad_units')
          .update({
            name: adForm.name,
            ad_format: adForm.ad_format,
            ad_type: adForm.ad_type,
            status: adForm.status,
            sizes: adForm.sizes,
            ad_placement: adForm.ad_placement,
            ad_code: adForm.ad_code,
            video_position_seconds: adForm.video_position_seconds,
            page_placement: adForm.page_placement,
            targeting: adForm.targeting,
            priority: adForm.priority,
          })
          .eq('id', editingAdUnit.id);
      } else {
        // Create new ad unit
        result = await supabase
          .from('ad_units')
          .insert([{
            name: adForm.name,
            ad_format: adForm.ad_format,
            ad_type: adForm.ad_type,
            status: adForm.status,
            sizes: adForm.sizes,
            ad_placement: adForm.ad_placement,
            ad_code: adForm.ad_code,
            video_position_seconds: adForm.video_position_seconds,
            page_placement: adForm.page_placement,
            targeting: adForm.targeting,
            priority: adForm.priority,
          }]);
      }
      
      if (result.error) throw result.error;
      
      toast({ title: `Ad Unit ${editingAdUnit ? 'updated' : 'created'} successfully` });
      setAdForm({
        name: '',
        ad_format: 'banner',
        ad_type: 'display',
        status: 'active',
        sizes: '300x250',
        ad_placement: '',
        ad_code: '',
        video_position_seconds: 0,
        page_placement: 'sidebar',
        targeting: '',
        priority: 10,
      });
      setEditingAdUnit(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save ad unit',
      });
    }
  };

  const handleEditAdUnit = (adUnit: AdUnit) => {
    setEditingAdUnit(adUnit);
    setAdForm({
      name: adUnit.name,
      ad_format: adUnit.ad_format,
      ad_type: adUnit.ad_type,
      status: adUnit.status,
      sizes: Array.isArray(adUnit.sizes) ? adUnit.sizes.join(',') : adUnit.sizes,
      ad_placement: typeof adUnit.ad_placement === 'object' ? JSON.stringify(adUnit.ad_placement) : adUnit.ad_placement || '',
      ad_code: adUnit.ad_code || '',
      video_position_seconds: adUnit.video_position_seconds || 0,
      page_placement: adUnit.page_placement || 'sidebar',
      targeting: typeof adUnit.targeting === 'object' ? JSON.stringify(adUnit.targeting) : adUnit.targeting,
      priority: adUnit.priority || 10,
    });
  };

  const handleDeleteAdUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad unit?')) return;
    
    try {
      const { error } = await supabase
        .from('ad_units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Ad Unit deleted successfully' });
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete ad unit',
      });
    }
  };

  const formatAdSize = (sizes: any) => {
    if (typeof sizes === 'string') return sizes;
    if (Array.isArray(sizes)) return sizes.join(', ');
    if (typeof sizes === 'object') return JSON.stringify(sizes);
    return 'N/A';
  };

  const pendingMonetization = monetizationRequests.filter(m => m.status === 'pending');
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidOut = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  
  const totalAdRevenue = adPerformance.reduce((sum, perf) => sum + (perf.revenue || 0), 0);
  const totalAdImpressions = adPerformance.reduce((sum, perf) => sum + (perf.impressions || 0), 0);
  const totalAdClicks = adPerformance.reduce((sum, perf) => sum + (perf.clicks || 0), 0);
  const avgCPM = totalAdImpressions > 0 ? (totalAdRevenue / (totalAdImpressions / 1000)) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Monetization Management</h1>
        <p className="text-muted-foreground mt-1">Manage monetization applications, payouts, and ad units</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monetized Channels</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {monetizationRequests.filter(m => m.is_monetized).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingMonetization.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalPendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalPaidOut.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalAdRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAdImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList className="mb-4">
          <TabsTrigger value="applications">
            Applications {pendingMonetization.length > 0 && `(${pendingMonetization.length})`}
          </TabsTrigger>
          <TabsTrigger value="payouts">
            Payouts {pendingPayouts.length > 0 && `(${pendingPayouts.length})`}
          </TabsTrigger>
          <TabsTrigger value="ad-units">
            Ad Units {adUnits.length > 0 && `(${adUnits.length})`}
          </TabsTrigger>
          <TabsTrigger value="ad-performance">
            Ad Performance {adPerformance.length > 0 && `(${adPerformance.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">All Monetized</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Applications</CardTitle>
              <CardDescription>Review and manage monetization applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingMonetization.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMonetization.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Link to={`/channel/${request.channel?.id}`} className="font-medium text-foreground hover:text-primary">
                            {request.channel?.name || 'Unknown'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {request.channel?.subscriber_count?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Pending</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleMonetizationAction(request.id, 'approve')}
                                className="gap-2 text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMonetizationAction(request.id, 'reject')}
                                className="gap-2 text-destructive"
                              >
                                <XCircle className="w-4 h-4" />Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Review and process payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <Link to={`/channel/${payout.channel?.id}`} className="font-medium text-foreground hover:text-primary">
                            {payout.channel?.name || 'Unknown'}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">${payout.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{payout.payment_method || 'Not set'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.status === 'completed' ? 'default' :
                              payout.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payout.requested_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {payout.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handlePayoutAction(payout.id, 'approve')}
                                  className="gap-2 text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePayoutAction(payout.id, 'reject')}
                                  className="gap-2 text-destructive"
                                >
                                  <XCircle className="w-4 h-4" />Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No payouts yet</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ad-units">
          <Card>
            <CardHeader>
              <CardTitle>Ad Units</CardTitle>
              <CardDescription>Manage Google Ad Manager ad units</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{editingAdUnit ? 'Edit Ad Unit' : 'Create Ad Unit'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAdUnitSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Unit Name</Label>
                        <Input
                          id="name"
                          value={adForm.name}
                          onChange={(e) => setAdForm({...adForm, name: e.target.value})}
                          placeholder="Enter ad unit name"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ad_format">Ad Format</Label>
                          <Select value={adForm.ad_format} onValueChange={(value) => setAdForm({...adForm, ad_format: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="banner">Banner</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="native">Native</SelectItem>
                              <SelectItem value="interstitial">Interstitial</SelectItem>
                              <SelectItem value="video_pre_roll">Video Pre-roll</SelectItem>
                              <SelectItem value="video_mid_roll">Video Mid-roll</SelectItem>
                              <SelectItem value="video_post_roll">Video Post-roll</SelectItem>
                              <SelectItem value="google_adsense">Google AdSense</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="link">Link</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={adForm.status} onValueChange={(value) => setAdForm({...adForm, status: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="deleted">Deleted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sizes">Ad Sizes</Label>
                        <Input
                          id="sizes"
                          value={adForm.sizes}
                          onChange={(e) => setAdForm({...adForm, sizes: e.target.value})}
                          placeholder="e.g., 300x250, 728x90"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ad_type">Ad Type</Label>
                        <Select value={adForm.ad_type} onValueChange={(value) => setAdForm({...adForm, ad_type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="display">Display</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="native">Native</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="page_placement">Page Placement</Label>
                        <Select value={adForm.page_placement} onValueChange={(value) => setAdForm({...adForm, page_placement: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video_player">Video Player</SelectItem>
                            <SelectItem value="sidebar">Sidebar</SelectItem>
                            <SelectItem value="feed">Video Feed</SelectItem>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="footer">Footer</SelectItem>
                            <SelectItem value="in_player">In-Player</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="video_position_seconds">Video Position (seconds)</Label>
                          <Input
                            id="video_position_seconds"
                            type="number"
                            value={adForm.video_position_seconds}
                            onChange={(e) => setAdForm({...adForm, video_position_seconds: parseInt(e.target.value) || 0})}
                            placeholder="0 for pre-roll"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={adForm.priority}
                            onChange={(e) => setAdForm({...adForm, priority: parseInt(e.target.value) || 10})}
                            placeholder="Lower number = Higher priority"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ad_placement">Ad Placement (JSON)</Label>
                        <Input
                          id="ad_placement"
                          value={adForm.ad_placement}
                          onChange={(e) => setAdForm({...adForm, ad_placement: e.target.value})}
                          placeholder='e.g., {"page": "video", "position": "pre_roll", "time_seconds": 0}'
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ad_code">Ad Code</Label>
                        <Textarea
                          id="ad_code"
                          value={adForm.ad_code}
                          onChange={(e) => setAdForm({...adForm, ad_code: e.target.value})}
                          placeholder="Paste Google AdSense code, HTML code, or other ad code here"
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="targeting">Targeting (JSON)</Label>
                        <Input
                          id="targeting"
                          value={adForm.targeting}
                          onChange={(e) => setAdForm({...adForm, targeting: e.target.value})}
                          placeholder='e.g., {"category": "technology"}'
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        {editingAdUnit ? 'Update Ad Unit' : 'Create Ad Unit'}
                      </Button>
                      
                      {editingAdUnit && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingAdUnit(null);
                            setAdForm({
                              name: '',
                              ad_format: 'banner',
                              ad_type: 'display',
                              status: 'active',
                              sizes: '300x250',
                              ad_placement: '',
                              ad_code: '',
                              video_position_seconds: 0,
                              page_placement: 'sidebar',
                              targeting: '',
                              priority: 10,
                            });
                          }}
                          className="w-full"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ad Unit Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Ad Formats
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                          <li>• Banner: Standard display ads</li>
                          <li>• Video: Pre-roll, mid-roll, post-roll</li>
                          <li>• Native: Ads that match content style</li>
                          <li>•Interstitial: Full-screen ads</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Common Sizes
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                          <li>• 300x250: Medium Rectangle</li>
                          <li>• 728x90: Leaderboard</li>
                          <li>• 320x50: Mobile Banner</li>
                          <li>• 160x600: Wide Skyscraper</li>
                          <li>• 300x600: Half Page</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Video Ad Types
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                          <li>• Pre-roll: Before video starts</li>
                          <li>• Mid-roll: During video playback</li>
                          <li>• Post-roll: After video ends</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : adUnits.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                          <TableHead>Placement</TableHead>
                        <TableHead>Sizes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adUnits.map((adUnit) => (
                        <TableRow key={adUnit.id}>
                          <TableCell className="font-medium">{adUnit.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(adUnit.ad_type || 'display').charAt(0).toUpperCase() + (adUnit.ad_type || 'display').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {adUnit.page_placement || 'N/A'}
                            {adUnit.ad_format?.includes('video') && adUnit.video_position_seconds !== undefined && (
                              <span className="text-xs ml-1">({adUnit.video_position_seconds}s)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatAdSize(adUnit.sizes)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                adUnit.status === 'active' ? 'default' :
                                adUnit.status === 'paused' ? 'secondary' : 'destructive'
                              }
                            >
                              {(adUnit.status || 'draft').charAt(0).toUpperCase() + (adUnit.status || 'draft').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(adUnit.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditAdUnit(adUnit)}
                                  className="gap-2 text-blue-600"
                                >
                                  <Edit3 className="w-4 h-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAdUnit(adUnit.id)}
                                  className="gap-2 text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No ad units yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first ad unit to start monetizing with Google Ad Manager</p>
                  <Button onClick={() => setAdForm({
                    name: '',
                    ad_format: 'banner',
                    ad_type: 'display',
                    status: 'active',
                    sizes: '300x250',
                    ad_placement: '',
                    ad_code: '',
                    video_position_seconds: 0,
                    page_placement: 'sidebar',
                    targeting: '',
                    priority: 10,
                  })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ad Unit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ad-performance">
          <Card>
            <CardHeader>
              <CardTitle>Ad Performance</CardTitle>
              <CardDescription>Track ad performance metrics and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : adPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad Unit</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Impressions</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>CTR</TableHead>
                        <TableHead>eCPM</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adPerformance.map((perf) => {
                        const ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions * 100).toFixed(2) : '0.00';
                        const eCPM = perf.impressions > 0 ? (perf.revenue / (perf.impressions / 1000)).toFixed(2) : '0.00';
                        
                        return (
                          <TableRow key={perf.id}>
                            <TableCell className="font-medium">
                              {perf.ad_unit?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(perf.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {perf.impressions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {perf.clicks.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${perf.revenue.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {ctr}%
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              ${eCPM}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No performance data yet</h3>
                  <p className="text-muted-foreground">Ad performance metrics will appear once ad units start serving</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Monetized Channels</CardTitle>
              <CardDescription>Channels with active monetization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monetizationRequests.filter(m => m.is_monetized).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monetizationRequests.filter(m => m.is_monetized).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Link to={`/channel/${request.channel?.id}`} className="font-medium text-foreground hover:text-primary">
                            {request.channel?.name || 'Unknown'}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">${request.total_earnings?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-muted-foreground">${request.pending_earnings?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No monetized channels yet</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}