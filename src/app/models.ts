export class MatlabResponse {
  result: string;
  figures: Figure[];
  session: MatlabSession;
  sessions: MatlabSession[];
}

export class MatlabSession {
  pid: number;
  sid: number;
}

export class Figure {
  id: number;
  base64: string;
}
