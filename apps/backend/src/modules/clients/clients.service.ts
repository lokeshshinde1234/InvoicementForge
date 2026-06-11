import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Client } from './client.entity';

export type CreateClientDto = {
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
  password?: string | null;
  passwordHash?: string | null;
};

export type UpdateClientDto = Partial<CreateClientDto>;

export type ClientFilters = {
  search?: string;
};

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  create(dto: CreateClientDto, tenantId: string): Promise<Client> {
    const client = this.clientsRepository.create({
      tenantId,
      name: dto.name.trim(),
      companyName: dto.companyName?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      phone: dto.phone?.trim() || null,
      gstin: dto.gstin?.trim().toUpperCase() || null,
      state: dto.state?.trim().toUpperCase() || null,
      address: dto.address?.trim() || null,
      isPasswordCreated: false,
    });

    return this.clientsRepository.save(client);
  }

  /**
   * Import multiple clients in a single operation. Returns an array of
   * inserted Client entities. TenantId must be provided by the caller.
   */
  async importClients(
    tenantId: string,
    clients: CreateClientDto[],
  ): Promise<Client[]> {
    if (!tenantId) {
      throw new BadRequestException(
        'tenantId is required for importing clients',
      );
    }
    const results: Client[] = [];

    for (const dto of clients) {
      const name = (dto.name || '').trim();
      const companyName = dto.companyName?.trim() || null;
      const email = dto.email?.trim().toLowerCase() || null;
      const phone = dto.phone?.trim() || null;
      const gstin = dto.gstin?.trim().toUpperCase() || null;
      const state = dto.state?.trim().toUpperCase() || null;
      const address = dto.address?.trim() || null;

      let existing: Client | null = null;

      if (email) {
        existing = await this.clientsRepository.findOne({
          where: { tenantId, email },
        });
      }

      if (!existing && phone) {
        existing = await this.clientsRepository.findOne({
          where: { tenantId, phone },
        });
      }

      if (!existing && companyName && name) {
        existing = await this.clientsRepository.findOne({
          where: { tenantId, companyName, name },
        });
      }

      if (existing) {
        const merged = this.clientsRepository.merge(existing, {
          name: name || existing.name,
          companyName: companyName ?? existing.companyName,
          email: email ?? existing.email,
          phone: phone ?? existing.phone,
          gstin: gstin ?? existing.gstin,
          state: state ?? existing.state,
          address: address ?? existing.address,
        });
        const saved = await this.clientsRepository.save(merged);
        results.push(saved);
      } else {
        const created = this.clientsRepository.create({
          tenantId,
          name,
          companyName,
          email,
          phone,
          gstin,
          state,
          address,
        });
        const saved = await this.clientsRepository.save(created);
        results.push(saved);
      }
    }

    return results;
  }

  findAll(tenantId: string, filters: ClientFilters = {}): Promise<Client[]> {
    const search = filters.search?.trim();

    return this.clientsRepository.find({
      where: search
        ? [
            { tenantId, name: ILike(`%${search}%`) },
            { tenantId, companyName: ILike(`%${search}%`) },
            { tenantId, email: ILike(`%${search}%`) },
          ]
        : { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    tenantId: string,
  ): Promise<Client> {
    const client = await this.findOne(id, tenantId);
    const safeDto = { ...dto };
    delete safeDto.password;
    delete safeDto.passwordHash;
    const updatedClient = this.clientsRepository.merge(client, {
      name: safeDto.name?.trim() ?? client.name,
      companyName:
        safeDto.companyName === undefined
          ? client.companyName
          : safeDto.companyName?.trim() || null,
      email:
        safeDto.email === undefined
          ? client.email
          : safeDto.email?.trim().toLowerCase() || null,
      phone:
        safeDto.phone === undefined
          ? client.phone
          : safeDto.phone?.trim() || null,
      gstin:
        safeDto.gstin === undefined
          ? client.gstin
          : safeDto.gstin?.trim().toUpperCase() || null,
      state:
        safeDto.state === undefined
          ? client.state
          : safeDto.state?.trim().toUpperCase() || null,
      address:
        safeDto.address === undefined
          ? client.address
          : safeDto.address?.trim() || null,
    });

    return this.clientsRepository.save(updatedClient);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.clientsRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('Client not found');
    }
  }
}
