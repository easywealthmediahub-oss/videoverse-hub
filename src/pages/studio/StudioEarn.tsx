import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, CreditCard, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface MonetizationSettings {
  id: string;
  is_monetized: boolean;
  status: string;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  payment_method: string | null;
  payment_details: any;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  requested_at: string;
  processed_at: string | null;
}

export default function StudioEarn() {
  const { channel } = useProfile();
  const { toast } = useToast();
  const [monetization, setMonetization] = useState<MonetizationSettings | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  useEffect(() => {
    if (channel) {
      fetchMonetization();
      fetchPayouts();
    }
  }, [channel]);

  const fetchMonetization = async () => {
    if (!channel) return;

    const { data, error } = await supabase
      .from('monetization_settings')
      .select('*')
      .eq('channel_id', channel.id)
      .maybeSingle();

    if (data) {
      setMonetization(data);
    } else if (!error) {
      // Create monetization settings if they don't exist
      const { data: newData } = await supabase
        .from('monetization_settings')
        .insert({ channel_id: channel.id })
        .select()
        .single();
      if (newData) {
        setMonetization(newData);
      }
    }
    setLoading(false);
  };

  const fetchPayouts = async () => {
    if (!channel) return;

    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('channel_id', channel.id)
      .order('requested_at', { ascending: false });

    if (data) {
      setPayouts(data);
    }
  };

  const handleApplyMonetization = async () => {
    if (!channel || !monetization) return;

    const { error } = await supabase
      .from('monetization_settings')
      .update({ status: 'pending', is_monetized: false })
      .eq('id', monetization.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to apply for monetization.' });
    } else {
      setMonetization({ ...monetization, status: 'pending' });
      toast({ title: 'Application submitted', description: 'Your monetization application is being reviewed.' });
    }
  };

  const handleRequestPayout = async () => {
    if (!channel || !monetization) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }

    if (amount > monetization.pending_earnings) {
      toast({ variant: 'destructive', title: 'Insufficient balance' });
      return;
    }

    setRequestingPayout(true);

    const { error } = await supabase
      .from('payouts')
      .insert({
        channel_id: channel.id,
        amount,
        payment_method: monetization.payment_method,
      });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to request payout.' });
    } else {
      // Update pending earnings
      await supabase
        .from('monetization_settings')
        .update({ pending_earnings: monetization.pending_earnings - amount })
        .eq('id', monetization.id);

      toast({ title: 'Payout requested', description: 'Your payout request has been submitted.' });
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      fetchMonetization();
      fetchPayouts();
    }

    setRequestingPayout(false);
  };

  // Mock earnings data
  const earningsData = [
    { name: 'Jan', earnings: 120 },
    { name: 'Feb', earnings: 180 },
    { name: 'Mar', earnings: 150 },
    { name: 'Apr', earnings: 220 },
    { name: 'May', earnings: 280 },
    { name: 'Jun', earnings: 310 },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMonetized = monetization?.is_monetized;
  const isPending = monetization?.status === 'pending';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Earn</h1>
        <p className="text-muted-foreground mt-1">Manage your channel monetization and earnings</p>
      </div>

      {/* Monetization Status */}
      {!isMonetized && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {isPending ? 'Monetization Under Review' : 'Enable Monetization'}
            </CardTitle>
            <CardDescription>
              {isPending 
                ? 'Your application is being reviewed. This usually takes 1-3 business days.'
                : 'Start earning from your videos by enabling monetization.'
              }
            </CardDescription>
          </CardHeader>
          {!isPending && (
            <CardContent>
              <Button onClick={handleApplyMonetization}>Apply for Monetization</Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${monetization?.total_earnings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${monetization?.pending_earnings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${monetization?.paid_earnings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {isMonetized ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <Badge variant={isMonetized ? 'default' : 'secondary'}>
              {isMonetized ? 'Monetized' : isPending ? 'Pending' : 'Not Monetized'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Earnings Over Time</CardTitle>
                <CardDescription>Your earnings for the past 6 months</CardDescription>
              </div>
              {isMonetized && monetization?.pending_earnings && monetization.pending_earnings >= 50 && (
                <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Wallet className="h-4 w-4" />
                      Request Payout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Payout</DialogTitle>
                      <DialogDescription>
                        Available balance: ${monetization.pending_earnings.toFixed(2)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          min={50}
                          max={monetization.pending_earnings}
                        />
                        <p className="text-sm text-muted-foreground">Minimum payout: $50.00</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRequestPayout} disabled={requestingPayout}>
                        {requestingPayout ? 'Processing...' : 'Request Payout'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(142 76% 36%)"
                      fill="hsl(142 76% 36% / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Your past payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payout.requested_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          ${payout.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.payment_method || 'Not set'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.status === 'completed'
                                ? 'default'
                                : payout.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No payouts yet</h3>
                  <p className="text-muted-foreground">
                    Your payout history will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure how you receive payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select defaultValue={monetization?.payment_method || ''}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Email / Details</Label>
                <Input placeholder="Enter your payment email or details" className="max-w-sm" />
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}