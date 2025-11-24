/**
 * Material Articles Utility Functions
 *
 * Helper functions for safely accessing and manipulating material articles
 * with proper null checking and TypeScript safety.
 */

import { Article, CategoryType } from "../types/article";
import { Material } from "../types/material";

/**
 * Safely get articles for a specific category, returning empty array if undefined
 */
export function getArticlesByCategory(
  material: Material,
  category: CategoryType
): Article[] {
  return material.articles?.[category] || [];
}

/**
 * Safely get the count of articles for a specific category
 */
export function getArticleCount(
  material: Material,
  category: CategoryType
): number {
  return (material.articles?.[category] || []).length;
}

/**
 * Get a safe articles object with all categories initialized to empty arrays if needed
 */
export function getSafeArticles(material: Material): {
  compostability: Article[];
  recyclability: Article[];
  reusability: Article[];
} {
  return {
    compostability: material.articles?.compostability || [],
    recyclability: material.articles?.recyclability || [],
    reusability: material.articles?.reusability || [],
  };
}

/**
 * Add an article to a material's category
 */
export function addArticleToMaterial(
  material: Material,
  category: CategoryType,
  article: Article
): Material {
  return {
    ...material,
    articles: {
      ...getSafeArticles(material),
      [category]: [...getArticlesByCategory(material, category), article],
    },
  };
}

/**
 * Update an article in a material's category
 */
export function updateArticleInMaterial(
  material: Material,
  category: CategoryType,
  articleId: string,
  updateFn: (article: Article) => Article
): Material {
  const updatedArticles = getArticlesByCategory(material, category).map((a) =>
    a.id === articleId ? updateFn(a) : a
  );

  return {
    ...material,
    articles: {
      ...getSafeArticles(material),
      [category]: updatedArticles,
    },
  };
}

/**
 * Remove an article from a material's category
 */
export function removeArticleFromMaterial(
  material: Material,
  category: CategoryType,
  articleId: string
): Material {
  return {
    ...material,
    articles: {
      ...getSafeArticles(material),
      [category]: getArticlesByCategory(material, category).filter(
        (a) => a.id !== articleId
      ),
    },
  };
}

/**
 * Get all articles from a material across all categories
 */
export function getAllArticles(material: Material): Array<{
  article: Article;
  category: CategoryType;
}> {
  return [
    ...getArticlesByCategory(material, "compostability").map((a) => ({
      article: a,
      category: "compostability" as CategoryType,
    })),
    ...getArticlesByCategory(material, "recyclability").map((a) => ({
      article: a,
      category: "recyclability" as CategoryType,
    })),
    ...getArticlesByCategory(material, "reusability").map((a) => ({
      article: a,
      category: "reusability" as CategoryType,
    })),
  ];
}

/**
 * Get total count of all articles in a material
 */
export function getTotalArticleCount(material: Material): number {
  return (
    getArticleCount(material, "compostability") +
    getArticleCount(material, "recyclability") +
    getArticleCount(material, "reusability")
  );
}
