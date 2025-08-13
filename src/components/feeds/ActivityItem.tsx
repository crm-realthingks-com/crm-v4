
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, User, Mail, Phone, FileText, ChevronRight, Undo2 } from "lucide-react";

interface ActivityItemProps {
  id: string;
  type: string;
  title: string;
  description: string;
  user: string;
  time: string;
  details: string;
  isNew?: boolean;
  onClick: () => void;
  onRevert?: () => void;
}

export const ActivityItem = ({ 
  id, 
  type, 
  title, 
  description, 
  user, 
  time, 
  details, 
  isNew = false,
  onClick,
  onRevert 
}: ActivityItemProps) => {
  const getIcon = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_updated':
        return BarChart3;
      case 'meeting':
      case 'meeting_scheduled':
        return Calendar;
      case 'contact_added':
        return User;
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_updated':
        return 'bg-green-100 text-green-600';
      case 'meeting':
      case 'meeting_scheduled':
        return 'bg-blue-100 text-blue-600';
      case 'contact_added':
        return 'bg-purple-100 text-purple-600';
      case 'email':
        return 'bg-orange-100 text-orange-600';
      case 'call':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'deal_update':
      case 'deal_updated':
        return 'default';
      case 'meeting':
      case 'meeting_scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const Icon = getIcon();
  const showRevertButton = type === 'deal_updated' || type === 'deal_update';

  return (
    <div 
      className={`flex items-start gap-4 p-4 border rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02] hover:-translate-y-1 group ${
        isNew ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor()}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            {showRevertButton && onRevert && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRevert();
                }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs px-2 py-1 h-7 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Undo2 className="w-3 h-3 mr-1" />
                Revert
              </Button>
            )}
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-1">{description}</p>
        <p className="text-xs text-primary font-medium mb-2">{details}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {user}
            </Badge>
            <Badge variant={getBadgeVariant()} className="text-xs">
              {type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
