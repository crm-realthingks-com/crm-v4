
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ContactColumnConfig {
  field: string;
  label: string;
  visible: boolean;
  order: number;
}

interface ContactColumnCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ContactColumnConfig[];
  onColumnsChange: (columns: ContactColumnConfig[]) => void;
}

export const ContactColumnCustomizer = ({ 
  open, 
  onOpenChange, 
  columns, 
  onColumnsChange 
}: ContactColumnCustomizerProps) => {
  const [localColumns, setLocalColumns] = useState<ContactColumnConfig[]>(columns);

  const handleVisibilityChange = (field: string, visible: boolean) => {
    const updatedColumns = localColumns.map(col => 
      col.field === field ? { ...col, visible } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultColumns: ContactColumnConfig[] = [
      { field: 'contact_name', label: 'Contact Name', visible: true, order: 0 },
      { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
      { field: 'position', label: 'Position', visible: true, order: 2 },
      { field: 'email', label: 'Email', visible: true, order: 3 },
      { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
      { field: 'region', label: 'Region', visible: true, order: 5 }, // Changed from country to region
      { field: 'contact_owner', label: 'Contact Owner', visible: true, order: 6 },
      { field: 'industry', label: 'Industry', visible: false, order: 7 },
      { field: 'contact_source', label: 'Source', visible: false, order: 8 },
      { field: 'lead_status', label: 'Status', visible: false, order: 9 },
    ];
    setLocalColumns(defaultColumns);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Customize Columns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Check/uncheck to show/hide columns in the contact table.
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto p-1">
            {localColumns.map((column) => (
              <div
                key={column.field}
                className="flex items-center space-x-3 p-3 border rounded-lg bg-card hover:bg-muted/30"
              >
                <Checkbox
                  id={column.field}
                  checked={column.visible}
                  onCheckedChange={(checked) => 
                    handleVisibilityChange(column.field, Boolean(checked))
                  }
                />
                
                <Label
                  htmlFor={column.field}
                  className="flex-1 cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button onClick={handleSave}>
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
