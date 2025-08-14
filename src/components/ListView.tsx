import { useState, useEffect, useMemo, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS } from "@/types/deal";
import { Search, Filter, X, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { InlineEditCell } from "./InlineEditCell";
import { ColumnCustomizer, ColumnConfig } from "./ColumnCustomizer";
import { ImportExportBar } from "./ImportExportBar";
import { BulkActionsBar } from "./BulkActionsBar";
import { DealsAdvancedFilter, AdvancedFilterState } from "./DealsAdvancedFilter";
import { useToast } from "@/hooks/use-toast";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => void;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: Partial<Deal>[]) => void;
}

export const ListView = ({ 
  deals, 
  onDealClick, 
  onUpdateDeal, 
  onDeleteDeals, 
  onImportDeals 
}: ListViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<AdvancedFilterState>({
    stages: [],
    regions: [],
    leadOwners: [],
    priorities: [],
    probabilities: [],
    handoffStatuses: [],
    searchTerm: "",
    probabilityRange: [0, 100],
  });
  const [sortBy, setSortBy] = useState<string>("modified_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { field: 'project_name', label: 'Project', visible: true, order: 0 },
    { field: 'customer_name', label: 'Customer', visible: true, order: 1 },
    { field: 'lead_owner', label: 'Lead Owner', visible: true, order: 2 },
    { field: 'stage', label: 'Stage', visible: true, order: 3 },
    { field: 'priority', label: 'Priority', visible: true, order: 4 },
    { field: 'total_contract_value', label: 'Value', visible: true, order: 5 },
    { field: 'expected_closing_date', label: 'Expected Close', visible: true, order: 6 },
    { field: 'lead_name', label: 'Lead Name', visible: false, order: 7 },
    { field: 'region', label: 'Region', visible: false, order: 8 },
    { field: 'probability', label: 'Probability', visible: false, order: 9 },
    { field: 'internal_comment', label: 'Comment', visible: false, order: 10 },
    { field: 'customer_need', label: 'Customer Need', visible: false, order: 11 },
    { field: 'customer_challenges', label: 'Customer Challenges', visible: false, order: 12 },
    { field: 'relationship_strength', label: 'Relationship Strength', visible: false, order: 13 },
    { field: 'budget', label: 'Budget', visible: false, order: 14 },
    { field: 'business_value', label: 'Business Value', visible: false, order: 15 },
    { field: 'decision_maker_level', label: 'Decision Maker Level', visible: false, order: 16 },
    { field: 'is_recurring', label: 'Is Recurring', visible: false, order: 17 },
    { field: 'project_duration', label: 'Duration', visible: false, order: 18 },
    { field: 'start_date', label: 'Start Date', visible: false, order: 19 },
    { field: 'end_date', label: 'End Date', visible: false, order: 20 },
    { field: 'rfq_received_date', label: 'RFQ Received', visible: false, order: 21 },
    { field: 'proposal_due_date', label: 'Proposal Due', visible: false, order: 22 },
    { field: 'rfq_status', label: 'RFQ Status', visible: false, order: 23 },
    { field: 'currency_type', label: 'Currency', visible: false, order: 24 },
    { field: 'action_items', label: 'Action Items', visible: false, order: 25 },
    { field: 'current_status', label: 'Current Status', visible: false, order: 26 },
    { field: 'closing', label: 'Closing', visible: false, order: 27 },
    { field: 'won_reason', label: 'Won Reason', visible: false, order: 28 },
    { field: 'lost_reason', label: 'Lost Reason', visible: false, order: 29 },
    { field: 'need_improvement', label: 'Need Improvement', visible: false, order: 30 },
    { field: 'drop_reason', label: 'Drop Reason', visible: false, order: 31 },
    { field: 'quarterly_revenue_q1', label: 'Q1 Revenue', visible: false, order: 32 },
    { field: 'quarterly_revenue_q2', label: 'Q2 Revenue', visible: false, order: 33 },
    { field: 'quarterly_revenue_q3', label: 'Q3 Revenue', visible: false, order: 34 },
    { field: 'quarterly_revenue_q4', label: 'Q4 Revenue', visible: false, order: 35 },
    { field: 'total_revenue', label: 'Total Revenue', visible: false, order: 36 },
    { field: 'signed_contract_date', label: 'Signed Date', visible: false, order: 37 },
    { field: 'implementation_start_date', label: 'Implementation Start', visible: false, order: 38 },
    { field: 'handoff_status', label: 'Handoff Status', visible: false, order: 39 },
    { field: 'created_at', label: 'Created', visible: false, order: 40 },
    { field: 'modified_at', label: 'Updated', visible: false, order: 41 },
  ]);

  // Column width state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    'project_name': 200,
    'customer_name': 150,
    'lead_owner': 140,
    'stage': 120,
    'priority': 100,
    'total_contract_value': 120,
    'expected_closing_date': 140,
  });

  // Resize state
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  const { toast } = useToast();

  const formatCurrency = (amount: number | undefined, currency: string = 'EUR') => {
    if (!amount) return '-';
    const symbols = { USD: '$', EUR: '€', INR: '₹' };
    return `${symbols[currency as keyof typeof symbols] || '€'}${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  // Handle column resize
  const handleMouseDown = (e: React.MouseEvent, field: string) => {
    setIsResizing(field);
    setStartX(e.clientX);
    setStartWidth(columnWidths[field] || 120);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + deltaX); // Minimum width of 80px
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  };

  const handleMouseUp = () => {
    if (isResizing) {
      // Save to localStorage
      localStorage.setItem('deals-column-widths', JSON.stringify(columnWidths));
      setIsResizing(null);
    }
  };

  // Mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startX, startWidth, columnWidths]);

  // Load column widths from localStorage
  useEffect(() => {
    const savedWidths = localStorage.getItem('deals-column-widths');
    if (savedWidths) {
      try {
        const parsed = JSON.parse(savedWidths);
        setColumnWidths(parsed);
      } catch (e) {
        console.error('Failed to parse saved column widths:', e);
      }
    }
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(new Set(filteredAndSortedDeals.map(deal => deal.id)));
    } else {
      setSelectedDeals(new Set());
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    const newSelected = new Set(selectedDeals);
    if (checked) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    
    onDeleteDeals(Array.from(selectedDeals));
    setSelectedDeals(new Set());
    
    toast({
      title: "Deals deleted",
      description: `Successfully deleted ${selectedDeals.size} deals`,
    });
  };

  const handleBulkExport = () => {
    const selectedDealObjects = deals.filter(deal => selectedDeals.has(deal.id));
    // Export logic handled by ImportExportBar
  };

  const handleInlineEdit = async (dealId: string, field: string, value: any) => {
    try {
      await onUpdateDeal(dealId, { [field]: value });
      toast({
        title: "Deal updated",
        description: "Field updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update deal field",
        variant: "destructive",
      });
    }
  };

  const getFieldType = (field: string): 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'stage' | 'priority' | 'currency' => {
    if (field === 'stage') return 'stage';
    if (field === 'priority') return 'priority';
    if (['total_contract_value', 'total_revenue', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4'].includes(field)) return 'currency';
    if (['expected_closing_date', 'start_date', 'end_date', 'rfq_received_date', 'proposal_due_date', 'signed_contract_date', 'implementation_start_date'].includes(field)) return 'date';
    if (['internal_comment', 'customer_need', 'action_items', 'won_reason', 'lost_reason', 'need_improvement', 'drop_reason'].includes(field)) return 'textarea';
    if (['is_recurring'].includes(field)) return 'boolean';
    if (['customer_challenges', 'relationship_strength', 'business_value', 'decision_maker_level', 'rfq_status', 'handoff_status'].includes(field)) return 'select';
    if (['probability', 'project_duration'].includes(field)) return 'number';
    return 'text';
  };

  const getFieldOptions = (field: string): string[] => {
    const optionsMap: Record<string, string[]> = {
      customer_challenges: ['Open', 'Ongoing', 'Done'],
      relationship_strength: ['Low', 'Medium', 'High'],
      business_value: ['Open', 'Ongoing', 'Done'],
      decision_maker_level: ['Open', 'Ongoing', 'Done'],
      is_recurring: ['Yes', 'No', 'Unclear'],
      rfq_status: ['Drafted', 'Submitted', 'Rejected', 'Accepted'],
      handoff_status: ['Not Started', 'In Progress', 'Complete'],
      currency_type: ['EUR', 'USD', 'INR'],
    };
    return optionsMap[field] || [];
  };

  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // Generate available options for multi-select filters
  const availableOptions = useMemo(() => {
    const regions = Array.from(new Set(deals.map(d => d.region).filter(Boolean)));
    const leadOwners = Array.from(new Set(deals.map(d => d.lead_owner).filter(Boolean)));
    const priorities = Array.from(new Set(deals.map(d => String(d.priority)).filter(p => p !== 'undefined')));
    const probabilities = Array.from(new Set(deals.map(d => String(d.probability)).filter(p => p !== 'undefined')));
    const handoffStatuses = Array.from(new Set(deals.map(d => d.handoff_status).filter(Boolean)));
    
    return {
      regions,
      leadOwners,
      priorities,
      probabilities,
      handoffStatuses,
    };
  }, [deals]);

  useEffect(() => {
    const savedFilters = localStorage.getItem('deals-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
        setSearchTerm(parsed.searchTerm || "");
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
  }, []);

  useEffect(() => {
    const filtersWithSearch = { ...filters, searchTerm };
    localStorage.setItem('deals-filters', JSON.stringify(filtersWithSearch));
  }, [filters, searchTerm]);

  const filteredAndSortedDeals = deals
    .filter(deal => {
      // Combine search from both searchTerm and filters.searchTerm
      const allSearchTerms = [searchTerm, filters.searchTerm].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !allSearchTerms || 
        deal.deal_name?.toLowerCase().includes(allSearchTerms) ||
        deal.project_name?.toLowerCase().includes(allSearchTerms) ||
        deal.lead_name?.toLowerCase().includes(allSearchTerms) ||
        deal.customer_name?.toLowerCase().includes(allSearchTerms) ||
        deal.region?.toLowerCase().includes(allSearchTerms);
      
      // Apply multi-select filters
      const matchesStages = filters.stages.length === 0 || filters.stages.includes(deal.stage);
      const matchesRegions = filters.regions.length === 0 || filters.regions.includes(deal.region || '');
      const matchesLeadOwners = filters.leadOwners.length === 0 || filters.leadOwners.includes(deal.lead_owner || '');
      const matchesPriorities = filters.priorities.length === 0 || filters.priorities.includes(String(deal.priority || ''));
      const matchesProbabilities = filters.probabilities.length === 0 || filters.probabilities.includes(String(deal.probability || ''));
      const matchesHandoffStatuses = filters.handoffStatuses.length === 0 || filters.handoffStatuses.includes(deal.handoff_status || '');
      
      // Probability range filter
      const dealProbability = deal.probability || 0;
      const matchesProbabilityRange = dealProbability >= filters.probabilityRange[0] && dealProbability <= filters.probabilityRange[1];
      
      return matchesSearch && matchesStages && matchesRegions && matchesLeadOwners && 
             matchesPriorities && matchesProbabilities && matchesHandoffStatuses && matchesProbabilityRange;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Get the values for the sort field
      if (['priority', 'probability', 'project_duration'].includes(sortBy)) {
        aValue = a[sortBy as keyof Deal] || 0;
        bValue = b[sortBy as keyof Deal] || 0;
      } else if (['total_contract_value', 'total_revenue', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4'].includes(sortBy)) {
        aValue = a[sortBy as keyof Deal] || 0;
        bValue = b[sortBy as keyof Deal] || 0;
      } else if (['expected_closing_date', 'start_date', 'end_date', 'created_at', 'modified_at', 'rfq_received_date', 'proposal_due_date', 'signed_contract_date', 'implementation_start_date'].includes(sortBy)) {
        const aDateValue = a[sortBy as keyof Deal];
        const bDateValue = b[sortBy as keyof Deal];
        aValue = new Date(typeof aDateValue === 'string' ? aDateValue : 0);
        bValue = new Date(typeof bDateValue === 'string' ? bDateValue : 0);
      } else if (sortBy === 'is_recurring') {
        // Handle boolean field
        aValue = a.is_recurring ? 1 : 0;
        bValue = b.is_recurring ? 1 : 0;
      } else {
        // String fields
        aValue = String(a[sortBy as keyof Deal] || '').toLowerCase();
        bValue = String(b[sortBy as keyof Deal] || '').toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeals = filteredAndSortedDeals.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.stages.length > 0) count++;
    if (filters.regions.length > 0) count++;
    if (filters.leadOwners.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.probabilities.length > 0) count++;
    if (filters.handoffStatuses.length > 0) count++;
    if (filters.searchTerm) count++;
    if (filters.probabilityRange[0] > 0 || filters.probabilityRange[1] < 100) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      stages: [],
      regions: [],
      leadOwners: [],
      priorities: [],
      probabilities: [],
      handoffStatuses: [],
      searchTerm: "",
      probabilityRange: [0, 100],
    });
    setSearchTerm("");
  };

  const activeFiltersCount = getActiveFiltersCount();
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm;

  // Get selected deal objects for export
  const selectedDealObjects = deals.filter(deal => selectedDeals.has(deal.id));

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header with search and filters */}
      <div className="flex-shrink-0 p-4 bg-background border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search all deal details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all hover:border-primary/50 focus:border-primary"
              />
            </div>
            
            <DealsAdvancedFilter 
              filters={filters} 
              onFiltersChange={setFilters}
              availableRegions={availableOptions.regions}
              availableLeadOwners={availableOptions.leadOwners}
              availablePriorities={availableOptions.priorities}
              availableProbabilities={availableOptions.probabilities}
              availableHandoffStatuses={availableOptions.handoffStatuses}
            />

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ImportExportBar
              deals={deals}
              onImport={onImportDeals}
              onExport={() => {}}
              selectedDeals={selectedDealObjects}
              onRefresh={() => {}}
            />
            <ColumnCustomizer
              columns={columns}
              onUpdate={setColumns}
            />
          </div>
        </div>
      </div>

      {/* Scrollable table area - Takes remaining height */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table ref={tableRef} className="w-full">
          <TableHeader className="sticky top-0 bg-primary/5 backdrop-blur-sm z-20 border-b-2 border-primary/20">
            <TableRow className="hover:bg-primary/10 transition-colors border-b border-primary/20">
              <TableHead className="w-12 min-w-12 bg-primary/10 border-r border-primary/20">
                <Checkbox
                  checked={selectedDeals.size === paginatedDeals.length && paginatedDeals.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="transition-all hover:scale-110"
                />
              </TableHead>
              {visibleColumns.map(column => (
                <TableHead 
                  key={column.field} 
                  className="font-semibold cursor-pointer hover:bg-primary/15 transition-colors relative bg-primary/10 border-r border-primary/20 text-primary-foreground"
                  style={{ 
                    width: `${columnWidths[column.field] || 120}px`,
                    minWidth: `${columnWidths[column.field] || 120}px`,
                    maxWidth: `${columnWidths[column.field] || 120}px`
                  }}
                  onClick={() => {
                    if (sortBy === column.field) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy(column.field);
                      setSortOrder("desc");
                    }
                  }}
                >
                  <div className="flex items-center gap-2 pr-4 text-foreground font-bold">
                    {column.label}
                    {sortBy === column.field && (
                      sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/40 bg-transparent"
                    onMouseDown={(e) => handleMouseDown(e, column.field)}
                    style={{
                      background: isResizing === column.field ? 'hsl(var(--primary) / 0.5)' : undefined
                    }}
                  />
                </TableHead>
              ))}
              <TableHead className="w-20 min-w-20 bg-primary/10 border-r border-primary/20 text-foreground font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8 text-muted-foreground">
                  No deals found
                </TableCell>
              </TableRow>
            ) : (
              paginatedDeals.map((deal) => (
                <TableRow 
                  key={deal.id} 
                  className={`hover:bg-primary/5 transition-all duration-200 hover:shadow-sm ${
                    selectedDeals.has(deal.id) ? 'bg-primary/10 shadow-sm' : ''
                  }`}
                  style={{ 
                    background: selectedDeals.has(deal.id) ? 'hsl(var(--primary) / 0.1)' : undefined,
                    borderLeft: selectedDeals.has(deal.id) ? '3px solid hsl(var(--primary))' : undefined 
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDeals.has(deal.id)}
                      onCheckedChange={(checked) => handleSelectDeal(deal.id, Boolean(checked))}
                      className="transition-all hover:scale-110"
                    />
                  </TableCell>
                  {visibleColumns.map(column => (
                    <TableCell 
                      key={column.field} 
                      className="font-medium"
                      style={{ 
                        width: `${columnWidths[column.field] || 120}px`,
                        minWidth: `${columnWidths[column.field] || 120}px`,
                        maxWidth: `${columnWidths[column.field] || 120}px`
                      }}
                    >
                      <InlineEditCell
                        value={deal[column.field as keyof Deal]}
                        field={column.field}
                        dealId={deal.id}
                        onSave={handleInlineEdit}
                        type={getFieldType(column.field)}
                        options={getFieldOptions(column.field)}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDealClick(deal)}
                        className="hover-scale p-1 h-7 w-7"
                        title="Open deal form"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onDeleteDeals([deal.id]);
                          toast({
                            title: "Deal deleted",
                            description: `Successfully deleted ${deal.project_name || 'deal'}`,
                          });
                        }}
                        className="hover-scale p-1 h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete deal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed bottom section with bulk actions and pagination */}
      <div className="flex-shrink-0 bg-background border-t">
        {selectedDeals.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedDeals.size}
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onClearSelection={() => setSelectedDeals(new Set())}
          />
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <span>Total: <strong>{filteredAndSortedDeals.length}</strong> deals</span>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span>Active filters:</span>
                {filters.stages.length > 0 && <Badge variant="secondary">Stages: {filters.stages.join(', ')}</Badge>}
                {filters.regions.length > 0 && <Badge variant="secondary">Regions: {filters.regions.join(', ')}</Badge>}
                {filters.leadOwners.length > 0 && <Badge variant="secondary">Owners: {filters.leadOwners.join(', ')}</Badge>}
                {filters.priorities.length > 0 && <Badge variant="secondary">Priorities: {filters.priorities.join(', ')}</Badge>}
                {filters.probabilities.length > 0 && <Badge variant="secondary">Probabilities: {filters.probabilities.join(', ')}%</Badge>}
                {searchTerm && <Badge variant="secondary">Search: {searchTerm}</Badge>}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"  
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
