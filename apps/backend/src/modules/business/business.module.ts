import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSettings } from './business-settings.entity';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessSettings])],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
