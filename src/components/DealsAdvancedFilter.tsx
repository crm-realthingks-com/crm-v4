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
  probabilityRange: [0, 100]
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
  availableHandoffStatuses
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
        setSavedFilters(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt)
        })));
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
  const updateLocalFilter = <K extends keyof AdvancedFilterState,>(key: K, value: AdvancedFilterState[K]) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const toggleMultiSelectValue = (key: keyof Pick<AdvancedFilterState, 'stages' | 'regions' | 'leadOwners' | 'priorities' | 'probabilities' | 'handoffStatuses'>, value: string) => {
    const currentValues = localFilters[key] as string[];
    const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
    updateLocalFilter(key, newValues);
  };
  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };
  const clearAllFilters = () => {
    const clearedFilters = {
      ...initialFilters
    };
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
      filters: {
        ...localFilters
      },
      createdAt: new Date()
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
  const renderMultiSelectSection = (title: string, key: keyof Pick<AdvancedFilterState, 'stages' | 'regions' | 'leadOwners' | 'priorities' | 'probabilities' | 'handoffStatuses'>, options: string[]) => <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {options.map(option => <div key={option} className="flex items-center space-x-2">
            <Checkbox id={`${key}-${option}`} checked={(localFilters[key] as string[]).includes(option)} onCheckedChange={() => toggleMultiSelectValue(key, option)} className="h-4 w-4" />
            <Label htmlFor={`${key}-${option}`} className="text-sm font-normal cursor-pointer flex-1">
              {key === 'priorities' ? `Priority ${option}` : option}
            </Label>
          </div>)}
      </div>
    </div>;
  return <div className="relative" ref={filterRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start" side="bottom" sideOffset={5}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Advanced Filters
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Filter Set</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="filter-name">Filter Name</Label>
                          <Input id="filter-name" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Enter filter name..." />
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
                  
                  {savedFilters.length > 0 && <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FolderOpen className="w-4 h-4 mr-1" />
                          Load
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <h4 className="font-medium">Saved Filters</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {savedFilters.map(savedFilter => <div key={savedFilter.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{savedFilter.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {savedFilter.createdAt.toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => loadSavedFilter(savedFilter)}>
                                    Load
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteSavedFilter(savedFilter.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>)}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Keyword Search</Label>
                
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {renderMultiSelectSection("Stages", "stages", DEAL_STAGES)}
                  {renderMultiSelectSection("Regions", "regions", REGION_OPTIONS)}
                  {renderMultiSelectSection("Priorities", "priorities", PRIORITY_OPTIONS)}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {renderMultiSelectSection("Lead Owners", "leadOwners", availableLeadOwners)}
                  {renderMultiSelectSection("Probabilities (%)", "probabilities", PROBABILITY_OPTIONS)}
                  {renderMultiSelectSection("Handoff Status", "handoffStatuses", availableHandoffStatuses)}
                </div>
              </div>

              {/* Probability Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Probability Range (%)</Label>
                <div className="px-3">
                  <Slider value={localFilters.probabilityRange} onValueChange={value => updateLocalFilter("probabilityRange", value as [number, number])} max={100} step={5} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{localFilters.probabilityRange[0]}%</span>
                    <span>{localFilters.probabilityRange[1]}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={clearAllFilters} variant="outline" className="flex-1" disabled={activeFiltersCount === 0}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>;
};