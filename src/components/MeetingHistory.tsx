import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Download, Play, Trash2 } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
  status: 'completed' | 'processing' | 'failed';
  summary?: {
    actionItems: number;
    keyPoints: number;
  };
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Product Planning Meeting',
    date: '2024-01-15',
    duration: '45m',
    participants: 4,
    status: 'completed',
    summary: {
      actionItems: 5,
      keyPoints: 8
    }
  },
  {
    id: '2',
    title: 'Weekly Team Standup',
    date: '2024-01-12',
    duration: '30m',
    participants: 6,
    status: 'completed',
    summary: {
      actionItems: 3,
      keyPoints: 5
    }
  },
  {
    id: '3',
    title: 'Client Onboarding Call',
    date: '2024-01-10',
    duration: '1h 15m',
    participants: 3,
    status: 'processing'
  },
  {
    id: '4',
    title: 'Design Review Session',
    date: '2024-01-08',
    duration: '2h',
    participants: 5,
    status: 'completed',
    summary: {
      actionItems: 7,
      keyPoints: 12
    }
  }
];

export const MeetingHistory = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meeting History</h2>
          <p className="text-muted-foreground">
            View and manage your recorded meetings
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </div>

      <div className="grid gap-4">
        {mockMeetings.map((meeting) => (
          <Card key={meeting.id} className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{meeting.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(meeting.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meeting.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {meeting.participants} participants
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>

                {meeting.summary && (
                  <div className="flex gap-4 mb-4">
                    <div className="bg-primary/10 rounded-lg px-3 py-2">
                      <div className="text-sm font-medium text-primary">
                        {meeting.summary.actionItems} Action Items
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg px-3 py-2">
                      <div className="text-sm font-medium">
                        {meeting.summary.keyPoints} Key Points
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4" />
                    View Summary
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mockMeetings.length === 0 && (
        <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur-sm">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
          <p className="text-muted-foreground">
            Start recording your first meeting to see it here.
          </p>
        </Card>
      )}
    </div>
  );
};