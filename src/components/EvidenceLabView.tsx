import { useState } from 'react';
import { ArrowLeft, Search, Plus, Filter, BookOpen, Database, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface EvidenceLabViewProps {
  onBack: () => void;
}

// MIU = Minimum Information Unit
interface MIU {
  id: string;
  parameter: string; // Y, D, C, M, E, B, N, T, H, L, R, U, C_RU
  source_id: string;
  source_title: string;
  value: number | string;
  unit?: string;
  context: string;
  page_number?: number;
  confidence: 'high' | 'medium' | 'low';
  created_at: string;
  created_by: string;
}

export function EvidenceLabView({ onBack }: EvidenceLabViewProps) {
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [selectedMIU, setSelectedMIU] = useState<MIU | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for wireframe
  const parameters = [
    { code: 'Y', name: 'Years to Degrade', color: '#e6beb5' },
    { code: 'D', name: 'Degradability', color: '#b8c8cb' },
    { code: 'C', name: 'Compostability', color: '#a8d5ba' },
    { code: 'M', name: 'Methane Production', color: '#f4d5a6' },
    { code: 'E', name: 'Ecotoxicity', color: '#d4a5a5' },
    { code: 'B', name: 'Biodegradability', color: '#c4b5d5' },
    { code: 'N', name: 'Novelty', color: '#f5e6d3' },
    { code: 'T', name: 'Toxicity', color: '#e5c3c6' },
    { code: 'H', name: 'Human Health Impact', color: '#d4e4f7' },
    { code: 'L', name: 'Leachate Potential', color: '#d5e8d4' },
    { code: 'R', name: 'Recyclability', color: '#fff2cc' },
    { code: 'U', name: 'Reusability', color: '#ffe6cc' },
    { code: 'C_RU', name: 'Combined R+U', color: '#e1d5e7' },
  ];

  const mockMIUs: MIU[] = [
    {
      id: '1',
      parameter: 'Y',
      source_id: 'src_001',
      source_title: 'Biodegradation of PLA in Marine Environments',
      value: 450,
      unit: 'days',
      context: 'PLA films showed complete degradation in seawater at 25°C over 450 days',
      page_number: 12,
      confidence: 'high',
      created_at: '2024-01-15T10:30:00Z',
      created_by: 'natto@wastefull.org',
    },
    {
      id: '2',
      parameter: 'Y',
      source_id: 'src_002',
      source_title: 'Comparative Study of Bioplastic Degradation Rates',
      value: 380,
      unit: 'days',
      context: 'Under laboratory conditions (30°C, 60% humidity), PLA degraded in 380 days',
      page_number: 45,
      confidence: 'medium',
      created_at: '2024-01-20T14:20:00Z',
      created_by: 'natto@wastefull.org',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#e5e4dc] dark:bg-[#1a1917]">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="font-['Fredoka_One'] text-[24px] text-black dark:text-white">
            Evidence Lab
          </h2>
          <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
            Collect and organize scientific evidence for material parameters
          </p>
        </div>
        <Button className="bg-[#e6beb5] hover:bg-[#e6beb5]/90 border border-[#211f1c] dark:border-white/20">
          <Plus size={16} className="mr-2" />
          New Evidence Point
        </Button>
      </div>

      {/* Main Split-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Parameter Selection */}
        <div className="w-80 border-r border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825] flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
              <Input
                placeholder="Search parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 font-['Sniglet'] text-[12px]"
              />
            </div>
          </div>

          {/* Parameter List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {parameters.map((param) => (
                <button
                  key={param.code}
                  onClick={() => setSelectedParameter(param.code)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedParameter === param.code
                      ? 'border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                      : 'border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md border border-[#211f1c] dark:border-white/20 flex items-center justify-center font-['Fredoka_One'] text-[10px]"
                        style={{ backgroundColor: param.color }}
                      >
                        {param.code}
                      </div>
                      <span className="font-['Sniglet'] text-[13px] text-black dark:text-white">
                        {param.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-['Sniglet'] text-[9px]">
                      {param.code === 'Y' ? '2' : '0'} MIUs
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Middle Pane: MIU List */}
        <div className="flex-1 bg-white dark:bg-[#2a2825] flex flex-col border-r border-[#211f1c]/20 dark:border-white/20">
          {selectedParameter ? (
            <>
              {/* MIU List Header */}
              <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white">
                    Evidence Points for {parameters.find(p => p.code === selectedParameter)?.name}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Filter size={14} className="mr-2" />
                    Filter
                  </Button>
                </div>
                <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
                  {mockMIUs.length} evidence points collected
                </p>
              </div>

              {/* MIU Cards */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {mockMIUs.map((miu) => (
                    <button
                      key={miu.id}
                      onClick={() => setSelectedMIU(miu)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedMIU?.id === miu.id
                          ? 'border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                          : 'border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40'
                      }`}
                    >
                      {/* Source Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen size={14} className="text-black/40 dark:text-white/40 mt-0.5 flex-shrink-0" />
                        <span className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                          {miu.source_title}
                        </span>
                      </div>

                      {/* Value */}
                      <div className="flex items-center gap-2 mb-2">
                        <Database size={14} className="text-black/40 dark:text-white/40" />
                        <span className="font-['Fredoka_One'] text-[14px] text-black dark:text-white">
                          {miu.value} {miu.unit}
                        </span>
                        <Badge
                          variant={miu.confidence === 'high' ? 'default' : 'secondary'}
                          className="font-['Sniglet'] text-[9px] ml-auto"
                        >
                          {miu.confidence}
                        </Badge>
                      </div>

                      {/* Context (truncated) */}
                      <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60 line-clamp-2">
                        {miu.context}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#211f1c]/10 dark:border-white/10">
                        <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                          Page {miu.page_number}
                        </span>
                        <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                          •
                        </span>
                        <span className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40">
                          {new Date(miu.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Database size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
                <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                  Select a Parameter
                </h3>
                <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60 max-w-xs">
                  Choose a parameter from the left to view and manage its evidence points
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: MIU Detail View */}
        <div className="w-96 bg-white dark:bg-[#2a2825] flex flex-col">
          {selectedMIU ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
                <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-1">
                  Evidence Point Details
                </h3>
                <p className="font-['Sniglet'] text-[10px] text-black/40 dark:text-white/40">
                  ID: {selectedMIU.id}
                </p>
              </div>

              {/* Detail Content */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Source Information */}
                  <div>
                    <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      SOURCE
                    </label>
                    <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen size={14} className="text-black/60 dark:text-white/60 mt-0.5" />
                        <span className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                          {selectedMIU.source_title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-black/40 dark:text-white/40" />
                        <span className="font-['Sniglet'] text-[10px] text-black/60 dark:text-white/60">
                          Page {selectedMIU.page_number}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      EXTRACTED VALUE
                    </label>
                    <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                      <span className="font-['Fredoka_One'] text-[20px] text-black dark:text-white">
                        {selectedMIU.value} {selectedMIU.unit}
                      </span>
                    </div>
                  </div>

                  {/* Context */}
                  <div>
                    <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      CONTEXT
                    </label>
                    <div className="p-3 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
                      <p className="font-['Sniglet'] text-[12px] text-black dark:text-white leading-relaxed">
                        {selectedMIU.context}
                      </p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      CONFIDENCE LEVEL
                    </label>
                    <Badge
                      variant={selectedMIU.confidence === 'high' ? 'default' : 'secondary'}
                      className="font-['Sniglet'] text-[11px]"
                    >
                      {selectedMIU.confidence.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div>
                    <label className="block font-['Fredoka_One'] text-[11px] text-black/60 dark:text-white/60 mb-2">
                      METADATA
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-[#e5e4dc] dark:bg-[#1a1917]">
                        <span className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
                          Created by
                        </span>
                        <span className="font-['Sniglet'] text-[11px] text-black dark:text-white">
                          {selectedMIU.created_by}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-[#e5e4dc] dark:bg-[#1a1917]">
                        <span className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
                          Created at
                        </span>
                        <span className="font-['Sniglet'] text-[11px] text-black dark:text-white">
                          {new Date(selectedMIU.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Delete
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
                <h3 className="font-['Fredoka_One'] text-[16px] text-black dark:text-white mb-2">
                  No Selection
                </h3>
                <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60 max-w-xs">
                  Select an evidence point to view its details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
