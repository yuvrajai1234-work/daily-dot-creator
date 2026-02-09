import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useSaveReflection } from "@/hooks/useHabits";
import { Sparkles } from "lucide-react";

interface AIReflectionProps {
  completionRate: number;
  userName: string;
}

const AIReflection = ({ completionRate, userName }: AIReflectionProps) => {
  const [reflection, setReflection] = useState("");
  const saveReflection = useSaveReflection();

  const getAIMessage = () => {
    if (completionRate === 0) {
      return `"Hey ${userName || "there"}, today is a fresh start! Every small step builds significant momentum. What was one thing that went well today?"`;
    }
    if (completionRate < 50) {
      return `"Good effort so far, ${userName || "there"}! You've made progress today. Remember, consistency beats perfection. What's one thing you're proud of?"`;
    }
    if (completionRate < 100) {
      return `"Great job on staying consistent with your routine, ${userName || "there"}! Remember, every small step builds significant momentum. What was one thing that went well today?"`;
    }
    return `"Amazing, ${userName || "there"}! You've completed everything today! 🎉 Take a moment to reflect on what made today so productive."`;
  };

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Daily Reflection
        </CardTitle>
        <p className="text-xs text-muted-foreground">Your AI companion's thoughts on your progress.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {getAIMessage()}
        </p>

        <Textarea
          placeholder="Write your thoughts and insights here..."
          className="min-h-[100px] bg-secondary/30 border-border/50 resize-none text-sm"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />
        <Button
          className="w-full gradient-primary hover:opacity-90"
          size="sm"
          disabled={!reflection.trim() || saveReflection.isPending}
          onClick={() => {
            saveReflection.mutate(reflection, {
              onSuccess: () => setReflection(""),
            });
          }}
        >
          {saveReflection.isPending ? "Saving..." : "Save Reflection"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIReflection;
