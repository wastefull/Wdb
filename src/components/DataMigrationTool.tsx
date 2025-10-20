import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Database, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  migrateAllMaterials, 
  getMigrationStats, 
  needsMigration,
  previewSourcesForMaterial
} from '../utils/dataMigration';

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  Y_value?: number;
  sources?: any[];
  confidence_level?: 'High' | 'Medium' | 'Low';
}

interface DataMigrationToolProps {
  materials: Material[];
  onMigrate: (materials: Material[]) => void;
}

export function DataMigrationTool({ materials, onMigrate }: DataMigrationToolProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  
  const stats = getMigrationStats(materials);
  const materialsNeedingMigration = materials.filter(needsMigration);

  const handleMigrate = async () => {
    if (materialsNeedingMigration.length === 0) {
      toast.info('All materials are up to date!');
      return;
    }

    setIsMigrating(true);
    
    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const migratedMaterials = migrateAllMaterials(materials);
      onMigrate(migratedMaterials);
      
      toast.success(
        `Successfully migrated ${materialsNeedingMigration.length} material(s)!`,
        { description: 'Scientific data and sources have been added.' }
      );
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Failed to migrate materials');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="p-6 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2">
            Data Migration Tool
          </h3>
          
          <p className="text-[12px] text-black/70 dark:text-white/70 mb-4">
            Backfill existing materials with scientific parameters and source citations from the source library.
          </p>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
              <div className="text-[10px] text-black/60 dark:text-white/60 mb-1">Total Materials</div>
              <div className="text-[20px] text-black dark:text-white">{stats.total}</div>
            </div>
            
            <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
              <div className="text-[10px] text-black/60 dark:text-white/60 mb-1">Need Migration</div>
              <div className="text-[20px] text-black dark:text-white">
                {stats.needsMigration}
              </div>
            </div>
            
            <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
              <div className="text-[10px] text-black/60 dark:text-white/60 mb-1">Has Sci Data</div>
              <div className="text-[20px] text-black dark:text-white">
                {stats.hasScientificData}
              </div>
            </div>
            
            <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
              <div className="text-[10px] text-black/60 dark:text-white/60 mb-1">Has Sources</div>
              <div className="text-[20px] text-black dark:text-white">
                {stats.hasSources}
              </div>
            </div>
            
            <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
              <div className="text-[10px] text-black/60 dark:text-white/60 mb-1">High Confidence</div>
              <div className="text-[20px] text-black dark:text-white">
                {stats.highConfidence}
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {stats.needsMigration > 0 ? (
            <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
                <strong>{stats.needsMigration} material(s)</strong> are missing scientific data or sources. 
                Migration will automatically add default parameters and citations from the source library.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-[11px] text-green-800 dark:text-green-200">
                All materials are up to date with scientific data and sources!
              </AlertDescription>
            </Alert>
          )}

          {/* Materials Needing Migration */}
          {materialsNeedingMigration.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                {showDetails ? 'Hide' : 'Show'} materials needing migration
              </button>
              
              {showDetails && (
                <div className="space-y-2 p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
                  {materialsNeedingMigration.map(material => {
                    const isExpanded = expandedMaterial === material.id;
                    const previewSources = previewSourcesForMaterial(material.name);
                    
                    return (
                      <div key={material.id} className="border border-[#211f1c]/10 dark:border-white/10 rounded-md overflow-hidden">
                        <div 
                          className="flex items-center justify-between text-[11px] p-2 hover:bg-[#211f1c]/5 dark:hover:bg-white/5 cursor-pointer"
                          onClick={() => setExpandedMaterial(isExpanded ? null : material.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-black/40 dark:text-white/40" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-black/40 dark:text-white/40" />
                            )}
                            <span className="text-black dark:text-white font-medium">{material.name}</span>
                          </div>
                          <div className="flex gap-2">
                            {!material.Y_value && (
                              <Badge variant="outline" className="text-[8px] bg-amber-50 dark:bg-amber-900/20">
                                No sci data
                              </Badge>
                            )}
                            {(!material.sources || material.sources.length < 3) && (
                              <Badge variant="outline" className="text-[8px] bg-red-50 dark:bg-red-900/20">
                                {material.sources?.length || 0} sources
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[8px] bg-green-50 dark:bg-green-900/20">
                              Will add {previewSources.length}
                            </Badge>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-3 bg-[#211f1c]/5 dark:bg-white/5 border-t border-[#211f1c]/10 dark:border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-3 h-3 text-black/60 dark:text-white/60" />
                              <span className="text-[10px] text-black/60 dark:text-white/60 font-medium">
                                Sources that will be added:
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {previewSources.map((source, idx) => (
                                <div key={idx} className="text-[9px] text-black/80 dark:text-white/80 pl-5">
                                  <div className="flex items-start gap-2">
                                    <span className="text-black/40 dark:text-white/40 shrink-0">•</span>
                                    <div className="flex-1">
                                      <p className="font-medium">{source.title}</p>
                                      {source.authors && (
                                        <p className="text-black/60 dark:text-white/60">{source.authors} ({source.year})</p>
                                      )}
                                      <div className="flex gap-1 mt-0.5">
                                        <Badge variant="outline" className="text-[7px]">
                                          Weight: {source.weight?.toFixed(1)}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Migration Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleMigrate}
              disabled={isMigrating || stats.needsMigration === 0}
              className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Migrate {stats.needsMigration > 0 ? `${stats.needsMigration} Material(s)` : 'All'}
                </>
              )}
            </Button>
          </div>

          {/* What Migration Does */}
          <details className="mt-4">
            <summary className="text-[11px] text-black/60 dark:text-white/60 cursor-pointer hover:text-black dark:hover:text-white">
              What does migration do?
            </summary>
            <div className="mt-2 text-[10px] text-black/60 dark:text-white/60 space-y-1 pl-4">
              <p>✓ Adds scientific parameters (Y, D, C, M, E values) based on material type</p>
              <p>✓ Adds 3-5 academic source citations from the source library</p>
              <p>✓ Calculates CR practical and theoretical scores with confidence intervals</p>
              <p>✓ Sets appropriate confidence level (High/Medium/Low) based on sources</p>
              <p>✓ Adds whitepaper version and methodology metadata</p>
              <p>✓ Preserves all existing material data (name, scores, articles, etc.)</p>
            </div>
          </details>
          
          {/* How Sources Are Selected */}
          <details className="mt-2">
            <summary className="text-[11px] text-black/60 dark:text-white/60 cursor-pointer hover:text-black dark:hover:text-white">
              How are sources selected?
            </summary>
            <div className="mt-2 text-[10px] text-black/60 dark:text-white/60 space-y-1 pl-4">
              <p><strong>Smart Tag Matching:</strong> Material name is parsed (e.g., "Plastic (PET)" → "plastic", "pet") and matched against source tags</p>
              <p><strong>Relevance Scoring:</strong> Sources scored by tag matches, title mentions, and abstract content</p>
              <p><strong>Quality Prioritization:</strong> Peer-reviewed sources (weight 1.0) ranked higher than industrial reports (0.7)</p>
              <p><strong>Diversity:</strong> Mix of 3-4 material-specific sources + 1 general LCA/methodology source</p>
              <p><strong>Example:</strong> "Cardboard" gets tagged sources for cardboard, paper, recycling, composting</p>
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
}
