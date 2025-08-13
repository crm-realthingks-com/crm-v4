import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS } from "@/types/deal";
import { DealCard } from "./DealCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BulkActionsBar } from "./BulkActionsBar";
import { ImportExportBar } from "./ImportExportBar";

interface KanbanBoardProps {
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: Partial<Deal>[]) => void;
  onRefresh: () => void;
}

export const KanbanBoard = ({ 
  deals, 
  onUpdateDeal, 
  onDealClick, 
  onCreateDeal, 
  onDeleteDeals, 
  onImportDeals,
  onRefresh 
}: KanbanBoardProps) => {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filterDeals = (deals: Deal[]) => {
    if (!searchTerm) return deals;
    
    const searchValue = searchTerm.toLowerCase();
    return deals.filter(deal => 
      deal.project_name?.toLowerCase().includes(searchValue) ||
      deal.customer_name?.toLowerCase().includes(searchValue) ||
      deal.lead_name?.toLowerCase().includes(searchValue) ||
      deal.lead_owner?.toLowerCase().includes(searchValue) ||
      deal.region?.toLowerCase().includes(searchValue) ||
      deal.internal_comment?.toLowerCase().includes(searchValue) ||
      deal.customer_need?.toLowerCase().includes(searchValue) ||
      deal.customer_challenges?.toLowerCase().includes(searchValue) ||
      deal.relationship_strength?.toLowerCase().includes(searchValue) ||
      deal.budget?.toLowerCase().includes(searchValue) ||
      deal.business_value?.toLowerCase().includes(searchValue) ||
      deal.decision_maker_level?.toLowerCase().includes(searchValue) ||
      deal.currency_type?.toLowerCase().includes(searchValue) ||
      deal.action_items?.toLowerCase().includes(searchValue) ||
      deal.current_status?.toLowerCase().includes(searchValue) ||
      deal.won_reason?.toLowerCase().includes(searchValue) ||
      deal.lost_reason?.toLowerCase().includes(searchValue) ||
      deal.need_improvement?.toLowerCase().includes(searchValue) ||
      deal.drop_reason?.toLowerCase().includes(searchValue) ||
      deal.stage?.toLowerCase().includes(searchValue) ||
      String(deal.priority || '').includes(searchValue) ||
      String(deal.probability || '').includes(searchValue) ||
      String(deal.total_contract_value || '').includes(searchValue)
    );
  };

  const getDealsByStage = (stage: DealStage) => {
    const filteredDeals = filterDeals(deals);
    return filteredDeals.filter(deal => deal.stage === stage);
  };

  const getVisibleStages = () => {
    const lostDeals = getDealsByStage('Lost');
    const droppedDeals = getDealsByStage('Dropped');
    
    return DEAL_STAGES.filter(stage => {
      if (stage === 'Lost') return lostDeals.length > 0;
      if (stage === 'Dropped') return droppedDeals.length > 0;
      return true;
    });
  };

  const onDragStart = (start: any) => {
    setDraggedDeal(start.draggableId);
  };

  // No validation - allow movement to any stage
  const canMoveToStage = (deal: Deal, targetStage: DealStage): boolean => {
    console.log(`=== ALLOWING MOVE FROM ${deal.stage} TO ${targetStage} ===`);
    return true; // Always allow movement
  };

  const onDragEnd = async (result: DropResult) => {
    setDraggedDeal(null);
    
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId as DealStage;
    const deal = deals.find(d => d.id === draggableId);
    
    if (!deal || deal.stage === newStage) return;

    console.log(`Moving deal from ${deal.stage} to ${newStage}`);

    try {
      console.log(`Moving deal ${draggableId} to stage ${newStage}`);
      await onUpdateDeal(draggableId, { stage: newStage });
      toast({
        title: "Deal Updated",
        description: `Deal moved to ${newStage} stage`,
      });
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast({
        title: "Error",
        description: "Failed to update deal stage",
        variant: "destructive",
      });
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const newSelected = new Set(selectedDeals);
    if (checked) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleSelectAllInStage = (stage: DealStage, checked: boolean) => {
    const stageDeals = getDealsByStage(stage);
    const newSelected = new Set(selectedDeals);
    
    stageDeals.forEach(deal => {
      if (checked) {
        newSelected.add(deal.id);
      } else {
        newSelected.delete(deal.id);
      }
    });
    
    setSelectedDeals(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    
    onDeleteDeals(Array.from(selectedDeals));
    setSelectedDeals(new Set());
    setSelectionMode(false);
    
    toast({
      title: "Deals deleted",
      description: `Successfully deleted ${selectedDeals.size} deals`,
    });
  };

  const handleBulkExport = () => {
    // Export logic handled by ImportExportBar
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedDeals(new Set());
    }
  };

  const handleDealCardAction = async (dealId: string, newStage: DealStage) => {
    try {
      console.log(`Card action: Moving deal ${dealId} to stage ${newStage}`);
      await onUpdateDeal(dealId, { stage: newStage });
      toast({
        title: "Deal Updated",
        description: `Deal moved to ${newStage} stage`,
      });
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast({
        title: "Error",
        description: "Failed to update deal stage",
        variant: "destructive",
      });
    }
  };

  const visibleStages = getVisibleStages();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top search and controls bar */}
      <div className="flex-shrink-0 px-6 py-3 bg-background border-b border-border">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search all deal details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all hover:border-primary/50 focus:border-primary w-full text-base"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                className="hover-scale transition-all whitespace-nowrap text-base"
              >
                {selectionMode ? "Exit Selection" : "Select Deals"}
              </Button>
              
              {selectionMode && selectedDeals.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <span className="font-medium text-base">{selectedDeals.size} selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky stage headers */}
      <div className="flex-shrink-0 px-4 pt-3 bg-background border-b border-border/30 z-10 sticky top-0">
        <div 
          className="grid gap-3"
          style={{ 
            gridTemplateColumns: `repeat(${visibleStages.length}, minmax(280px, 1fr))`
          }}
        >
          {visibleStages.map((stage) => {
            const stageDeals = getDealsByStage(stage);
            const selectedInStage = stageDeals.filter(deal => selectedDeals.has(deal.id)).length;
            const allSelected = selectedInStage === stageDeals.length && stageDeals.length > 0;
            
            return (
              <div key={stage} className={`p-3 rounded-lg border-2 ${STAGE_COLORS[stage]} transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectionMode && (
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAllInStage(stage, Boolean(checked))}
                        className="transition-colors flex-shrink-0"
                      />
                    )}
                    <h3 className="font-semibold text-base truncate">{stage}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {stageDeals.length}
                      {selectionMode && selectedInStage > 0 && (
                        <span className="text-primary ml-1">({selectedInStage})</span>
                      )}
                    </span>
                    {stage === 'Lead' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCreateDeal(stage)}
                        className="hover-scale flex-shrink-0 p-1 h-7 w-7"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-3">
        <style>
          {`
            .deals-scrollbar::-webkit-scrollbar {
              width: 2px;
              height: 2px;
            }
            .deals-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .deals-scrollbar::-webkit-scrollbar-thumb {
              background: hsl(var(--border));
              border-radius: 1px;
            }
            .deals-scrollbar::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground));
            }
          `}
        </style>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div 
            className="grid gap-3 h-full overflow-x-auto deals-scrollbar"
            style={{ 
              gridTemplateColumns: `repeat(${visibleStages.length}, minmax(280px, 1fr))`,
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) transparent'
            }}
          >
            {visibleStages.map((stage) => {
              const stageDeals = getDealsByStage(stage);
              
              return (
                <div key={stage} className="flex flex-col h-full min-w-0">
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2 p-2 rounded-lg transition-all min-h-0 overflow-y-auto deals-scrollbar ${
                          snapshot.isDraggingOver ? 'bg-muted/50 shadow-inner' : ''
                        }`}
                        style={{ 
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'hsl(var(--border)) transparent'
                        }}
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable 
                            key={deal.id} 
                            draggableId={deal.id} 
                            index={index}
                            isDragDisabled={selectionMode}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...(!selectionMode ? provided.dragHandleProps : {})}
                                className="relative group"
                              >
                                {selectionMode && (
                                  <div className="absolute top-2 left-2 z-10">
                                    <Checkbox
                                      checked={selectedDeals.has(deal.id)}
                                      onCheckedChange={(checked) => handleSelectDeal(deal.id, Boolean(checked))}
                                      className="bg-background border-2 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                                <DealCard
                                  deal={deal}
                                  onClick={(e) => {
                                    if (selectionMode) {
                                      handleSelectDeal(deal.id, !selectedDeals.has(deal.id), e);
                                    } else {
                                      onDealClick(deal);
                                    }
                                  }}
                                  isDragging={snapshot.isDragging}
                                  isSelected={selectedDeals.has(deal.id)}
                                  selectionMode={selectionMode}
                                  onDelete={(dealId) => {
                                    onDeleteDeals([dealId]);
                                    toast({
                                      title: "Deal deleted",
                                      description: `Successfully deleted ${deal.project_name || 'deal'}`,
                                    });
                                  }}
                                  onStageChange={handleDealCardAction}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <div className="flex-shrink-0">
        <BulkActionsBar
          selectedCount={selectedDeals.size}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedDeals(new Set())}
        />
      </div>
    </div>
  );
};
