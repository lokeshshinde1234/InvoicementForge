import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import {
  ClientsController,
  CompanyClientsController,
} from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientsController, CompanyClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
