
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { Deal } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";
import { useDealsImportExport } from "@/hooks/useDealsImportExport";

type ImportedDeal = Partial<Deal> & { shouldUpdate?: boolean };

interface ImportExportBarProps {
  deals: Deal[];
  onImport: (deals: ImportedDeal[]) => void;
  onExport: (selectedDeals?: Deal[]) => void;
  selectedDeals?: Deal[];
  onRefresh: () => void;
}

export const ImportExportBar = ({ deals, onImport, onExport, selectedDeals, onRefresh }: ImportExportBarProps) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  // Use the simplified deals import/export logic
  const { handleImport, handleExportAll, handleExportSelected } = useDealsImportExport({
    onRefresh
  });

  const handleExport = () => {
    const dealsToExport = selectedDeals && selectedDeals.length > 0 ? selectedDeals : deals;
    
    if (dealsToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no deals to export.",
        variant: "destructive",
      });
      return;
    }

    console.log('ImportExportBar: Starting export with deals:', dealsToExport.length);
    handleExportAll(dealsToExport);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      console.log('File selected for import:', file.name, 'Size:', file.size);
    }
  };

  const handleImportClick = async () => {
    if (!importFile) return;

    try {
      console.log('Starting import with centralized logic...');
      await handleImport(importFile);
      setImportFile(null);
      
      // Refresh the deals data after successful import
      onRefresh();
      
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover-scale button-scale"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import deals from CSV file</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Deals from CSV</DialogTitle>
          </DialogHeader>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV file</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
              
              {importFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    File: {importFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleImportClick}
                  disabled={!importFile}
                  className="hover-scale"
                >
                  Import Deals
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="hover-scale button-scale"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export deals to CSV file</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
