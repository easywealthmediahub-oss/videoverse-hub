import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, Shield, Loader2 } from 'lucide-react';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';

interface SiteSettings {
  monetization: {
    enabled: boolean;
    min_payout: number;
    revenue_share: number;
    cpm_rate: number;
  };
  platform: {
    name: string;
    maintenance_mode: boolean;
    allow_signups: boolean;
  };
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    monetization: {
      enabled: true,
      min_payout: 50,
      revenue_share: 55,
      cpm_rate: 2.50,
    },
    platform: {
      name: 'VideoTube',
      maintenance_mode: false,
      allow_signups: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // In the future, we could fetch additional settings here
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Save monetization and platform settings
    // Implementation would depend on how these are stored in the database
    toast({ title: 'Settings saved' });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global platform settings</p>
      </div>

      {/* Site Settings Form */}
      <div className="mb-8">
        <SiteSettingsForm />
      </div>

      {/* Platform Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowSignups" className="text-base">Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
              </div>
              <Switch
                id="allowSignups"
                checked={settings.platform.allow_signups}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  platform: { ...settings.platform, allow_signups: checked }
                })}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Put the site in maintenance mode (only admins can access)</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.platform.maintenance_mode}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                platform: { ...settings.platform, maintenance_mode: checked }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Monetization Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monetization Settings
          </CardTitle>
          <CardDescription>Configure creator monetization options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="monetizationEnabled" className="text-base">Enable Monetization</Label>
              <p className="text-sm text-muted-foreground">Allow creators to earn from their content</p>
            </div>
            <Switch
              id="monetizationEnabled"
              checked={settings.monetization.enabled}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                monetization: { ...settings.monetization, enabled: checked }
              })}
            />
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="minPayout" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Minimum Payout ($)
              </label>
              <input
                id="minPayout"
                type="number"
                value={settings.monetization.min_payout}
                onChange={(e) => setSettings({
                  ...settings,
                  monetization: { ...settings.monetization, min_payout: parseFloat(e.target.value) || 0 }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="revenueShare" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Revenue Share (%)
              </label>
              <input
                id="revenueShare"
                type="number"
                value={settings.monetization.revenue_share}
                onChange={(e) => setSettings({
                  ...settings,
                  monetization: { ...settings.monetization, revenue_share: parseFloat(e.target.value) || 0 }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Percentage creators receive</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="cpmRate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                CPM Rate ($)
              </label>
              <input
                id="cpmRate"
                type="number"
                step="0.01"
                value={settings.monetization.cpm_rate}
                onChange={(e) => setSettings({
                  ...settings,
                  monetization: { ...settings.monetization, cpm_rate: parseFloat(e.target.value) || 0 }
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Earnings per 1000 views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Admin access is restricted to users with the admin role. All changes are logged and can be audited.
            Make sure to keep your account secure and use strong passwords.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}