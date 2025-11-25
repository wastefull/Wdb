import { ArrowLeft } from 'lucide-react';
import { PageTemplate } from './PageTemplate';

interface License {
  name: string;
  version?: string;
  licenseType: string;
  url: string;
  description: string;
}

const licenses: License[] = [
  {
    name: 'React',
    licenseType: 'MIT License',
    url: 'https://github.com/facebook/react',
    description: 'A JavaScript library for building user interfaces'
  },
  {
    name: 'Tailwind CSS',
    licenseType: 'MIT License',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework'
  },
  {
    name: 'Radix UI',
    licenseType: 'MIT License',
    url: 'https://github.com/radix-ui/primitives',
    description: 'Unstyled, accessible components for building design systems (used by shadcn/ui)'
  },
  {
    name: 'Lucide React',
    licenseType: 'ISC License',
    url: 'https://github.com/lucide-icons/lucide',
    description: 'Beautiful & consistent icon toolkit'
  },
  {
    name: 'Recharts',
    licenseType: 'MIT License',
    url: 'https://github.com/recharts/recharts',
    description: 'Redefined chart library built with React and D3'
  },
  {
    name: 'React Markdown',
    licenseType: 'MIT License',
    url: 'https://github.com/remarkjs/react-markdown',
    description: 'Markdown component for React'
  },
  {
    name: 'remark-math',
    licenseType: 'MIT License',
    url: 'https://github.com/remarkjs/remark-math',
    description: 'remark plugin to support math'
  },
  {
    name: 'remark-gfm',
    licenseType: 'MIT License',
    url: 'https://github.com/remarkjs/remark-gfm',
    description: 'remark plugin to support GFM (autolink literals, footnotes, strikethrough, tables, tasklists)'
  },
  {
    name: 'rehype-katex',
    licenseType: 'MIT License',
    url: 'https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex',
    description: 'rehype plugin to render math in HTML with KaTeX'
  },
  {
    name: 'KaTeX',
    licenseType: 'MIT License',
    url: 'https://github.com/KaTeX/KaTeX',
    description: 'Fast math typesetting for the web'
  },
  {
    name: 'Motion (Framer Motion)',
    licenseType: 'MIT License',
    url: 'https://github.com/framer/motion',
    description: 'Open source, production-ready animation library for React'
  },
  {
    name: 'React Hook Form',
    version: '7.55.0',
    licenseType: 'MIT License',
    url: 'https://github.com/react-hook-form/react-hook-form',
    description: 'Performant, flexible and extensible forms with easy-to-use validation'
  },
  {
    name: 'Sonner',
    version: '2.0.3',
    licenseType: 'MIT License',
    url: 'https://github.com/emilkowalski/sonner',
    description: 'An opinionated toast component for React'
  },
  {
    name: 'Supabase JS',
    licenseType: 'MIT License',
    url: 'https://github.com/supabase/supabase-js',
    description: 'An isomorphic Javascript client for Supabase'
  },
  {
    name: 'Hono',
    licenseType: 'MIT License',
    url: 'https://github.com/honojs/hono',
    description: 'Ultrafast web framework for the Edges'
  },
  {
    name: 'TypeScript',
    licenseType: 'Apache License 2.0',
    url: 'https://github.com/microsoft/TypeScript',
    description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output'
  }
];

export function LicensesView({ onBack }: { onBack: () => void }) {
  return (
    <PageTemplate
      title="Open Source Licenses"
      description="WasteDB is built on the shoulders of giants. We're grateful to the open source community for these amazing projects."
      onBack={onBack}
    >
      {/* Licenses List */}
      <div className="space-y-4">
        {licenses.map((license, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[11.464px] p-5 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[3px_3px_0px_0px_#000000] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white">
                  {license.name}
                  {license.version && (
                    <span className="text-[12px] text-black/60 dark:text-white/60 ml-2">
                      v{license.version}
                    </span>
                  )}
                </h3>
              </div>
              <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] px-3 py-1 rounded-full bg-[#b8c8cb] dark:bg-[#2a2f27] border border-[#211f1c] dark:border-white/20 text-black dark:text-white whitespace-nowrap">
                {license.licenseType}
              </span>
            </div>
            
            <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/70 dark:text-white/70 mb-3">
              {license.description}
            </p>
            
            <a
              href={license.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-[#4a90a4] dark:text-[#6bb6d0] hover:underline inline-flex items-center gap-1"
            >
              View on GitHub →
            </a>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-[#e4e3ac]/20 dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[11.464px]">
        <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70">
          <strong>Note:</strong> This list includes the primary open source libraries used in WasteDB. Each library may have its own dependencies with their respective licenses. For complete license information, please refer to the individual project repositories.
        </p>
      </div>
    </PageTemplate>
  );
}