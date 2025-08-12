import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS } from "@/types/deal";
import { Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { InlineEditCell } from "./InlineEditCell";
import { ColumnCustomizer, ColumnConfig } from "./ColumnCustomizer";
import { ImportExportBar } from "./ImportExportBar";
import { BulkActionsBar } from "./BulkActionsBar";
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
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [sortBy, setSortBy] = useState<string>("modified_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>([
    // Only include active fields from the deals pipeline (removed all specified fields)
    // Basic fields
    { field: 'project_name', label: 'Project', visible: true, order: 0 },
    { field: 'customer_name', label: 'Customer', visible: true, order: 1 },
    { field: 'lead_owner', label: 'Lead Owner', visible: true, order: 2 },
    { field: 'stage', label: 'Stage', visible: true, order: 3 },
    { field: 'priority', label: 'Priority', visible: true, order: 4 },
    { field: 'total_contract_value', label: 'Value', visible: true, order: 5 },
    { field: 'expected_closing_date', label: 'Expected Close', visible: true, order: 6 },
    
    // Lead stage fields
    { field: 'lead_name', label: 'Lead Name', visible: false, order: 7 },
    { field: 'region', label: 'Region', visible: false, order: 8 },
    { field: 'probability', label: 'Probability', visible: false, order: 9 },
    { field: 'internal_comment', label: 'Comment', visible: false, order: 10 },
    
    // Discussions stage fields
    { field: 'customer_need', label: 'Customer Need', visible: false, order: 11 },
    { field: 'customer_challenges', label: 'Customer Challenges', visible: false, order: 12 },
    { field: 'relationship_strength', label: 'Relationship Strength', visible: false, order: 13 },
    
    // Qualified stage fields
    { field: 'budget', label: 'Budget', visible: false, order: 14 },
    { field: 'business_value', label: 'Business Value', visible: false, order: 15 },
    { field: 'decision_maker_level', label: 'Decision Maker Level', visible: false, order: 16 },
    
    // RFQ stage fields
    { field: 'is_recurring', label: 'Is Recurring', visible: false, order: 17 },
    { field: 'project_duration', label: 'Duration', visible: false, order: 18 },
    { field: 'start_date', label: 'Start Date', visible: false, order: 19 },
    { field: 'end_date', label: 'End Date', visible: false, order: 20 },
    { field: 'rfq_received_date', label: 'RFQ Received', visible: false, order: 21 },
    { field: 'proposal_due_date', label: 'Proposal Due', visible: false, order: 22 },
    { field: 'rfq_status', label: 'RFQ Status', visible: false, order: 23 },
    
    // Offered stage fields
    { field: 'currency_type', label: 'Currency', visible: false, order: 24 },
    { field: 'action_items', label: 'Action Items', visible: false, order: 25 },
    { field: 'current_status', label: 'Current Status', visible: false, order: 26 },
    { field: 'closing', label: 'Closing', visible: false, order: 27 },
    
    // Final stage fields
    { field: 'won_reason', label: 'Won Reason', visible: false, order: 28 },
    { field: 'lost_reason', label: 'Lost Reason', visible: false, order: 29 },
    { field: 'need_improvement', label: 'Need Improvement', visible: false, order: 30 },
    { field: 'drop_reason', label: 'Drop Reason', visible: false, order: 31 },
    
    // Won stage specific fields
    { field: 'quarterly_revenue_q1', label: 'Q1 Revenue', visible: false, order: 32 },
    { field: 'quarterly_revenue_q2', label: 'Q2 Revenue', visible: false, order: 33 },
    { field: 'quarterly_revenue_q3', label: 'Q3 Revenue', visible: false, order: 34 },
    { field: 'quarterly_revenue_q4', label: 'Q4 Revenue', visible: false, order: 35 },
    { field: 'total_revenue', label: 'Total Revenue', visible: false, order: 36 },
    { field: 'signed_contract_date', label: 'Signed Date', visible: false, order: 37 },
    { field: 'implementation_start_date', label: 'Implementation Start', visible: false, order: 38 },
    { field: 'handoff_status', label: 'Handoff Status', visible: false, order: 39 },
    
    // System fields
    { field: 'created_at', label: 'Created', visible: false, order: 40 },
    { field: 'modified_at', label: 'Updated', visible: false, order: 41 },
  ]);
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

  const filteredAndSortedDeals = deals
    .filter(deal => {
      const searchValue = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        deal.project_name?.toLowerCase().includes(searchValue) ||
        deal.customer_name?.toLowerCase().includes(searchValue) ||
        deal.lead_name?.toLowerCase().includes(searchValue) ||
        deal.lead_owner?.toLowerCase().includes(searchValue) ||
        deal.region?.toLowerCase().includes(searchValue) ||
        deal.internal_comment?.toLowerCase().includes(searchValue) ||
        deal.customer_need?.toLowerCase().includes(searchValue) ||
        deal.customer_challenges?.toLowerCase().includes(searchValue) ||
        deal.relationship_strength?.toLowerCase().includes(searchValue) ||
        deal.budget?.toLowerCase().includes(searchValue) ||
        deal.business_value?.toLowerCase().includes(searchValue) ||
        deal.decision_maker_level?.toLowerCase().includes(searchValue) ||
        deal.currency_type?.toLowerCase().includes(searchValue) ||
        deal.action_items?.toLowerCase().includes(searchValue) ||
        deal.current_status?.toLowerCase().includes(searchValue) ||
        deal.won_reason?.toLowerCase().includes(searchValue) ||
        deal.lost_reason?.toLowerCase().includes(searchValue) ||
        deal.need_improvement?.toLowerCase().includes(searchValue) ||
        deal.drop_reason?.toLowerCase().includes(searchValue) ||
        deal.stage?.toLowerCase().includes(searchValue) ||
        String(deal.priority || '').includes(searchValue) ||
        String(deal.probability || '').includes(searchValue) ||
        String(deal.project_duration || '').includes(searchValue) ||
        String(deal.total_contract_value || '').includes(searchValue);
      
      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
      
      return matchesSearch && matchesStage;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width container with proper spacing */}
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header with filters and controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card rounded-lg p-4 border shadow-sm card-hover"
             style={{ background: 'var(--gradient-subtle)' }}>
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search all deal details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all hover:border-primary/50 focus:border-primary"
              />
            </div>
            
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as DealStage | "all")}>
              <SelectTrigger className="w-[180px] hover:border-primary/50 transition-all hover:shadow-sm input-focus">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {DEAL_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
              <SelectTrigger className="w-[150px] hover:border-primary/50 transition-all hover:shadow-sm input-focus">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modified_at">Updated</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="total_contract_value">Value</SelectItem>
                <SelectItem value="expected_closing_date">Expected Close</SelectItem>
                <SelectItem value="project_name">Project</SelectItem>
                <SelectItem value="customer_name">Customer</SelectItem>
                <SelectItem value="lead_owner">Lead Owner</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
              <SelectTrigger className="w-[100px] hover:border-primary/50 transition-all hover:shadow-sm input-focus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ColumnCustomizer
              columns={columns}
              onUpdate={setColumns}
            />
          </div>
        </div>

        {/* Table */}
        <div className="w-full border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card"
             style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-primary/5 transition-colors"
                          style={{ background: 'var(--gradient-subtle)' }}>
                  <TableHead className="w-12 min-w-12">
                    <Checkbox
                      checked={selectedDeals.size === filteredAndSortedDeals.length && filteredAndSortedDeals.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="transition-all hover:scale-110"
                    />
                  </TableHead>
                  {visibleColumns.map(column => (
                    <TableHead key={column.field} className={`font-semibold cursor-pointer hover:bg-primary/10 transition-colors ${
                      column.field === 'project_name' ? 'min-w-[200px]' :
                      column.field === 'customer_name' ? 'min-w-[150px]' :
                      column.field === 'lead_owner' ? 'min-w-[140px]' :
                      column.field === 'stage' ? 'min-w-[120px]' :
                      column.field === 'priority' ? 'min-w-[100px]' :
                      column.field === 'total_contract_value' ? 'min-w-[120px]' :
                      column.field === 'expected_closing_date' ? 'min-w-[140px]' :
                      'min-w-[120px]'
                    }`}
                    onClick={() => {
                      if (sortBy === column.field) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(column.field);
                        setSortOrder("desc");
                      }
                    }}>
                      <div className="flex items-center gap-2">
                        {column.label}
                        {sortBy === column.field && (
                          sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-20 min-w-20">Actions</TableHead>
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
                  filteredAndSortedDeals.map((deal) => (
                    <TableRow 
                      key={deal.id} 
                      className={`hover:bg-primary/5 transition-all duration-200 hover:shadow-sm ${
                        selectedDeals.has(deal.id) ? 'bg-primary/10 shadow-sm' : ''
                      }`}
                      style={{ 
                        background: selectedDeals.has(deal.id) ? 'var(--primary-50)' : undefined,
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
                        <TableCell key={column.field} className="font-medium">
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
                            <Edit className="w-3 h-3" />
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
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <BulkActionsBar
          selectedCount={selectedDeals.size}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedDeals(new Set())}
        />
      </div>
    </div>
  );
};
