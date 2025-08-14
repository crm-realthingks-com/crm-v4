import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { DealStage, DEAL_STAGES } from "@/types/deal";
import { cn } from "@/lib/utils";

export interface FilterState {
  stage: DealStage | "all";
  region: string;
  leadOwner: string;
  priority: string;
  probability: [number];
  expectedClosingDateStart?: Date;
  expectedClosingDateEnd?: Date;
  dealName: string;
  projectName: string;
  leadName: string;
  customerName: string;
}

interface DealsFilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  children: React.ReactNode;
}

const initialFilters: FilterState = {
  stage: "all",
  region: "",
  leadOwner: "",
  priority: "all",
  probability: [0],
  dealName: "",
  projectName: "",
  leadName: "",
  customerName: "",
};

export const DealsFilterPanel = ({ filters, onFiltersChange, children }: DealsFilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    const clearedFilters = { ...initialFilters };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.stage !== "all") count++;
    if (filters.region) count++;
    if (filters.leadOwner) count++;
    if (filters.priority) count++;
    if (filters.probability[0] > 0) count++;
    if (filters.expectedClosingDateStart || filters.expectedClosingDateEnd) count++;
    if (filters.dealName) count++;
    if (filters.projectName) count++;
    if (filters.leadName) count++;
    if (filters.customerName) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Deals
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Stage Filter */}
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={localFilters.stage} onValueChange={(value) => updateFilter("stage", value as DealStage | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
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
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              placeholder="Enter region..."
              value={localFilters.region}
              onChange={(e) => updateFilter("region", e.target.value)}
            />
          </div>

          {/* Lead Owner Filter */}
          <div className="space-y-2">
            <Label htmlFor="leadOwner">Lead Owner</Label>
            <Input
              id="leadOwner"
              placeholder="Enter lead owner..."
              value={localFilters.leadOwner}
              onChange={(e) => updateFilter("leadOwner", e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={localFilters.priority} onValueChange={(value) => updateFilter("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="1">High (1)</SelectItem>
                <SelectItem value="2">Medium (2)</SelectItem>
                <SelectItem value="3">Low (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Probability Filter */}
          <div className="space-y-2">
            <Label>Probability (minimum %)</Label>
            <div className="px-3">
          <Slider
            value={localFilters.probability}
            onValueChange={(value) => updateFilter("probability", value as [number])}
            max={100}
            step={5}
            className="w-full"
          />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium">{localFilters.probability[0]}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Expected Closing Date Range */}
          <div className="space-y-2">
            <Label>Expected Closing Date</Label>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.expectedClosingDateStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.expectedClosingDateStart ? (
                      format(localFilters.expectedClosingDateStart, "PPP")
                    ) : (
                      <span>From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.expectedClosingDateStart}
                    onSelect={(date) => updateFilter("expectedClosingDateStart", date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.expectedClosingDateEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.expectedClosingDateEnd ? (
                      format(localFilters.expectedClosingDateEnd, "PPP")
                    ) : (
                      <span>To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.expectedClosingDateEnd}
                    onSelect={(date) => updateFilter("expectedClosingDateEnd", date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Text Search Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealName">Deal Name</Label>
              <Input
                id="dealName"
                placeholder="Search deal name..."
                value={localFilters.dealName}
                onChange={(e) => updateFilter("dealName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Search project name..."
                value={localFilters.projectName}
                onChange={(e) => updateFilter("projectName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadName">Lead Name</Label>
              <Input
                id="leadName"
                placeholder="Search lead name..."
                value={localFilters.leadName}
                onChange={(e) => updateFilter("leadName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Search customer name..."
                value={localFilters.customerName}
                onChange={(e) => updateFilter("customerName", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-6 border-t">
            <Button 
              onClick={clearAllFilters} 
              variant="outline" 
              className="flex-1"
              disabled={activeFiltersCount === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};