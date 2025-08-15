
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
  banned_until?: string;
}

interface ResetPasswordDialogProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
}

const ResetPasswordDialog = ({ user, isOpen, onClose }: ResetPasswordDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!user.email) {
      toast({
        title: "Error",
        description: "User email is required for password reset",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log('Resetting password for user:', user.email);
      
      toast({
        title: "Sending Reset Email",
        description: "Please wait while we send the password reset email...",
      });

      const { data, error } = await supabase.functions.invoke('user-admin', {
        method: 'POST',
        body: { 
          action: 'reset-password',
          email: user.email 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || "Failed to send reset password email");
      }

      if (data?.success) {
        console.log('Password reset email sent successfully:', data);
        
        toast({
          title: "Reset Email Sent",
          description: `Password reset email has been sent to ${user.email}`,
        });
        
        onClose();
      } else {
        throw new Error(data?.error || "Failed to send reset password email");
      }
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      let errorMessage = "An unexpected error occurred while sending the reset email.";
      
      if (error.message?.includes("Failed to fetch")) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.message?.includes("Authentication")) {
        errorMessage = "Authentication error. Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Reset Failed",
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

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset User Password</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send a password reset email to "{user.user_metadata?.full_name || user.email || user.id}"?
            <br /><br />
            <strong>This will:</strong>
            <br />• Send a password reset email to {user.email || 'the user'}
            <br />• Allow the user to create a new password
            <br />• The reset link will expire after 1 hour
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResetPassword}
            disabled={loading || !user.email}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetPasswordDialog;
