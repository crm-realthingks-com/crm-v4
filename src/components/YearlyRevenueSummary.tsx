import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Target, Euro, Calendar, Edit2, Check, X, AlertCircle } from "lucide-react";
import { useYearlyRevenueData, useAvailableYears } from "@/hooks/useYearlyRevenueData";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const YearlyRevenueSummary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { years, isLoading: yearsLoading } = useAvailableYears();
  
  // Create years array from 2023 to 2026, default to current year (2025 for setup)
  const availableYears = [2023, 2024, 2025, 2026];
  const currentYear = new Date().getFullYear();
  const defaultYear = availableYears.includes(currentYear) ? currentYear : 2025;
  
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const { revenueData, isLoading: dataLoading } = useYearlyRevenueData(selectedYear);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return (actual / target) * 100;
  };

  const handleSaveTarget = async () => {
    if (!user || !targetValue) return;

    try {
      const { error } = await supabase
        .from('yearly_revenue_targets')
        .upsert({
          year: selectedYear,
          total_target: Number(targetValue),
          created_by: user.id
        }, {
          onConflict: 'year'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Target updated successfully",
      });

      setEditingTarget(false);
      setTargetValue('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update target",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (type: 'actual' | 'projected', quarter?: string) => {
    const params = new URLSearchParams();
    
    if (type === 'actual') {
      params.append('stage', 'Won');
    } else {
      params.append('stage', 'RFQ');
    }
    
    if (quarter) {
      const quarterNum = parseInt(quarter.replace('q', ''));
      params.append('quarter', quarterNum.toString());
      params.append('year', selectedYear.toString());
    }
    
    navigate(`/deals?${params.toString()}`);
  };

  if (yearsLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state when no deals exist for the selected year
  if (revenueData && !revenueData.hasDeals) {
    return (
      <div className="space-y-6">
        {/* Header with Year Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Revenue Analytics</h2>
            <p className="text-muted-foreground"> </p>
          </div>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No deals found for {selectedYear}</h3>
                <p className="text-muted-foreground">
                  There are no deals recorded for the selected year. Try selecting a different year or add some deals to see revenue analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCombined = (revenueData?.totalActual || 0) + (revenueData?.totalProjected || 0);
  const progressPercentage = getProgressPercentage(revenueData?.totalActual || 0, revenueData?.target || 0);

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Revenue Analytics</h2>
          <p className="text-muted-foreground"> </p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Target</CardTitle>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-primary" />
              {!editingTarget ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setEditingTarget(true);
                    setTargetValue(revenueData?.target?.toString() || '');
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleSaveTarget}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTarget(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingTarget ? (
              <Input
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter target amount"
                type="number"
              />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.target || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">Set for {selectedYear}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale cursor-pointer" onClick={() => handleCardClick('actual')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actual Revenue</CardTitle>
            <Euro className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueData?.totalActual || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(1)}% of target
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale cursor-pointer" onClick={() => handleCardClick('projected')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(revenueData?.totalProjected || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From RFQ deals</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalCombined)}
            </div>
            <p className="text-xs text-muted-foreground">Actual + Projected</p>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quarterly Breakdown - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter, index) => (
              <div key={quarter} className="space-y-3">
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Q{index + 1}</h4>
                  <p className="text-sm text-muted-foreground">
                    {quarter === 'q1' && 'Jan - Mar'}
                    {quarter === 'q2' && 'Apr - Jun'}
                    {quarter === 'q3' && 'Jul - Sep'}
                    {quarter === 'q4' && 'Oct - Dec'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded"
                    onClick={() => handleCardClick('actual', quarter)}
                  >
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(revenueData?.actualRevenue[quarter] || 0)}
                    </span>
                  </div>
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded"
                    onClick={() => handleCardClick('projected', quarter)}
                  >
                    <span className="text-sm text-muted-foreground">Projected</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(revenueData?.projectedRevenue[quarter] || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold">
                      {formatCurrency(
                        (revenueData?.actualRevenue[quarter] || 0) + 
                        (revenueData?.projectedRevenue[quarter] || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyRevenueSummary;
