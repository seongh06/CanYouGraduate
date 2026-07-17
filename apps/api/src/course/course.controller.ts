import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiMessageResult } from '../common/api-message.result';
import { CurrentProfile } from '../session/current-profile.decorator';
import { SessionGuard } from '../session/session.guard';
import type { CreateCourseBody, UpdateCourseBody } from './course.service';
import { CourseService } from './course.service';

@Controller('api/courses')
@UseGuards(SessionGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(201)
  async createCourse(@CurrentProfile() profile: Profile, @Body() body: CreateCourseBody) {
    const result = await this.courseService.createCourse(profile, body);
    return new ApiMessageResult('과목이 추가되었습니다.', result);
  }

  @Get('duplicates')
  listDuplicates(@CurrentProfile() profile: Profile) {
    return this.courseService.listDuplicates(profile);
  }

  @Patch('duplicates/:groupKey/retake')
  @HttpCode(200)
  async toggleRetake(
    @CurrentProfile() profile: Profile,
    @Param('groupKey') groupKey: string,
    @Body() body: { retakeAccepted?: boolean },
  ) {
    await this.courseService.toggleRetake(profile, groupKey, body?.retakeAccepted);
    return new ApiMessageResult('재수강 처리 여부가 변경되었습니다.');
  }

  @Patch(':courseId')
  @HttpCode(200)
  async updateCourse(
    @CurrentProfile() profile: Profile,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: UpdateCourseBody,
  ) {
    await this.courseService.updateCourse(profile, courseId, body);
    return new ApiMessageResult('과목이 수정되었습니다.');
  }

  @Delete(':courseId')
  @HttpCode(200)
  async deleteCourse(@CurrentProfile() profile: Profile, @Param('courseId', ParseIntPipe) courseId: number) {
    await this.courseService.deleteCourse(profile, courseId);
    return new ApiMessageResult('과목이 삭제되었습니다.');
  }

  @Post(':courseId/substitution')
  @HttpCode(200)
  async setSubstitution(
    @CurrentProfile() profile: Profile,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { catalogCourseId?: number },
  ) {
    const result = await this.courseService.setSubstitution(profile, courseId, body?.catalogCourseId);
    return new ApiMessageResult('대체인정 과목이 연결되었습니다.', result);
  }

  @Delete(':courseId/substitution')
  @HttpCode(200)
  async removeSubstitution(@CurrentProfile() profile: Profile, @Param('courseId', ParseIntPipe) courseId: number) {
    await this.courseService.removeSubstitution(profile, courseId);
    return new ApiMessageResult('대체인정 연결이 해제되었습니다.');
  }
}
