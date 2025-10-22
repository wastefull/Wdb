/**
 * Recyclability Tab - CR parameters and composite scores
 */

import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { DimensionTabProps } from './types';

export function RecyclabilityTab({ formData, onParameterChange }: DimensionTabProps) {
  const handleRecalculateFromParams = () => {
    const Y = formData.Y_value || 0;
    const D = formData.D_value || 0;
    const C = formData.C_value || 0;
    const M = formData.M_value || 0;
    
    const U_clean_theo = 1.0;
    const U_clean_prac = 0.6;
    
    const CR_theoretical = Y * D * C * M * U_clean_theo;
    const CR_practical = Y * D * C * M * U_clean_prac;
    
    // Calculate 10% confidence intervals
    const practicalMargin = CR_practical * 0.10;
    const theoreticalMargin = CR_theoretical * 0.10;
    
    onParameterChange('CR_practical_mean', CR_practical);
    onParameterChange('CR_theoretical_mean', CR_theoretical);
    onParameterChange('CR_practical_CI95', {
      lower: Math.max(0, CR_practical - practicalMargin),
      upper: Math.min(1, CR_practical + practicalMargin),
    });
    onParameterChange('CR_theoretical_CI95', {
      lower: Math.max(0, CR_theoretical - theoreticalMargin),
      upper: Math.min(1, CR_theoretical + theoreticalMargin),
    });
    onParameterChange('recyclability', Math.round(CR_practical * 100));
    onParameterChange('method_version', 'CR-v1');
  };

  return (
    <div className="space-y-4">
      {/* Parameters Card */}
      <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
          Recyclability Parameters (CR-v1)
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[11px]">Yield (Y)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.Y_value || ''}
              onChange={(e) => onParameterChange('Y_value', parseFloat(e.target.value) || 0)}
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Material recovery rate</p>
          </div>

          <div>
            <Label className="text-[11px]">Degradability (D)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.D_value || ''}
              onChange={(e) => onParameterChange('D_value', parseFloat(e.target.value) || 0)}
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Quality retention</p>
          </div>

          <div>
            <Label className="text-[11px]">Contamination (C)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.C_value || ''}
              onChange={(e) => onParameterChange('C_value', parseFloat(e.target.value) || 0)}
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Contamination tolerance</p>
          </div>

          <div>
            <Label className="text-[11px]">Maturity (M) - Shared</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.M_value || ''}
              onChange={(e) => onParameterChange('M_value', parseFloat(e.target.value) || 0)}
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Infrastructure availability</p>
          </div>

          <div>
            <Label className="text-[11px]">Energy (E)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.E_value || ''}
              onChange={(e) => onParameterChange('E_value', parseFloat(e.target.value) || 0)}
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Energy demand (normalized)</p>
          </div>
        </div>

        <Button 
          onClick={handleRecalculateFromParams}
          className="mt-4 w-full bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
        >
          Recalculate Composite Scores from Parameters
        </Button>
      </Card>

      {/* Composite Scores Card */}
      <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
          Composite Recyclability Index (CR)
        </h3>

        {/* Practical Score */}
        <div className="mb-4 pb-4 border-b border-[#211f1c] dark:border-white/20">
          <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
            Practical (Realistic Conditions)
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_practical_mean || ''}
                onChange={(e) => onParameterChange('CR_practical_mean', parseFloat(e.target.value) || 0)}
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Lower</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_practical_CI95?.lower || ''}
                onChange={(e) => onParameterChange('CR_practical_CI95', {
                  ...formData.CR_practical_CI95,
                  lower: parseFloat(e.target.value) || 0,
                  upper: formData.CR_practical_CI95?.upper || 0,
                })}
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Upper</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_practical_CI95?.upper || ''}
                onChange={(e) => onParameterChange('CR_practical_CI95', {
                  ...formData.CR_practical_CI95,
                  lower: formData.CR_practical_CI95?.lower || 0,
                  upper: parseFloat(e.target.value) || 0,
                })}
                className="text-[12px]"
              />
            </div>
          </div>
          
          {formData.CR_practical_mean && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score: <strong>{Math.round(formData.CR_practical_mean * 100)}/100</strong>
            </div>
          )}
        </div>

        {/* Theoretical Score */}
        <div>
          <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
            Theoretical (Ideal Conditions)
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_theoretical_mean || ''}
                onChange={(e) => onParameterChange('CR_theoretical_mean', parseFloat(e.target.value) || 0)}
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Lower</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_theoretical_CI95?.lower || ''}
                onChange={(e) => onParameterChange('CR_theoretical_CI95', {
                  ...formData.CR_theoretical_CI95,
                  lower: parseFloat(e.target.value) || 0,
                  upper: formData.CR_theoretical_CI95?.upper || 0,
                })}
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Upper</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CR_theoretical_CI95?.upper || ''}
                onChange={(e) => onParameterChange('CR_theoretical_CI95', {
                  ...formData.CR_theoretical_CI95,
                  lower: formData.CR_theoretical_CI95?.lower || 0,
                  upper: parseFloat(e.target.value) || 0,
                })}
                className="text-[12px]"
              />
            </div>
          </div>
          
          {formData.CR_theoretical_mean && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score: <strong>{Math.round(formData.CR_theoretical_mean * 100)}/100</strong>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
