import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CountriesService } from './countries.service'
import { CountryDto } from './dto/country.dto'

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all countries with their lock status (public reference data)' })
  @ApiOkResponse({ type: [CountryDto] })
  findAll(): Promise<CountryDto[]> {
    return this.countriesService.findAll()
  }
}
