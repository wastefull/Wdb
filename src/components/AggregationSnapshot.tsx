import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Database, BookOpen, GitBranch, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface AggregationData {
  id: string;
  material_id: string;
  parameter_code: string;
  aggregated_value: number;
  miu_count: number;
  miu_ids: string[];
  weights_used: Array<{
    miu_id: string;
    confidence_level: string;
    weight: number;
  }>;
  transform_version: string;
  ontology_version: string;
  weight_policy_version: string;
  codebook_version: string;
  computed_at: string;
  computed_by?: string;
}

interface AggregationSnapshotProps {
  aggregation: AggregationData;
  onViewEvidence?: (miuIds: string[]) => void;
}

/**
 * AggregationSnapshot component displays the complete version tracking
 * for a parameter aggregation, showing all versions used in the computation.
 * This ensures full reproducibility and audit trail.
 */
export function AggregationSnapshot({ aggregation, onViewEvidence }: AggregationSnapshotProps) {
  const {
    parameter_code,
    aggregated_value,
    miu_count,
    miu_ids,
    weights_used,
    transform_version,
    ontology_version,
    weight_policy_version,
    codebook_version,
    computed_at,
  } = aggregation;

  const computedDate = new Date(computed_at);

  return (
    <Card className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-['Sniglet'] text-[14px]">
              Aggregation Snapshot: {parameter_code}
            </CardTitle>
            <CardDescription className="font-['Sniglet'] text-[11px] mt-1">
              Computed {computedDate.toLocaleDateString()} at {computedDate.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-['Sniglet'] text-[10px]">
            {miu_count} MIUs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aggregated Value */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="text-[10px] text-black/60 dark:text-white/60 font-['Sniglet'] mb-1">
            Weighted Mean
          </div>
          <div className="text-[20px] font-['Fredoka_One'] text-blue-600 dark:text-blue-400">
            {aggregated_value.toFixed(2)}
          </div>
        </div>

        {/* Version Tracking */}
        <div className="space-y-3">
          <h4 className="font-['Sniglet'] text-[12px] text-black dark:text-white flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Version Snapshot
          </h4>

          <div className="space-y-2">
            {/* Transform Version */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-black/60 dark:text-white/60" />
                <span className="font-['Sniglet'] text-[10px] text-black dark:text-white">
                  Transform
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-['Sniglet'] text-[9px]">
                  v{transform_version}
                </Badge>
                <a
                  href="/data/transforms.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Ontology Version */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-black/60 dark:text-white/60" />
                <span className="font-['Sniglet'] text-[10px] text-black dark:text-white">
                  Ontology
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-['Sniglet'] text-[9px]">
                  v{ontology_version}
                </Badge>
                <a
                  href="/data/ontologies/units.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Weight Policy Version */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-black/60 dark:text-white/60" />
                <span className="font-['Sniglet'] text-[10px] text-black dark:text-white">
                  Weight Policy
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-['Sniglet'] text-[9px]">
                  v{weight_policy_version}
                </Badge>
                <span className="font-['Sniglet'] text-[9px] text-black/60 dark:text-white/60">
                  (high: 1.0, medium: 0.7, low: 0.4)
                </span>
              </div>
            </div>

            {/* Codebook Version */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-black/60 dark:text-white/60" />
                <span className="font-['Sniglet'] text-[10px] text-black dark:text-white">
                  Codebook
                </span>
              </div>
              <Badge variant="outline" className="font-['Sniglet'] text-[9px]">
                v{codebook_version}
              </Badge>
            </div>
          </div>
        </div>

        {/* Weights Used */}
        <div className="space-y-2">
          <h4 className="font-['Sniglet'] text-[12px] text-black dark:text-white">
            Confidence Weights
          </h4>
          <div className="space-y-1">
            {weights_used.map((w, index) => (
              <div
                key={w.miu_id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-[10px]"
              >
                <span className="font-['Sniglet'] text-black/60 dark:text-white/60">
                  MIU {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-['Sniglet'] text-[9px] ${
                      w.confidence_level === 'high'
                        ? 'border-green-500 text-green-700 dark:text-green-400'
                        : w.confidence_level === 'medium'
                        ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                        : 'border-red-500 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {w.confidence_level}
                  </Badge>
                  <span className="font-['Sniglet'] text-black dark:text-white">
                    {w.weight.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Evidence Button */}
        {onViewEvidence && (
          <Button
            onClick={() => onViewEvidence(miu_ids)}
            variant="outline"
            size="sm"
            className="w-full font-['Sniglet'] text-[11px]"
          >
            View {miu_count} Evidence Point{miu_count !== 1 ? 's' : ''}
          </Button>
        )}

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-[#211f1c]/20 dark:border-white/20">
          <div className="text-[9px] text-black/50 dark:text-white/50 font-['Sniglet']">
            <div className="flex items-center justify-between">
              <span>Aggregation ID:</span>
              <code className="text-[8px] bg-muted px-1 py-0.5 rounded">
                {aggregation.id}
              </code>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Evidence Count:</span>
              <span>{miu_count} MIUs</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
