import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiSuccessResponse } from '@canyougraduate/shared-types';
import { Observable, map } from 'rxjs';
import { ApiMessageResult } from './api-message.result';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof ApiMessageResult) {
          return { success: true as const, message: result.message, data: result.data };
        }
        return { success: true as const, message: 'API 호출 성공', data: result as T };
      }),
    );
  }
}
