export type ErrorResponse = {
  traceId: string;
  timestamp: string;
  path: string;
  errorCode: string;
  message: string;
  details?: unknown;
};
