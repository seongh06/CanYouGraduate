import { Global, Module } from '@nestjs/common';
import { SessionGuard } from './session.guard';

@Global()
@Module({
  providers: [SessionGuard],
  exports: [SessionGuard],
})
export class SessionModule {}
