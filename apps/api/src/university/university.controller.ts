import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { UniversityService } from './university.service';

function parseRequiredIntId(value: string | undefined, fieldName: string): number {
  const parsed = Number(value);
  if (!value || Number.isNaN(parsed)) {
    throw new BadRequestException(`${fieldName}은(는) 필수입니다.`);
  }
  return parsed;
}

@Controller('api')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('universities')
  listUniversities() {
    return this.universityService.listUniversities();
  }

  @Get('departments')
  listDepartments(@Query('universityId') universityId?: string) {
    return this.universityService.listDepartments(parseRequiredIntId(universityId, 'universityId'));
  }

  @Get('departments/:departmentId/tracks')
  listTracks(@Param('departmentId') departmentId: string) {
    return this.universityService.listTracks(parseRequiredIntId(departmentId, 'departmentId'));
  }
}
