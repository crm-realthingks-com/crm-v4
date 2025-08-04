import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Users, CheckSquare, Lightbulb, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MeetingSummary {
  title: string;
  duration: string;
  participants: number;
  keyPoints: string[];
  actionItems: string[];
  nextSteps: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface AISummaryProps {
  transcript: any[];
  meetingDuration: number;
}

export const AISummary = ({ transcript, meetingDuration }: AISummaryProps) => {
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI-generated summary
    const mockSummary: MeetingSummary = {
      title: "Product Planning Meeting",
      duration: formatDuration(meetingDuration),
      participants: 4,
      keyPoints: [
        "Discussed Q1 product roadmap and feature prioritization",
        "Reviewed user feedback from recent beta testing",
        "Identified potential technical challenges for mobile app",
        "Analyzed competitor features and market positioning"
      ],
      actionItems: [
        "John to draft technical specification for mobile app by Friday",
        "Sarah to schedule user interviews for next week",
        "Team to research competitor pricing strategies",
        "Set up follow-up meeting with engineering team"
      ],
      nextSteps: [
        "Finalize product requirements document",
        "Begin development sprint planning",
        "Schedule stakeholder review meeting"
      ],
      sentiment: 'positive'
    };
    
    setSummary(mockSummary);
    setIsGenerating(false);
    
    toast({
      title: "Summary generated",
      description: "AI has analyzed your meeting and created a comprehensive summary.",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const copySummary = () => {
    if (!summary) return;
    
    const summaryText = `
# ${summary.title}

**Duration:** ${summary.duration}
**Participants:** ${summary.participants}

## Key Points
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

## Action Items
${summary.actionItems.map(item => `□ ${item}`).join('\n')}

## Next Steps
${summary.nextSteps.map(step => `• ${step}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(summaryText);
    toast({
      title: "Summary copied",
      description: "Meeting summary has been copied to clipboard.",
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {!summary ? (
        <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">AI Meeting Analysis</h3>
          <p className="text-muted-foreground mb-6">
            Generate intelligent summaries, extract action items, and identify key insights from your meeting.
          </p>
          <Button 
            onClick={generateSummary} 
            variant="ai" 
            size="lg"
            disabled={transcript.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyzing Meeting...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Generate AI Summary
              </>
            )}
          </Button>
          {transcript.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Start recording to enable AI analysis
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Meeting Overview */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{summary.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {summary.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {summary.participants} participants
                  </div>
                  <Badge className={getSentimentColor(summary.sentiment)}>
                    {summary.sentiment} sentiment
                  </Badge>
                </div>
              </div>
              <Button onClick={copySummary} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
                Copy Summary
              </Button>
            </div>
          </Card>

          {/* Key Points */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold">Key Points</h4>
            </div>
            <ul className="space-y-3">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Action Items */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold">Action Items</h4>
            </div>
            <ul className="space-y-3">
              {summary.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 rounded border-border focus:ring-primary"
                  />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold">Next Steps</h4>
            </div>
            <ul className="space-y-3">
              {summary.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};