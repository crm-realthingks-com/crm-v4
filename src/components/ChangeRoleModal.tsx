
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldAlert, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
  role?: string;
}

interface ChangeRoleModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

const ChangeRoleModal = ({ open, onClose, user, onSuccess }: ChangeRoleModalProps) => {
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      toast({
        title: "Updating Role",
        description: "Updating user role with server-controlled security...",
      });

      const { data, error } = await supabase.functions.invoke('user-admin', {
        method: 'PUT',
        body: {
          userId: user.id,
          role
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: "User role updated successfully. Changes are now active.",
        });
        
        onSuccess();
        onClose();
      } else {
        throw new Error(data?.error || "Failed to update user role");
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setRole('user');
    }
  };

  const getRoleIcon = (roleValue: string) => {
    switch (roleValue) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <ShieldAlert className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (roleValue: string) => {
    switch (roleValue) {
      case 'admin':
        return 'Full system access including user management';
      case 'manager':
        return 'Advanced permissions with team management capabilities';
      default:
        return 'Standard user permissions';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current role: <span className="font-medium capitalize">{user.role || 'user'}</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div>User</div>
                      <div className="text-xs text-muted-foreground">Standard permissions</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    <div>
                      <div>Manager</div>
                      <div className="text-xs text-muted-foreground">Team management capabilities</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div>Admin</div>
                      <div className="text-xs text-muted-foreground">Full system access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {getRoleIcon(role)}
              {getRoleDescription(role)}
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              <strong>Security Note:</strong> Role changes are managed by server-controlled security policies and take effect immediately.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRoleModal;
