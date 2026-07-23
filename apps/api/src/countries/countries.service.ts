import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.country.findMany({
      select: { id: true, isoCode: true, name: true, region: true, status: true },
      orderBy: { name: 'asc' },
    })
  }
}
