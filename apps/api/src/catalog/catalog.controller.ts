import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import { CatalogService } from './catalog.service';

@Controller('api/catalog')
@UseGuards(SessionGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('courses')
  searchCourses(
    @CurrentProfile() profile: Profile,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.searchCourses(profile, query, limit ? Number(limit) : undefined);
  }
}
