import { Card } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, variant = "primary" }) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    success: "text-primary bg-primary/10"
  };

  return (
    <Card className="bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-primary mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClasses[variant]}`}>
            <Icon className="h-7 w-7" />
          </div>
        )}
      </div>
    </Card>
  );
}
