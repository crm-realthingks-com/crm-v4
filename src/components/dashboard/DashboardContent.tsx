
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardContent = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Add Contact",
      description: "Create a new contact",
      icon: Users,
      action: () => navigate("/contacts"),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Add Lead",
      description: "Create a new lead",
      icon: Target,
      action: () => navigate("/leads"),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Add Deal",
      description: "Create a new deal",
      icon: TrendingUp,
      action: () => navigate("/deals"),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.title} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={action.action}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.bgColor}`}>
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Create
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Activity tracking will show recent changes to contacts, leads, and deals.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
