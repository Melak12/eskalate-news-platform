import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseResponse } from '../interfaces/response.interface';
import { Prisma } from '../../../prisma/generated/client';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      // @ts-ignore
      const zodError = exception.getZodError() as any;
      errors = zodError.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
          if ('message' in exceptionResponse) {
              const msg = (exceptionResponse as any).message;
              if (Array.isArray(msg)) {
                  // Ensure array of strings
                  errors = msg.map(e => typeof e === 'string' ? e : JSON.stringify(e));
                  message = 'Validation failed';
              } else {
                  message = msg as string;
                  errors = [message];
              }
          }
      } else {
          message = exception.message;
          errors = [message];
      }

    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma specific errors if needed
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        errors = [`Duplicate entry for ${exception.meta?.target}`];
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        errors = [exception.message];
      } else {
          message = 'Database error';
          errors = [exception.message];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [message];
    }

    this.logger.error(
      `Status: ${status} Error: ${JSON.stringify(errors)}`,
      (exception as Error).stack,
    );

    const responseBody: BaseResponse<null> = {
      Success: false,
      Message: message,
      Object: null,
      Errors: errors.length > 0 ? errors : [message],
    };

    response.status(status).json(responseBody);
  }
}
