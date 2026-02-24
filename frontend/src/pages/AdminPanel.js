import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Settings, FileQuestion } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await fetch(`${API}/admin/users`, { credentials: 'include' });
      const usersData = await usersRes.json();
      setUsers(usersData);

      const stagesRes = await fetch(`${API}/stages`, { credentials: 'include' });
      const stagesData = await stagesRes.json();
      setStages(stagesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load admin panel");
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await fetch(`${API}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      toast.success("User role updated");
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update user role");
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            data-testid="back-to-dashboard-btn"
            className="mb-4 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users, stages, and configurations</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" data-testid="users-tab">Users</TabsTrigger>
            <TabsTrigger value="stages" data-testid="stages-tab">Stages</TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <Users className="mr-3 h-6 w-6" />
                User Management
              </h3>
              <div className="space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.user_id} 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl"
                    data-testid={`user-${user.user_id}`}
                  >
                    <div>
                      <p className="font-medium text-primary">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleUpdateUserRole(user.user_id, value)}
                      >
                        <SelectTrigger className="w-[180px]" data-testid={`role-select-${user.user_id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="team">Team Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stages">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <FileQuestion className="mr-3 h-6 w-6" />
                Stage Configuration
              </h3>
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div 
                    key={stage.stage_id} 
                    className="p-4 bg-muted/30 rounded-xl"
                    data-testid={`stage-${stage.stage_number}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-primary mb-1">Stage {stage.stage_number}: {stage.stage_name}</h4>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                        {stage.requires_meeting && (
                          <span className="inline-block mt-2 text-xs bg-accent/10 text-accent px-2 py-1 rounded">Requires Meeting</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <Settings className="mr-3 h-6 w-6" />
                System Settings
              </h3>
              <p className="text-muted-foreground">System configuration options will be available here.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
