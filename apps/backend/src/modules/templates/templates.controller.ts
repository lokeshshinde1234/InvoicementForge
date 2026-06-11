import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import type { TemplateRecord } from './template.data';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(): TemplateRecord[] {
    return this.templatesService.findAll();
  }

  @Get('popular')
  findPopular(): TemplateRecord[] {
    return this.templatesService.findPopular();
  }

  @Get('recently-viewed')
  recentlyViewed(): TemplateRecord[] {
    return this.templatesService.getRecentlyViewed();
  }

  @Get('favorites')
  favorites(): TemplateRecord[] {
    return this.templatesService.getFavorites();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): TemplateRecord {
    const template = this.templatesService.findBySlug(slug);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  @Get(':slug/related')
  related(@Param('slug') slug: string): TemplateRecord[] {
    return this.templatesService.findRelated(slug);
  }

  @Post(':slug/favorite')
  favorite(@Param('slug') slug: string): { slug: string; favorite: boolean } {
    return this.templatesService.saveFavorite(slug);
  }

  @Post(':slug/usage')
  usage(@Param('slug') slug: string): { slug: string; tracked: boolean } {
    return this.templatesService.trackUsage(slug);
  }
}
