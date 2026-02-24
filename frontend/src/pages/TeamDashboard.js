import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogOut, Search, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeamDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, avgProgress: 0 });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API}/clients`, { credentials: 'include' });
      const data = await response.json();
      setClients(data);
      setFilteredClients(data);

      const total = data.length;
      const active = data.filter(c => c.status === 'active').length;
      const avgProgress = total > 0 ? data.reduce((sum, c) => sum + c.progress_percentage, 0) / total : 0;
      setStats({ total, active, avgProgress: Math.round(avgProgress) });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error("Failed to load clients");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Team Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage and monitor client journeys</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="logout-btn"
              className="hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
              </div>
              <Users className="h-12 w-12 text-primary/20" />
            </div>
          </Card>
          
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Active Clients</p>
                <p className="text-3xl font-bold text-accent mt-2">{stats.active}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-accent/20" />
            </div>
          </Card>
          
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Avg Progress</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.avgProgress}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary/20" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-clients-input"
              className="pl-10 flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No clients found</p>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card 
                key={client.client_id}
                onClick={() => navigate(`/client/${client.client_id}`)}
                data-testid={`client-${client.client_id}`}
                className="group cursor-pointer bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-primary mb-2">{client.full_name}</h3>
                    <p className="text-muted-foreground">{client.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Current Stage</p>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Stage {client.current_stage}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Progress</p>
                      <p className="text-lg font-bold text-primary">{client.progress_percentage}%</p>
                    </div>
                    
                    <Badge 
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                      className={client.status === 'active' ? 'bg-accent text-accent-foreground' : ''}
                    >
                      {client.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
