import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, User, Clock } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { getPublishedPosts } from "../../utils/blog";
import { BlogPost } from "../../types/blog";
import { logger } from "../../utils/logger";

interface BlogViewProps {
  onBack: () => void;
}

export function BlogView({ onBack }: BlogViewProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await getPublishedPosts();
      setPosts(data);
    } catch (error) {
      logger.error("Failed to load blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      News: "tag-yellow",
      Tutorial: "tag-blue",
      "Case Study": "tag-green",
      Research: "tag-purple",
      Community: "tag-pink",
      "Product Update": "tag-orange",
    };
    return colors[category] || "tag-gray";
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Blog"
        description="Latest news, updates, and insights from the WasteDB team"
        onBack={onBack}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin mb-4" />
            <p className="text-[13px] text-black/60 dark:text-white/60">
              Loading blog posts...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (posts.length === 0) {
    return (
      <PageTemplate
        title="Blog"
        description="Latest news, updates, and insights from the WasteDB team"
        onBack={onBack}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Newspaper
            size={48}
            className="mb-4 text-black/20 dark:text-white/20"
          />
          <h3 className="text-[16px] font-display mb-2 text-black dark:text-white">
            No blog posts yet
          </h3>
          <p className="text-[13px] text-black/60 dark:text-white/60 max-w-md">
            Blog posts will appear here once published by the WasteDB team.
            Check back soon for updates and insights!
          </p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Blog"
      description="Latest news, updates, and insights from the WasteDB team"
      onBack={onBack}
    >
      <div className="space-y-4">
        {posts.map((post) => (
          <button
            key={post.id}
            className="retro-card-button w-full p-6 text-left"
            onClick={() => {
              // TODO: Navigate to blog post detail view
              logger.log("Navigate to blog post:", post.slug);
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[11px] text-black/60 dark:text-white/60">
                <Calendar size={14} />
                <span>{formatDate(post.published_at || post.created_at)}</span>
                <span className="mx-2">•</span>
                <User size={14} />
                <span>{post.author_name || "WasteDB Team"}</span>
                {post.reading_time_minutes && (
                  <>
                    <span className="mx-2">•</span>
                    <Clock size={14} />
                    <span>{post.reading_time_minutes} min read</span>
                  </>
                )}
              </div>

              <h3 className="text-[18px] font-display text-black dark:text-white">
                {post.title}
              </h3>

              <p className="text-[13px] text-black/70 dark:text-white/70">
                {post.excerpt}
              </p>

              <div className="flex gap-2 flex-wrap">
                <span className={getCategoryColor(post.category)}>
                  {post.category}
                </span>
                {post.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag-gray">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg">
        <p className="text-[12px] text-black/60 dark:text-white/60">
          <Newspaper size={16} className="inline-block mr-2" />
          Blog posts are published by the WasteDB admin team and cover news,
          updates, and insights about the platform and waste management in
          general.
        </p>
      </div>
    </PageTemplate>
  );
}
