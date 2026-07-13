import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './session/session.module';
import { UniversityModule } from './university/university.module';

@Module({
  imports: [PrismaModule, SessionModule, UniversityModule, ProfileModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
