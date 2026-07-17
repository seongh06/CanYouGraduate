import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiMessageResult } from '../common/api-message.result';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import { GraduationService } from './graduation.service';

// 결과화면 트랙 미리보기용 — 있으면 프로필에 저장된 majorTrackId 대신 이 값으로 제1전공 요건을 조회한다.
function parseTrackId(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

@Controller('api/graduation')
@UseGuards(SessionGuard)
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  @Get('requirements')
  getRequirements(@CurrentProfile() profile: Profile, @Query('trackId') trackId?: string) {
    return this.graduationService.getRequirements(profile, parseTrackId(trackId));
  }

  @Post('calculate')
  @HttpCode(200)
  async calculate(@CurrentProfile() profile: Profile, @Query('trackId') trackId?: string) {
    const result = await this.graduationService.calculate(profile, parseTrackId(trackId));
    return new ApiMessageResult('졸업 요건 계산이 완료되었습니다.', result);
  }

  @Patch('checks/:checkKey')
  @HttpCode(200)
  async updateCheck(
    @CurrentProfile() profile: Profile,
    @Param('checkKey') checkKey: string,
    @Body() body: { checked?: unknown },
  ) {
    await this.graduationService.updateCheck(profile, checkKey, body?.checked);
    return new ApiMessageResult('체크리스트가 갱신되었습니다.');
  }

  @Patch('language-score')
  @HttpCode(200)
  async updateLanguageScore(@CurrentProfile() profile: Profile, @Body() body: { examType?: unknown; score?: unknown }) {
    const result = await this.graduationService.updateLanguageScore(profile, body?.examType, body?.score);
    return new ApiMessageResult('API 호출 성공', result);
  }

  @Patch('thesis')
  @HttpCode(200)
  async updateThesis(@CurrentProfile() profile: Profile, @Body() body: { pass?: unknown }) {
    await this.graduationService.updateThesis(profile, body?.pass);
    return new ApiMessageResult('API 호출 성공');
  }
}
