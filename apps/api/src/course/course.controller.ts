import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
}
