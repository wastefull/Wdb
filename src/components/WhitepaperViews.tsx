import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import * as api from '../utils/api';

interface Whitepaper {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export function MethodologyListView({ onBack, onSelectWhitepaper }: { 
  onBack: () => void;
  onSelectWhitepaper: (slug: string) => void;
}) {
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWhitepapers = async () => {
      try {
        const fetchedWhitepapers = await api.getAllWhitepapers();
        setWhitepapers(fetchedWhitepapers);
      } catch (err) {
        console.error('Error loading whitepapers:', err);
        setError('Failed to load whitepapers');
      } finally {
        setLoading(false);
      }
    };

    loadWhitepapers();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white flex-1">
          Methodology & Whitepapers
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-black/50 dark:text-white/50" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      ) : whitepapers.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/60 dark:text-white/60">
            No whitepapers available yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-w-4xl">
          {whitepapers.map(whitepaper => (
            <button
              key={whitepaper.slug}
              onClick={() => onSelectWhitepaper(whitepaper.slug)}
              className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20">
                  <FileText size={24} className="text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2">
                    {whitepaper.title}
                  </h3>
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-2">
                    Last updated: {new Date(whitepaper.updatedAt).toLocaleDateString()}
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
                    Read Whitepaper
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhitepaperView({ 
  whitepaperSlug, 
  onBack 
}: { 
  whitepaperSlug: string;
  onBack: () => void;
}) {
  const [whitepaper, setWhitepaper] = useState<Whitepaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWhitepaper = async () => {
      try {
        console.log('🔍 Loading whitepaper with slug:', whitepaperSlug);
        const fetchedWhitepaper = await api.getWhitepaper(whitepaperSlug);
        console.log('📄 Fetched whitepaper:', {
          slug: fetchedWhitepaper?.slug,
          title: fetchedWhitepaper?.title,
          contentType: typeof fetchedWhitepaper?.content,
          contentLength: fetchedWhitepaper?.content?.length || 0,
          contentPreview: typeof fetchedWhitepaper?.content === 'string' ? fetchedWhitepaper.content.substring(0, 100) : 'NOT A STRING',
          keys: fetchedWhitepaper ? Object.keys(fetchedWhitepaper) : []
        });
        if (fetchedWhitepaper) {
          // Convert [] math blocks to $ for proper KaTeX rendering
          const processedContent = fetchedWhitepaper.content.replace(
            /\[\n([\s\S]*?)\n\]/g,
            (match, equation) => `$\n${equation.trim()}\n$`
          );
          setWhitepaper({
            ...fetchedWhitepaper,
            content: processedContent
          });
        } else {
          setError('Whitepaper not found');
        }
      } catch (err) {
        console.error('❌ Error loading whitepaper:', err);
        setError('Failed to load whitepaper');
      } finally {
        setLoading(false);
      }
    };

    loadWhitepaper();
  }, [whitepaperSlug]);

  useEffect(() => {
    // Add KaTeX CSS to document head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the link when component unmounts
      const existingLink = document.querySelector('link[href*="katex"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
          >
            <ArrowLeft size={16} className="text-black" />
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-black/50 dark:text-white/50" />
        </div>
      </div>
    );
  }

  if (error || !whitepaper) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
          >
            <ArrowLeft size={16} className="text-black" />
          </button>
        </div>
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-red-600 dark:text-red-400">
            {error || 'Whitepaper not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="font-['Fredoka_One',_sans-serif] text-[18px] text-black dark:text-white flex-1">
          {whitepaper.title}
        </h2>
      </div>

      <div className="max-w-4xl bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-8 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
        <article className="prose prose-lg max-w-none dark:prose-invert
          prose-headings:font-serif
          prose-headings:text-black dark:prose-headings:text-white
          prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6
          prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-5
          prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4
          prose-p:font-serif
          prose-p:text-base prose-p:leading-relaxed
          prose-p:text-black dark:prose-p:text-white
          prose-li:font-serif
          prose-li:text-base prose-li:leading-relaxed
          prose-li:text-black dark:prose-li:text-white
          prose-table:font-serif
          prose-table:text-sm
          prose-th:font-semibold
          prose-th:text-black dark:prose-th:text-white
          prose-td:text-black dark:prose-td:text-white
          prose-strong:font-semibold prose-strong:text-black dark:prose-strong:text-white
          prose-em:italic prose-em:text-black dark:prose-em:text-white
          prose-code:font-mono prose-code:text-sm
          prose-code:text-black dark:prose-code:text-white
          prose-code:bg-gray-100 dark:prose-code:bg-gray-800
          prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:font-mono prose-pre:text-sm
          prose-blockquote:border-l-gray-300 dark:prose-blockquote:border-l-gray-600
          prose-blockquote:font-serif prose-blockquote:italic
          prose-blockquote:text-black/80 dark:prose-blockquote:text-white/80
        " style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }}>
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
            components={{
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-6">
                  <table {...props} className="border-collapse border border-gray-300 dark:border-gray-600" />
                </div>
              ),
              th: ({node, ...props}) => (
                <th {...props} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800" style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              td: ({node, ...props}) => (
                <td {...props} className="border border-gray-300 dark:border-gray-600 px-4 py-2" style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              code: ({node, inline, className, ...props}) => (
                inline ? (
                  <code {...props} className={className} style={{ fontFamily: '"Courier New", Courier, monospace' }} />
                ) : (
                  <code {...props} className={className} style={{ fontFamily: '"Courier New", Courier, monospace' }} />
                )
              ),
              h1: ({node, ...props}) => (
                <h1 {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              h2: ({node, ...props}) => (
                <h2 {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              h3: ({node, ...props}) => (
                <h3 {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              p: ({node, ...props}) => (
                <p {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              li: ({node, ...props}) => (
                <li {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              blockquote: ({node, ...props}) => (
                <blockquote {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              strong: ({node, ...props}) => (
                <strong {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
              em: ({node, ...props}) => (
                <em {...props} style={{ fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' }} />
              ),
            }}
          >
            {whitepaper.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}