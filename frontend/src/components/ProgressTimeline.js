import { CheckCircle2, Lock, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProgressTimeline({ stages, currentStage, onStartStage }) {
  return (
    <div className="relative pl-8 border-l-2 border-muted space-y-8">
      {stages.map((stage, index) => {
        const stageNumber = stage.stage_number;
        const isCompleted = stageNumber < currentStage;
        const isCurrent = stageNumber === currentStage;
        const isLocked = stageNumber > currentStage;

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
            } rounded-2xl p-6 transition-all duration-300 hover:shadow-lg`}>
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
                  onClick={() => onStartStage(stage.stage_id)}
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
  );
}
