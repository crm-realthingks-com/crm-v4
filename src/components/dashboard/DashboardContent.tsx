
import { Deal, DealStage } from "@/types/deal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";

interface DashboardContentProps {
  activeView: 'kanban' | 'list';
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const DashboardContent = ({
  activeView,
  deals,
  onUpdateDeal,
  onDealClick,
  onCreateDeal,
  onDeleteDeals,
  onImportDeals,
  onRefresh
}: DashboardContentProps) => {
  return (
    <div className="flex-1">
      {activeView === 'kanban' ? (
        <div className="w-full">
          <KanbanBoard
            deals={deals}
            onUpdateDeal={onUpdateDeal}
            onDealClick={onDealClick}
            onCreateDeal={onCreateDeal}
            onDeleteDeals={onDeleteDeals}
            onImportDeals={onImportDeals}
            onRefresh={onRefresh}
          />
        </div>
      ) : (
        <div className="w-full">
          <ListView
            deals={deals}
            onDealClick={onDealClick}
            onUpdateDeal={onUpdateDeal}
            onDeleteDeals={onDeleteDeals}
            onImportDeals={onImportDeals}
          />
        </div>
      )}
    </div>
  );
};
