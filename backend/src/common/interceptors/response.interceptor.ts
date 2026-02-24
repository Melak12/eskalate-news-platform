import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already a standardized response, return it as is
        if (data && typeof data === 'object' && 'Success' in data && 'Object' in data) {
           return data;
        }

        // Default successful response structure
        return {
          Success: true,
          Message: 'Operation successful',
          Object: data || null,
          Errors: null,
        };
      }),
    );
  }
}
