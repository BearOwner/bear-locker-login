import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Key, LogOut, Edit, Trash2, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface LicenseKey {
  id: string;
  key: string;
  product_name: string;
  status: string;
  user_email?: string;
  usage_count?: number;
  max_usage?: number;
  expires_at?: string;
  notes?: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLicense, setNewLicense] = useState({
    product_name: '',
    max_usage: '',
    expires_at: '',
    notes: ''
  });

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch license keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const licenseKey = generateLicenseKey();
    
    try {
      const { error } = await supabase
        .from('license_keys')
        .insert({
          key: licenseKey,
          product_name: newLicense.product_name,
          seller_id: user?.id,
          status: 'active',
          max_usage: newLicense.max_usage ? parseInt(newLicense.max_usage) : null,
          expires_at: newLicense.expires_at || null,
          notes: newLicense.notes || null,
          usage_count: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "License key created successfully",
      });

      setNewLicense({ product_name: '', max_usage: '', expires_at: '', notes: '' });
      setIsCreateDialogOpen(false);
      fetchLicenses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create license key",
        variant: "destructive",
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'expired': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'banned': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">License Manager</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {licenses.filter(l => l.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {licenses.filter(l => l.status === 'expired').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {licenses.filter(l => 
                  new Date(l.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Licenses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>License Keys</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create License
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New License Key</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateLicense} className="space-y-4">
                  <div>
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input
                      id="product_name"
                      value={newLicense.product_name}
                      onChange={(e) => setNewLicense({...newLicense, product_name: e.target.value})}
                      placeholder="e.g., My Software v1.0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_usage">Max Usage Count</Label>
                    <Input
                      id="max_usage"
                      type="number"
                      value={newLicense.max_usage}
                      onChange={(e) => setNewLicense({...newLicense, max_usage: e.target.value})}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expiration Date</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={newLicense.expires_at}
                      onChange={(e) => setNewLicense({...newLicense, expires_at: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newLicense.notes}
                      onChange={(e) => setNewLicense({...newLicense, notes: e.target.value})}
                      placeholder="Optional notes about this license"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">Create License Key</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No license keys found. Create your first license key to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{license.key}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(license.key)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{license.product_name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(license.status)}>
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {license.usage_count || 0}
                        {license.max_usage && `/${license.max_usage}`}
                      </TableCell>
                      <TableCell>
                        {license.expires_at 
                          ? new Date(license.expires_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}