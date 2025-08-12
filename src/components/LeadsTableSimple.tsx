
import React from 'react';
import { BulkActionsBar } from "@/components/BulkActionsBar";

interface LeadsTableSimpleProps {
  selectedCount: number;
}

const LeadsTableSimple = ({ selectedCount }: LeadsTableSimpleProps) => {
  const handleDelete = () => {
    console.log('Deleting selected leads');
  };

  const handleExport = () => {
    console.log('Exporting selected leads');
  };

  const handleClearSelection = () => {
    console.log('Clearing selection');
  };

  return (
    <div>
      {selectedCount > 0 && (
        <BulkActionsBar 
          selectedCount={selectedCount}
          onDelete={handleDelete}
          onExport={handleExport}
          onClearSelection={handleClearSelection}
        />
      )}
      {/* Rest of leads table content would go here */}
    </div>
  );
};

export default LeadsTableSimple;
