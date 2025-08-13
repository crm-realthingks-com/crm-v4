
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Index = () => {
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch contacts count
      const { count: contactsCount } = await supabase
        .from("contacts")
        .select("*", { count: 'exact', head: true });

      // Fetch leads count
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: 'exact', head: true });

      // Fetch deals count and revenue
      const { data: deals } = await supabase
        .from("deals")
        .select("amount");

      const totalRevenue = deals?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

      setStats({
        totalContacts: contactsCount || 0,
        totalLeads: leadsCount || 0,
        totalDeals: deals?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader />
      <DashboardStats
        totalContacts={stats.totalContacts}
        totalLeads={stats.totalLeads}
        totalDeals={stats.totalDeals}
        totalRevenue={stats.totalRevenue}
      />
      <DashboardContent />
    </div>
  );
};

export default Index;
