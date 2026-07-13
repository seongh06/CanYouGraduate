import { PrismaService } from '../prisma/prisma.service';

export async function findOrCreateSemester(
  prisma: PrismaService,
  profileId: number,
  label: string,
  markActiveIfFirst: boolean,
) {
  const existing = await prisma.semester.findFirst({ where: { profileId, label } });
  if (existing) return existing;

  const count = await prisma.semester.count({ where: { profileId } });
  return prisma.semester.create({
    data: { profileId, label, sortOrder: count, active: markActiveIfFirst && count === 0 },
  });
}
