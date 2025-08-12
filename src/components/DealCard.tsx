import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Deal, STAGE_COLORS } from "@/types/deal";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface DealCardProps {
  deal: Deal;
  onClick: (e?: React.MouseEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onDelete?: (dealId: string) => void;
}

export const DealCard = ({ deal, onClick, isDragging, isSelected, selectionMode, onDelete }: DealCardProps) => {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols = { USD: '$', EUR: '€', INR: '₹' };
    return `${symbols[currency as keyof typeof symbols] || '€'}${amount.toLocaleString()}`;
  };

  return (
    <Card
      className={`deal-card cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'ring-2 ring-primary bg-primary/10 border-primary' : ''} ${
        selectionMode ? 'pl-8' : ''
      } animate-fade-in border-border/50 hover:bg-gradient-to-br hover:from-card hover:to-primary/5 button-scale`}
      onClick={onClick}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
            {deal.project_name || 'Untitled Deal'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!selectionMode && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deal.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-6 w-6 bg-destructive/10 hover:bg-destructive/20 text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Customer Name */}
        {deal.customer_name && (
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Customer:</span>
            <p className="text-sm font-medium text-foreground truncate">
              {deal.customer_name}
            </p>
          </div>
        )}
        
        {/* Lead Name */}
        {deal.lead_name && (
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Lead:</span>
            <p className="text-sm text-muted-foreground truncate">
              {deal.lead_name}
            </p>
          </div>
        )}
        
        {/* Lead Owner */}
        {deal.lead_owner && (
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Owner:</span>
            <p className="text-sm text-muted-foreground truncate">
              {deal.lead_owner}
            </p>
          </div>
        )}
        
        {/* Probability */}
        {deal.probability !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Probability:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-300 hover:bg-primary-variant" 
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary">{deal.probability}%</span>
            </div>
          </div>
        )}
        
        {/* Contract Value */}
        {deal.total_contract_value && (
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Value:</span>
            <p className="font-bold text-sm text-primary">
              {formatCurrency(deal.total_contract_value, deal.currency_type)}
            </p>
          </div>
        )}
        
        {/* Expected Closing Date */}
        {deal.expected_closing_date && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Close:</span>
            <p className="text-xs text-muted-foreground">
              {(() => {
                try {
                  return format(new Date(deal.expected_closing_date), 'MMM dd, yyyy');
                } catch {
                  return 'Invalid date';
                }
              })()}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/30">
          <span>Updated: {deal.modified_at ? (() => {
            try {
              return format(new Date(deal.modified_at), 'MMM dd');
            } catch {
              return 'Unknown';
            }
          })() : 'Unknown'}</span>
          
          {deal.priority && (
            <Badge 
              variant={deal.priority >= 4 ? 'destructive' : deal.priority >= 3 ? 'default' : 'secondary'}
              className="text-xs px-2 py-0"
            >
              P{deal.priority}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};