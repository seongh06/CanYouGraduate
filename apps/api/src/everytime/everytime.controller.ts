import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiMessageResult } from '../common/api-message.result';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import { EverytimeService } from './everytime.service';

interface SyncBody {
  url?: string;
}

interface SyncTextBody {
  semesterLabel?: string;
  rawText?: string;
}

@Controller('api/everytime')
@UseGuards(SessionGuard)
export class EverytimeController {
  constructor(private readonly everytimeService: EverytimeService) {}

  @Post('sync')
  @HttpCode(202)
  sync(@CurrentProfile() profile: Profile, @Body() body: SyncBody) {
    const result = this.everytimeService.startSync(profile, body.url ?? '');
    return new ApiMessageResult('동기화가 시작되었습니다.', result);
  }

  @Post('sync/text')
  async syncText(@CurrentProfile() profile: Profile, @Body() body: SyncTextBody) {
    const result = await this.everytimeService.syncFromText(profile, body.semesterLabel ?? '', body.rawText ?? '');
    return new ApiMessageResult('텍스트 파싱이 완료되었습니다.', result);
  }

  @Get('semesters')
  listSemesters(@CurrentProfile() profile: Profile) {
    return this.everytimeService.listSemesters(profile);
  }

  @Get('semesters/:semesterId/courses')
  listCourses(
    @CurrentProfile() profile: Profile,
    @Param('semesterId', ParseIntPipe) semesterId: number,
    @Query('includeGeneral') includeGeneral?: string,
  ) {
    const include = includeGeneral === undefined ? true : includeGeneral !== 'false';
    return this.everytimeService.listCourses(profile, semesterId, include);
  }
}
