import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Download, Upload, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleContactsImportExport } from "@/hooks/useSimpleContactsImportExport";

const Contacts = () => {
  const { toast } = useToast();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('Contacts page: Rendering with refreshTrigger:', refreshTrigger);

  const onRefresh = () => {
    console.log('Contacts page: Triggering refresh...');
    setRefreshTrigger(prev => {
      const newTrigger = prev + 1;
      console.log('Contacts page: Refresh trigger updated from', prev, 'to', newTrigger);
      return newTrigger;
    });
  };

  const { handleImport, handleExport, isImporting } = useSimpleContactsImportExport(onRefresh);

  const handleImportClick = () => {
    console.log('Contacts page: Import clicked, opening file dialog');
    fileInputRef.current?.click();
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Contacts page: File selected for import:', file?.name);
    
    if (!file) {
      console.log('Contacts page: No file selected, returning');
      return;
    }

    console.log('Contacts page: Starting CSV import process with file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    try {
      console.log('Contacts page: Calling handleImport from hook');
      await handleImport(file);
      
      // Reset the file input to allow reimporting the same file
      event.target.value = '';
      console.log('Contacts page: File input reset');
      
    } catch (error: any) {
      console.error('Contacts page: Import error caught:', error);
      
      // Reset file input on error too
      event.target.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.length} contacts deleted successfully`,
      });
      
      setSelectedContacts([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
          <p className="text-muted-foreground"> </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setShowColumnCustomizer(true)}
            size="icon"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" disabled={isImporting}>
                <Download className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Action'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              {selectedContacts.length > 0 && (
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedContacts.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Hidden file input for CSV import */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        className="hidden"
        disabled={isImporting}
      />

      {/* Contact Table */}
      <ContactTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Contacts;
