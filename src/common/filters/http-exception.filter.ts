import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../types/error-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = isHttpException ? exception.getResponse() : undefined;
    const httpException = isHttpException ? exception : undefined;
    const message =
      typeof responseBody === 'string'
        ? responseBody
        : responseBody &&
            typeof responseBody === 'object' &&
            'message' in responseBody
          ? (responseBody as { message?: string }).message ??
            httpException?.message
          : httpException?.message;

    const errorResponse: ErrorResponse = {
      traceId: request.id ?? 'unknown',
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode: isHttpException ? exception.name : 'InternalServerError',
      message: isHttpException ? message ?? 'Unexpected error' : 'Unexpected error',
      details: isHttpException ? responseBody : undefined,
    };

    response.status(status).json(errorResponse);
  }
}
