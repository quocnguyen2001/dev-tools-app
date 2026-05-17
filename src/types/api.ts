export interface ApiSuccess<TData, TMeta = Record<string, unknown>> {
  data: TData;
  meta?: TMeta;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
