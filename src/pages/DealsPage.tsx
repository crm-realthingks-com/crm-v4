
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Deal, DealStage } from "@/types/deal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { DealForm } from "@/components/DealForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const DealsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStage, setInitialStage] = useState<DealStage>('Lead');
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('list');

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch deals",
          variant: "destructive",
        });
        return;
      }

      setDeals((data || []) as unknown as Deal[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ ...updates, modified_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, ...updates } : deal
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive",
      });
    }
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from('deals')
          .insert([{ 
            ...dealData, 
            deal_name: dealData.project_name || 'Untitled Deal',
            created_by: user?.id,
            modified_by: user?.id 
          }])
          .select()
          .single();

        if (error) throw error;

        setDeals(prev => [data as unknown as Deal, ...prev]);
      } else if (selectedDeal) {
        const updateData = {
          ...dealData,
          deal_name: dealData.project_name || selectedDeal.project_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: user?.id
        };
        
        await handleUpdateDeal(selectedDeal.id, updateData);
        await fetchDeals();
      }
    } catch (error) {
      console.error("Error in handleSaveDeal:", error);
      throw error;
    }
  };

  const handleDeleteDeals = async (dealIds: string[]) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .in('id', dealIds);

      if (error) throw error;

      setDeals(prev => prev.filter(deal => !dealIds.includes(deal.id)));
      
      toast({
        title: "Success",
        description: `Deleted ${dealIds.length} deal(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const handleImportDeals = async (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => {
    try {
      let createdCount = 0;
      let updatedCount = 0;

      for (const importDeal of importedDeals) {
        const { shouldUpdate, ...dealData } = importDeal;
        
        const existingDeal = deals.find(d => 
          (dealData.id && d.id === dealData.id) || 
          (dealData.project_name && d.project_name === dealData.project_name)
        );

        if (existingDeal) {
          const { data, error } = await supabase
            .from('deals')
            .update({
              ...dealData,
              modified_by: user?.id,
              deal_name: dealData.project_name || existingDeal.deal_name
            })
            .eq('id', existingDeal.id)
            .select()
            .single();

          if (error) throw error;
          updatedCount++;
        } else {
          const newDealData = {
            ...dealData,
            stage: dealData.stage || 'Lead' as const,
            created_by: user?.id,
            modified_by: user?.id,
            deal_name: dealData.project_name || `Imported Deal ${Date.now()}`
          };

          const { data, error } = await supabase
            .from('deals')
            .insert(newDealData)
            .select()
            .single();

          if (error) throw error;
          createdCount++;
        }
      }

      await fetchDeals();
      
      toast({
        title: "Import successful",
        description: `Created ${createdCount} new deals, updated ${updatedCount} existing deals`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import deals. Please check the CSV format.",
        variant: "destructive",
      });
    }
  };

  const handleCreateDeal = (stage: DealStage) => {
    setInitialStage(stage);
    setIsCreating(true);
    setSelectedDeal(null);
    setIsFormOpen(true);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsCreating(false);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedDeal(null);
    setIsCreating(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Deals Pipeline</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
              <div className="bg-muted rounded-lg p-1 flex">
                <Button
                  variant={activeView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('kanban')}
                  className={activeView === 'kanban' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Kanban
                </Button>
                <Button
                  variant={activeView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('list')}
                  className={activeView === 'list' ? 'bg-primary text-primary-foreground' : ''}
                >
                  List
                </Button>
              </div>
              <Button 
                onClick={() => handleCreateDeal('Lead')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Deal</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Takes remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'kanban' ? (
          <KanbanBoard
            deals={deals}
            onUpdateDeal={handleUpdateDeal}
            onDealClick={handleDealClick}
            onCreateDeal={handleCreateDeal}
            onDeleteDeals={handleDeleteDeals}
            onImportDeals={handleImportDeals}
            onRefresh={fetchDeals}
          />
        ) : (
          <ListView
            deals={deals}
            onDealClick={handleDealClick}
            onUpdateDeal={handleUpdateDeal}
            onDeleteDeals={handleDeleteDeals}
            onImportDeals={handleImportDeals}
          />
        )}
      </div>

      {/* Deal Form Modal */}
      <DealForm
        deal={selectedDeal}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveDeal}
        onRefresh={fetchDeals}
        isCreating={isCreating}
        initialStage={initialStage}
      />
    </div>
  );
};

export default DealsPage;
