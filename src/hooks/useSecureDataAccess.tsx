
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { useToast } from '@/hooks/use-toast';

export const useSecureDataAccess = () => {
  const { logDataAccess, logSecurityEvent } = useSecurityAudit();
  const { toast } = useToast();

  const secureQuery = useCallback(async (
    tableName: string,
    query: any,
    operation: string = 'SELECT'
  ) => {
    try {
      // Log the data access attempt
      await logDataAccess(tableName, operation);

      const result = await query;

      if (result.error) {
        // Log failed access attempts
        await logSecurityEvent('DATA_ACCESS_FAILED', tableName, undefined, {
          error: result.error.message,
          operation
        });
        throw result.error;
      }

      // Log successful sensitive data access
      if (['deals', 'contacts', 'leads'].includes(tableName.toLowerCase())) {
        await logSecurityEvent('SENSITIVE_DATA_ACCESS', tableName, undefined, {
          operation,
          record_count: result.data?.length || 1
        });
      }

      return result;
    } catch (error) {
      console.error(`Secure ${operation} failed for ${tableName}:`, error);
      throw error;
    }
  }, [logDataAccess, logSecurityEvent]);

  const secureExport = useCallback(async (
    tableName: string,
    data: any[],
    exportType: string = 'CSV'
  ) => {
    try {
      // Log export attempt
      await logSecurityEvent('DATA_EXPORT', tableName, undefined, {
        export_type: exportType,
        record_count: data.length,
        timestamp: new Date().toISOString()
      });

      // Check if user has export permissions (could be enhanced with role-based checks)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated for export');
      }

      return data;
    } catch (error) {
      console.error(`Secure export failed for ${tableName}:`, error);
      toast({
        title: "Export Failed",
        description: "You don't have permission to export this data",
        variant: "destructive",
      });
      throw error;
    }
  }, [logSecurityEvent, toast]);

  return {
    secureQuery,
    secureExport
  };
};
