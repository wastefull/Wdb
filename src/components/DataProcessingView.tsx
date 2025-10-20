import { useState } from 'react';
import { ArrowLeft, Play, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  articles: any;
  
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

interface RecyclabilityParameters {
  // Core Parameters (0-1 scale)
  Y: number;  // Yield - fraction successfully recovered
  D: number;  // Degradability - quality loss per cycle (inverted, higher = better)
  C: number;  // Contamination tolerance
  M: number;  // Maturity - infrastructure availability
  
  // Mode selection
  useTheoretical: boolean;
  
  // Theoretical mode: clean input assumption
  U_clean_theo: number;  // 1.0 default for theoretical
  
  // Practical mode: realistic cleanliness
  U_clean_prac: number;  // 0.6 default for practical
}

const defaultParameters: RecyclabilityParameters = {
  Y: 0.75,
  D: 0.80,
  C: 0.70,
  M: 0.65,
  useTheoretical: false,
  U_clean_theo: 1.0,
  U_clean_prac: 0.6,
};

// Material category to parameter mapping (simplified estimates)
const categoryDefaults: Record<string, Partial<RecyclabilityParameters>> = {
  'Glass': { Y: 0.95, D: 1.0, C: 0.85, M: 0.95 },
  'Metals': { Y: 0.90, D: 0.95, C: 0.80, M: 0.90 },
  'Paper & Cardboard': { Y: 0.70, D: 0.60, C: 0.65, M: 0.85 },
  'Plastics': { Y: 0.60, D: 0.50, C: 0.40, M: 0.70 },
  'Electronics & Batteries': { Y: 0.50, D: 0.40, C: 0.30, M: 0.50 },
  'Fabrics & Textiles': { Y: 0.40, D: 0.45, C: 0.35, M: 0.40 },
  'Building Materials': { Y: 0.65, D: 0.70, C: 0.60, M: 0.60 },
  'Organic/Natural Waste': { Y: 0.20, D: 0.30, C: 0.25, M: 0.30 },
};

/**
 * Calculate Composite Recyclability Index (CR)
 * Based on WasteDB methodology from Recyclability.md
 * 
 * CR = (Y × (1 - D) × C × M × U_clean)
 * 
 * Where:
 * - Y: Yield (recovery fraction)
 * - D: Degradability (inverted - higher D means less degradation)
 * - C: Contamination tolerance
 * - M: Maturity (infrastructure availability)
 * - U_clean: Cleanliness factor (1.0 theoretical, 0.6 practical)
 */
function calculateRecyclability(params: RecyclabilityParameters): number {
  const U_clean = params.useTheoretical ? params.U_clean_theo : params.U_clean_prac;
  
  // CR = Y × (1 - D) × C × M × U_clean
  // Note: D is already inverted in our model (higher = better)
  const CR = params.Y * params.D * params.C * params.M * U_clean;
  
  // Return as 0-100 scale
  return Math.round(CR * 100);
}

/**
 * Get recyclability label based on score
 */
function getRecyclabilityLabel(score: number): string {
  const normalized = score / 100;
  
  if (normalized >= 0.80) return 'Easily recyclable';
  if (normalized >= 0.60) return 'Recyclable with care';
  if (normalized >= 0.40) return 'Limited recyclability';
  if (normalized >= 0.20) return 'Technically recyclable';
  return 'Unrecyclable / Experimental';
}

interface DataProcessingViewProps {
  materials: Material[];
  onBack: () => void;
  onUpdateMaterials: (materials: Material[]) => void;
}

export function DataProcessingView({ materials, onBack, onUpdateMaterials }: DataProcessingViewProps) {
  const [parameters, setParameters] = useState<RecyclabilityParameters>(defaultParameters);
  const [processing, setProcessing] = useState(false);
  const [previewResults, setPreviewResults] = useState<Array<{ id: string; name: string; category: string; oldScore: number; newScore: number; label: string }>>([]);

  const handleParameterChange = (key: keyof RecyclabilityParameters, value: number | boolean) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handlePreviewCalculation = () => {
    const results = materials.map(material => {
      // Get category-specific defaults
      const categoryParams = categoryDefaults[material.category] || {};
      
      // Merge with global parameters
      const materialParams: RecyclabilityParameters = {
        ...parameters,
        ...categoryParams,
      };
      
      const newScore = calculateRecyclability(materialParams);
      const label = getRecyclabilityLabel(newScore);
      
      return {
        id: material.id,
        name: material.name,
        category: material.category,
        oldScore: material.recyclability,
        newScore,
        label,
      };
    });
    
    setPreviewResults(results);
    toast.success(`Calculated scores for ${results.length} materials`);
  };

  const handleApplyToAll = () => {
    setProcessing(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const updatedMaterials = materials.map(material => {
        const result = previewResults.find(r => r.id === material.id);
        if (result) {
          // Get category-specific parameters
          const categoryParams = categoryDefaults[material.category] || {};
          const materialParams = { ...parameters, ...categoryParams };
          
          // Calculate both theoretical and practical scores
          const practicalScore = calculateRecyclability({ ...materialParams, useTheoretical: false });
          const theoreticalScore = calculateRecyclability({ ...materialParams, useTheoretical: true });
          
          // Calculate confidence intervals (simplified - using 10% margin for now)
          const practicalMargin = practicalScore * 0.10;
          const theoreticalMargin = theoreticalScore * 0.10;
          
          // Determine confidence level based on parameter variance (simplified heuristic)
          let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Medium';
          const paramVariance = Math.abs(materialParams.Y - 0.75) + 
                                Math.abs(materialParams.D - 0.80) + 
                                Math.abs(materialParams.C - 0.70) + 
                                Math.abs(materialParams.M - 0.65);
          
          if (paramVariance < 0.3) confidenceLevel = 'High';
          else if (paramVariance > 0.6) confidenceLevel = 'Low';
          
          return {
            ...material,
            recyclability: result.newScore,
            
            // Store scientific parameters (normalized 0-1)
            Y_value: materialParams.Y,
            D_value: materialParams.D,
            C_value: materialParams.C,
            M_value: materialParams.M,
            E_value: material.E_value || 0, // Energy - not calculated yet, preserve existing or 0
            
            // Store calculated composite scores (normalized 0-1)
            CR_practical_mean: practicalScore / 100,
            CR_theoretical_mean: theoreticalScore / 100,
            
            // Store confidence intervals
            CR_practical_CI95: {
              lower: Math.max(0, (practicalScore - practicalMargin) / 100),
              upper: Math.min(1, (practicalScore + practicalMargin) / 100),
            },
            CR_theoretical_CI95: {
              lower: Math.max(0, (theoreticalScore - theoreticalMargin) / 100),
              upper: Math.min(1, (theoreticalScore + theoreticalMargin) / 100),
            },
            
            // Store confidence and provenance
            confidence_level: confidenceLevel,
            whitepaper_version: '2025.1',
            calculation_timestamp: timestamp,
            method_version: 'CR-v1',
            
            // Preserve existing sources or initialize empty
            sources: material.sources || [],
          };
        }
        return material;
      });
      
      onUpdateMaterials(updatedMaterials);
      
      // Update preview results to reflect that changes were applied
      // Now "old" scores should match "new" scores
      setPreviewResults(previewResults.map(result => ({
        ...result,
        oldScore: result.newScore,
      })));
      
      toast.success(`Updated recyclability scores for ${materials.length} materials with scientific metadata`);
    } catch (error) {
      toast.error('Failed to update materials');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetParameters = () => {
    setParameters(defaultParameters);
    setPreviewResults([]);
    toast.info('Parameters reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
          aria-label="Go back"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div>
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
            Data Processing
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            Calculate recyclability scores using WasteDB methodology
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters Panel */}
        <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
            Global Parameters
          </h3>
          
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-[#211f1c]/20 dark:border-white/20">
              <div>
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Calculation Mode
                </Label>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  {parameters.useTheoretical ? 'Theoretical (ideal conditions)' : 'Practical (real-world)'}
                </p>
              </div>
              <Switch
                checked={parameters.useTheoretical}
                onCheckedChange={(checked) => handleParameterChange('useTheoretical', checked)}
              />
            </div>

            {/* Yield (Y) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Yield (Y)
                </Label>
                <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  {(parameters.Y * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[parameters.Y * 100]}
                onValueChange={([value]) => handleParameterChange('Y', value / 100)}
                min={0}
                max={100}
                step={1}
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                Fraction of material successfully recovered after processing
              </p>
            </div>

            {/* Degradability (D) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Degradability (D)
                </Label>
                <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  {(parameters.D * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[parameters.D * 100]}
                onValueChange={([value]) => handleParameterChange('D', value / 100)}
                min={0}
                max={100}
                step={1}
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                Quality retention per recycling cycle (higher = less degradation)
              </p>
            </div>

            {/* Contamination Tolerance (C) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Contamination Tolerance (C)
                </Label>
                <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  {(parameters.C * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[parameters.C * 100]}
                onValueChange={([value]) => handleParameterChange('C', value / 100)}
                min={0}
                max={100}
                step={1}
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                Process sensitivity to contaminants
              </p>
            </div>

            {/* Maturity (M) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Maturity (M)
                </Label>
                <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  {(parameters.M * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[parameters.M * 100]}
                onValueChange={([value]) => handleParameterChange('M', value / 100)}
                min={0}
                max={100}
                step={1}
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                Infrastructure availability and readiness
              </p>
            </div>

            {/* Cleanliness Factor */}
            <div className={`space-y-2 ${parameters.useTheoretical ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center">
                <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                  Cleanliness Factor (U)
                  {parameters.useTheoretical && (
                    <span className="ml-2 text-[10px] text-black/50 dark:text-white/50">(locked)</span>
                  )}
                </Label>
                <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                  {((parameters.useTheoretical ? parameters.U_clean_theo : parameters.U_clean_prac) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[(parameters.useTheoretical ? parameters.U_clean_theo : parameters.U_clean_prac) * 100]}
                onValueChange={([value]) => {
                  if (!parameters.useTheoretical) {
                    handleParameterChange('U_clean_prac', value / 100);
                  }
                }}
                min={0}
                max={100}
                step={1}
                disabled={parameters.useTheoretical}
                className={parameters.useTheoretical ? 'cursor-not-allowed' : ''}
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                {parameters.useTheoretical 
                  ? 'Theoretical: assumes ideal clean input (locked at 100%)'
                  : 'Practical: realistic cleanliness in consumer conditions'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
              <button
                onClick={handleResetParameters}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[12px] text-black"
              >
                <RefreshCcw size={14} />
                Reset
              </button>
              <button
                onClick={handlePreviewCalculation}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[12px] text-black"
              >
                <Play size={14} />
                Calculate
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
              Preview Results
            </h3>
            {previewResults.length > 0 && (
              <button
                onClick={handleApplyToAll}
                disabled={processing}
                className="px-4 py-2 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[12px] text-black disabled:opacity-50"
              >
                {processing ? 'Applying...' : 'Apply to All'}
              </button>
            )}
          </div>

          {previewResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
                Click "Calculate" to preview recyclability scores
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif]">Material</TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif]">Category</TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-right">Old</TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-right">New</TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif]">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[12px]">
                        {result.name}
                      </TableCell>
                      <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                        {result.category}
                      </TableCell>
                      <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-right">
                        {result.oldScore}
                      </TableCell>
                      <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-right">
                        <span className={result.newScore !== result.oldScore ? 'text-[#4a90a4] dark:text-[#6bb6d0]' : ''}>
                          {result.newScore}
                        </span>
                      </TableCell>
                      <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[10px]">
                        {result.label}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Methodology Info */}
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-4 border-[1.5px] border-[#211f1c] dark:border-white/20">
        <h4 className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white mb-2">
          Calculation Formula
        </h4>
        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70 mb-2">
          CR = Y × D × C × M × U<sub>clean</sub>
        </p>
        <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
          Based on WasteDB Statistical and Accessibility Methodology. Category-specific defaults are applied and can be overridden by global parameters.
        </p>
      </div>
    </div>
  );
}
