// app/types.ts
export interface ApiResponse {
  costs: {
    aws: number;
    azure: number;
    gcp: number;
  };
  recommendation: string;
}