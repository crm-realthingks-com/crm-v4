
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import SecurityAlert from '@/components/SecurityAlert';

interface SecurityContextType {
  isSecurityEnabled: boolean;
  hasAdminAccess: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const { user } = useAuth();
  const { logSecurityEvent } = useSecurityAudit();

  const hasAdminAccess = user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (user) {
      // Log user session start
      logSecurityEvent('SESSION_START', 'auth', user.id, {
        login_time: new Date().toISOString(),
        user_agent: navigator.userAgent
      });

      // Set up session monitoring
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logSecurityEvent('SESSION_INACTIVE', 'auth', user.id);
        } else {
          logSecurityEvent('SESSION_ACTIVE', 'auth', user.id);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        logSecurityEvent('SESSION_END', 'auth', user.id);
      };
    }
  }, [user, logSecurityEvent]);

  const value = {
    isSecurityEnabled: true,
    hasAdminAccess
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
