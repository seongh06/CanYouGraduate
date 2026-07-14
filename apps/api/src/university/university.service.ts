import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async listUniversities() {
    const universities = await this.prisma.university.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, supported: true },
    });
    return { universities };
  }

  async listColleges(universityId: number) {
    const university = await this.prisma.university.findUnique({ where: { id: universityId } });
    if (!university) {
      throw new NotFoundException('존재하지 않는 대학 정보입니다.');
    }

    const colleges = await this.prisma.college.findMany({
      where: { universityId },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, campus: true },
    });
    return { colleges };
  }

  async listDepartments(universityId: number, collegeId?: number) {
    const university = await this.prisma.university.findUnique({ where: { id: universityId } });
    if (!university) {
      throw new NotFoundException('존재하지 않는 대학 정보입니다.');
    }

    const departments = await this.prisma.department.findMany({
      where: { universityId, ...(collegeId !== undefined ? { collegeId } : {}) },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, catalogReady: true },
    });
    return { departments };
  }

  async listTracks(departmentId: number) {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new NotFoundException('존재하지 않는 학과 정보입니다.');
    }

    const tracks = await this.prisma.track.findMany({
      where: { departmentId },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, requiredCourseCount: true },
    });
    return { tracks };
  }
}
