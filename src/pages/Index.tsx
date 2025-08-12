import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Deal, DealStage } from "@/types/deal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { DealForm } from "@/components/DealForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImportExportBar } from "@/components/ImportExportBar";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, BarChart3, Users, Euro } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStage, setInitialStage] = useState<DealStage>('Lead');
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');

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
        
        console.log("Updating deal with data:", updateData);
        
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
      const processedDeals: Deal[] = [];

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
          processedDeals.push(data as Deal);
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
          processedDeals.push(data as Deal);
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getStats = () => {
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.total_contract_value || 0), 0);
    const wonDeals = deals.filter(deal => deal.stage === 'Won').length;
    
    return { totalDeals, totalValue, wonDeals };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header - REMOVED DUPLICATE IMPORT/EXPORT BUTTONS */}
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between w-full max-w-none">
            {/* Left side - App title */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl lg:text-3xl font-bold">RealThingks Deals</h1>
            </div>
            
            {/* Right side - Controls without duplicate import/export */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* View Toggle */}
              <div className="bg-white/10 rounded-lg p-1 flex">
                <Button
                  variant={activeView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('kanban')}
                  className={activeView === 'kanban' ? 'bg-white text-primary font-medium px-3' : 'text-white hover:bg-white/20 px-3'}
                >
                  Kanban
                </Button>
                <Button
                  variant={activeView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('list')}
                  className={activeView === 'list' ? 'bg-white text-primary font-medium px-3' : 'text-white hover:bg-white/20 px-3'}
                >
                  List
                </Button>
              </div>
              
              <Button 
                onClick={() => handleCreateDeal('Lead')}
                className="bg-white text-primary hover:bg-white/90 font-semibold transition-all hover:scale-105 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Deal
              </Button>
              
              {/* User Info with Sign Out */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <div className="text-right">
                  <p className="text-primary-foreground/90 text-sm font-medium">
                    {user.email}
                  </p>
                </div>
                <Button 
                  onClick={handleSignOut}
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

      {/* Stats */}
      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="animate-fade-in hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Euro className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wonDeals}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1">
        {activeView === 'kanban' ? (
          <div className="w-full">
            <KanbanBoard
              deals={deals}
              onUpdateDeal={handleUpdateDeal}
              onDealClick={handleDealClick}
              onCreateDeal={handleCreateDeal}
              onDeleteDeals={handleDeleteDeals}
              onImportDeals={handleImportDeals}
              onRefresh={fetchDeals}
            />
          </div>
        ) : (
          <div className="w-full">
            <ListView
              deals={deals}
              onDealClick={handleDealClick}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeals={handleDeleteDeals}
              onImportDeals={handleImportDeals}
            />
          </div>
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

export default Index;
