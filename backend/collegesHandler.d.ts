import type { IncomingMessage, ServerResponse } from 'node:http';

export interface CollegeResult {
  name: string;
  id?: string;
  state?: string;
  country?: string;
}

export declare function searchColleges(query: string, limit?: number): Promise<CollegeResult[]>;

export declare function handleCollegesSearchRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void>;
