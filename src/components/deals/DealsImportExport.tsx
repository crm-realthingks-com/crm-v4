
import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useDealsImportExport } from "@/hooks/useDealsImportExport";
import { Deal } from "@/types/deal";

interface DealsImportExportProps {
  deals: Deal[];
  onImportComplete: (importedDeals: Deal[]) => void;
}

const DealsImportExport = ({ deals, onImportComplete }: DealsImportExportProps) => {
  const { handleImport, handleExportAll } = useDealsImportExport({
    onRefresh: () => console.log('Refreshing deals data')
  });

  const exportDeals = () => {
    handleExportAll(deals);
  };

  const importDeals = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportDeals} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <div>
        <input
          type="file"
          accept=".csv"
          onChange={importDeals}
          style={{ display: 'none' }}
          id="deals-import"
        />
        <label htmlFor="deals-import">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
};

export default DealsImportExport;
