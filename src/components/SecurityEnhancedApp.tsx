
import React from 'react';
import { SecurityProvider } from '@/components/SecurityProvider';
import { AuthProvider } from '@/hooks/useAuth';

interface SecurityEnhancedAppProps {
  children: React.ReactNode;
}

const SecurityEnhancedApp = ({ children }: SecurityEnhancedAppProps) => {
  return (
    <AuthProvider>
      <SecurityProvider>
        {children}
      </SecurityProvider>
    </AuthProvider>
  );
};

export default SecurityEnhancedApp;
