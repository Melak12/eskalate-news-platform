
export interface BaseResponse<T> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
}
