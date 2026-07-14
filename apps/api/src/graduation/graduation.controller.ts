import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiMessageResult } from '../common/api-message.result';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import { GraduationService } from './graduation.service';

@Controller('api/graduation')
@UseGuards(SessionGuard)
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  @Get('requirements')
  getRequirements(@CurrentProfile() profile: Profile) {
    return this.graduationService.getRequirements(profile);
  }

  @Post('calculate')
  @HttpCode(200)
  async calculate(@CurrentProfile() profile: Profile) {
    const result = await this.graduationService.calculate(profile);
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
