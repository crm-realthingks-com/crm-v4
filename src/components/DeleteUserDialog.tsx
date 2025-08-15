
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
      console.log('Starting user deletion for:', user.id);
      
      toast({
        title: "Deleting User",
        description: "Please wait while we delete the user account...",
      });

      const { data, error } = await supabase.functions.invoke('user-admin', {
        method: 'DELETE',
        body: { userId: user.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || "Failed to delete user");
      }

      if (data?.success) {
        console.log('User deletion successful:', data);
        
        toast({
          title: "Success",
          description: `User "${user.user_metadata?.full_name || user.email}" has been deleted successfully.`,
        });
        
        onSuccess();
        onClose();
      } else {
        throw new Error(data?.error || "Failed to delete user");
      }
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      let errorMessage = "An unexpected error occurred while deleting the user.";
      
      if (error.message?.includes("Failed to fetch")) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.message?.includes("Authentication")) {
        errorMessage = "Authentication error. Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the user "{user.user_metadata?.full_name || user.email}"? 
            <br /><br />
            <strong>This action cannot be undone and will:</strong>
            <br />• Remove the user from the authentication system
            <br />• Delete all associated profile data
            <br />• Revoke all access permissions immediately
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
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
