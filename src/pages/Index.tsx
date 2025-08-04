import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MeetingRecorder } from '@/components/MeetingRecorder';
import { AISummary } from '@/components/AISummary';
import { MeetingHistory } from '@/components/MeetingHistory';
import { 
  Brain, 
  Mic, 
  History, 
  Sparkles, 
  Users, 
  Clock, 
  CheckSquare,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

const Index = () => {
  const [currentTab, setCurrentTab] = useState('record');
  const [transcript, setTranscript] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MeetingAI</h1>
                <p className="text-sm text-muted-foreground">Smart Meeting Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4" />
                Invite Team
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Never Miss a Detail in Your
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent block">
                Important Meetings
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Record, transcribe, and generate AI-powered summaries with action items. 
              Your intelligent meeting companion for maximum productivity.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm text-center hover:bg-card/60 transition-all duration-300">
              <Mic className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real-time Recording</h3>
              <p className="text-sm text-muted-foreground">
                High-quality audio recording with live transcription
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm text-center hover:bg-card/60 transition-all duration-300">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Smart summaries, action items, and key insights extraction
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm text-center hover:bg-card/60 transition-all duration-300">
              <CheckSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Action Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Automatic action item detection and follow-up reminders
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Main App Interface */}
      <section className="px-6 pb-12">
        <div className="container mx-auto max-w-6xl">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="record" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Record Meeting
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Meeting History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record">
              <MeetingRecorder />
            </TabsContent>

            <TabsContent value="summary">
              <AISummary transcript={transcript} meetingDuration={meetingDuration} />
            </TabsContent>

            <TabsContent value="history">
              <MeetingHistory />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 border-t border-border/50 bg-card/20">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">99.5%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-3">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">SOC2</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-3">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
