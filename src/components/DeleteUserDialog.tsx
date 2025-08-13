
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

const DeleteUserDialog = ({ open, onClose, user, onSuccess }: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'DELETE',
        body: {
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the user "{user.user_metadata?.full_name || user.email}"? 
            This action cannot be undone and will permanently remove the user from your system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
