
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface QuarterlyData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

interface YearlyRevenueData {
  year: number;
  target: number;
  actualRevenue: QuarterlyData;
  projectedRevenue: QuarterlyData;
  totalActual: number;
  totalProjected: number;
  hasDeals: boolean;
}

export const useYearlyRevenueData = (selectedYear: number) => {
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['yearly-revenue', selectedYear],
    queryFn: async (): Promise<YearlyRevenueData> => {
      console.log('Fetching revenue data for year:', selectedYear);

      // Get yearly target
      const { data: targetData } = await supabase
        .from('yearly_revenue_targets')
        .select('total_target')
        .eq('year', selectedYear)
        .single();

      console.log('Target data:', targetData);

      // Get all deals and filter by year
      const { data: allDeals } = await supabase
        .from('deals')
        .select('*');

      console.log('All deals:', allDeals);

      // Filter deals by year based on expected_closing_date or signed_contract_date
      const dealsForYear = allDeals?.filter(deal => {
        const expectedClosingDate = deal.expected_closing_date ? new Date(deal.expected_closing_date).getFullYear() : null;
        const signedContractDate = deal.signed_contract_date ? new Date(deal.signed_contract_date).getFullYear() : null;
        
        return expectedClosingDate === selectedYear || signedContractDate === selectedYear;
      }) || [];

      console.log(`Deals for year ${selectedYear}:`, dealsForYear);

      // If no deals exist for this year, return empty data
      if (dealsForYear.length === 0) {
        return {
          year: selectedYear,
          target: targetData?.total_target || 0,
          actualRevenue: { q1: 0, q2: 0, q3: 0, q4: 0 },
          projectedRevenue: { q1: 0, q2: 0, q3: 0, q4: 0 },
          totalActual: 0,
          totalProjected: 0,
          hasDeals: false
        };
      }

      // Separate Won and RFQ deals from filtered results
      const wonDeals = dealsForYear.filter(deal => deal.stage === 'Won');
      const rfqDeals = dealsForYear.filter(deal => deal.stage === 'RFQ');

      console.log('Won deals for year:', wonDeals);
      console.log('RFQ deals for year:', rfqDeals);

      const actualRevenue: QuarterlyData = { q1: 0, q2: 0, q3: 0, q4: 0 };
      const projectedRevenue: QuarterlyData = { q1: 0, q2: 0, q3: 0, q4: 0 };

      let totalActualRevenue = 0;
      let totalProjectedRevenue = 0;

      // Process Won deals for actual revenue
      wonDeals?.forEach(deal => {
        console.log('Processing Won deal:', deal.deal_name, 'Total Revenue:', deal.total_revenue);
        
        if (deal.total_revenue) {
          const revenue = Number(deal.total_revenue);
          if (!isNaN(revenue)) {
            totalActualRevenue += revenue;
            console.log('Added actual revenue:', revenue, 'Running total:', totalActualRevenue);
            
            // Quarterly breakdown for actual revenue (Q1-Q4 Revenue from Won deals)
            if (deal.quarterly_revenue_q1) {
              const q1Revenue = Number(deal.quarterly_revenue_q1);
              if (!isNaN(q1Revenue)) {
                actualRevenue.q1 += q1Revenue;
              }
            }
            if (deal.quarterly_revenue_q2) {
              const q2Revenue = Number(deal.quarterly_revenue_q2);
              if (!isNaN(q2Revenue)) {
                actualRevenue.q2 += q2Revenue;
              }
            }
            if (deal.quarterly_revenue_q3) {
              const q3Revenue = Number(deal.quarterly_revenue_q3);
              if (!isNaN(q3Revenue)) {
                actualRevenue.q3 += q3Revenue;
              }
            }
            if (deal.quarterly_revenue_q4) {
              const q4Revenue = Number(deal.quarterly_revenue_q4);
              if (!isNaN(q4Revenue)) {
                actualRevenue.q4 += q4Revenue;
              }
            }
          }
        }
      });

      // Process RFQ deals for projected revenue - sum all TCV values by expected closing quarter
      rfqDeals?.forEach(deal => {
        console.log('Processing RFQ deal:', deal.deal_name, 'Total Contract Value:', deal.total_contract_value, 'Expected Closing:', deal.expected_closing_date);
        
        if (deal.total_contract_value) {
          const contractValue = Number(deal.total_contract_value);
          if (!isNaN(contractValue)) {
            totalProjectedRevenue += contractValue;
            console.log('Added projected revenue:', contractValue, 'Running total:', totalProjectedRevenue);
            
            // Determine quarter based on expected_closing_date
            if (deal.expected_closing_date) {
              try {
                const closingDate = new Date(deal.expected_closing_date);
                const closingYear = closingDate.getFullYear();
                
                // Only include deals that are expected to close in the selected year
                if (closingYear === selectedYear) {
                  const month = closingDate.getMonth() + 1; // getMonth() returns 0-11
                  let quarter: keyof QuarterlyData;
                  
                  if (month >= 1 && month <= 3) {
                    quarter = 'q1';
                  } else if (month >= 4 && month <= 6) {
                    quarter = 'q2';
                  } else if (month >= 7 && month <= 9) {
                    quarter = 'q3';
                  } else {
                    quarter = 'q4';
                  }
                  
                  projectedRevenue[quarter] += contractValue;
                  console.log(`Added ${contractValue} to projected ${quarter.toUpperCase()} for year ${selectedYear}`);
                } else {
                  console.log(`Deal ${deal.deal_name} expected to close in ${closingYear}, not ${selectedYear} - not included in quarterly breakdown`);
                }
              } catch (error) {
                console.warn('Invalid closing date for deal:', deal.deal_name, deal.expected_closing_date);
                // If date is invalid, don't include in quarterly breakdown but still count in total
              }
            } else {
              console.log(`Deal ${deal.deal_name} has no expected_closing_date - not included in quarterly breakdown`);
            }
          }
        }
      });

      console.log('Final totals - Actual:', totalActualRevenue, 'Projected:', totalProjectedRevenue);
      console.log('Quarterly actual:', actualRevenue);
      console.log('Quarterly projected:', projectedRevenue);

      return {
        year: selectedYear,
        target: targetData?.total_target || 0,
        actualRevenue,
        projectedRevenue,
        totalActual: totalActualRevenue,
        totalProjected: totalProjectedRevenue,
        hasDeals: true
      };
    },
  });

  return { revenueData, isLoading, error };
};

export const useAvailableYears = () => {
  const { data: years, isLoading } = useQuery({
    queryKey: ['available-years'],
    queryFn: async (): Promise<number[]> => {
      // Get years from deals
      const { data: deals } = await supabase
        .from('deals')
        .select('expected_closing_date')
        .not('expected_closing_date', 'is', null);

      // Get years from targets
      const { data: targets } = await supabase
        .from('yearly_revenue_targets')
        .select('year');

      const yearSet = new Set<number>();
      
      // Add current year
      yearSet.add(new Date().getFullYear());
      
      // Add years from deals
      deals?.forEach(deal => {
        if (deal.expected_closing_date) {
          const year = new Date(deal.expected_closing_date).getFullYear();
          yearSet.add(year);
        }
      });

      // Add years from targets
      targets?.forEach(target => {
        yearSet.add(target.year);
      });

      return Array.from(yearSet).sort((a, b) => b - a);
    },
  });

  return { years: years || [], isLoading };
};

// Hook to get live dashboard stats
export const useDashboardStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...');
      
      const { data: deals } = await supabase
        .from('deals')
        .select('*');

      console.log('All deals for dashboard stats:', deals);

      const totalDeals = deals?.length || 0;
      
      // Calculate total revenue from Won deals using total_revenue field
      let totalRevenue = 0;
      deals?.forEach(deal => {
        console.log('Processing deal for dashboard:', deal.deal_name, 'Stage:', deal.stage, 'Total Revenue:', deal.total_revenue);
        
        if (deal.stage === 'Won' && deal.total_revenue) {
          const revenue = Number(deal.total_revenue);
          totalRevenue += revenue;
          console.log('Adding revenue from Won deal:', revenue, 'Running total:', totalRevenue);
        }
      });
      
      console.log('Final dashboard total revenue:', totalRevenue);
      
      const wonDeals = deals?.filter(deal => deal.stage === 'Won').length || 0;

      return {
        totalDeals,
        totalRevenue,
        wonDeals,
        todayMeetings: 0 // Remove meetings dependency
      };
    },
  });

  return { stats, isLoading };
};
