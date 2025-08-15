
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureDataAccess } from '@/hooks/useSecureDataAccess';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/types/deal';

export const useSecureDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { secureQuery } = useSecureDataAccess();
  const { isAdmin } = useUserRoles();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false });

      const result = await secureQuery('deals', query, 'SELECT');
      setDeals(result.data || []);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      
      // Log permission denial for debugging using existing function
      try {
        await supabase.rpc('log_security_event', {
          p_action: 'PERMISSION_DENIED',
          p_resource_type: 'deals',
          p_details: { error: error.message, operation: 'SELECT' }
        });
      } catch (logError) {
        console.error('Failed to log permission denial:', logError);
      }

      toast({
        title: "Access Denied",
        description: "You don't have permission to view these deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (dealData: Partial<Deal>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dealToInsert = {
        ...dealData,
        deal_name: dealData.project_name || 'Untitled Deal',
        created_by: user.id,
        modified_by: user.id,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };

      console.log('Creating deal with data:', dealToInsert);

      const { data, error } = await supabase
        .from('deals')
        .insert([dealToInsert])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        
        // Log permission denial for debugging using existing function
        try {
          await supabase.rpc('log_security_event', {
            p_action: 'PERMISSION_DENIED',
            p_resource_type: 'deals',
            p_details: { error: error.message, data: dealToInsert, operation: 'INSERT' }
          });
        } catch (logError) {
          console.error('Failed to log permission denial:', logError);
        }
        
        throw error;
      }

      setDeals(prev => [data as Deal, ...prev]);
      toast({
        title: "Success",
        description: "Deal created successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: `Failed to create deal: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        ...updates,
        modified_at: new Date().toISOString(),
        modified_by: user.id
      };

      console.log('Updating deal with data:', updateData);

      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        
        // Log permission denial for debugging using existing function
        try {
          await supabase.rpc('log_security_event', {
            p_action: 'PERMISSION_DENIED',
            p_resource_type: 'deals',
            p_details: { error: error.message, deal_id: id, updates: updateData, operation: 'UPDATE' }
          });
        } catch (logError) {
          console.error('Failed to log permission denial:', logError);
        }
        
        throw error;
      }

      setDeals(prev => prev.map(deal => 
        deal.id === id ? { ...deal, ...data } as Deal : deal
      ));

      toast({
        title: "Success",
        description: "Deal updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: `Failed to update deal: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        
        // Log permission denial for debugging using existing function
        try {
          await supabase.rpc('log_security_event', {
            p_action: 'PERMISSION_DENIED',
            p_resource_type: 'deals',
            p_details: { error: error.message, deal_id: id, operation: 'DELETE' }
          });
        } catch (logError) {
          console.error('Failed to log permission denial:', logError);
        }
        
        throw error;
      }

      setDeals(prev => prev.filter(deal => deal.id !== id));
      
      toast({
        title: "Success",
        description: "Deal deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast({
        title: "Error",
        description: `Failed to delete deal: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user, isAdmin]);

  return {
    deals,
    loading,
    isAdmin,
    fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal
  };
};
