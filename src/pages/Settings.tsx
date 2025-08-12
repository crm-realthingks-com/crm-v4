
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import UserManagement from "@/components/UserManagement";

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      {/* User Management Tab */}
      <div className="space-y-6">
        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border-b-2 border-primary">
            <Users className="w-4 h-4" />
            User Management
          </div>
        </div>

        <UserManagement />
      </div>
    </div>
  );
};

export default Settings;
