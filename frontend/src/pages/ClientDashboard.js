import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LogOut, FileText, Upload, Clock, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [actionPlans, setActionPlans] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
      const userData = await userRes.json();
      setUser(userData);

      const clientsRes = await fetch(`${API}/clients`, { credentials: 'include' });
      const clientsData = await clientsRes.json();
      
      if (clientsData.length > 0) {
        setClient(clientsData[0]);
        
        const reportsRes = await fetch(`${API}/clients/${clientsData[0].client_id}/reports`, { credentials: 'include' });
        const reportsData = await reportsRes.json();
        setReports(reportsData);
        
        const plansRes = await fetch(`${API}/clients/${clientsData[0].client_id}/action-plans`, { credentials: 'include' });
        const plansData = await plansRes.json();
        setActionPlans(plansData);
      }

      const stagesRes = await fetch(`${API}/stages`, { credentials: 'include' });
      const stagesData = await stagesRes.json();
      setStages(stagesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleStartStage = (stageId) => {
    navigate(`/questionnaire/${stageId}`);
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

  const currentStageNumber = client?.current_stage || 1;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Your Journey Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
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
        {/* Progress Overview */}
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-medium text-primary mb-4">Overall Progress</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stage {currentStageNumber} of {stages.length}</span>
              <span className="font-medium text-primary">{client?.progress_percentage || 0}% Complete</span>
            </div>
            <Progress value={client?.progress_percentage || 0} className="h-3" />
          </div>
        </Card>

        {/* Journey Timeline */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-medium text-primary mb-6">Your Journey Path</h2>
          <div className="relative pl-8 border-l-2 border-muted space-y-8">
            {stages.map((stage, index) => {
              const stageNumber = stage.stage_number;
              const isCompleted = stageNumber < currentStageNumber;
              const isCurrent = stageNumber === currentStageNumber;
              const isLocked = stageNumber > currentStageNumber;

              return (
                <div key={stage.stage_id} className="relative group" data-testid={`stage-${stageNumber}`}>
                  <div className={`absolute ${
                    isCurrent 
                      ? '-left-[11px] top-0 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-[0_0_0_4px_rgba(26,77,46,0.2)]'
                      : isCompleted
                      ? '-left-[11px] top-0 h-5 w-5 rounded-full bg-primary border-4 border-background'
                      : '-left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-muted'
                  }`}>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-white" />}
                  </div>
                  
                  <Card className={`ml-4 ${
                    isCurrent 
                      ? 'bg-card border-2 border-primary shadow-md'
                      : isCompleted
                      ? 'bg-card border border-border/50 shadow-sm'
                      : 'bg-muted/30 border border-muted'
                  } rounded-2xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-2">
                          Stage {stageNumber}
                          {stage.requires_meeting && <Clock className="inline ml-2 h-4 w-4" />}
                        </div>
                        <h3 className="text-2xl font-medium text-primary mb-2">{stage.stage_name}</h3>
                        <p className="text-base leading-relaxed text-foreground/90">{stage.description}</p>
                      </div>
                      {isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    
                    {isCurrent && (
                      <Button
                        onClick={() => handleStartStage(stage.stage_id)}
                        data-testid={`start-stage-${stageNumber}-btn`}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2 font-medium mt-4"
                      >
                        {stage.requires_meeting ? 'View Details' : 'Start Questionnaire'}
                      </Button>
                    )}
                    
                    {isCompleted && (
                      <div className="flex items-center text-primary font-medium mt-4">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Completed
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reports & Action Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
            <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
              <FileText className="mr-3 h-6 w-6" />
              Your Reports
            </h3>
            {reports.length === 0 ? (
              <p className="text-muted-foreground">No reports available yet</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.report_id} className="p-4 bg-muted/30 rounded-xl" data-testid={`report-${report.report_id}`}>
                    <h4 className="font-medium text-primary">{report.report_title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated on {new Date(report.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
            <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6" />
              Action Plans
            </h3>
            {actionPlans.length === 0 ? (
              <p className="text-muted-foreground">No action plans available yet</p>
            ) : (
              <div className="space-y-4">
                {actionPlans.map((plan) => (
                  <div key={plan.action_plan_id} className="p-4 bg-muted/30 rounded-xl" data-testid={`action-plan-${plan.action_plan_id}`}>
                    <h4 className="font-medium text-primary">{plan.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
