import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X, Save, FolderOpen, Trash2, Search } from "lucide-react";
import { DealStage, DEAL_STAGES } from "@/types/deal";
import { cn } from "@/lib/utils";

export interface AdvancedFilterState {
  stages: DealStage[];
  regions: string[];
  leadOwners: string[];
  priorities: string[];
  probabilities: string[];
  handoffStatuses: string[];
  searchTerm: string;
  probabilityRange: [number, number];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedFilterState;
  createdAt: Date;
}

interface DealsAdvancedFilterProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  availableRegions: string[];
  availableLeadOwners: string[];
  availablePriorities: string[];
  availableProbabilities: string[];
  availableHandoffStatuses: string[];
}

const initialFilters: AdvancedFilterState = {
  stages: [],
  regions: [],
  leadOwners: [],
  priorities: [],
  probabilities: [],
  handoffStatuses: [],
  searchTerm: "",
  probabilityRange: [0, 100],
};

const REGION_OPTIONS = ["EU", "US", "Asia", "Other"];
const PRIORITY_OPTIONS = ["1", "2", "3", "4", "5"];
const PROBABILITY_OPTIONS = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];

export const DealsAdvancedFilter = ({
  filters,
  onFiltersChange,
  availableRegions,
  availableLeadOwners,
  availablePriorities,
  availableProbabilities,
  availableHandoffStatuses,
}: DealsAdvancedFilterProps) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(filters);
  const [isOpen, setIsOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("deals-saved-filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed.map((f: any) => ({ ...f, createdAt: new Date(f.createdAt) })));
      } catch (error) {
        console.error("Error loading saved filters:", error);
      }
    }
  }, []);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("deals-filters", JSON.stringify(filters));
  }, [filters]);

  const updateLocalFilter = <K extends keyof AdvancedFilterState>(
    key: K,
    value: AdvancedFilterState[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleMultiSelectValue = (
    key: keyof Pick<AdvancedFilterState, 'stages' | 'regions' | 'leadOwners' | 'priorities' | 'probabilities' | 'handoffStatuses'>,
    value: string
  ) => {
    const currentValues = localFilters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateLocalFilter(key, newValues);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    const clearedFilters = { ...initialFilters };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

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

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...localFilters },
      createdAt: new Date(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem("deals-saved-filters", JSON.stringify(updated));
    setFilterName("");
    setShowSaveDialog(false);
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setLocalFilters(savedFilter.filters);
    onFiltersChange(savedFilter.filters);
    setIsOpen(false);
  };

  const deleteSavedFilter = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem("deals-saved-filters", JSON.stringify(updated));
  };

  const activeFiltersCount = getActiveFiltersCount();

  const renderFilterSection = (
    title: string,
    key: keyof Pick<AdvancedFilterState, 'stages' | 'regions' | 'leadOwners' | 'priorities' | 'probabilities' | 'handoffStatuses'>,
    options: string[]
  ) => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-foreground">{title}</Label>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-3 py-1">
            <Checkbox
              id={`${key}-${option}`}
              checked={(localFilters[key] as string[]).includes(option)}
              onCheckedChange={() => toggleMultiSelectValue(key, option)}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`${key}-${option}`}
              className="text-sm text-muted-foreground cursor-pointer flex-1 leading-none"
            >
              {key === 'priorities' ? `Priority ${option}` : option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={filterRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[520px] p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="bg-background border border-border rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                  Save
                </Button>
                {savedFilters.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <h4 className="font-medium">Saved Filters</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {savedFilters.map((savedFilter) => (
                            <div
                              key={savedFilter.id}
                              className="flex items-center justify-between p-2 border rounded-md"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{savedFilter.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {savedFilter.createdAt.toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadSavedFilter(savedFilter)}
                                >
                                  Load
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSavedFilter(savedFilter.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Keyword Search */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Keyword Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search deal name, project, lead, customer, region..."
                    value={localFilters.searchTerm}
                    onChange={(e) => updateLocalFilter("searchTerm", e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="space-y-6">
                  {renderFilterSection("Stages", "stages", DEAL_STAGES)}
                  {renderFilterSection("Regions", "regions", REGION_OPTIONS)}
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  {renderFilterSection("Lead Owners", "leadOwners", availableLeadOwners)}
                  {renderFilterSection("Priorities", "priorities", PRIORITY_OPTIONS)}
                </div>

                {/* Column 3 */}
                <div className="space-y-6">
                  {renderFilterSection("Probabilities (%)", "probabilities", PROBABILITY_OPTIONS)}
                  {renderFilterSection("Handoff Status", "handoffStatuses", availableHandoffStatuses)}
                </div>
              </div>

              {/* Probability Range Slider */}
              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-sm font-semibold text-foreground">Probability Range (%)</Label>
                <div className="px-2">
                  <Slider
                    value={localFilters.probabilityRange}
                    onValueChange={(value) => updateLocalFilter("probabilityRange", value as [number, number])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{localFilters.probabilityRange[0]}%</span>
                    <span>{localFilters.probabilityRange[1]}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 px-4 py-3 border-t border-border bg-muted/20">
              <Button 
                onClick={clearAllFilters} 
                variant="outline" 
                size="sm"
                className="flex-1"
                disabled={activeFiltersCount === 0}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={applyFilters} size="sm" className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Set</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCurrentFilter} disabled={!filterName.trim()}>
                Save Filter
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
