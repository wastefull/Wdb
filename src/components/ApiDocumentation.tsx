/**
 * API Documentation Component
 * 
 * Provides comprehensive documentation for the WasteDB Research API,
 * including endpoint descriptions, parameters, examples, and interactive testing.
 */

import { useState } from 'react';
import { Copy, Check, ExternalLink, Database, Code, BookOpen, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface EndpointExample {
  description: string;
  url: string;
  response?: string;
}

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: EndpointParam[];
  queryParams?: EndpointParam[];
  examples: EndpointExample[];
  responseSchema?: string;
}

export const ApiDocumentation: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const endpoints: Record<string, ApiEndpoint[]> = {
    materials: [
      {
        method: 'GET',
        path: '/api/v1/materials',
        description: 'Retrieve a paginated list of all materials with optional filtering and sorting.',
        queryParams: [
          { name: 'category', type: 'string', required: false, description: 'Filter by material category', example: 'Plastics' },
          { name: 'search', type: 'string', required: false, description: 'Search in material names and descriptions', example: 'PET' },
          { name: 'sort', type: 'string', required: false, description: 'Field to sort by: name, recyclability, compostability, reusability', example: 'recyclability' },
          { name: 'order', type: 'string', required: false, description: 'Sort order: asc or desc', example: 'desc' },
          { name: 'limit', type: 'number', required: false, description: 'Maximum number of results (max 100)', example: '20' },
          { name: 'offset', type: 'number', required: false, description: 'Number of results to skip for pagination', example: '0' },
        ],
        examples: [
          {
            description: 'Get all materials',
            url: `${baseUrl}/api/v1/materials`,
          },
          {
            description: 'Get plastics sorted by recyclability (descending)',
            url: `${baseUrl}/api/v1/materials?category=Plastics&sort=recyclability&order=desc`,
          },
          {
            description: 'Search for materials containing "PET"',
            url: `${baseUrl}/api/v1/materials?search=PET&limit=10`,
          },
        ],
        responseSchema: `{
  "data": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "recyclability": 0-100,
      "compostability": 0-100,
      "reusability": 0-100,
      "description": "string",
      "Y_value": 0-1,  // Yield
      "D_value": 0-1,  // Degradation
      "C_value": 0-1,  // Contamination tolerance
      "M_value": 0-1,  // Maturity
      "E_value": 0-1,  // Energy
      ... // Additional scientific parameters
    }
  ],
  "meta": {
    "total": number,
    "limit": number,
    "offset": number,
    "count": number
  },
  "links": {
    "self": "string",
    "next": "string | null",
    "prev": "string | null"
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/materials/:id',
        description: 'Retrieve detailed information about a specific material by its ID.',
        params: [
          { name: 'id', type: 'string', required: true, description: 'Unique material identifier', example: 'pet-plastic' },
        ],
        examples: [
          {
            description: 'Get material by ID',
            url: `${baseUrl}/api/v1/materials/pet-plastic`,
          },
        ],
        responseSchema: `{
  "data": {
    "id": "string",
    "name": "string",
    "category": "string",
    "recyclability": 0-100,
    "compostability": 0-100,
    "reusability": 0-100,
    "description": "string",
    ... // All material fields and scientific parameters
  }
}`,
      },
    ],
    statistics: [
      {
        method: 'GET',
        path: '/api/v1/stats',
        description: 'Get aggregate statistics across all materials in the database.',
        examples: [
          {
            description: 'Get database statistics',
            url: `${baseUrl}/api/v1/stats`,
          },
        ],
        responseSchema: `{
  "data": {
    "totalMaterials": number,
    "categories": {
      "Plastics": number,
      "Metals": number,
      ... // Count per category
    },
    "averages": {
      "recyclability": number,
      "compostability": number,
      "reusability": number
    },
    "ranges": {
      "recyclability": { "min": number, "max": number },
      "compostability": { "min": number, "max": number },
      "reusability": { "min": number, "max": number }
    }
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/categories',
        description: 'Get the list of all material categories.',
        examples: [
          {
            description: 'Get all categories',
            url: `${baseUrl}/api/v1/categories`,
          },
        ],
        responseSchema: `{
  "data": [
    "Plastics",
    "Metals",
    "Glass",
    "Paper & Cardboard",
    "Fabrics & Textiles",
    "Electronics & Batteries",
    "Building Materials",
    "Organic/Natural Waste"
  ]
}`,
      },
    ],
    methodology: [
      {
        method: 'GET',
        path: '/api/v1/methodology',
        description: 'Get information about the WasteDB scoring methodology.',
        examples: [
          {
            description: 'Get methodology information',
            url: `${baseUrl}/api/v1/methodology`,
          },
        ],
        responseSchema: `{
  "data": {
    "version": "string",
    "description": "string",
    "metrics": [
      {
        "name": "Recyclability",
        "description": "string",
        "scale": "0-100",
        "parameters": ["Y", "D", "C", "M", "E"]
      },
      ...
    ],
    "whitepapers": [
      {
        "slug": "string",
        "title": "string",
        "link": "string"
      }
    ],
    "lastUpdated": "ISO 8601 timestamp"
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/whitepapers',
        description: 'Get a list of all methodology whitepapers.',
        examples: [
          {
            description: 'Get all whitepapers',
            url: `${baseUrl}/api/v1/whitepapers`,
          },
        ],
        responseSchema: `{
  "data": [
    {
      "slug": "string",
      "title": "string",
      "updatedAt": "ISO 8601 timestamp",
      "link": "string"
    }
  ]
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/whitepapers/:slug',
        description: 'Get the full content of a specific methodology whitepaper.',
        params: [
          { name: 'slug', type: 'string', required: true, description: 'Whitepaper slug identifier', example: 'recyclability' },
        ],
        examples: [
          {
            description: 'Get recyclability methodology',
            url: `${baseUrl}/api/v1/whitepapers/recyclability`,
          },
        ],
        responseSchema: `{
  "data": {
    "slug": "string",
    "title": "string",
    "content": "string (Markdown)",
    "updatedAt": "ISO 8601 timestamp"
  }
}`,
      },
    ],
    articles: [
      {
        method: 'GET',
        path: '/api/v1/articles',
        description: 'Get published articles, optionally filtered by material or category.',
        queryParams: [
          { name: 'material_id', type: 'string', required: false, description: 'Filter by material ID', example: 'pet-plastic' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category: compostability, recyclability, or reusability', example: 'recyclability' },
        ],
        examples: [
          {
            description: 'Get all published articles',
            url: `${baseUrl}/api/v1/articles`,
          },
          {
            description: 'Get recyclability articles for a specific material',
            url: `${baseUrl}/api/v1/articles?material_id=pet-plastic&category=recyclability`,
          },
        ],
        responseSchema: `{
  "data": [
    {
      "id": "string",
      "title": "string",
      "category": "DIY" | "Industrial" | "Experimental",
      "material_id": "string",
      "status": "published",
      "created_by": "string",
      "writer_name": "string",
      ... // Additional article fields
    }
  ]
}`,
      },
    ],
  };

  const renderEndpoint = (endpoint: ApiEndpoint) => {
    const fullPath = `${baseUrl}${endpoint.path}`;
    
    return (
      <Card key={endpoint.path} className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                  {endpoint.method}
                </Badge>
                <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.path}</code>
              </div>
              <CardDescription className="mt-2">{endpoint.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="mb-2">Path Parameters</h4>
              <div className="bg-muted/50 rounded p-3 space-y-2">
                {endpoint.params.map((param) => (
                  <div key={param.name} className="flex items-start gap-2">
                    <code className="text-sm bg-background px-2 py-1 rounded">{param.name}</code>
                    <Badge variant="outline" className="text-xs">
                      {param.type}
                    </Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        required
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex-1">{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <h4 className="mb-2">Query Parameters</h4>
              <div className="bg-muted/50 rounded p-3 space-y-2">
                {endpoint.queryParams.map((param) => (
                  <div key={param.name} className="flex items-start gap-2 flex-wrap">
                    <code className="text-sm bg-background px-2 py-1 rounded">{param.name}</code>
                    <Badge variant="outline" className="text-xs">
                      {param.type}
                    </Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        required
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex-1 basis-full md:basis-auto">
                      {param.description}
                    </span>
                    {param.example && (
                      <code className="text-xs bg-background px-2 py-1 rounded text-muted-foreground">
                        e.g., {param.example}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          <div>
            <h4 className="mb-2">Examples</h4>
            <div className="space-y-2">
              {endpoint.examples.map((example, idx) => (
                <div key={idx} className="bg-muted/50 rounded p-3">
                  <p className="text-sm mb-2">{example.description}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded flex-1 overflow-x-auto">
                      {example.url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(example.url, example.url)}
                    >
                      {copiedUrl === example.url ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(example.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Schema */}
          {endpoint.responseSchema && (
            <div>
              <h4 className="mb-2">Response Schema</h4>
              <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto">
                <code>{endpoint.responseSchema}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const codeExamples = {
    javascript: `// Using fetch API
const baseUrl = '${baseUrl}';

// Get all materials
const response = await fetch(\`\${baseUrl}/api/v1/materials\`);
const data = await response.json();
console.log(data.data); // Array of materials

// Get materials with filters
const filtered = await fetch(
  \`\${baseUrl}/api/v1/materials?category=Plastics&sort=recyclability&order=desc\`
);
const filteredData = await filtered.json();

// Get single material
const material = await fetch(\`\${baseUrl}/api/v1/materials/pet-plastic\`);
const materialData = await material.json();
console.log(materialData.data);`,

    python: `import requests

base_url = '${baseUrl}'

# Get all materials
response = requests.get(f'{base_url}/api/v1/materials')
data = response.json()
print(data['data'])  # List of materials

# Get materials with filters
filtered = requests.get(
    f'{base_url}/api/v1/materials',
    params={
        'category': 'Plastics',
        'sort': 'recyclability',
        'order': 'desc'
    }
)
filtered_data = filtered.json()

# Get single material
material = requests.get(f'{base_url}/api/v1/materials/pet-plastic')
material_data = material.json()
print(material_data['data'])`,

    curl: `# Get all materials
curl "${baseUrl}/api/v1/materials"

# Get materials with filters
curl "${baseUrl}/api/v1/materials?category=Plastics&sort=recyclability&order=desc"

# Get single material
curl "${baseUrl}/api/v1/materials/pet-plastic"

# Get statistics
curl "${baseUrl}/api/v1/stats"

# Get methodology info
curl "${baseUrl}/api/v1/methodology"`,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Research API Documentation</h1>
        <p className="text-muted-foreground mt-2">
          The WasteDB Research API provides programmatic access to our comprehensive materials sustainability database.
          All endpoints are public and do not require authentication.
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2">Base URL</h4>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-2 rounded flex-1">
                {baseUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(baseUrl, 'baseUrl')}
              >
                {copiedUrl === 'baseUrl' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="mb-2">Key Features</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>No authentication required - fully open access</li>
              <li>RESTful JSON API with pagination support</li>
              <li>Comprehensive filtering and sorting options</li>
              <li>Access to 1000+ materials with detailed sustainability scores</li>
              <li>Scientific methodology documentation and whitepapers</li>
              <li>Rate limiting: 100 requests per minute</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials">
            <Database className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <Activity className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="methodology">
            <BookOpen className="h-4 w-4 mr-2" />
            Methodology
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Code Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-6">
          <h2 className="mb-4">Materials Endpoints</h2>
          {endpoints.materials.map((endpoint) => renderEndpoint(endpoint))}
          
          <h3 className="mb-4 mt-6">Articles Endpoints</h3>
          {endpoints.articles.map((endpoint) => renderEndpoint(endpoint))}
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <h2 className="mb-4">Statistics & Categories</h2>
          {endpoints.statistics.map((endpoint) => renderEndpoint(endpoint))}
        </TabsContent>

        <TabsContent value="methodology" className="mt-6">
          <h2 className="mb-4">Methodology & Whitepapers</h2>
          {endpoints.methodology.map((endpoint) => renderEndpoint(endpoint))}
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <h2 className="mb-4">Code Examples</h2>
          
          <div className="space-y-6">
            {/* JavaScript */}
            <Card>
              <CardHeader>
                <CardTitle>JavaScript / TypeScript</CardTitle>
                <CardDescription>Using the Fetch API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
                    <code>{codeExamples.javascript}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.javascript, 'js')}
                  >
                    {copiedUrl === 'js' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Python */}
            <Card>
              <CardHeader>
                <CardTitle>Python</CardTitle>
                <CardDescription>Using the requests library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
                    <code>{codeExamples.python}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.python, 'py')}
                  >
                    {copiedUrl === 'py' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* cURL */}
            <Card>
              <CardHeader>
                <CardTitle>cURL</CardTitle>
                <CardDescription>Command-line examples</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">
                    <code>{codeExamples.curl}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                  >
                    {copiedUrl === 'curl' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Support & Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Attribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Data Attribution:</strong> When using WasteDB data in publications or applications,
            please cite: "WasteDB by Wastefull (db.wastefull.org)"
          </p>
          <p>
            <strong>Support:</strong> For API support, feature requests, or to report issues,
            please contact us at{' '}
            <a href="mailto:api@wastefull.org" className="text-primary hover:underline">
              api@wastefull.org
            </a>
          </p>
          <p>
            <strong>Rate Limits:</strong> The API is currently rate-limited to 100 requests per minute
            per IP address. Contact us if you need higher limits for research purposes.
          </p>
          <p className="text-muted-foreground">
            This API is provided as-is for research and educational purposes. All data is licensed
            under Creative Commons BY-SA 4.0.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
