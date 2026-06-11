import { Module } from '@nestjs/common';
import { TemplatesModule } from '../templates/templates.module';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [TemplatesModule],
  controllers: [MarketingController],
})
export class MarketingModule {}
