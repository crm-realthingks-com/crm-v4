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
import { useState } from "react";
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
}

export function AppSidebar({ isFixed = false }: AppSidebarProps) {
  const [isPinned, setIsPinned] = useState(true); // default: open
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  // No parent-controlled open state — always use isPinned
  const sidebarOpen = isPinned;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  // Only toggle on Pin button click
  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  // Menu item click: navigation only, no state changes
  const handleMenuItemClick = (url: string) => {
    navigate(url);
  };

  return (
    <div 
      className={`h-screen flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
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
            <span className="ml-3 text-gray-800 font-semibold text-lg whitespace-nowrap">
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
              <button
                onClick={() => handleMenuItemClick(item.url)}
                className={`
                  w-full flex items-center rounded-lg relative transition-colors duration-200
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
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: sidebarOpen ? '20px' : '60px',
                    height: '20px'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                {sidebarOpen && (
                  <span className="ml-3">{item.title}</span>
                )}
              </button>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right">
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

      {/* Bottom Section */}
      <div className="border-t border-gray-300 p-4 space-y-3 relative">
        {/* Pin Toggle Button */}
        <div className="flex" style={{ paddingLeft: sidebarOpen ? '0px' : '6px' }}>
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
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center relative">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              style={{ 
                position: 'absolute',
                left: '6px',
                width: '40px',
                height: '40px'
              }}
            >
              <LogOut className="w-5 h-5" />
            </button>
            <p className="text-gray-700 text-sm font-medium truncate ml-16">
              {getUserDisplayName()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
