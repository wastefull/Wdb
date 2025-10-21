import { useState } from 'react';
import { Plus, Trash2, Save, X, AlertCircle, ExternalLink, BookOpen, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { SOURCE_LIBRARY, getSourcesByMaterial, type Source as LibrarySource } from '../data/sources';

interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
  parameters?: string[];
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

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
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;
  confidence_level?: 'High' | 'Medium' | 'Low';
  sources?: Source[];
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

interface ScientificDataEditorProps {
  material: Material;
  onSave: (material: Material) => void;
  onCancel: () => void;
}

export function ScientificDataEditor({ material, onSave, onCancel }: ScientificDataEditorProps) {
  const [formData, setFormData] = useState<Material>({ ...material });
  const [sources, setSources] = useState<Source[]>(material.sources || []);
  const [newSource, setNewSource] = useState<Source>({
    title: '',
    authors: '',
    year: undefined,
    doi: '',
    url: '',
    weight: 1.0,
  });
  const [showSourceLibrary, setShowSourceLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const handleParameterChange = (key: keyof Material, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSource = () => {
    if (!newSource.title.trim()) {
      toast.error('Source title is required');
      return;
    }
    
    setSources(prev => [...prev, { ...newSource }]);
    setNewSource({
      title: '',
      authors: '',
      year: undefined,
      doi: '',
      url: '',
      weight: 1.0,
    });
    toast.success('Source added');
  };

  const handleRemoveSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
    toast.success('Source removed');
  };

  const handleAddFromLibrary = (librarySource: LibrarySource) => {
    // Check if already added
    const alreadyAdded = sources.some(s => s.title === librarySource.title && s.doi === librarySource.doi);
    if (alreadyAdded) {
      toast.error('This source has already been added');
      return;
    }
    
    // Auto-assign parameters based on source tags
    const parameters: string[] = [];
    const tags = librarySource.tags || [];
    
    if (tags.some(t => ['recycling', 'yield', 'recovery'].includes(t))) {
      parameters.push('Y_value', 'CR_practical_mean');
    }
    if (tags.some(t => ['degradation', 'quality', 'composting'].includes(t))) {
      parameters.push('D_value');
    }
    if (tags.some(t => ['contamination', 'purity'].includes(t))) {
      parameters.push('C_value');
    }
    if (tags.some(t => ['infrastructure', 'maturity', 'facilities'].includes(t))) {
      parameters.push('M_value');
    }
    if (tags.some(t => ['energy', 'lca'].includes(t))) {
      parameters.push('E_value');
    }
    if (tags.includes('general') || tags.includes('methodology')) {
      parameters.push('CR_practical_mean', 'CR_theoretical_mean');
    }
    
    // If no specific parameters assigned, default to CR scores
    const finalParameters = parameters.length > 0 ? parameters : ['CR_practical_mean', 'CR_theoretical_mean'];
    
    // Convert library source to material source format
    const newSource: Source = {
      title: librarySource.title,
      authors: librarySource.authors,
      year: librarySource.year,
      doi: librarySource.doi,
      url: librarySource.url,
      weight: librarySource.weight,
      parameters: finalParameters,
    };
    
    setSources(prev => [...prev, newSource]);
    toast.success('Source added from library');
  };

  const getSuggestedConfidenceLevel = (sourceCount: number, totalWeight: number): 'High' | 'Medium' | 'Low' => {
    // Calculate weighted source score
    const weightedScore = sourceCount > 0 ? totalWeight / sourceCount : 0;
    
    if (sourceCount === 0) {
      return 'Low';
    } else if (sourceCount >= 3 && weightedScore >= 0.8) {
      return 'High';
    } else if (sourceCount >= 2 || weightedScore >= 0.6) {
      return 'Medium';
    } else {
      return 'Low';
    }
  };

  const handleSave = () => {
    // Validate parameters are in range 0-1
    const params = ['Y_value', 'D_value', 'C_value', 'M_value', 'E_value', 'CR_practical_mean', 'CR_theoretical_mean'] as const;
    
    for (const param of params) {
      const value = formData[param];
      if (value !== undefined && (value < 0 || value > 1)) {
        toast.error(`${param} must be between 0 and 1`);
        return;
      }
    }
    
    // Validate confidence intervals
    if (formData.CR_practical_CI95) {
      if (formData.CR_practical_CI95.lower < 0 || formData.CR_practical_CI95.upper > 1 || 
          formData.CR_practical_CI95.lower > formData.CR_practical_CI95.upper) {
        toast.error('Invalid practical confidence interval');
        return;
      }
    }
    
    if (formData.CR_theoretical_CI95) {
      if (formData.CR_theoretical_CI95.lower < 0 || formData.CR_theoretical_CI95.upper > 1 || 
          formData.CR_theoretical_CI95.lower > formData.CR_theoretical_CI95.upper) {
        toast.error('Invalid theoretical confidence interval');
        return;
      }
    }
    
    // Validate confidence level against sources
    const totalWeight = sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
    const suggestedLevel = getSuggestedConfidenceLevel(sources.length, totalWeight);
    
    // Define confidence level hierarchy
    const levelHierarchy: Record<'High' | 'Medium' | 'Low', number> = {
      'High': 3,
      'Medium': 2,
      'Low': 1,
    };
    
    const selectedLevel = formData.confidence_level || 'Medium';
    
    if (levelHierarchy[selectedLevel] > levelHierarchy[suggestedLevel]) {
      toast.error(
        `Confidence level "${selectedLevel}" requires more sources. ` +
        `With ${sources.length} source(s), maximum recommended level is "${suggestedLevel}". ` +
        `Please add more citations or reduce confidence level.`,
        { duration: 6000 }
      );
      return;
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

  const handleRecalculateFromParams = () => {
    // Use the Data Processing View formula
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
    
    setFormData(prev => ({
      ...prev,
      CR_practical_mean: CR_practical,
      CR_theoretical_mean: CR_theoretical,
      CR_practical_CI95: {
        lower: Math.max(0, CR_practical - practicalMargin),
        upper: Math.min(1, CR_practical + practicalMargin),
      },
      CR_theoretical_CI95: {
        lower: Math.max(0, CR_theoretical - theoreticalMargin),
        upper: Math.min(1, CR_theoretical + theoreticalMargin),
      },
      recyclability: Math.round(CR_practical * 100),
      method_version: 'CR-v1',
    }));
    
    toast.success('Composite scores recalculated from parameters');
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
          All parameter values should be normalized to 0-1 scale. Composite scores are calculated from raw parameters.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="parameters" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="scores">Composite Scores</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        {/* Raw Parameters Tab */}
        <TabsContent value="parameters" className="space-y-4">
          <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
              Raw Normalized Parameters (0-1)
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
                  onChange={(e) => handleParameterChange('Y_value', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleParameterChange('D_value', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleParameterChange('C_value', parseFloat(e.target.value) || 0)}
                  className="text-[12px]"
                />
                <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">Contamination tolerance</p>
              </div>

              <div>
                <Label className="text-[11px]">Maturity (M)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.M_value || ''}
                  onChange={(e) => handleParameterChange('M_value', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleParameterChange('E_value', parseFloat(e.target.value) || 0)}
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
        </TabsContent>

        {/* Composite Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
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
                    onChange={(e) => handleParameterChange('CR_practical_mean', parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => handleParameterChange('CR_practical_CI95', {
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
                    onChange={(e) => handleParameterChange('CR_practical_CI95', {
                      ...formData.CR_practical_CI95,
                      lower: formData.CR_practical_CI95?.lower || 0,
                      upper: parseFloat(e.target.value) || 0,
                    })}
                    className="text-[12px]"
                  />
                </div>
              </div>
            </div>

            {/* Theoretical Score */}
            <div className="mb-4">
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
                    onChange={(e) => handleParameterChange('CR_theoretical_mean', parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => handleParameterChange('CR_theoretical_CI95', {
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
                    onChange={(e) => handleParameterChange('CR_theoretical_CI95', {
                      ...formData.CR_theoretical_CI95,
                      lower: formData.CR_theoretical_CI95?.lower || 0,
                      upper: parseFloat(e.target.value) || 0,
                    })}
                    className="text-[12px]"
                  />
                </div>
              </div>
            </div>

            {/* Confidence & Metadata */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#211f1c] dark:border-white/20">
              <div>
                <Label className="text-[10px]">Confidence Level</Label>
                <Select
                  value={formData.confidence_level || 'Medium'}
                  onValueChange={(value: 'High' | 'Medium' | 'Low') => handleParameterChange('confidence_level', value)}
                >
                  <SelectTrigger className="text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High (3+ sources)</SelectItem>
                    <SelectItem value="Medium">Medium (2+ sources)</SelectItem>
                    <SelectItem value="Low">Low (0-1 sources)</SelectItem>
                  </SelectContent>
                </Select>
                {(() => {
                  const totalWeight = sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
                  const suggested = getSuggestedConfidenceLevel(sources.length, totalWeight);
                  const current = formData.confidence_level || 'Medium';
                  if (suggested !== current) {
                    return (
                      <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1">
                        Recommended: {suggested} ({sources.length} sources)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <Label className="text-[10px]">Whitepaper Version</Label>
                <Input
                  type="text"
                  value={formData.whitepaper_version || ''}
                  onChange={(e) => handleParameterChange('whitepaper_version', e.target.value)}
                  placeholder="e.g., 2025.1"
                  className="text-[12px]"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          {(() => {
            const totalWeight = sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
            const suggested = getSuggestedConfidenceLevel(sources.length, totalWeight);
            const current = formData.confidence_level || 'Medium';
            const levelHierarchy: Record<'High' | 'Medium' | 'Low', number> = {
              'High': 3,
              'Medium': 2,
              'Low': 1,
            };
            
            if (levelHierarchy[current] > levelHierarchy[suggested]) {
              return (
                <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
                    <strong>Confidence Level Mismatch:</strong> Current level is "{current}" but you only have {sources.length} source(s). 
                    {sources.length === 0 && ' Add at least 2 sources for Medium confidence or 3+ for High confidence.'}
                    {sources.length === 1 && ' Add at least 1 more source for Medium confidence or 2+ more for High confidence.'}
                    {sources.length === 2 && ' Add at least 1 more source for High confidence.'}
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}
          
          <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
              Citation Sources ({sources.length})
            </h3>

            {/* Existing Sources */}
            <div className="space-y-2 mb-4">
              {sources.map((source, index) => (
                <div key={index} className="p-3 bg-white dark:bg-[#2a2825] border border-[#211f1c] dark:border-white/20 rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[11px] text-black dark:text-white font-medium">{source.title}</p>
                      {source.authors && (
                        <p className="text-[9px] text-black/60 dark:text-white/60">{source.authors}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {source.year && (
                          <Badge variant="outline" className="text-[8px]">{source.year}</Badge>
                        )}
                        {source.doi && (
                          <a
                            href={`https://doi.org/${source.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            DOI <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                        {source.weight !== undefined && source.weight !== 1.0 && (
                          <Badge variant="outline" className="text-[8px]">Weight: {source.weight.toFixed(2)}</Badge>
                        )}
                      </div>
                      {source.parameters && source.parameters.length > 0 && (
                        <div className="mt-2 text-[9px] text-black/60 dark:text-white/60">
                          <span className="italic">Used for:</span>{' '}
                          {source.parameters.map(param => {
                            const paramNames: Record<string, string> = {
                              'Y_value': 'Yield',
                              'D_value': 'Degradability',
                              'C_value': 'Contamination',
                              'M_value': 'Maturity',
                              'E_value': 'Energy',
                              'CR_practical_mean': 'CR Practical',
                              'CR_theoretical_mean': 'CR Theoretical'
                            };
                            return paramNames[param] || param;
                          }).join(', ')}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveSource(index)}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {sources.length === 0 && (
                <p className="text-[11px] text-black/60 dark:text-white/60 text-center py-4">
                  No sources added yet
                </p>
              )}
            </div>

            {/* Source Library Browser */}
            <div className="pt-4 border-t border-[#211f1c] dark:border-white/20 mb-4">
              <Dialog open={showSourceLibrary} onOpenChange={setShowSourceLibrary}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-[#211f1c] dark:border-white/20"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Source Library ({SOURCE_LIBRARY.length} available)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-['Sniglet:Regular',_sans-serif]">
                      Source Library
                    </DialogTitle>
                    <DialogDescription className="text-[11px]">
                      Browse and add academic sources from our curated library to support your scientific data.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                      <Input
                        type="text"
                        placeholder="Search by title, author, or tags..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="pl-10 text-[12px]"
                      />
                    </div>
                  </div>
                  
                  {/* Material-specific sources */}
                  {(() => {
                    const materialSources = getSourcesByMaterial(material.name);
                    if (materialSources.length > 0) {
                      return (
                        <div className="mb-4">
                          <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
                            Recommended for {material.name}
                          </h4>
                          <div className="space-y-2">
                            {materialSources.map(source => (
                              <Card key={source.id} className="p-3 bg-blue-50 dark:bg-blue-900/20">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-[11px] text-black dark:text-white font-medium">{source.title}</p>
                                    {source.authors && (
                                      <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">{source.authors}</p>
                                    )}
                                    {source.abstract && (
                                      <p className="text-[9px] text-black/60 dark:text-white/60 mt-1 line-clamp-2">{source.abstract}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {source.year && <Badge variant="outline" className="text-[8px]">{source.year}</Badge>}
                                      <Badge variant="outline" className="text-[8px]">{source.type}</Badge>
                                      <Badge variant="outline" className="text-[8px]">Weight: {source.weight?.toFixed(1)}</Badge>
                                      {source.doi && (
                                        <a
                                          href={`https://doi.org/${source.doi}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                          DOI <ExternalLink className="w-2 h-2" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleAddFromLibrary(source)}
                                    size="sm"
                                    className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black shrink-0"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* All sources */}
                  <div>
                    <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
                      All Sources
                    </h4>
                    <div className="space-y-2">
                      {SOURCE_LIBRARY
                        .filter(source => {
                          if (!librarySearch) return true;
                          const search = librarySearch.toLowerCase();
                          return (
                            source.title.toLowerCase().includes(search) ||
                            source.authors?.toLowerCase().includes(search) ||
                            source.tags?.some(tag => tag.includes(search)) ||
                            source.abstract?.toLowerCase().includes(search)
                          );
                        })
                        .map(source => (
                          <Card key={source.id} className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-[11px] text-black dark:text-white font-medium">{source.title}</p>
                                {source.authors && (
                                  <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">{source.authors}</p>
                                )}
                                {source.abstract && (
                                  <p className="text-[9px] text-black/60 dark:text-white/60 mt-1 line-clamp-2">{source.abstract}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {source.year && <Badge variant="outline" className="text-[8px]">{source.year}</Badge>}
                                  <Badge variant="outline" className="text-[8px]">{source.type}</Badge>
                                  <Badge variant="outline" className="text-[8px]">Weight: {source.weight?.toFixed(1)}</Badge>
                                  {source.tags && (
                                    <div className="flex gap-1">
                                      {source.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-[7px]">{tag}</Badge>
                                      ))}
                                    </div>
                                  )}
                                  {source.doi && (
                                    <a
                                      href={`https://doi.org/${source.doi}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      DOI <ExternalLink className="w-2 h-2" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleAddFromLibrary(source)}
                                size="sm"
                                className="bg-[#e6beb5] hover:bg-[#d6aea5] text-black shrink-0"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Add New Source */}
            <div className="pt-4 border-t border-[#211f1c] dark:border-white/20">
              <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-3">
                Add Custom Source
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px]">Title *</Label>
                  <Input
                    type="text"
                    value={newSource.title}
                    onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Study or paper title"
                    className="text-[12px]"
                  />
                </div>

                <div>
                  <Label className="text-[10px]">Authors</Label>
                  <Input
                    type="text"
                    value={newSource.authors || ''}
                    onChange={(e) => setNewSource(prev => ({ ...prev, authors: e.target.value }))}
                    placeholder="Smith, J. et al."
                    className="text-[12px]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px]">Year</Label>
                    <Input
                      type="number"
                      value={newSource.year || ''}
                      onChange={(e) => setNewSource(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
                      placeholder="2025"
                      className="text-[12px]"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-[10px]">DOI</Label>
                    <Input
                      type="text"
                      value={newSource.doi || ''}
                      onChange={(e) => setNewSource(prev => ({ ...prev, doi: e.target.value }))}
                      placeholder="10.1234/example"
                      className="text-[12px]"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px]">URL</Label>
                  <Input
                    type="text"
                    value={newSource.url || ''}
                    onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="text-[12px]"
                  />
                </div>

                <div>
                  <Label className="text-[10px]">Weight (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newSource.weight || 1.0}
                    onChange={(e) => setNewSource(prev => ({ ...prev, weight: parseFloat(e.target.value) || 1.0 }))}
                    className="text-[12px]"
                  />
                </div>

                <Button
                  onClick={handleAddSource}
                  className="w-full bg-[#e6beb5] hover:bg-[#d6aea5] text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
