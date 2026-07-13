import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponse } from '@canyougraduate/shared-types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.extractMessage(exception);

    const body: ApiErrorResponse = {
      success: false,
      message,
      data: null,
    };

    response.status(status).json(body);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const message = (response as { message: unknown }).message;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
      return exception.message;
    }
    return '서버 내부 오류가 발생했습니다.';
  }
}
