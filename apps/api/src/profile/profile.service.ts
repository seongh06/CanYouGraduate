import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile, ProgramType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const PROGRAM_TYPES: ProgramType[] = ['DOUBLE_MAJOR', 'DEEPENED_MAJOR'];

export interface CreateProfileBody {
  admissionYear?: number;
  universityId?: number;
  majorDepartmentId?: number;
  majorTrackId?: number | null;
  programType?: ProgramType;
  secondMajorDepartmentId?: number | null;
  secondMajorTrackId?: number | null;
  minorDepartmentId?: number | null;
  hasMicroDegree?: boolean;
}

export interface UpdateProfileBody {
  majorDepartmentId?: number;
  majorTrackId?: number | null;
  programType?: ProgramType;
  secondMajorDepartmentId?: number | null;
  secondMajorTrackId?: number | null;
  minorDepartmentId?: number | null;
  hasMicroDegree?: boolean;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isProgramType(value: unknown): value is ProgramType {
  return typeof value === 'string' && (PROGRAM_TYPES as string[]).includes(value);
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(body: CreateProfileBody) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('요청 본문이 올바르지 않습니다.');
    }
    if (!isPositiveInt(body.admissionYear)) {
      throw new BadRequestException('입학 학번(admissionYear)은 필수입니다.');
    }
    if (!isPositiveInt(body.universityId)) {
      throw new BadRequestException('대학(universityId)은 필수입니다.');
    }
    if (!isPositiveInt(body.majorDepartmentId)) {
      throw new BadRequestException('주전공 학과(majorDepartmentId)는 필수입니다.');
    }
    if (body.majorTrackId != null && !isPositiveInt(body.majorTrackId)) {
      throw new BadRequestException('주전공 트랙(majorTrackId) 값이 올바르지 않습니다.');
    }
    if (!isProgramType(body.programType)) {
      throw new BadRequestException('전공 유형(programType)은 필수입니다. (DOUBLE_MAJOR 또는 DEEPENED_MAJOR)');
    }
    if (body.programType === 'DOUBLE_MAJOR') {
      if (!isPositiveInt(body.secondMajorDepartmentId)) {
        throw new BadRequestException('복수전공 선택 시 제2전공 학과(secondMajorDepartmentId)는 필수입니다.');
      }
    } else if (body.secondMajorDepartmentId != null || body.secondMajorTrackId != null) {
      throw new BadRequestException('전공심화 선택 시 제2전공 정보는 입력할 수 없습니다.');
    }
    if (body.secondMajorTrackId != null && !isPositiveInt(body.secondMajorTrackId)) {
      throw new BadRequestException('제2전공 트랙(secondMajorTrackId) 값이 올바르지 않습니다.');
    }
    if (body.secondMajorTrackId != null && body.secondMajorDepartmentId == null) {
      throw new BadRequestException('제2전공 트랙을 지정하려면 제2전공 학과(secondMajorDepartmentId)가 필요합니다.');
    }
    if (body.minorDepartmentId != null && !isPositiveInt(body.minorDepartmentId)) {
      throw new BadRequestException('부전공 학과(minorDepartmentId) 값이 올바르지 않습니다.');
    }
    if (body.hasMicroDegree !== undefined && typeof body.hasMicroDegree !== 'boolean') {
      throw new BadRequestException('소단위전공 가입 여부(hasMicroDegree) 값이 올바르지 않습니다.');
    }

    await this.assertReferencesExist({
      universityId: body.universityId,
      majorDepartmentId: body.majorDepartmentId,
      majorTrackId: body.majorTrackId ?? undefined,
      secondMajorDepartmentId: body.secondMajorDepartmentId ?? undefined,
      secondMajorTrackId: body.secondMajorTrackId ?? undefined,
      minorDepartmentId: body.minorDepartmentId ?? undefined,
      effectiveMajorDepartmentId: body.majorDepartmentId,
      effectiveSecondMajorDepartmentId: body.secondMajorDepartmentId ?? undefined,
    });

    const profile = await this.prisma.profile.create({
      data: {
        sessionId: randomUUID(),
        admissionYear: body.admissionYear,
        universityId: body.universityId,
        majorDepartmentId: body.majorDepartmentId,
        majorTrackId: body.majorTrackId ?? null,
        programType: body.programType,
        secondMajorDepartmentId: body.secondMajorDepartmentId ?? null,
        secondMajorTrackId: body.secondMajorTrackId ?? null,
        minorDepartmentId: body.minorDepartmentId ?? null,
        hasMicroDegree: body.hasMicroDegree ?? false,
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
      include: {
        university: true,
        majorDepartment: true,
        majorTrack: true,
        secondMajorDepartment: true,
        secondMajorTrack: true,
        minorDepartment: true,
      },
    });

    return {
      profileId: full.id,
      admissionYear: full.admissionYear,
      university: { id: full.university.id, name: full.university.name },
      majorDepartment: { id: full.majorDepartment.id, name: full.majorDepartment.name },
      majorTrack: full.majorTrack ? { id: full.majorTrack.id, name: full.majorTrack.name } : null,
      programType: full.programType,
      secondMajorDepartment: full.secondMajorDepartment
        ? { id: full.secondMajorDepartment.id, name: full.secondMajorDepartment.name }
        : null,
      secondMajorTrack: full.secondMajorTrack
        ? { id: full.secondMajorTrack.id, name: full.secondMajorTrack.name }
        : null,
      minorDepartment: full.minorDepartment ? { id: full.minorDepartment.id, name: full.minorDepartment.name } : null,
      hasMicroDegree: full.hasMicroDegree,
      syncedAt: full.syncedAt,
    };
  }

  async updateProfile(profile: Profile, body: UpdateProfileBody, rawBody: Record<string, unknown>) {
    if (!rawBody || typeof rawBody !== 'object') {
      throw new BadRequestException('요청 본문이 올바르지 않습니다.');
    }
    const data: Record<string, string | number | boolean | null> = {};

    if ('majorDepartmentId' in rawBody) {
      if (!isPositiveInt(body.majorDepartmentId)) {
        throw new BadRequestException('주전공 학과(majorDepartmentId) 값이 올바르지 않습니다.');
      }
      data.majorDepartmentId = body.majorDepartmentId;
    }
    if ('majorTrackId' in rawBody) {
      if (body.majorTrackId != null && !isPositiveInt(body.majorTrackId)) {
        throw new BadRequestException('주전공 트랙(majorTrackId) 값이 올바르지 않습니다.');
      }
      data.majorTrackId = body.majorTrackId ?? null;
    }
    if ('programType' in rawBody) {
      if (!isProgramType(body.programType)) {
        throw new BadRequestException('전공 유형(programType) 값이 올바르지 않습니다.');
      }
      data.programType = body.programType;
    }
    if ('secondMajorDepartmentId' in rawBody) {
      if (body.secondMajorDepartmentId != null && !isPositiveInt(body.secondMajorDepartmentId)) {
        throw new BadRequestException('제2전공 학과(secondMajorDepartmentId) 값이 올바르지 않습니다.');
      }
      data.secondMajorDepartmentId = body.secondMajorDepartmentId ?? null;
    }
    if ('secondMajorTrackId' in rawBody) {
      if (body.secondMajorTrackId != null && !isPositiveInt(body.secondMajorTrackId)) {
        throw new BadRequestException('제2전공 트랙(secondMajorTrackId) 값이 올바르지 않습니다.');
      }
      data.secondMajorTrackId = body.secondMajorTrackId ?? null;
    }
    if ('minorDepartmentId' in rawBody) {
      if (body.minorDepartmentId != null && !isPositiveInt(body.minorDepartmentId)) {
        throw new BadRequestException('부전공 학과(minorDepartmentId) 값이 올바르지 않습니다.');
      }
      data.minorDepartmentId = body.minorDepartmentId ?? null;
    }
    if ('hasMicroDegree' in rawBody) {
      if (typeof body.hasMicroDegree !== 'boolean') {
        throw new BadRequestException('소단위전공 가입 여부(hasMicroDegree) 값이 올바르지 않습니다.');
      }
      data.hasMicroDegree = body.hasMicroDegree;
    }

    const effectiveProgramType = (data.programType as ProgramType | undefined) ?? profile.programType;
    const effectiveSecondMajorDepartmentId: number | null =
      'secondMajorDepartmentId' in data
        ? (data.secondMajorDepartmentId as number | null)
        : profile.secondMajorDepartmentId;
    const effectiveSecondMajorTrackId: number | null =
      'secondMajorTrackId' in data ? (data.secondMajorTrackId as number | null) : profile.secondMajorTrackId;

    if (effectiveProgramType === 'DOUBLE_MAJOR' && effectiveSecondMajorDepartmentId == null) {
      throw new BadRequestException('복수전공 선택 시 제2전공 학과(secondMajorDepartmentId)는 필수입니다.');
    }
    if (
      effectiveProgramType === 'DEEPENED_MAJOR' &&
      (effectiveSecondMajorDepartmentId != null || effectiveSecondMajorTrackId != null)
    ) {
      throw new BadRequestException('전공심화 선택 시 제2전공 정보는 입력할 수 없습니다.');
    }
    if (effectiveSecondMajorTrackId != null && effectiveSecondMajorDepartmentId == null) {
      throw new BadRequestException('제2전공 트랙을 지정하려면 제2전공 학과(secondMajorDepartmentId)가 필요합니다.');
    }

    await this.assertReferencesExist({
      universityId: profile.universityId,
      majorDepartmentId: data.majorDepartmentId as number | undefined,
      majorTrackId: (data.majorTrackId as number | null | undefined) ?? undefined,
      secondMajorDepartmentId: (data.secondMajorDepartmentId as number | null | undefined) ?? undefined,
      secondMajorTrackId: (data.secondMajorTrackId as number | null | undefined) ?? undefined,
      minorDepartmentId: (data.minorDepartmentId as number | null | undefined) ?? undefined,
      effectiveMajorDepartmentId: (data.majorDepartmentId as number | undefined) ?? profile.majorDepartmentId,
      effectiveSecondMajorDepartmentId: effectiveSecondMajorDepartmentId ?? undefined,
    });

    await this.prisma.profile.update({ where: { id: profile.id }, data });
  }

  private async assertReferencesExist(refs: {
    universityId: number;
    majorDepartmentId?: number;
    majorTrackId?: number;
    secondMajorDepartmentId?: number;
    secondMajorTrackId?: number;
    minorDepartmentId?: number;
    effectiveMajorDepartmentId?: number;
    effectiveSecondMajorDepartmentId?: number;
  }) {
    const [university, majorDepartment, majorTrack, secondMajorDepartment, secondMajorTrack, minorDepartment] =
      await Promise.all([
        this.prisma.university.findUnique({ where: { id: refs.universityId } }),
        refs.majorDepartmentId !== undefined
          ? this.prisma.department.findUnique({ where: { id: refs.majorDepartmentId } })
          : null,
        refs.majorTrackId !== undefined ? this.prisma.track.findUnique({ where: { id: refs.majorTrackId } }) : null,
        refs.secondMajorDepartmentId !== undefined
          ? this.prisma.department.findUnique({ where: { id: refs.secondMajorDepartmentId } })
          : null,
        refs.secondMajorTrackId !== undefined
          ? this.prisma.track.findUnique({ where: { id: refs.secondMajorTrackId } })
          : null,
        refs.minorDepartmentId !== undefined
          ? this.prisma.department.findUnique({ where: { id: refs.minorDepartmentId } })
          : null,
      ]);

    if (!university) throw new NotFoundException('존재하지 않는 대학 정보입니다.');

    if (refs.majorDepartmentId !== undefined) {
      if (!majorDepartment) throw new NotFoundException('존재하지 않는 학과 정보입니다.');
      if (majorDepartment.universityId !== refs.universityId) {
        throw new BadRequestException('주전공 학과가 선택한 대학에 속하지 않습니다.');
      }
    }
    if (refs.majorTrackId !== undefined) {
      if (!majorTrack) throw new NotFoundException('존재하지 않는 트랙 정보입니다.');
      if (refs.effectiveMajorDepartmentId !== undefined && majorTrack.departmentId !== refs.effectiveMajorDepartmentId) {
        throw new BadRequestException('트랙이 선택한 주전공 학과에 속하지 않습니다.');
      }
    }
    if (refs.secondMajorDepartmentId !== undefined) {
      if (!secondMajorDepartment) throw new NotFoundException('존재하지 않는 학과 정보입니다.');
      if (secondMajorDepartment.universityId !== refs.universityId) {
        throw new BadRequestException('제2전공 학과가 선택한 대학에 속하지 않습니다.');
      }
    }
    if (refs.secondMajorTrackId !== undefined) {
      if (!secondMajorTrack) throw new NotFoundException('존재하지 않는 트랙 정보입니다.');
      if (
        refs.effectiveSecondMajorDepartmentId !== undefined &&
        secondMajorTrack.departmentId !== refs.effectiveSecondMajorDepartmentId
      ) {
        throw new BadRequestException('트랙이 선택한 제2전공 학과에 속하지 않습니다.');
      }
    }
    if (refs.minorDepartmentId !== undefined) {
      if (!minorDepartment) throw new NotFoundException('존재하지 않는 학과 정보입니다.');
      if (minorDepartment.universityId !== refs.universityId) {
        throw new BadRequestException('부전공 학과가 선택한 대학에 속하지 않습니다.');
      }
    }
  }
}
