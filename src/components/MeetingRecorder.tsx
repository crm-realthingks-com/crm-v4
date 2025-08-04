import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: string;
  speaker?: string;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const MeetingRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const newSegment: TranscriptSegment = {
            id: Date.now().toString(),
            text: result[0].transcript,
            timestamp: new Date().toLocaleTimeString(),
            speaker: 'Speaker 1'
          };
          setTranscript(prev => [...prev, newSegment]);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsTranscribing(false);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }

      toast({
        title: "Recording started",
        description: "Your meeting is now being recorded and transcribed.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    toast({
      title: "Recording stopped",
      description: "Your meeting recording has been saved.",
    });
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsTranscribing(false);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Resume speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const exportTranscript = () => {
    const transcriptText = transcript.map(segment => 
      `[${segment.timestamp}] ${segment.speaker}: ${segment.text}`
    ).join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isRecording && !isPaused && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="text-lg font-semibold">
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready to Record'}
              </span>
            </div>
            {isRecording && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {formatDuration(duration)}
              </Badge>
            )}
          </div>
          
          {isTranscribing && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              Live Transcription
            </Badge>
          )}
        </div>

        <div className="flex gap-3">
          {!isRecording ? (
            <Button onClick={startRecording} variant="record" size="lg">
              <Mic className="w-5 h-5" />
              Start Recording
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button onClick={resumeRecording} variant="ai" size="lg">
                  <Play className="w-5 h-5" />
                  Resume
                </Button>
              ) : (
                <Button onClick={pauseRecording} variant="secondary" size="lg">
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
              )}
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="w-5 h-5" />
                Stop
              </Button>
            </>
          )}
          
          {transcript.length > 0 && (
            <Button onClick={exportTranscript} variant="outline" size="lg">
              <Download className="w-5 h-5" />
              Export
            </Button>
          )}
        </div>
      </Card>

      {/* Live Transcript */}
      {transcript.length > 0 && (
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4">Live Transcript</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transcript.map((segment) => (
              <div key={segment.id} className="border-l-2 border-primary/30 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {segment.timestamp}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {segment.speaker}
                  </span>
                </div>
                <p className="text-foreground">{segment.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};