import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, MessageSquare, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [responses, setResponses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [reports, setReports] = useState([]);
  const [actionPlans, setActionPlans] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingNotes, setMeetingNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const clientRes = await fetch(`${API}/clients/${clientId}`, { credentials: 'include' });
      const clientData = await clientRes.json();
      setClient(clientData);

      const responsesRes = await fetch(`${API}/clients/${clientId}/responses`, { credentials: 'include' });
      const responsesData = await responsesRes.json();
      setResponses(responsesData);

      const meetingsRes = await fetch(`${API}/clients/${clientId}/meetings`, { credentials: 'include' });
      const meetingsData = await meetingsRes.json();
      setMeetings(meetingsData);

      const reportsRes = await fetch(`${API}/clients/${clientId}/reports`, { credentials: 'include' });
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      const plansRes = await fetch(`${API}/clients/${clientId}/action-plans`, { credentials: 'include' });
      const plansData = await plansRes.json();
      setActionPlans(plansData);

      const stagesRes = await fetch(`${API}/stages`, { credentials: 'include' });
      const stagesData = await stagesRes.json();
      setStages(stagesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load client profile");
      setLoading(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!meetingNotes.trim()) {
      toast.error("Please enter meeting notes");
      return;
    }

    try {
      await fetch(`${API}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          client_id: clientId,
          stage_id: stages.find(s => s.stage_number === client.current_stage)?.stage_id || '',
          notes: meetingNotes
        })
      });

      toast.success("Meeting notes added");
      setMeetingNotes('');
      fetchData();
    } catch (error) {
      console.error('Error adding meeting:', error);
      toast.error("Failed to add meeting notes");
    }
  };

  const handleAdvanceStage = async () => {
    try {
      await fetch(`${API}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_stage: client.current_stage + 1,
          progress_percentage: Math.round(((client.current_stage) / stages.length) * 100)
        })
      });

      toast.success("Client advanced to next stage");
      fetchData();
    } catch (error) {
      console.error('Error advancing stage:', error);
      toast.error("Failed to advance stage");
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
            onClick={() => navigate('/team')}
            data-testid="back-to-team-btn"
            className="mb-4 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team Dashboard
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">{client?.full_name}</h1>
              <p className="text-muted-foreground mt-1">{client?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-primary text-primary-foreground">Stage {client?.current_stage}</Badge>
              <Badge className="bg-accent text-accent-foreground">{client?.status}</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress */}
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-medium text-primary mb-4">Overall Progress</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stage {client?.current_stage} of {stages.length}</span>
              <span className="font-medium text-primary">{client?.progress_percentage}% Complete</span>
            </div>
            <Progress value={client?.progress_percentage} className="h-3" />
          </div>
          
          {client?.current_stage < stages.length && (
            <Button
              onClick={handleAdvanceStage}
              data-testid="advance-stage-btn"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2 font-medium mt-6"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Advance to Next Stage
            </Button>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="responses" data-testid="responses-tab">Responses</TabsTrigger>
            <TabsTrigger value="meetings" data-testid="meetings-tab">Meetings</TabsTrigger>
            <TabsTrigger value="reports" data-testid="reports-tab">Reports</TabsTrigger>
            <TabsTrigger value="action-plans" data-testid="action-plans-tab">Action Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="responses">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6">Client Responses</h3>
              {responses.length === 0 ? (
                <p className="text-muted-foreground">No responses yet</p>
              ) : (
                <div className="space-y-6">
                  {responses.map((response, index) => (
                    <div key={response.response_id} className="p-4 bg-muted/30 rounded-xl" data-testid={`response-${index + 1}`}>
                      <p className="font-medium text-primary mb-2">Question ID: {response.question_id}</p>
                      <p className="text-foreground/90"><strong>Answer:</strong> {JSON.stringify(response.answer)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Submitted: {new Date(response.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <MessageSquare className="mr-3 h-6 w-6" />
                Meeting Notes
              </h3>
              
              <div className="mb-6">
                <Textarea
                  placeholder="Add meeting notes..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={4}
                  data-testid="meeting-notes-input"
                  className="mb-4 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
                <Button
                  onClick={handleAddMeeting}
                  data-testid="add-meeting-btn"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2 font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meeting Notes
                </Button>
              </div>

              <div className="space-y-4">
                {meetings.length === 0 ? (
                  <p className="text-muted-foreground">No meetings recorded yet</p>
                ) : (
                  meetings.map((meeting) => (
                    <div key={meeting.meeting_id} className="p-4 bg-muted/30 rounded-xl" data-testid={`meeting-${meeting.meeting_id}`}>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </p>
                      <p className="text-foreground/90">{meeting.notes}</p>
                      <Badge className="mt-2">{meeting.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-medium text-primary flex items-center">
                  <FileText className="mr-3 h-6 w-6" />
                  Reports
                </h3>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API}/clients/${clientId}/generate-report`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      if (!response.ok) throw new Error('Failed to generate report');
                      toast.success("Report generated successfully!");
                      fetchData();
                    } catch (error) {
                      console.error('Error generating report:', error);
                      toast.error("Failed to generate report");
                    }
                  }}
                  data-testid="generate-report-btn"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2 font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
              {reports.length === 0 ? (
                <p className="text-muted-foreground">No reports generated yet</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.report_id} className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors" data-testid={`report-${report.report_id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-primary mb-2">{report.report_title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Generated: {new Date(report.generated_at).toLocaleDateString()}
                          </p>
                          {report.is_finalized && <Badge className="mt-2">Finalized</Badge>}
                        </div>
                        {report.report_content?.filename && (
                          <a
                            href={`${API}/reports/${report.report_id}/download`}
                            download
                            className="text-primary hover:text-primary/80 transition-colors"
                            data-testid={`download-report-${report.report_id}`}
                          >
                            <FileText className="h-6 w-6" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="action-plans">
            <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
              <h3 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <CheckCircle2 className="mr-3 h-6 w-6" />
                Action Plans
              </h3>
              {actionPlans.length === 0 ? (
                <p className="text-muted-foreground">No action plans created yet</p>
              ) : (
                <div className="space-y-4">
                  {actionPlans.map((plan) => (
                    <div key={plan.action_plan_id} className="p-4 bg-muted/30 rounded-xl" data-testid={`action-plan-${plan.action_plan_id}`}>
                      <h4 className="font-medium text-primary mb-2">{plan.title}</h4>
                      <p className="text-foreground/90 mb-2">{plan.description}</p>
                      <div className="space-y-2 mt-4">
                        {plan.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                            {task.title || task.description || JSON.stringify(task)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
