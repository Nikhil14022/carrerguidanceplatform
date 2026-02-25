import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuestionnaireView() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [client, setClient] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [stageId]);

  const fetchData = async () => {
    try {
      const clientsRes = await fetch(`${API}/clients`, { credentials: 'include' });
      const clientsData = await clientsRes.json();
      if (clientsData.length > 0) {
        setClient(clientsData[0]);
        
        const responsesRes = await fetch(`${API}/clients/${clientsData[0].client_id}/responses`, { credentials: 'include' });
        const responsesData = await responsesRes.json();
        
        const responsesMap = {};
        responsesData.forEach(r => {
          responsesMap[r.question_id] = r.answer;
        });
        setResponses(responsesMap);
      }

      const stagesRes = await fetch(`${API}/stages`, { credentials: 'include' });
      const stagesData = await stagesRes.json();
      const currentStage = stagesData.find(s => s.stage_id === stageId);
      setStage(currentStage);

      const questionsRes = await fetch(`${API}/stages/${stageId}/questions`, { credentials: 'include' });
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load questionnaire");
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      for (const question of questions) {
        if (question.is_required && !responses[question.question_id]) {
          toast.error(`Please answer: ${question.question_text}`);
          return;
        }

        await fetch(`${API}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            client_id: client.client_id,
            question_id: question.question_id,
            stage_id: stageId,
            answer: responses[question.question_id]
          })
        });
      }

      // Calculate total stages to determine progress
      const totalStages = 5; // We have 5 stages
      const currentStage = client.current_stage;
      const isLastStage = currentStage === totalStages;
      
      // Advance to next stage and update progress
      const nextStage = currentStage + 1;
      const progressPercentage = Math.round((currentStage / totalStages) * 100);
      
      await fetch(`${API}/clients/${client.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_stage: nextStage <= totalStages ? nextStage : currentStage,
          progress_percentage: progressPercentage
        })
      });

      if (isLastStage) {
        // Journey completed! Generate report and action plan
        toast.success("🎉 Congratulations! You've completed your journey!");
        
        // Generate report
        try {
          await fetch(`${API}/clients/${client.client_id}/generate-report`, {
            method: 'POST',
            credentials: 'include'
          });
          console.log('Report generated successfully');
        } catch (err) {
          console.error('Failed to generate report:', err);
        }
        
        // Generate action plan
        try {
          await fetch(`${API}/action-plans/auto-generate/${client.client_id}`, {
            method: 'POST',
            credentials: 'include'
          });
          console.log('Action plan generated successfully');
        } catch (err) {
          console.error('Failed to generate action plan:', err);
        }
        
        // Redirect to action plan view
        setTimeout(() => {
          navigate('/action-plan', { replace: true });
        }, 2000);
      } else {
        toast.success("Stage completed! Moving to next stage...");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast.error("Failed to save responses");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            data-testid="back-to-dashboard-btn"
            className="mb-4 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary">{stage?.stage_name}</h1>
          <p className="text-muted-foreground mt-1">{stage?.description}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8">
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.question_id} data-testid={`question-${index + 1}`}>
                <Label className="text-lg font-medium text-primary mb-3 block">
                  {index + 1}. {question.question_text}
                  {question.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {question.question_type === 'text' && (
                  <Input
                    value={responses[question.question_id] || ''}
                    onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                    placeholder="Your answer"
                    data-testid={`answer-${index + 1}`}
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                )}

                {question.question_type === 'textarea' && (
                  <Textarea
                    value={responses[question.question_id] || ''}
                    onChange={(e) => handleResponseChange(question.question_id, e.target.value)}
                    placeholder="Your detailed answer"
                    rows={5}
                    data-testid={`answer-${index + 1}`}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                )}

                {question.question_type === 'multiple_choice' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${question.question_id}-${optIndex}`}
                          checked={(responses[question.question_id] || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const current = responses[question.question_id] || [];
                            if (checked) {
                              handleResponseChange(question.question_id, [...current, option]);
                            } else {
                              handleResponseChange(question.question_id, current.filter(o => o !== option));
                            }
                          }}
                          data-testid={`option-${index + 1}-${optIndex + 1}`}
                        />
                        <Label htmlFor={`${question.question_id}-${optIndex}`} className="cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {question.question_type === 'scale' && (
                  <RadioGroup
                    value={responses[question.question_id]?.toString() || ''}
                    onValueChange={(value) => handleResponseChange(question.question_id, parseInt(value))}
                    data-testid={`answer-${index + 1}`}
                  >
                    <div className="flex flex-wrap gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <div key={num} className="flex items-center space-x-2">
                          <RadioGroupItem value={num.toString()} id={`scale-${question.question_id}-${num}`} />
                          <Label htmlFor={`scale-${question.question_id}-${num}`} className="cursor-pointer">{num}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              data-testid="submit-questionnaire-btn"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 font-medium w-full md:w-auto"
            >
              <Save className="mr-2 h-5 w-5" />
              Save Responses
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
