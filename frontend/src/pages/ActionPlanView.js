import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, AlertCircle, ArrowLeft, Download, Home } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ActionPlanView() {
  const navigate = useNavigate();
  const [actionPlan, setActionPlan] = useState(null);
  const [client, setClient] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get client info
      const clientsRes = await fetch(`${API}/clients`, { credentials: 'include' });
      const clientsData = await clientsRes.json();
      
      if (clientsData.length > 0) {
        const clientData = clientsData[0];
        setClient(clientData);
        
        // Get action plans
        const plansRes = await fetch(`${API}/clients/${clientData.client_id}/action-plans`, { credentials: 'include' });
        const plansData = await plansRes.json();
        
        if (plansData.length > 0) {
          setActionPlan(plansData[0]);
        }
        
        // Get reports
        const reportsRes = await fetch(`${API}/clients/${clientData.client_id}/reports`, { credentials: 'include' });
        const reportsData = await reportsRes.json();
        
        if (reportsData.length > 0) {
          setReport(reportsData[0]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load action plan");
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your action plan...</p>
        </div>
      </div>
    );
  }

  if (!actionPlan) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-12 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-primary mb-4">No Action Plan Yet</h2>
          <p className="text-muted-foreground mb-6">
            Complete your journey to receive a personalized action plan.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3">
            Go to Dashboard
          </Button>
        </Card>
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
              <h1 className="text-3xl font-bold text-primary">🎉 Journey Complete!</h1>
              <p className="text-muted-foreground mt-1">Your personalized action plan is ready</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              data-testid="back-to-dashboard-btn"
              className="hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Congratulations Banner */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">Congratulations, {client?.full_name}!</h2>
              <p className="text-white/90">
                You've successfully completed all 5 stages of your journey. Here's your personalized action plan to guide your next steps.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Plan Tasks */}
          <div className="lg:col-span-2">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-2">{actionPlan.title}</h3>
              <p className="text-muted-foreground mb-6">{actionPlan.description}</p>

              <div className="space-y-4">
                {actionPlan.tasks.map((task, index) => (
                  <Card 
                    key={task.task_id || index}
                    className="bg-muted/30 border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-6"
                    data-testid={`task-${index + 1}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-medium text-primary">
                            {task.title || task.description}
                          </h4>
                        </div>
                        {task.title && task.description && (
                          <p className="text-foreground/80 ml-11">{task.description}</p>
                        )}
                      </div>
                      <Badge className={`${getPriorityColor(task.priority)} ml-4`}>
                        {task.priority || 'medium'}
                      </Badge>
                    </div>
                    
                    {task.due_date && (
                      <div className="flex items-center text-sm text-muted-foreground ml-11">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {formatDate(task.due_date)}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6">
              <h4 className="text-lg font-medium text-primary mb-4">Journey Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stages Completed</span>
                  <span className="font-semibold text-primary">5/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-primary">100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasks Assigned</span>
                  <span className="font-semibold text-primary">{actionPlan.tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Date</span>
                  <span className="font-semibold text-primary">
                    {new Date(actionPlan.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Download Report */}
            {report && (
              <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-6">
                <h4 className="text-lg font-medium text-primary mb-4 flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Your Report
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your comprehensive journey report with all your responses and insights.
                </p>
                <a
                  href={`${API}/reports/${report.report_id}/download`}
                  download
                  className="block"
                >
                  <Button 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6 py-3"
                    data-testid="download-report-btn"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </a>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h4 className="text-lg font-medium text-primary mb-4">What's Next?</h4>
              <ul className="space-y-3 text-sm text-foreground/80">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Review and download your journey report</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Follow your personalized action plan</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Track your progress on assigned tasks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Schedule follow-up sessions as needed</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
