
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    role?: string;
  };
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
      setRole(user.user_metadata?.role || 'user');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'PUT',
        body: {
          userId: user.id,
          role
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
