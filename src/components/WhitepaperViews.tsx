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
          setWhitepaper(fetchedWhitepaper);
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
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white flex-1">
          {whitepaper.title}
        </h2>
      </div>

      <div className="max-w-4xl bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-8 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
        <article className="prose prose-sm max-w-none dark:prose-invert
          prose-headings:font-['Sniglet:Regular',_sans-serif] 
          prose-headings:text-black dark:prose-headings:text-white
          prose-p:font-['Sniglet:Regular',_sans-serif] 
          prose-p:text-[12px] 
          prose-p:text-black dark:prose-p:text-white
          prose-li:font-['Sniglet:Regular',_sans-serif] 
          prose-li:text-[12px] 
          prose-li:text-black dark:prose-li:text-white
          prose-table:font-['Sniglet:Regular',_sans-serif] 
          prose-table:text-[11px]
          prose-th:text-black dark:prose-th:text-white
          prose-td:text-black dark:prose-td:text-white
          prose-strong:text-black dark:prose-strong:text-white
          prose-em:text-black dark:prose-em:text-white
          prose-code:text-black dark:prose-code:text-white
          prose-code:bg-[#e4e3ac] dark:prose-code:bg-[#211f1c]
          prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-blockquote:border-l-[#b8c8cb] 
          prose-blockquote:text-black/70 dark:prose-blockquote:text-white/70
        ">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
            components={{
              table: ({node, ...props}) => (
                <div className="table-scroll-wrapper">
                  <table {...props} />
                </div>
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