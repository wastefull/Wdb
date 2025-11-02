import { useState } from 'react';
import { ArrowLeft, Play, RefreshCcw, Calculator } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { calculateCompostability, calculateReusability, type Material } from '../utils/api';

// Shared Infrastructure Maturity parameter (0-1)
const DEFAULT_M_VALUE = 0.65;

// CR (Recyclability) Parameters
interface RecyclabilityParameters {
  Y: number;
  D: number;
  C: number;
  useTheoretical: boolean;
  U_clean_theo: number;
  U_clean_prac: number;
}

const defaultCRParameters: RecyclabilityParameters = {
  Y: 0.75,
  D: 0.80,
  C: 0.70,
  useTheoretical: false,
  U_clean_theo: 1.0,
  U_clean_prac: 0.6,
};

// CC (Compostability) Parameters
interface CompostabilityParameters {
  B: number;
  N: number;
  T: number;
  H: number;
  useTheoretical: boolean;
}

const defaultCCParameters: CompostabilityParameters = {
  B: 0.75,
  N: 0.70,
  T: 0.85,  // Higher is better (inverted toxicity)
  H: 0.60,
  useTheoretical: false,
};

// RU (Reusability) Parameters
interface ReusabilityParameters {
  L: number;
  R: number;
  U: number;
  C_RU: number;
  useTheoretical: boolean;
}

const defaultRUParameters: ReusabilityParameters = {
  L: 0.70,
  R: 0.65,
  U: 0.60,
  C_RU: 0.75,  // Higher is better (inverted contamination)
  useTheoretical: false,
};

// Material category to parameter mapping
const categoryDefaults: Record<string, {
  CR?: Partial<RecyclabilityParameters>;
  CC?: Partial<CompostabilityParameters>;
  RU?: Partial<ReusabilityParameters>;
}> = {
  'Glass': { 
    CR: { Y: 0.95, D: 1.0, C: 0.85 },
    RU: { L: 0.90, R: 0.70, U: 0.50, C_RU: 0.80 }
  },
  'Metals': { 
    CR: { Y: 0.90, D: 0.95, C: 0.80 },
    RU: { L: 0.85, R: 0.75, U: 0.60, C_RU: 0.70 }
  },
  'Paper & Cardboard': { 
    CR: { Y: 0.70, D: 0.60, C: 0.65 },
    CC: { B: 0.85, N: 0.80, T: 0.90, H: 0.75 }
  },
  'Plastics': { 
    CR: { Y: 0.60, D: 0.50, C: 0.40 },
    RU: { L: 0.60, R: 0.50, U: 0.45, C_RU: 0.55 }
  },
  'Electronics & Batteries': { 
    CR: { Y: 0.50, D: 0.40, C: 0.30 },
    RU: { L: 0.50, R: 0.40, U: 0.60, C_RU: 0.40 }
  },
  'Fabrics & Textiles': { 
    CR: { Y: 0.40, D: 0.45, C: 0.35 },
    RU: { L: 0.70, R: 0.60, U: 0.55, C_RU: 0.65 }
  },
  'Building Materials': { 
    CR: { Y: 0.65, D: 0.70, C: 0.60 },
    RU: { L: 0.80, R: 0.50, U: 0.40, C_RU: 0.70 }
  },
  'Organic/Natural Waste': { 
    CC: { B: 0.90, N: 0.85, T: 0.95, H: 0.80 },
    CR: { Y: 0.20, D: 0.30, C: 0.25 }
  },
};

// Calculate CR
function calculateRecyclability(params: RecyclabilityParameters, M: number): number {
  const U_clean = params.useTheoretical ? params.U_clean_theo : params.U_clean_prac;
  const CR = params.Y * params.D * params.C * M * U_clean;
  return Math.round(CR * 100);
}

// Get score label
function getScoreLabel(score: number, dimension: 'CR' | 'CC' | 'RU'): string {
  const normalized = score / 100;
  
  if (dimension === 'CR') {
    if (normalized >= 0.80) return 'Easily recyclable';
    if (normalized >= 0.60) return 'Recyclable with care';
    if (normalized >= 0.40) return 'Limited recyclability';
    if (normalized >= 0.20) return 'Technically recyclable';
    return 'Unrecyclable / Experimental';
  } else if (dimension === 'CC') {
    if (normalized >= 0.80) return 'Highly compostable';
    if (normalized >= 0.60) return 'Compostable';
    if (normalized >= 0.40) return 'Limited compostability';
    if (normalized >= 0.20) return 'Marginally compostable';
    return 'Non-compostable';
  } else {
    if (normalized >= 0.80) return 'Highly reusable';
    if (normalized >= 0.60) return 'Reusable';
    if (normalized >= 0.40) return 'Limited reusability';
    if (normalized >= 0.20) return 'Marginally reusable';
    return 'Single-use';
  }
}

interface DataProcessingViewProps {
  materials: Material[];
  onBack: () => void;
  onUpdateMaterials: (materials: Material[]) => void;
}

export function DataProcessingView({ materials, onBack, onUpdateMaterials }: DataProcessingViewProps) {
  // Shared M_value across all dimensions
  const [M_value, setM_value] = useState(DEFAULT_M_VALUE);
  
  // CR parameters
  const [crParams, setCRParams] = useState<RecyclabilityParameters>(defaultCRParameters);
  const [crResults, setCRResults] = useState<Array<{id: string; name: string; category: string; oldScore: number; newScore: number; label: string}>>([]);
  const [crProcessing, setCRProcessing] = useState(false);
  
  // CC parameters
  const [ccParams, setCCParams] = useState<CompostabilityParameters>(defaultCCParameters);
  const [ccResults, setCCResults] = useState<Array<{id: string; name: string; category: string; oldScore: number; newScore: number; label: string}>>([]);
  const [ccProcessing, setCCProcessing] = useState(false);
  const [ccCalculating, setCCCalculating] = useState(false);
  
  // RU parameters
  const [ruParams, setRUParams] = useState<ReusabilityParameters>(defaultRUParameters);
  const [ruResults, setRUResults] = useState<Array<{id: string; name: string; category: string; oldScore: number; newScore: number; label: string}>>([]);
  const [ruProcessing, setRUProcessing] = useState(false);
  const [ruCalculating, setRUCalculating] = useState(false);

  // CR handlers
  const handleCRPreview = () => {
    const results = materials.map(material => {
      const categoryParams = categoryDefaults[material.category]?.CR || {};
      const materialParams = { ...crParams, ...categoryParams };
      const newScore = calculateRecyclability(materialParams, M_value);
      const label = getScoreLabel(newScore, 'CR');
      
      return {
        id: material.id,
        name: material.name,
        category: material.category,
        oldScore: material.recyclability,
        newScore,
        label,
      };
    });
    
    setCRResults(results);
    toast.success(`Calculated CR scores for ${results.length} materials`);
  };

  const handleCRApply = () => {
    setCRProcessing(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const updatedMaterials = materials.map(material => {
        const result = crResults.find(r => r.id === material.id);
        if (result) {
          const categoryParams = categoryDefaults[material.category]?.CR || {};
          const materialParams = { ...crParams, ...categoryParams };
          
          const practicalScore = calculateRecyclability({ ...materialParams, useTheoretical: false }, M_value);
          const theoreticalScore = calculateRecyclability({ ...materialParams, useTheoretical: true }, M_value);
          
          const practicalMargin = practicalScore * 0.10;
          const theoreticalMargin = theoreticalScore * 0.10;
          
          return {
            ...material,
            recyclability: result.newScore,
            Y_value: materialParams.Y,
            D_value: materialParams.D,
            C_value: materialParams.C,
            M_value: M_value,
            E_value: material.E_value || 0,
            CR_practical_mean: practicalScore / 100,
            CR_theoretical_mean: theoreticalScore / 100,
            CR_practical_CI95: {
              lower: Math.max(0, (practicalScore - practicalMargin) / 100),
              upper: Math.min(1, (practicalScore + practicalMargin) / 100),
            },
            CR_theoretical_CI95: {
              lower: Math.max(0, (theoreticalScore - theoreticalMargin) / 100),
              upper: Math.min(1, (theoreticalScore + theoreticalMargin) / 100),
            },
            calculation_timestamp: timestamp,
            method_version: 'CR-v1',
          };
        }
        return material;
      });
      
      onUpdateMaterials(updatedMaterials);
      setCRResults(crResults.map(r => ({ ...r, oldScore: r.newScore })));
      toast.success(`Updated CR scores for ${materials.length} materials`);
    } catch (error) {
      toast.error('Failed to update CR scores');
      console.error(error);
    } finally {
      setCRProcessing(false);
    }
  };

  // CC handlers
  const handleCCPreview = async () => {
    setCCCalculating(true);
    
    try {
      const results = await Promise.all(materials.map(async (material) => {
        const categoryParams = categoryDefaults[material.category]?.CC || {};
        const materialParams = { ...ccParams, ...categoryParams };
        
        try {
          const result = await calculateCompostability({
            B: materialParams.B,
            N: materialParams.N,
            T: materialParams.T,
            H: materialParams.H,
            M: M_value,
            mode: materialParams.useTheoretical ? 'theoretical' : 'practical',
          });
          
          const label = getScoreLabel(result.public, 'CC');
          
          return {
            id: material.id,
            name: material.name,
            category: material.category,
            oldScore: material.compostability,
            newScore: result.public,
            label,
          };
        } catch (error) {
          console.error(`Error calculating CC for ${material.name}:`, error);
          return {
            id: material.id,
            name: material.name,
            category: material.category,
            oldScore: material.compostability,
            newScore: material.compostability,
            label: 'Calculation error',
          };
        }
      }));
      
      setCCResults(results);
      toast.success(`Calculated CC scores for ${results.length} materials`);
    } catch (error) {
      toast.error('Failed to calculate CC scores');
      console.error(error);
    } finally {
      setCCCalculating(false);
    }
  };

  const handleCCApply = async () => {
    setCCProcessing(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const updatedMaterials = await Promise.all(materials.map(async (material) => {
        const result = ccResults.find(r => r.id === material.id);
        if (result && result.label !== 'Calculation error') {
          const categoryParams = categoryDefaults[material.category]?.CC || {};
          const materialParams = { ...ccParams, ...categoryParams };
          
          try {
            const practicalResult = await calculateCompostability({
              B: materialParams.B,
              N: materialParams.N,
              T: materialParams.T,
              H: materialParams.H,
              M: M_value,
              mode: 'practical',
            });
            
            const theoreticalResult = await calculateCompostability({
              B: materialParams.B,
              N: materialParams.N,
              T: materialParams.T,
              H: materialParams.H,
              M: M_value,
              mode: 'theoretical',
            });
            
            const practicalMargin = practicalResult.mean * 0.10;
            const theoreticalMargin = theoreticalResult.mean * 0.10;
            
            return {
              ...material,
              compostability: result.newScore,
              B_value: materialParams.B,
              N_value: materialParams.N,
              T_value: materialParams.T,
              H_value: materialParams.H,
              M_value: M_value,
              CC_practical_mean: practicalResult.mean,
              CC_theoretical_mean: theoreticalResult.mean,
              CC_practical_CI95: {
                lower: Math.max(0, practicalResult.mean - practicalMargin),
                upper: Math.min(1, practicalResult.mean + practicalMargin),
              },
              CC_theoretical_CI95: {
                lower: Math.max(0, theoreticalResult.mean - theoreticalMargin),
                upper: Math.min(1, theoreticalResult.mean + theoreticalMargin),
              },
              calculation_timestamp: timestamp,
              method_version: material.method_version ? `${material.method_version},CC-v1` : 'CC-v1',
            };
          } catch (error) {
            console.error(`Error applying CC to ${material.name}:`, error);
            return material;
          }
        }
        return material;
      }));
      
      onUpdateMaterials(updatedMaterials);
      setCCResults(ccResults.map(r => ({ ...r, oldScore: r.newScore })));
      toast.success(`Updated CC scores for ${materials.length} materials`);
    } catch (error) {
      toast.error('Failed to update CC scores');
      console.error(error);
    } finally {
      setCCProcessing(false);
    }
  };

  // RU handlers
  const handleRUPreview = async () => {
    setRUCalculating(true);
    
    try {
      const results = await Promise.all(materials.map(async (material) => {
        const categoryParams = categoryDefaults[material.category]?.RU || {};
        const materialParams = { ...ruParams, ...categoryParams };
        
        try {
          const result = await calculateReusability({
            L: materialParams.L,
            R: materialParams.R,
            U: materialParams.U,
            C: materialParams.C_RU,
            M: M_value,
            mode: materialParams.useTheoretical ? 'theoretical' : 'practical',
          });
          
          const label = getScoreLabel(result.public, 'RU');
          
          return {
            id: material.id,
            name: material.name,
            category: material.category,
            oldScore: material.reusability,
            newScore: result.public,
            label,
          };
        } catch (error) {
          console.error(`Error calculating RU for ${material.name}:`, error);
          return {
            id: material.id,
            name: material.name,
            category: material.category,
            oldScore: material.reusability,
            newScore: material.reusability,
            label: 'Calculation error',
          };
        }
      }));
      
      setRUResults(results);
      toast.success(`Calculated RU scores for ${results.length} materials`);
    } catch (error) {
      toast.error('Failed to calculate RU scores');
      console.error(error);
    } finally {
      setRUCalculating(false);
    }
  };

  const handleRUApply = async () => {
    setRUProcessing(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const updatedMaterials = await Promise.all(materials.map(async (material) => {
        const result = ruResults.find(r => r.id === material.id);
        if (result && result.label !== 'Calculation error') {
          const categoryParams = categoryDefaults[material.category]?.RU || {};
          const materialParams = { ...ruParams, ...categoryParams };
          
          try {
            const practicalResult = await calculateReusability({
              L: materialParams.L,
              R: materialParams.R,
              U: materialParams.U,
              C: materialParams.C_RU,
              M: M_value,
              mode: 'practical',
            });
            
            const theoreticalResult = await calculateReusability({
              L: materialParams.L,
              R: materialParams.R,
              U: materialParams.U,
              C: materialParams.C_RU,
              M: M_value,
              mode: 'theoretical',
            });
            
            const practicalMargin = practicalResult.mean * 0.10;
            const theoreticalMargin = theoreticalResult.mean * 0.10;
            
            return {
              ...material,
              reusability: result.newScore,
              L_value: materialParams.L,
              R_value: materialParams.R,
              U_value: materialParams.U,
              C_RU_value: materialParams.C_RU,
              M_value: M_value,
              RU_practical_mean: practicalResult.mean,
              RU_theoretical_mean: theoreticalResult.mean,
              RU_practical_CI95: {
                lower: Math.max(0, practicalResult.mean - practicalMargin),
                upper: Math.min(1, practicalResult.mean + practicalMargin),
              },
              RU_theoretical_CI95: {
                lower: Math.max(0, theoreticalResult.mean - theoreticalMargin),
                upper: Math.min(1, theoreticalResult.mean + theoreticalMargin),
              },
              calculation_timestamp: timestamp,
              method_version: material.method_version ? `${material.method_version},RU-v1` : 'RU-v1',
            };
          } catch (error) {
            console.error(`Error applying RU to ${material.name}:`, error);
            return material;
          }
        }
        return material;
      }));
      
      onUpdateMaterials(updatedMaterials);
      setRUResults(ruResults.map(r => ({ ...r, oldScore: r.newScore })));
      toast.success(`Updated RU scores for ${materials.length} materials`);
    } catch (error) {
      toast.error('Failed to update RU scores');
      console.error(error);
    } finally {
      setRUProcessing(false);
    }
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
            Multi-Dimensional Data Processing
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            Calculate CR, CC, and RU scores using WasteDB methodology
          </p>
        </div>
      </div>

      {/* Shared Infrastructure Maturity */}
      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
          Shared Infrastructure Maturity (M)
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
              Infrastructure Maturity (M)
            </Label>
            <span className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
              {(M_value * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[M_value * 100]}
            onValueChange={([value]) => setM_value(value / 100)}
            min={0}
            max={100}
            step={1}
          />
          <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
            Shared across all three dimensions - represents circular economy infrastructure availability and regional readiness
          </p>
        </div>
      </div>

      {/* Dimension Tabs */}
      <Tabs defaultValue="recyclability" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
          <TabsTrigger value="recyclability" className="text-[10px] md:text-sm px-2">Recycle (CR)</TabsTrigger>
          <TabsTrigger value="compostability" className="text-[10px] md:text-sm px-2">Compost (CC)</TabsTrigger>
          <TabsTrigger value="reusability" className="text-[10px] md:text-sm px-2">Reuse (RU)</TabsTrigger>
        </TabsList>

        {/* CR Tab */}
        <TabsContent value="recyclability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CR Parameters Panel */}
            <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
                CR Parameters
              </h3>
              
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-[#211f1c]/20 dark:border-white/20">
                  <div>
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                      Mode
                    </Label>
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                      {crParams.useTheoretical ? 'Theoretical (ideal)' : 'Practical (real-world)'}
                    </p>
                  </div>
                  <Switch
                    checked={crParams.useTheoretical}
                    onCheckedChange={(checked) => setCRParams(prev => ({ ...prev, useTheoretical: checked }))}
                  />
                </div>

                {/* Y */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Yield (Y)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(crParams.Y * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[crParams.Y * 100]} onValueChange={([v]) => setCRParams(prev => ({ ...prev, Y: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Material recovery rate</p>
                </div>

                {/* D */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Degradability (D)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(crParams.D * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[crParams.D * 100]} onValueChange={([v]) => setCRParams(prev => ({ ...prev, D: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Quality retention</p>
                </div>

                {/* C */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Contamination (C)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(crParams.C * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[crParams.C * 100]} onValueChange={([v]) => setCRParams(prev => ({ ...prev, C: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Contamination tolerance</p>
                </div>

                {/* U_clean */}
                <div className={`space-y-2 ${crParams.useTheoretical ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">
                      Cleanliness (U) {crParams.useTheoretical && <span className="text-[10px]">(locked)</span>}
                    </Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">
                      {((crParams.useTheoretical ? crParams.U_clean_theo : crParams.U_clean_prac) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider 
                    value={[(crParams.useTheoretical ? crParams.U_clean_theo : crParams.U_clean_prac) * 100]} 
                    onValueChange={([v]) => !crParams.useTheoretical && setCRParams(prev => ({ ...prev, U_clean_prac: v / 100 }))}
                    min={0} 
                    max={100} 
                    step={1}
                    disabled={crParams.useTheoretical}
                  />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">
                    {crParams.useTheoretical ? 'Theoretical: ideal clean input (100%)' : 'Practical: realistic cleanliness'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
                  <button
                    onClick={() => { setCRParams(defaultCRParameters); setCRResults([]); toast.info('CR reset'); }}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-black"
                  >
                    <RefreshCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleCRPreview}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-black"
                  >
                    <Play size={14} />
                    <span>Calculate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CR Results Panel */}
            <ResultsPanel
              title="CR Results"
              results={crResults}
              processing={crProcessing}
              onApply={handleCRApply}
            />
          </div>
        </TabsContent>

        {/* CC Tab */}
        <TabsContent value="compostability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CC Parameters Panel */}
            <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
                CC Parameters
              </h3>
              
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-[#211f1c]/20 dark:border-white/20">
                  <div>
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                      Mode
                    </Label>
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                      {ccParams.useTheoretical ? 'Theoretical (ideal)' : 'Practical (regional)'}
                    </p>
                  </div>
                  <Switch
                    checked={ccParams.useTheoretical}
                    onCheckedChange={(checked) => setCCParams(prev => ({ ...prev, useTheoretical: checked }))}
                  />
                </div>

                {/* B */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Biodegradation (B)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ccParams.B * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ccParams.B * 100]} onValueChange={([v]) => setCCParams(prev => ({ ...prev, B: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Biodegradation rate</p>
                </div>

                {/* N */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Nutrient Balance (N)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ccParams.N * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ccParams.N * 100]} onValueChange={([v]) => setCCParams(prev => ({ ...prev, N: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">C:N:P ratio suitability</p>
                </div>

                {/* T */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Toxicity (T)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ccParams.T * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ccParams.T * 100]} onValueChange={([v]) => setCCParams(prev => ({ ...prev, T: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Toxicity / residue index (inverted)</p>
                </div>

                {/* H */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Habitat Adaptability (H)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ccParams.H * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ccParams.H * 100]} onValueChange={([v]) => setCCParams(prev => ({ ...prev, H: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Fraction of composting systems</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
                  <button
                    onClick={() => { setCCParams(defaultCCParameters); setCCResults([]); toast.info('CC reset'); }}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-black"
                  >
                    <RefreshCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleCCPreview}
                    disabled={ccCalculating}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#c74444] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-white disabled:opacity-50"
                  >
                    <Calculator size={14} />
                    <span>{ccCalculating ? 'Calculating...' : 'Calculate'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CC Results Panel */}
            <ResultsPanel
              title="CC Results"
              results={ccResults}
              processing={ccProcessing}
              onApply={handleCCApply}
              applyColor="bg-[#c74444] text-white"
            />
          </div>
        </TabsContent>

        {/* RU Tab */}
        <TabsContent value="reusability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RU Parameters Panel */}
            <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-4">
                RU Parameters
              </h3>
              
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-[#211f1c]/20 dark:border-white/20">
                  <div>
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white">
                      Mode
                    </Label>
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                      {ruParams.useTheoretical ? 'Theoretical (design intent)' : 'Practical (market reality)'}
                    </p>
                  </div>
                  <Switch
                    checked={ruParams.useTheoretical}
                    onCheckedChange={(checked) => setRUParams(prev => ({ ...prev, useTheoretical: checked }))}
                  />
                </div>

                {/* L */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Lifetime (L)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ruParams.L * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ruParams.L * 100]} onValueChange={([v]) => setRUParams(prev => ({ ...prev, L: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Functional cycles</p>
                </div>

                {/* R */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Repairability (R)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ruParams.R * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ruParams.R * 100]} onValueChange={([v]) => setRUParams(prev => ({ ...prev, R: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Ease of disassembly / repair</p>
                </div>

                {/* U */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Upgradability (U)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ruParams.U * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ruParams.U * 100]} onValueChange={([v]) => setRUParams(prev => ({ ...prev, U: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Ease of adaptation / repurposing</p>
                </div>

                {/* C_RU */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-['Sniglet:Regular',_sans-serif] text-[13px]">Contamination (C)</Label>
                    <span className="font-['Sniglet:Regular',_sans-serif] text-[12px]">{(ruParams.C_RU * 100).toFixed(0)}%</span>
                  </div>
                  <Slider value={[ruParams.C_RU * 100]} onValueChange={([v]) => setRUParams(prev => ({ ...prev, C_RU: v / 100 }))} min={0} max={100} step={1} />
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/60 dark:text-white/60">Probability of functional loss (inverted)</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
                  <button
                    onClick={() => { setRUParams(defaultRUParameters); setRUResults([]); toast.info('RU reset'); }}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#b5bec6] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-black"
                  >
                    <RefreshCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleRUPreview}
                    disabled={ruCalculating}
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-[#5a7a8f] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] md:text-[12px] text-white disabled:opacity-50"
                  >
                    <Calculator size={14} />
                    <span>{ruCalculating ? 'Calculating...' : 'Calculate'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RU Results Panel */}
            <ResultsPanel
              title="RU Results"
              results={ruResults}
              processing={ruProcessing}
              onApply={handleRUApply}
              applyColor="bg-[#5a7a8f] text-white"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Results Panel Component
interface ResultsPanelProps {
  title: string;
  results: Array<{id: string; name: string; category: string; oldScore: number; newScore: number; label: string}>;
  processing: boolean;
  onApply: () => void;
  applyColor?: string;
}

function ResultsPanel({ title, results, processing, onApply, applyColor = "bg-[#e6beb5] text-black" }: ResultsPanelProps) {
  return (
    <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
          {title}
        </h3>
        {results.length > 0 && (
          <button
            onClick={onApply}
            disabled={processing}
            className={`px-4 py-2 ${applyColor} rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] transition-all font-['Sniglet:Regular',_sans-serif] text-[12px] disabled:opacity-50`}
          >
            {processing ? 'Applying...' : 'Apply to All'}
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
            Click "Calculate" to preview scores
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
              {results.map((result) => (
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
  );
}
