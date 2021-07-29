export class MatlabResponse {
  result: string;
  figures: string[];
  session: MatlabSession;
  sessions: MatlabSession[];
}

export class MatlabSession {
  pid: number;
  sid: number;
}
