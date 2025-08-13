
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";

interface DashboardHeaderProps {
  userEmail: string;
  activeView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
  onCreateDeal: () => void;
  onSignOut: () => void;
}

export const DashboardHeader = ({
  userEmail,
  activeView,
  onViewChange,
  onCreateDeal,
  onSignOut
}: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between w-full max-w-none">
          {/* Left side - App title */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl lg:text-3xl font-bold">RealThingks Deals</h1>
          </div>
          
          {/* Right side - Controls */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            {/* View Toggle */}
            <div className="bg-white/10 rounded-lg p-1 flex">
              <Button
                variant={activeView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('kanban')}
                className={activeView === 'kanban' ? 'bg-white text-primary font-medium px-3' : 'text-white hover:bg-white/20 px-3'}
              >
                Kanban
              </Button>
              <Button
                variant={activeView === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('list')}
                className={activeView === 'list' ? 'bg-white text-primary font-medium px-3' : 'text-white hover:bg-white/20 px-3'}
              >
                List
              </Button>
            </div>
            
            <Button 
              onClick={onCreateDeal}
              className="bg-white text-primary hover:bg-white/90 font-semibold transition-all hover:scale-105 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
            
            {/* User Info with Sign Out */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <div className="text-right">
                <p className="text-primary-foreground/90 text-sm font-medium">
                  {userEmail}
                </p>
              </div>
              <Button 
                onClick={onSignOut}
                size="sm"
                className="bg-destructive/90 text-destructive-foreground hover:bg-destructive border-0 font-medium transition-all hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
