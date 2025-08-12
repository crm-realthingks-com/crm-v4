
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RevertConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RevertConfirmDialog = ({ open, onConfirm, onCancel }: RevertConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Confirm Revert
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to revert changes for this record? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm Revert
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
