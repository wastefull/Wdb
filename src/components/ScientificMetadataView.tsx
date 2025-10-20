import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { ChevronDown, FlaskConical, TrendingUp, Database, Calendar, FileText, Edit2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useState } from 'react';

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  
  // Scientific parameters
  Y_value?: number;
  D_value?: number;
  C_value?: number;
  M_value?: number;
  E_value?: number;
  CR_practical_mean?: number;
  CR_theoretical_mean?: number;
  CR_practical_CI95?: { lower: number; upper: number };
  CR_theoretical_CI95?: { lower: number; upper: number };
  confidence_level?: 'High' | 'Medium' | 'Low';
  sources?: Array<{
    title: string;
    authors?: string;
    year?: number;
    doi?: string;
    url?: string;
    weight?: number;
  }>;
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

interface ScientificMetadataViewProps {
  material: Material;
  onEditScientific?: () => void;
  isAdminModeActive?: boolean;
}

export function ScientificMetadataView({ material, onEditScientific, isAdminModeActive }: ScientificMetadataViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if this material has scientific data
  const hasScientificData = material.Y_value !== undefined || 
                            material.CR_practical_mean !== undefined ||
                            material.whitepaper_version !== undefined;
  
  // Show component even if no scientific data exists (for admin to add it)
  if (!hasScientificData && !isAdminModeActive) {
    return null;
  }
  
  // Validate confidence level against sources
  const validateConfidenceLevel = () => {
    const sourceCount = material.sources?.length || 0;
    const level = material.confidence_level;
    
    if (!level) return null;
    
    if (level === 'High' && sourceCount < 3) {
      return `High confidence requires 3+ sources (currently ${sourceCount})`;
    }
    if (level === 'Medium' && sourceCount < 2) {
      return `Medium confidence requires 2+ sources (currently ${sourceCount})`;
    }
    if ((level === 'High' || level === 'Medium') && sourceCount === 0) {
      return `${level} confidence requires supporting citations (currently 0)`;
    }
    
    return null;
  };
  
  const validationWarning = validateConfidenceLevel();
  
  const getConfidenceBadgeColor = (level?: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 p-3 bg-[#b8c8cb] dark:bg-[#2a2827] border border-[#211f1c] dark:border-white/20 rounded-md hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all">
          <FlaskConical className="w-4 h-4 text-black dark:text-white" />
          <span className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
            Scientific Data
          </span>
          {validationWarning && (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 ml-auto" />
          )}
          {material.confidence_level && (
            <Badge className={`${validationWarning ? '' : 'ml-auto'} ${getConfidenceBadgeColor(material.confidence_level)}`}>
              {material.confidence_level} Confidence
            </Badge>
          )}
          <ChevronDown className={`w-4 h-4 text-black dark:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-2 p-4 bg-white dark:bg-[#1a1918] border border-[#211f1c] dark:border-white/20">
          {/* Validation Warning */}
          {validationWarning && (
            <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
                <strong>Data Quality Issue:</strong> {validationWarning}
                {isAdminModeActive && ' Please edit scientific data to add sources or adjust confidence level.'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Admin Edit Button */}
          {isAdminModeActive && onEditScientific && (
            <div className="mb-4">
              <Button
                onClick={onEditScientific}
                size="sm"
                className="w-full bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
              >
                <Edit2 className="w-3 h-3 mr-2" />
                {hasScientificData ? 'Edit Scientific Data' : 'Add Scientific Data'}
              </Button>
            </div>
          )}
          
          {!hasScientificData && (
            <p className="text-[11px] text-black/60 dark:text-white/60 text-center py-4">
              No scientific data available. {isAdminModeActive && 'Click above to add scientific parameters.'}
            </p>
          )}
          
          {hasScientificData && (
          <div className="space-y-4">
            {/* Raw Parameters */}
            {(material.Y_value !== undefined || material.D_value !== undefined) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-black dark:text-white" />
                  <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                    Raw Parameters (0-1 normalized)
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {material.Y_value !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Yield (Y):</span>
                      <span className="text-black dark:text-white font-medium">{material.Y_value.toFixed(2)}</span>
                    </div>
                  )}
                  {material.D_value !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Degradability (D):</span>
                      <span className="text-black dark:text-white font-medium">{material.D_value.toFixed(2)}</span>
                    </div>
                  )}
                  {material.C_value !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Contamination (C):</span>
                      <span className="text-black dark:text-white font-medium">{material.C_value.toFixed(2)}</span>
                    </div>
                  )}
                  {material.M_value !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Maturity (M):</span>
                      <span className="text-black dark:text-white font-medium">{material.M_value.toFixed(2)}</span>
                    </div>
                  )}
                  {material.E_value !== undefined && material.E_value > 0 && (
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Energy (E):</span>
                      <span className="text-black dark:text-white font-medium">{material.E_value.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Composite Scores */}
            {(material.CR_practical_mean !== undefined || material.CR_theoretical_mean !== undefined) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-black dark:text-white" />
                  <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                    Composite Recyclability Index (CR)
                  </h4>
                </div>
                <div className="space-y-2 text-[11px]">
                  {material.CR_practical_mean !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-black/60 dark:text-white/60">Practical:</span>
                        <span className="text-black dark:text-white font-medium">
                          {(material.CR_practical_mean * 100).toFixed(1)}%
                        </span>
                      </div>
                      {material.CR_practical_CI95 && (
                        <div className="text-[10px] text-black/50 dark:text-white/50">
                          95% CI: [{(material.CR_practical_CI95.lower * 100).toFixed(1)}%, {(material.CR_practical_CI95.upper * 100).toFixed(1)}%]
                        </div>
                      )}
                    </div>
                  )}
                  {material.CR_theoretical_mean !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-black/60 dark:text-white/60">Theoretical:</span>
                        <span className="text-black dark:text-white font-medium">
                          {(material.CR_theoretical_mean * 100).toFixed(1)}%
                        </span>
                      </div>
                      {material.CR_theoretical_CI95 && (
                        <div className="text-[10px] text-black/50 dark:text-white/50">
                          95% CI: [{(material.CR_theoretical_CI95.lower * 100).toFixed(1)}%, {(material.CR_theoretical_CI95.upper * 100).toFixed(1)}%]
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Sources */}
            {material.sources && material.sources.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-black dark:text-white" />
                  <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                    Sources ({material.sources.length})
                  </h4>
                </div>
                <div className="space-y-1 text-[10px]">
                  {material.sources.map((source, idx) => (
                    <div key={idx} className="text-black/60 dark:text-white/60">
                      {source.authors && `${source.authors}. `}
                      {source.title}
                      {source.year && ` (${source.year})`}
                      {source.doi && (
                        <a 
                          href={`https://doi.org/${source.doi}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          DOI
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Metadata */}
            <div className="pt-2 border-t border-[#211f1c] dark:border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-black dark:text-white" />
                <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  Calculation Metadata
                </h4>
              </div>
              <div className="space-y-1 text-[10px] text-black/60 dark:text-white/60">
                {material.method_version && (
                  <div>Method: {material.method_version}</div>
                )}
                {material.whitepaper_version && (
                  <div>Whitepaper: v{material.whitepaper_version}</div>
                )}
                {material.calculation_timestamp && (
                  <div>Calculated: {formatTimestamp(material.calculation_timestamp)}</div>
                )}
              </div>
            </div>
          </div>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
