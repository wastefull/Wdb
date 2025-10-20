import { useState } from 'react';
import { Upload, Download, RefreshCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  
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
  sources?: any[];
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

interface BatchScientificOperationsProps {
  materials: Material[];
  onUpdateMaterials: (materials: Material[]) => void;
  onBack: () => void;
  isEmbedded?: boolean; // Set to true when used in a tab
}

export function BatchScientificOperations({ materials, onUpdateMaterials, onBack, isEmbedded = false }: BatchScientificOperationsProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    withScientificData: number;
    withoutScientificData: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  } | null>(null);

  // Calculate statistics
  const calculateStats = () => {
    const withScientificData = materials.filter(m => m.Y_value !== undefined).length;
    const highConfidence = materials.filter(m => m.confidence_level === 'High').length;
    const mediumConfidence = materials.filter(m => m.confidence_level === 'Medium').length;
    const lowConfidence = materials.filter(m => m.confidence_level === 'Low').length;

    setStats({
      total: materials.length,
      withScientificData,
      withoutScientificData: materials.length - withScientificData,
      highConfidence,
      mediumConfidence,
      lowConfidence,
    });
  };

  // Export scientific data as JSON
  const handleExportJSON = () => {
    setExporting(true);
    
    try {
      const scientificData = materials.map(material => ({
        id: material.id,
        name: material.name,
        category: material.category,
        
        // Raw parameters
        Y_value: material.Y_value,
        D_value: material.D_value,
        C_value: material.C_value,
        M_value: material.M_value,
        E_value: material.E_value,
        
        // Composite scores
        CR_practical_mean: material.CR_practical_mean,
        CR_theoretical_mean: material.CR_theoretical_mean,
        CR_practical_CI95: material.CR_practical_CI95,
        CR_theoretical_CI95: material.CR_theoretical_CI95,
        
        // Metadata
        confidence_level: material.confidence_level,
        sources: material.sources,
        whitepaper_version: material.whitepaper_version,
        calculation_timestamp: material.calculation_timestamp,
        method_version: material.method_version,
      }));
      
      const blob = new Blob([JSON.stringify(scientificData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wastedb-scientific-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported scientific data for ${materials.length} materials`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Export as CSV (research-friendly format)
  const handleExportCSV = () => {
    setExporting(true);
    
    try {
      const headers = [
        'ID', 'Name', 'Category',
        'Y (Yield)', 'D (Degradability)', 'C (Contamination)', 'M (Maturity)', 'E (Energy)',
        'CR Practical Mean', 'CR Practical CI Lower', 'CR Practical CI Upper',
        'CR Theoretical Mean', 'CR Theoretical CI Lower', 'CR Theoretical CI Upper',
        'Confidence Level', 'Source Count', 'Whitepaper Version', 'Method Version', 'Timestamp'
      ];
      
      const rows = materials.map(m => [
        m.id,
        m.name,
        m.category,
        m.Y_value?.toFixed(4) || '',
        m.D_value?.toFixed(4) || '',
        m.C_value?.toFixed(4) || '',
        m.M_value?.toFixed(4) || '',
        m.E_value?.toFixed(4) || '',
        m.CR_practical_mean?.toFixed(4) || '',
        m.CR_practical_CI95?.lower.toFixed(4) || '',
        m.CR_practical_CI95?.upper.toFixed(4) || '',
        m.CR_theoretical_mean?.toFixed(4) || '',
        m.CR_theoretical_CI95?.lower.toFixed(4) || '',
        m.CR_theoretical_CI95?.upper.toFixed(4) || '',
        m.confidence_level || '',
        m.sources?.length || '0',
        m.whitepaper_version || '',
        m.method_version || '',
        m.calculation_timestamp || '',
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wastedb-scientific-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported scientific data for ${materials.length} materials as CSV`);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Import scientific data from JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid format: expected array of materials');
        }
        
        // Merge imported data with existing materials
        let updatedCount = 0;
        const updatedMaterials = materials.map(material => {
          const importedMaterial = importedData.find(im => im.id === material.id);
          
          if (importedMaterial) {
            updatedCount++;
            return {
              ...material,
              ...importedMaterial,
              // Preserve basic material info
              name: material.name,
              category: material.category,
              articles: material.articles,
            };
          }
          
          return material;
        });
        
        onUpdateMaterials(updatedMaterials);
        toast.success(`Imported scientific data for ${updatedCount} materials`);
      } catch (error) {
        toast.error('Failed to import data: ' + (error as Error).message);
        console.error(error);
      } finally {
        setImporting(false);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Recalculate confidence levels based on data completeness
  const handleRecalculateConfidence = () => {
    setRecalculating(true);
    setProgress(0);
    
    const updatedMaterials = materials.map((material, index) => {
      // Simulate progress
      setTimeout(() => {
        setProgress(((index + 1) / materials.length) * 100);
      }, 10);
      
      // Skip if no scientific data
      if (!material.Y_value) {
        return material;
      }
      
      // Calculate completeness score
      let completeness = 0;
      if (material.Y_value !== undefined) completeness += 0.2;
      if (material.D_value !== undefined) completeness += 0.2;
      if (material.C_value !== undefined) completeness += 0.2;
      if (material.M_value !== undefined) completeness += 0.2;
      if (material.sources && material.sources.length > 0) completeness += 0.2;
      
      // Determine confidence level
      let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Low';
      if (completeness >= 0.8 && material.sources && material.sources.length >= 2) {
        confidenceLevel = 'High';
      } else if (completeness >= 0.6) {
        confidenceLevel = 'Medium';
      }
      
      return {
        ...material,
        confidence_level: confidenceLevel,
      };
    });
    
    setTimeout(() => {
      onUpdateMaterials(updatedMaterials);
      setRecalculating(false);
      setProgress(0);
      calculateStats();
      toast.success('Confidence levels recalculated');
    }, materials.length * 10 + 100);
  };

  // Initial stats calculation
  if (!stats) {
    calculateStats();
  }

  return (
    <div className={!isEmbedded ? "min-h-screen bg-[#f5f3ed] dark:bg-[#1a1817] p-6" : ""}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Sniglet:Regular',_sans-serif] text-[24px] text-black dark:text-white mb-1">
              Batch Scientific Operations
            </h1>
            <p className="text-[12px] text-black/60 dark:text-white/60">
              Import, export, and manage scientific data for multiple materials
            </p>
          </div>
          {!isEmbedded && (
            <Button onClick={onBack} variant="outline">
              Back to Materials
            </Button>
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <Card className="p-6 mb-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
            <h2 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-4">
              Database Statistics
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#b8c8cb] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <div className="text-[24px] font-bold text-black dark:text-white">{stats.total}</div>
                <div className="text-[10px] text-black/60 dark:text-white/60">Total Materials</div>
              </div>
              
              <div className="p-4 bg-[#e4e3ac] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <div className="text-[24px] font-bold text-black dark:text-white">{stats.withScientificData}</div>
                <div className="text-[10px] text-black/60 dark:text-white/60">With Scientific Data</div>
              </div>
              
              <div className="p-4 bg-[#e6beb5] dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <div className="text-[24px] font-bold text-black dark:text-white">{stats.highConfidence}</div>
                <div className="text-[10px] text-black/60 dark:text-white/60">High Confidence</div>
              </div>
              
              <div className="p-4 bg-white dark:bg-[#1a1918] rounded-md border border-[#211f1c] dark:border-white/20">
                <div className="text-[24px] font-bold text-black dark:text-white">{stats.mediumConfidence}</div>
                <div className="text-[10px] text-black/60 dark:text-white/60">Medium Confidence</div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="batch">Batch Operations</TabsTrigger>
            <TabsTrigger value="audit">Data Quality</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-[12px] text-blue-800 dark:text-blue-200">Export Scientific Data</AlertTitle>
              <AlertDescription className="text-[10px] text-blue-700 dark:text-blue-300">
                Export all scientific metadata for research, backup, or sharing with collaborators.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
                  Export as JSON
                </h3>
                <p className="text-[11px] text-black/60 dark:text-white/60 mb-4">
                  Complete scientific data including sources, confidence intervals, and all metadata. Best for backups and programmatic use.
                </p>
                <Button 
                  onClick={handleExportJSON}
                  disabled={exporting}
                  className="w-full bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export JSON'}
                </Button>
              </Card>

              <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
                  Export as CSV
                </h3>
                <p className="text-[11px] text-black/60 dark:text-white/60 mb-4">
                  Research-friendly spreadsheet format with all parameters and confidence intervals. Best for analysis in Excel/R/Python.
                </p>
                <Button 
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="w-full bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-[12px] text-yellow-800 dark:text-yellow-200">Import Warning</AlertTitle>
              <AlertDescription className="text-[10px] text-yellow-700 dark:text-yellow-300">
                Importing will merge scientific data with existing materials based on ID. Existing scientific data will be overwritten.
              </AlertDescription>
            </Alert>

            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
                Import Scientific Data from JSON
              </h3>
              <p className="text-[11px] text-black/60 dark:text-white/60 mb-4">
                Upload a JSON file previously exported from WasteDB. The system will match materials by ID and update their scientific metadata.
              </p>
              
              <div className="border-2 border-dashed border-[#211f1c] dark:border-white/20 rounded-md p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-black/40 dark:text-white/40" />
                <p className="text-[12px] text-black/60 dark:text-white/60 mb-4">
                  Select a JSON file to import
                </p>
                <label htmlFor="json-upload">
                  <Button 
                    as="span"
                    disabled={importing}
                    className="bg-[#e6beb5] hover:bg-[#d6aea5] text-black cursor-pointer"
                  >
                    {importing ? 'Importing...' : 'Choose File'}
                  </Button>
                  <input
                    id="json-upload"
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </Card>
          </TabsContent>

          {/* Batch Operations Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
                Recalculate Confidence Levels
              </h3>
              <p className="text-[11px] text-black/60 dark:text-white/60 mb-4">
                Automatically recalculate confidence levels for all materials based on data completeness, parameter availability, and source count.
              </p>
              
              {recalculating && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-[10px] text-black/60 dark:text-white/60 mt-2 text-center">
                    Processing {Math.round(progress)}%...
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleRecalculateConfidence}
                disabled={recalculating}
                className="w-full bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculating...' : 'Recalculate All Confidence Levels'}
              </Button>
            </Card>

            {/* Materials Summary Table */}
            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
                Materials Overview
              </h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Material</TableHead>
                      <TableHead className="text-[10px]">Category</TableHead>
                      <TableHead className="text-[10px]">Scientific Data</TableHead>
                      <TableHead className="text-[10px]">Confidence</TableHead>
                      <TableHead className="text-[10px]">Sources</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.slice(0, 10).map(material => (
                      <TableRow key={material.id}>
                        <TableCell className="text-[11px]">{material.name}</TableCell>
                        <TableCell className="text-[10px]">
                          <Badge variant="outline" className="text-[8px]">{material.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {material.Y_value !== undefined ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <span className="text-[10px] text-black/40 dark:text-white/40">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {material.confidence_level && (
                            <Badge 
                              className={`text-[8px] ${
                                material.confidence_level === 'High' ? 'bg-green-100 text-green-800' :
                                material.confidence_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {material.confidence_level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[10px]">
                          {material.sources?.length || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {materials.length > 10 && (
                  <p className="text-[10px] text-black/60 dark:text-white/60 mt-2 text-center">
                    Showing 10 of {materials.length} materials
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Data Quality Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-[12px] text-amber-800 dark:text-amber-200">Data Quality Audit</AlertTitle>
              <AlertDescription className="text-[10px] text-amber-700 dark:text-amber-300">
                Review materials with potential data quality issues where confidence levels don't match the number of supporting sources.
              </AlertDescription>
            </Alert>

            <Card className="p-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-4">
                Confidence Level Validation
              </h3>
              
              {(() => {
                const issues = materials.filter(m => {
                  const sourceCount = m.sources?.length || 0;
                  const level = m.confidence_level;
                  
                  if (!level) return false;
                  
                  if (level === 'High' && sourceCount < 3) return true;
                  if (level === 'Medium' && sourceCount < 2) return true;
                  if ((level === 'High' || level === 'Medium') && sourceCount === 0) return true;
                  
                  return false;
                });

                if (issues.length === 0) {
                  return (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-[11px] text-green-800 dark:text-green-200">
                        All materials have appropriate confidence levels based on their source count. No data quality issues detected.
                      </AlertDescription>
                    </Alert>
                  );
                }

                return (
                  <div className="space-y-4">
                    <Alert className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-[11px] text-red-800 dark:text-red-200">
                        Found {issues.length} material(s) with confidence level / source count mismatches
                      </AlertDescription>
                    </Alert>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">Material</TableHead>
                            <TableHead className="text-[10px]">Current Level</TableHead>
                            <TableHead className="text-[10px]">Sources</TableHead>
                            <TableHead className="text-[10px]">Issue</TableHead>
                            <TableHead className="text-[10px]">Recommended</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {issues.map(material => {
                            const sourceCount = material.sources?.length || 0;
                            const level = material.confidence_level || 'Low';
                            
                            let recommended: 'High' | 'Medium' | 'Low' = 'Low';
                            if (sourceCount >= 3) {
                              recommended = 'High';
                            } else if (sourceCount >= 2) {
                              recommended = 'Medium';
                            }
                            
                            let issue = '';
                            if (level === 'High' && sourceCount < 3) {
                              issue = sourceCount === 0 
                                ? 'No sources for High confidence' 
                                : `Need ${3 - sourceCount} more source(s)`;
                            } else if (level === 'Medium' && sourceCount < 2) {
                              issue = sourceCount === 0 
                                ? 'No sources for Medium confidence' 
                                : `Need ${2 - sourceCount} more source(s)`;
                            }
                            
                            return (
                              <TableRow key={material.id}>
                                <TableCell className="text-[11px]">{material.name}</TableCell>
                                <TableCell>
                                  <Badge 
                                    className={`text-[8px] ${
                                      level === 'High' ? 'bg-green-100 text-green-800' :
                                      level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[10px]">
                                  {sourceCount === 0 ? (
                                    <span className="text-red-600 dark:text-red-400">0</span>
                                  ) : (
                                    sourceCount
                                  )}
                                </TableCell>
                                <TableCell className="text-[10px] text-red-600 dark:text-red-400">
                                  {issue}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline"
                                    className={`text-[8px] ${
                                      recommended === 'High' ? 'border-green-400 text-green-700' :
                                      recommended === 'Medium' ? 'border-yellow-400 text-yellow-700' :
                                      'border-red-400 text-red-700'
                                    }`}
                                  >
                                    {recommended}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="pt-4 border-t border-[#211f1c] dark:border-white/20">
                      <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
                        Guidelines
                      </h4>
                      <ul className="text-[10px] text-black/60 dark:text-white/60 space-y-1">
                        <li>• <strong>High Confidence:</strong> Requires 3+ peer-reviewed sources</li>
                        <li>• <strong>Medium Confidence:</strong> Requires 2+ credible sources</li>
                        <li>• <strong>Low Confidence:</strong> 0-1 sources or preliminary data</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
