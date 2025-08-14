
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  email?: string;
}

interface ContactTableHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  pageContacts: Contact[];
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export const ContactTableHeader = ({
  searchTerm,
  setSearchTerm,
  selectedContacts,
  setSelectedContacts,
  pageContacts,
  sortField,
  sortDirection,
  onSort
}: ContactTableHeaderProps) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageContactIds = pageContacts.slice(0, 50).map(c => c.id);
      setSelectedContacts(pageContactIds);
    } else {
      setSelectedContacts([]);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
        <Checkbox
          checked={selectedContacts.length > 0 && selectedContacts.length === Math.min(pageContacts.length, 50)}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>
    </div>
  );
};
