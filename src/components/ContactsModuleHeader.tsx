
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { ContactColumnCustomizer } from "./ContactColumnCustomizer";
import { ContactColumn } from "@/types/columns";

interface ContactsModuleHeaderProps {
  onAddContact: () => void;
  columns: ContactColumn[];
  onColumnsChange: (columns: ContactColumn[]) => void;
}

const ContactsModuleHeader = ({ onAddContact, columns, onColumnsChange }: ContactsModuleHeaderProps) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Convert ContactColumn to ContactColumnConfig format for the customizer
  const convertToColumnConfig = (columns: ContactColumn[]) => {
    return columns.map((col, index) => ({
      field: col.key,
      label: col.label,
      visible: col.visible,
      order: index
    }));
  };

  // Convert ContactColumnConfig back to ContactColumn format
  const convertFromColumnConfig = (configs: any[]) => {
    return configs.map(config => ({
      key: config.field,
      label: config.label,
      visible: config.visible,
      type: config.type || 'text'
    }));
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
        <p className="text-muted-foreground">Manage your business contacts</p>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => setIsCustomizerOpen(true)} 
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Customize Columns
        </Button>
        <ContactColumnCustomizer 
          open={isCustomizerOpen}
          onOpenChange={setIsCustomizerOpen}
          columns={convertToColumnConfig(columns)}
          onColumnsChange={(configs) => onColumnsChange(convertFromColumnConfig(configs))}
        />
        <Button onClick={onAddContact} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>
    </div>
  );
};

export default ContactsModuleHeader;
