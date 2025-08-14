
import { 
  Home, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings,
  LogOut,
  Pin,
  PinOff
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Deals", url: "/deals", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  isFixed?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function AppSidebar({ isFixed = false, isOpen, onToggle }: AppSidebarProps) {
  const [isPinned, setIsPinned] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  // Use external state if provided (for fixed mode), otherwise use internal state
  const sidebarOpen = isFixed ? (isOpen ?? true) : isPinned;
  const setSidebarOpen = isFixed ? (onToggle || (() => {})) : setIsPinned;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    await signOut();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const togglePin = () => {
    if (isFixed) {
      onToggle?.(!sidebarOpen);
    } else {
      setIsPinned(!isPinned);
    }
  };

  return (
    <div 
      className={`h-screen flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
        isFixed ? 'relative' : ''
      }`}
      style={{ 
        width: sidebarOpen ? '220px' : '60px',
        minWidth: sidebarOpen ? '220px' : '60px',
        maxWidth: sidebarOpen ? '220px' : '60px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 relative" style={{ height: '72px', padding: '0 16px' }}>
        <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
          <img 
            src="/lovable-uploads/12bdcc4a-a1c8-4ccf-ba6a-931fd566d3c8.png" 
            alt="Logo" 
            className="w-8 h-8 flex-shrink-0 object-contain"
          />
          {sidebarOpen && (
            <span className="ml-3 text-gray-800 font-semibold text-lg whitespace-nowrap opacity-100 transition-opacity duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              RealThingks
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            const menuButton = (
              <NavLink
                to={item.url}
                 className={`
                  flex items-center rounded-lg relative transition-colors duration-200
                  ${active 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }
                `}
                style={{ 
                  paddingLeft: sidebarOpen ? '16px' : '0px',
                  paddingRight: sidebarOpen ? '16px' : '0px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  minHeight: '44px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: sidebarOpen ? '20px' : '60px',
                    height: '20px',
                    minWidth: '20px',
                    minHeight: '20px'
                  }}
                >
                  <item.icon 
                    className="w-5 h-5" 
                    style={{ 
                      minWidth: '20px',
                      minHeight: '20px'
                    }} 
                  />
                </div>
                {sidebarOpen && (
                  <span 
                    className="ml-3 opacity-100 transition-opacity duration-300"
                  >
                    {item.title}
                  </span>
                )}
              </NavLink>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.title}>
                {menuButton}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Pin Toggle & User & Sign Out */}
      <div className="border-t border-gray-300 p-4 space-y-3 relative">
        {/* Pin Toggle Button - Always bottom-left aligned */}
        <div className="flex" style={{ justifyContent: sidebarOpen ? 'flex-start' : 'flex-start', paddingLeft: sidebarOpen ? '0px' : '6px' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePin}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  sidebarOpen 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' 
                    : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                {sidebarOpen ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={sidebarOpen ? "bottom" : "right"}>
              <p>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User & Sign Out */}
        {!sidebarOpen ? (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center relative" style={{ minHeight: '40px' }}>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              style={{ 
                position: 'absolute',
                left: '6px',
                width: '40px',
                height: '40px',
                minWidth: '40px'
              }}
            >
              <LogOut className="w-5 h-5" />
            </button>
            <p 
              className="text-gray-700 text-sm font-medium truncate ml-16 opacity-100 transition-opacity duration-300"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '15px'
              }}
            >
              {getUserDisplayName()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
