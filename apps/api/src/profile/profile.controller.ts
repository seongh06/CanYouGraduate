import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiMessageResult } from '../common/api-message.result';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import type { CreateProfileBody, UpdateProfileBody } from './profile.service';
import { ProfileService } from './profile.service';

@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  createProfile(@Body() body: CreateProfileBody) {
    return this.profileService.createProfile(body);
  }

  @Get()
  @UseGuards(SessionGuard)
  getProfile(@CurrentProfile() profile: Profile) {
    return this.profileService.getProfile(profile);
  }

  @Patch()
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async updateProfile(@CurrentProfile() profile: Profile, @Body() body: UpdateProfileBody) {
    await this.profileService.updateProfile(profile, body, body as unknown as Record<string, unknown>);
    return new ApiMessageResult('프로필이 수정되었습니다.');
  }
}
