import { Injectable } from '@nestjs/common';
import { TemplateRecord, templates } from './template.data';

@Injectable()
export class TemplatesService {
  private readonly favorites = new Set<string>();
  private readonly recentlyViewed: string[] = [];

  findAll(): TemplateRecord[] {
    return templates;
  }

  findBySlug(slug: string): TemplateRecord | undefined {
    const template = templates.find((item) => item.slug === slug);

    if (template) {
      this.trackRecentlyViewed(slug);
    }

    return template;
  }

  findPopular(): TemplateRecord[] {
    return [...templates]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  }

  findRelated(slug: string): TemplateRecord[] {
    const current = this.findBySlug(slug);

    if (!current) {
      return [];
    }

    return templates
      .filter((template) => template.slug !== slug)
      .sort((a, b) => {
        const aScore = this.scoreRelated(current, a);
        const bScore = this.scoreRelated(current, b);
        return bScore - aScore;
      })
      .slice(0, 3);
  }

  saveFavorite(slug: string): { slug: string; favorite: boolean } {
    this.favorites.add(slug);
    return { slug, favorite: true };
  }

  getFavorites(): TemplateRecord[] {
    return templates.filter((template) => this.favorites.has(template.slug));
  }

  getRecentlyViewed(): TemplateRecord[] {
    return this.recentlyViewed
      .map((slug) => templates.find((template) => template.slug === slug))
      .filter((template): template is TemplateRecord => Boolean(template));
  }

  trackUsage(slug: string): { slug: string; tracked: boolean } {
    this.trackRecentlyViewed(slug);
    return { slug, tracked: true };
  }

  private trackRecentlyViewed(slug: string): void {
    this.recentlyViewed.unshift(slug);
    const unique = [...new Set(this.recentlyViewed)].slice(0, 8);
    this.recentlyViewed.splice(0, this.recentlyViewed.length, ...unique);
  }

  private scoreRelated(
    current: TemplateRecord,
    candidate: TemplateRecord,
  ): number {
    const sharedTags = candidate.tags.filter((tag) =>
      current.tags.includes(tag),
    );
    return (
      sharedTags.length * 10 +
      (candidate.category === current.category ? 25 : 0) +
      candidate.popularity / 10
    );
  }
}
