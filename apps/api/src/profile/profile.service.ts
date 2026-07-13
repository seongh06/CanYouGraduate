import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateProfileBody {
  admissionYear?: number;
  universityId?: number;
  majorDepartmentId?: number;
  minorDepartmentId?: number | null;
  trackId?: number | null;
}

export interface UpdateProfileBody {
  majorDepartmentId?: number;
  minorDepartmentId?: number | null;
  trackId?: number | null;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(body: CreateProfileBody) {
    if (!isPositiveInt(body.admissionYear)) {
      throw new BadRequestException('입학 학번(admissionYear)은 필수입니다.');
    }
    if (!isPositiveInt(body.universityId)) {
      throw new BadRequestException('대학(universityId)은 필수입니다.');
    }
    if (!isPositiveInt(body.majorDepartmentId)) {
      throw new BadRequestException('주전공 학과(majorDepartmentId)는 필수입니다.');
    }
    if (body.minorDepartmentId != null && !isPositiveInt(body.minorDepartmentId)) {
      throw new BadRequestException('부전공 학과(minorDepartmentId) 값이 올바르지 않습니다.');
    }
    if (body.trackId != null && !isPositiveInt(body.trackId)) {
      throw new BadRequestException('트랙(trackId) 값이 올바르지 않습니다.');
    }

    await this.assertReferencesExist({
      universityId: body.universityId,
      majorDepartmentId: body.majorDepartmentId,
      minorDepartmentId: body.minorDepartmentId ?? undefined,
      trackId: body.trackId ?? undefined,
    });

    const profile = await this.prisma.profile.create({
      data: {
        sessionId: randomUUID(),
        admissionYear: body.admissionYear,
        universityId: body.universityId,
        majorDepartmentId: body.majorDepartmentId,
        minorDepartmentId: body.minorDepartmentId ?? null,
        trackId: body.trackId ?? null,
      },
    });

    return {
      sessionId: profile.sessionId,
      profileId: profile.id,
      admissionYear: profile.admissionYear,
    };
  }

  async getProfile(profile: Profile) {
    const full = await this.prisma.profile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { university: true, majorDepartment: true, minorDepartment: true, track: true },
    });

    return {
      profileId: full.id,
      admissionYear: full.admissionYear,
      university: { id: full.university.id, name: full.university.name },
      majorDepartment: { id: full.majorDepartment.id, name: full.majorDepartment.name },
      minorDepartment: full.minorDepartment ? { id: full.minorDepartment.id, name: full.minorDepartment.name } : null,
      track: full.track ? { id: full.track.id, name: full.track.name } : null,
      syncedAt: full.syncedAt,
    };
  }

  async updateProfile(profile: Profile, body: UpdateProfileBody, rawBody: Record<string, unknown>) {
    const data: Record<string, number | null> = {};

    if ('majorDepartmentId' in rawBody) {
      if (!isPositiveInt(body.majorDepartmentId)) {
        throw new BadRequestException('주전공 학과(majorDepartmentId) 값이 올바르지 않습니다.');
      }
      data.majorDepartmentId = body.majorDepartmentId;
    }
    if ('minorDepartmentId' in rawBody) {
      if (body.minorDepartmentId != null && !isPositiveInt(body.minorDepartmentId)) {
        throw new BadRequestException('부전공 학과(minorDepartmentId) 값이 올바르지 않습니다.');
      }
      data.minorDepartmentId = body.minorDepartmentId ?? null;
    }
    if ('trackId' in rawBody) {
      if (body.trackId != null && !isPositiveInt(body.trackId)) {
        throw new BadRequestException('트랙(trackId) 값이 올바르지 않습니다.');
      }
      data.trackId = body.trackId ?? null;
    }

    await this.assertReferencesExist({
      majorDepartmentId: data.majorDepartmentId ?? undefined,
      minorDepartmentId: data.minorDepartmentId ?? undefined,
      trackId: data.trackId ?? undefined,
    });

    await this.prisma.profile.update({ where: { id: profile.id }, data });
  }

  private async assertReferencesExist(refs: {
    universityId?: number;
    majorDepartmentId?: number;
    minorDepartmentId?: number;
    trackId?: number;
  }) {
    if (refs.universityId !== undefined) {
      const university = await this.prisma.university.findUnique({ where: { id: refs.universityId } });
      if (!university) throw new NotFoundException('존재하지 않는 대학 정보입니다.');
    }
    if (refs.majorDepartmentId !== undefined) {
      const department = await this.prisma.department.findUnique({ where: { id: refs.majorDepartmentId } });
      if (!department) throw new NotFoundException('존재하지 않는 학과 정보입니다.');
    }
    if (refs.minorDepartmentId !== undefined) {
      const department = await this.prisma.department.findUnique({ where: { id: refs.minorDepartmentId } });
      if (!department) throw new NotFoundException('존재하지 않는 학과 정보입니다.');
    }
    if (refs.trackId !== undefined) {
      const track = await this.prisma.track.findUnique({ where: { id: refs.trackId } });
      if (!track) throw new NotFoundException('존재하지 않는 트랙 정보입니다.');
    }
  }
}
