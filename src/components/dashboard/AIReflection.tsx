import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useAIReflection } from "@/hooks/useAIReflection";

interface AIReflectionProps {
  completionRate: number;
  userName: string;
}

const AIReflection = ({ completionRate, userName }: AIReflectionProps) => {
  const { generateAIMessage } = useAIReflection();

  const aiMessage = generateAIMessage();

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          AI Daily Reflection
        </CardTitle>
        <p className="text-xs text-muted-foreground">Your AI companion's thoughts on your progress.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Generated Message */}
        <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/30">
          {/* Greeting with emoji */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{aiMessage.emoji}</span>
            <p className="font-bold text-primary text-base">{aiMessage.greeting}</p>
          </div>

          {/* Analysis */}
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "{aiMessage.analysis}"
          </p>

          {/* Advice */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">💡 Advice:</p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {aiMessage.advice}
            </p>
          </div>

          {/* Motivation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">🔥 Motivation:</p>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {aiMessage.motivation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIReflection;
