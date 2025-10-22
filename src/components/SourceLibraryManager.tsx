import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Search, BookOpen, ExternalLink, Save, X, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Source, SOURCE_LIBRARY } from '../data/sources';
import * as api from '../utils/api';

interface Material {
  id: string;
  name: string;
  sources?: Array<{
    title: string;
    authors?: string;
    year?: number;
    doi?: string;
    url?: string;
    weight?: number;
    parameters?: string[];
  }>;
}

interface SourceLibraryManagerProps {
  onBack: () => void;
  materials: Material[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function SourceLibraryManager({ onBack, materials, isAuthenticated, isAdmin }: SourceLibraryManagerProps) {
  const [sources, setSources] = useState<Source[]>([...SOURCE_LIBRARY]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Source>>({
    title: '',
    authors: '',
    year: new Date().getFullYear(),
    doi: '',
    url: '',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: '',
    tags: []
  });

  // Load sources from cloud on mount
  useEffect(() => {
    loadSourcesFromCloud();
  }, []);

  const loadSourcesFromCloud = async () => {
    try {
      setLoading(true);
      const cloudSources = await api.getAllSources();
      
      if (cloudSources.length > 0) {
        setSources(cloudSources);
        setCloudSynced(true);
      } else {
        // No cloud sources, use default library
        setSources([...SOURCE_LIBRARY]);
        setCloudSynced(false);
      }
    } catch (error) {
      console.error('Failed to load sources from cloud:', error);
      toast.error('Failed to load sources from cloud');
      setSources([...SOURCE_LIBRARY]);
      setCloudSynced(false);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from sources
  const allTags = Array.from(new Set(sources.flatMap(s => s.tags || []))).sort();

  // Filter sources
  const filteredSources = sources.filter(source => {
    const matchesSearch = !searchQuery || 
      source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || source.type === selectedType;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => source.tags?.includes(tag));

    return matchesSearch && matchesType && matchesTags;
  });

  // Get usage statistics for a source
  const getSourceUsage = (sourceTitle: string, sourceDoi?: string) => {
    return materials.filter(material => 
      material.sources?.some(s => 
        s.title === sourceTitle && 
        (!sourceDoi || !s.doi || s.doi === sourceDoi)
      )
    );
  };

  const handleAdd = async () => {
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    const newSource: Source = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      authors: formData.authors,
      year: formData.year,
      doi: formData.doi,
      url: formData.url,
      weight: formData.weight || 1.0,
      type: formData.type as Source['type'],
      abstract: formData.abstract,
      tags: formData.tags || []
    };

    // Update local state
    setSources([...sources, newSource]);

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin) {
      try {
        await api.createSource(newSource);
        toast.success('Source added and synced to cloud');
        setCloudSynced(true);
      } catch (error) {
        console.error('Failed to sync source to cloud:', error);
        toast.error('Source added locally but failed to sync to cloud');
      }
    } else {
      toast.success('Source added to library');
    }
    
    resetForm();
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setFormData(source);
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    const updatedSource = { ...editingSource, ...formData } as Source;

    // Update local state
    setSources(sources.map(s => 
      s.id === editingSource?.id ? updatedSource : s
    ));

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin && editingSource) {
      try {
        await api.updateSource(editingSource.id, updatedSource);
        toast.success('Source updated and synced to cloud');
        setCloudSynced(true);
      } catch (error) {
        console.error('Failed to sync source update to cloud:', error);
        toast.error('Source updated locally but failed to sync to cloud');
      }
    } else {
      toast.success('Source updated');
    }
    
    resetForm();
  };

  const handleDelete = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    const usage = getSourceUsage(source?.title || '', source?.doi);
    
    if (usage.length > 0) {
      toast.error(`Cannot delete: Used by ${usage.length} material(s)`);
      return;
    }

    // Update local state
    setSources(sources.filter(s => s.id !== sourceId));

    // Sync to cloud if authenticated and admin
    if (isAuthenticated && isAdmin) {
      try {
        await api.deleteSource(sourceId);
        toast.success('Source removed and synced to cloud');
        setCloudSynced(true);
      } catch (error) {
        console.error('Failed to sync source deletion to cloud:', error);
        toast.error('Source removed locally but failed to sync to cloud');
      }
    } else {
      toast.success('Source removed from library');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSource(null);
    setFormData({
      title: '',
      authors: '',
      year: new Date().getFullYear(),
      doi: '',
      url: '',
      weight: 1.0,
      type: 'peer-reviewed',
      abstract: '',
      tags: []
    });
  };

  const getTypeColor = (type: Source['type']) => {
    switch (type) {
      case 'peer-reviewed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'government': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'industrial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'ngo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'internal': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: Source['type']) => {
    const labels: Record<Source['type'], string> = {
      'peer-reviewed': 'Peer-Reviewed',
      'government': 'Government',
      'industrial': 'Industrial/LCA',
      'ngo': 'NGO/Nonprofit',
      'internal': 'Internal'
    };
    return labels[type];
  };

  const handleSyncToCloud = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error('Admin access required to sync to cloud');
      return;
    }

    try {
      await api.batchSaveSources(sources);
      toast.success(`${sources.length} sources synced to cloud`);
      setCloudSynced(true);
    } catch (error) {
      console.error('Failed to sync sources to cloud:', error);
      toast.error('Failed to sync sources to cloud');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Cloud className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20 animate-pulse" />
            <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
              Loading sources...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white">
                Source Library Management
              </h1>
              {cloudSynced ? (
                <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <CloudOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
              Manage academic sources and citations ({sources.length} sources)
              {cloudSynced ? ' • Synced with cloud' : ' • Local only'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && isAdmin && !cloudSynced && sources.length > 0 && (
              <Button
                onClick={handleSyncToCloud}
                variant="outline"
                className="border-[#211f1c] dark:border-white/20"
              >
                <Cloud className="w-4 h-4 mr-2" />
                Sync to Cloud
              </Button>
            )}
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
              disabled={!isAuthenticated || !isAdmin}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label className="text-[11px] mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <Input
                  type="text"
                  placeholder="Search by title, author, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-[12px]"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Label className="text-[11px] mb-2 block">Source Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="peer-reviewed">Peer-Reviewed</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="industrial">Industrial/LCA</SelectItem>
                  <SelectItem value="ngo">NGO/Nonprofit</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <div>
              <Label className="text-[11px] mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-2 bg-white dark:bg-[#1a1918] border border-[#211f1c] dark:border-white/20 rounded-md">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className={`cursor-pointer text-[9px] ${
                      selectedTags.includes(tag) 
                        ? 'bg-blue-500 text-white' 
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {(selectedType !== 'all' || selectedTags.length > 0 || searchQuery) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Showing {filteredSources.length} of {sources.length} sources
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedTags([]);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Sources Table */}
        <Card className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Source</TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Type</TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Weight</TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Tags</TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-center">Usage</TableHead>
                  <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map(source => {
                  const usage = getSourceUsage(source.title, source.doi);
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white font-medium">
                            {source.title}
                          </p>
                          {source.authors && (
                            <p className="text-[9px] text-black/60 dark:text-white/60">
                              {source.authors}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {source.year && (
                              <Badge variant="outline" className="text-[8px]">
                                {source.year}
                              </Badge>
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
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[8px] ${getTypeColor(source.type)}`}>
                          {getTypeLabel(source.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-black dark:text-white">
                          {source.weight?.toFixed(1) || '1.0'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {source.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[8px]">
                              {tag}
                            </Badge>
                          ))}
                          {source.tags && source.tags.length > 3 && (
                            <Badge variant="outline" className="text-[8px]">
                              +{source.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {usage.length > 0 ? (
                          <Badge variant="outline" className="text-[9px]">
                            {usage.length} material{usage.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-black/40 dark:text-white/40">
                            Unused
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(source)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(source.id)}
                            disabled={usage.length > 0}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSources.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
                No sources found
              </p>
            </div>
          )}
        </Card>

        {/* Add/Edit Source Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Sniglet:Regular',_sans-serif]">
                {editingSource ? 'Edit Source' : 'Add New Source'}
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Add or edit academic sources in the library. These sources can be cited in scientific data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label className="text-[11px]">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Paper title..."
                  className="text-[12px]"
                />
              </div>

              {/* Authors */}
              <div>
                <Label className="text-[11px]">Authors</Label>
                <Input
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  placeholder="Smith, J., Doe, A., et al."
                  className="text-[12px]"
                />
              </div>

              {/* Year and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="text-[12px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Source Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: Source['type']) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peer-reviewed">Peer-Reviewed (1.0)</SelectItem>
                      <SelectItem value="government">Government (0.9)</SelectItem>
                      <SelectItem value="industrial">Industrial/LCA (0.7)</SelectItem>
                      <SelectItem value="ngo">NGO/Nonprofit (0.6)</SelectItem>
                      <SelectItem value="internal">Internal (0.3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DOI and URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">DOI</Label>
                  <Input
                    value={formData.doi}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    placeholder="10.1016/j.example.2024.01.001"
                    className="text-[12px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    className="text-[12px]"
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <Label className="text-[11px]">Weight (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="text-[12px]"
                />
                <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
                  Confidence weight for aggregation calculations
                </p>
              </div>

              {/* Abstract */}
              <div>
                <Label className="text-[11px]">Abstract</Label>
                <Textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Brief summary of the source..."
                  rows={3}
                  className="text-[12px]"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-[11px]">Tags (comma-separated)</Label>
                <Input
                  value={formData.tags?.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="plastic, recycling, pet, yield"
                  className="text-[12px]"
                />
                <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
                  Material types, processes, parameters (e.g., glass, recycling, yield)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={editingSource ? handleUpdate : handleAdd}
                  className="bg-[#b8c8cb] hover:bg-[#a8b8bb] text-black"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingSource ? 'Update' : 'Add'} Source
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Alert */}
        {!isAuthenticated || !isAdmin ? (
          <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-[11px] text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Admin access required to modify the source library. Sign in with an admin account to add, edit, or delete sources.
            </AlertDescription>
          </Alert>
        ) : cloudSynced ? (
          <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
            <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-[11px] text-green-800 dark:text-green-200">
              <strong>Cloud Sync Active:</strong> Changes to the source library are automatically synced to the cloud and will persist across sessions.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
            <CloudOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-[11px] text-orange-800 dark:text-orange-200">
              <strong>Local Only:</strong> Sources are stored locally. Click "Sync to Cloud" to save changes permanently.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
