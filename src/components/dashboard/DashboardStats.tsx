
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Euro } from "lucide-react";
import { Deal } from "@/types/deal";

interface DashboardStatsProps {
  deals: Deal[];
}

export const DashboardStats = ({ deals }: DashboardStatsProps) => {
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.total_contract_value || 0), 0);
  const wonDeals = deals.filter(deal => deal.stage === 'Won').length;

  return (
    <div className="w-full px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="animate-fade-in hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Euro className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonDeals}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
