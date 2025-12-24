
export interface PrefillData {
  Name: string;
  Email: string;
  Payment: number | string;
  Link: string;
  Company?: string;
  Profession?: string;
  Submitted?: string; // "Yes" or undefined
}

export interface SubmissionPayload {
  id: string;
  Company: string;
  Profession: string;
  Description: string;
}

export enum AppStatus {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  ERROR = 'ERROR',
  ALREADY_SUBMITTED = 'ALREADY_SUBMITTED',
  MISSING_ID = 'MISSING_ID',
  SUCCESS = 'SUCCESS'
}
