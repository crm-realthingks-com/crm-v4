import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export interface ColumnConfig {
  field: string;
  label: string;
  visible: boolean;
  order: number;
}

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  onUpdate: (columns: ColumnConfig[]) => void;
}

export const ColumnCustomizer = ({ columns, onUpdate }: ColumnCustomizerProps) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  const handleVisibilityChange = (field: string, visible: boolean) => {
    const updatedColumns = localColumns.map(col => 
      col.field === field ? { ...col, visible } : col
    );
    setLocalColumns(updatedColumns);
    // Apply changes immediately
    onUpdate(updatedColumns);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedColumns = items.map((col, index) => ({
      ...col,
      order: index
    }));

    setLocalColumns(reorderedColumns);
    // Apply changes immediately
    onUpdate(reorderedColumns);
  };

  const handleSave = () => {
    onUpdate(localColumns);
  };

  const handleReset = () => {
    // Include ALL possible fields from all stages
    const allAvailableFields = [
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
      { field: 'project_type', label: 'Project Type', visible: false, order: 18 },
      { field: 'duration', label: 'Duration', visible: false, order: 19 },
      { field: 'revenue', label: 'Revenue', visible: false, order: 20 },
      { field: 'start_date', label: 'Start Date', visible: false, order: 21 },
      { field: 'end_date', label: 'End Date', visible: false, order: 22 },
      
      // Offered stage fields
      { field: 'currency_type', label: 'Currency', visible: false, order: 23 },
      { field: 'action_items', label: 'Action Items', visible: false, order: 24 },
      { field: 'current_status', label: 'Current Status', visible: false, order: 25 },
      
      // Final stage fields
      { field: 'won_reason', label: 'Won Reason', visible: false, order: 26 },
      { field: 'lost_reason', label: 'Lost Reason', visible: false, order: 27 },
      { field: 'need_improvement', label: 'Need Improvement', visible: false, order: 28 },
      { field: 'drop_reason', label: 'Drop Reason', visible: false, order: 29 },
      
      // System fields
      { field: 'created_at', label: 'Created', visible: false, order: 30 },
      { field: 'modified_at', label: 'Updated', visible: false, order: 31 },
    ];
    setLocalColumns(allAvailableFields);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="hover-scale button-scale">
              <Settings2 className="w-4 h-4 mr-2" />
              Columns
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Customize Columns</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Tip:</strong> Drag to reorder, check/uncheck to show/hide columns. All stage-specific fields are available.
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="columns">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 max-h-[400px] overflow-y-auto p-1"
                    >
                      {localColumns.map((column, index) => (
                        <Draggable
                          key={column.field}
                          draggableId={column.field}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200 ${
                                snapshot.isDragging ? 'bg-primary/10 border-primary shadow-md scale-105' : 'bg-card hover:bg-muted/30 hover:shadow-sm'
                              }`}
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                              </div>
                              
                              <Checkbox
                                id={column.field}
                                checked={column.visible}
                                onCheckedChange={(checked) => 
                                  handleVisibilityChange(column.field, Boolean(checked))
                                }
                              />
                              
                              <Label
                                htmlFor={column.field}
                                className="flex-1 cursor-pointer"
                              >
                                {column.label}
                              </Label>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleReset} className="button-scale">
                  Reset to Default
                </Button>
                <Button onClick={handleSave} className="btn-primary button-scale">
                  Apply Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipTrigger>
      <TooltipContent>
        <p>Customize visible columns and their order</p>
      </TooltipContent>
    </Tooltip>
  );
};