
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

  const generateFileName = (prefix: string) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-');
    return `${prefix}_${date}_${time}.csv`;
  };

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

    console.log('Starting export with deals:', dealsToExport.length);

    // Updated export fields list after database cleanup - removed all unused fields
    const exportFields = [
      // Basic deal info (all stages)
      'deal_name',
      'stage',
      'internal_comment',
      
      // Lead stage fields
      'project_name',
      'lead_name',
      'customer_name',
      'region',
      'lead_owner',
      'priority',
      
      // Discussions stage fields
      'customer_need',
      'relationship_strength',
      
      // Qualified stage fields
      'budget',
      'probability',
      'expected_closing_date',
      'is_recurring',
      'customer_challenges',
      'business_value',
      'decision_maker_level',
      
      // RFQ stage fields
      'total_contract_value',
      'currency_type',
      'start_date',
      'end_date',
      'project_duration',
      'action_items',
      'rfq_received_date',
      'proposal_due_date',
      'rfq_status',
      
      // Offered stage fields
      'current_status',
      'closing',
      
      // Won stage fields
      'won_reason',
      'quarterly_revenue_q1',
      'quarterly_revenue_q2',
      'quarterly_revenue_q3',
      'quarterly_revenue_q4',
      'total_revenue',
      'signed_contract_date',
      'implementation_start_date',
      'handoff_status',
      
      // Lost stage fields
      'lost_reason',
      'need_improvement',
      
      // Dropped stage fields
      'drop_reason'
    ];

    console.log('Export fields to include:', exportFields);

    const validDeals = dealsToExport.filter(deal => {
      const hasBasicData = deal.stage && deal.deal_name;
      if (!hasBasicData) {
        console.warn("Skipping invalid deal during export:", deal);
      }
      return hasBasicData;
    });

    if (validDeals.length === 0) {
      toast({
        title: "No valid data to export",
        description: "No deals have sufficient data for export.",
        variant: "destructive",
      });
      return;
    }

    if (validDeals.length < dealsToExport.length) {
      console.warn(`Filtered out ${dealsToExport.length - validDeals.length} invalid deals during export`);
    }

    const headers = exportFields.join(',');
    
    const rows = validDeals.map((deal, index) => {
      console.log(`Processing deal ${index + 1}:`, deal.deal_name);
      return exportFields.map(field => {
        const value = deal[field as keyof Deal];
        if (value === null || value === undefined || value === '') return '';
        
        let stringValue = String(value);
        
        // Format dates consistently
        if (field.includes('date') && !field.includes('_id') && value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            stringValue = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }
        
        // Handle boolean values
        if (typeof value === 'boolean') {
          stringValue = value ? 'true' : 'false';
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
          stringValue = value.join(', ');
        }
        
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    console.log('Generated CSV content preview:', csvContent.substring(0, 500) + '...');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('Deals_Export'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Export completed: ${validDeals.length} deals exported`);
    toast({
      title: "Export successful",
      description: `Exported ${validDeals.length} deals to CSV`,
    });
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
