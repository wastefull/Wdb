/**
 * Scientific Data Editor - Main Coordinator Component
 * Manages multi-dimensional scientific data entry for CR, CC, and RU
 */

import { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner@2.0.3';
import { RecyclabilityTab } from './RecyclabilityTab';
import { CompostabilityTab } from './CompostabilityTab';
import { ReusabilityTab } from './ReusabilityTab';
import { SourcesTab } from './SourcesTab';
import type { Material, Source } from './types';

interface ScientificDataEditorProps {
  material: Material;
  onSave: (material: Material) => void;
  onCancel: () => void;
}

export function ScientificDataEditor({ material, onSave, onCancel }: ScientificDataEditorProps) {
  const [formData, setFormData] = useState<Material>({ ...material });
  const [sources, setSources] = useState<Source[]>(material.sources || []);

  const handleParameterChange = (key: keyof Material, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Validate parameters are in range 0-1
    const params = [
      'Y_value', 'D_value', 'C_value', 'M_value', 'E_value', 
      'CR_practical_mean', 'CR_theoretical_mean',
      'B_value', 'N_value', 'T_value', 'H_value',
      'CC_practical_mean', 'CC_theoretical_mean',
      'L_value', 'R_value', 'U_value', 'C_RU_value',
      'RU_practical_mean', 'RU_theoretical_mean'
    ] as const;
    
    for (const param of params) {
      const value = formData[param];
      if (value !== undefined && (value < 0 || value > 1)) {
        toast.error(`${param} must be between 0 and 1`);
        return;
      }
    }
    
    // Validate all confidence intervals
    const ciFields = [
      { name: 'CR practical', field: formData.CR_practical_CI95 },
      { name: 'CR theoretical', field: formData.CR_theoretical_CI95 },
      { name: 'CC practical', field: formData.CC_practical_CI95 },
      { name: 'CC theoretical', field: formData.CC_theoretical_CI95 },
      { name: 'RU practical', field: formData.RU_practical_CI95 },
      { name: 'RU theoretical', field: formData.RU_theoretical_CI95 },
    ];
    
    for (const ci of ciFields) {
      if (ci.field) {
        if (ci.field.lower < 0 || ci.field.upper > 1 || ci.field.lower > ci.field.upper) {
          toast.error(`Invalid ${ci.name} confidence interval`);
          return;
        }
      }
    }
    
    // Update material with sources and timestamp
    const updatedMaterial = {
      ...formData,
      sources,
      calculation_timestamp: new Date().toISOString(),
    };
    
    onSave(updatedMaterial);
    toast.success('Scientific data saved');
  };

  return (
    <div className="bg-white dark:bg-[#2a2825] relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] dark:border-white/20 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
          Scientific Data Editor: {material.name}
        </h2>
        <div className="flex gap-2">
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="border-[#211f1c] dark:border-white/20"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#e4e3ac] hover:bg-[#d4d39c] text-black border-[#211f1c] dark:border-white/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-[11px] text-blue-800 dark:text-blue-200">
          All parameter values should be normalized to 0-1 scale. M_value (Infrastructure Maturity) is shared across all three dimensions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="recyclability" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="recyclability">Recyclability</TabsTrigger>
          <TabsTrigger value="compostability">Compostability</TabsTrigger>
          <TabsTrigger value="reusability">Reusability</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="recyclability">
          <RecyclabilityTab 
            formData={formData} 
            onParameterChange={handleParameterChange} 
          />
        </TabsContent>

        <TabsContent value="compostability">
          <CompostabilityTab 
            formData={formData} 
            onParameterChange={handleParameterChange} 
          />
        </TabsContent>

        <TabsContent value="reusability">
          <ReusabilityTab 
            formData={formData} 
            onParameterChange={handleParameterChange} 
          />
        </TabsContent>

        <TabsContent value="sources">
          <SourcesTab
            material={formData}
            sources={sources}
            onSourcesChange={setSources}
            onParameterChange={handleParameterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
