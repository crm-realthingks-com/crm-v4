
import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Download, Upload, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useImportExport } from "@/hooks/useImportExport";

const Contacts = () => {
  const { toast } = useToast();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  console.log('Contacts page: Rendering with refreshTrigger:', refreshTrigger);

  // Use the import/export hook
  const { handleImport, handleExportAll } = useImportExport({
    moduleName: 'contacts',
    tableName: 'contacts',
    onRefresh: () => {
      console.log('Contacts page: Import hook triggering refresh...');
      setRefreshTrigger(prev => {
        const newTrigger = prev + 1;
        console.log('Contacts page: Refresh trigger updated from', prev, 'to', newTrigger);
        return newTrigger;
      });
    }
  });

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
    
    setIsImporting(true);
    
    try {
      console.log('Contacts page: Calling handleImport from hook');
      const result = await handleImport(file);
      
      console.log('Contacts page: Import completed with result:', result);
      
      // Reset the file input to allow reimporting the same file
      event.target.value = '';
      console.log('Contacts page: File input reset');
      
    } catch (error: any) {
      console.error('Contacts page: Import error caught:', error);
      console.error('Contacts page: Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Additional error handling - show user-friendly message
      if (!error.message) {
        toast({
          title: "Import Error",
          description: "An unknown error occurred during import. Please try again.",
          variant: "destructive",
        });
      }
      
      // Reset file input on error too
      event.target.value = '';
    } finally {
      console.log('Contacts page: Setting isImporting to false');
      setIsImporting(false);
    }
  };

  const handleExportContacts = async () => {
    try {
      console.log('Contacts page: Starting export');
      toast({
        title: "Export Started",
        description: "Preparing contacts export...",
      });

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      console.log('Contacts page: Export query result:', { count: contacts?.length, error });

      if (error) {
        console.error('Contacts page: Database fetch error:', error);
        throw error;
      }

      if (!contacts || contacts.length === 0) {
        toast({
          title: "No Data",
          description: "No contacts available to export",
          variant: "destructive",
        });
        return;
      }

      await handleExportAll(contacts);
      
      toast({
        title: "Export Completed",
        description: `${contacts.length} contacts exported successfully.`,
      });
    } catch (error) {
      console.error('Contacts page: Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
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
          <p className="text-muted-foreground">Manage your contact database</p>
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
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportContacts}>
                <Download className="w-4 h-4 mr-2" />
                Export All
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

      {/* Contact Table */}
      <ContactTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        onExportReady={() => {}}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Contacts;
