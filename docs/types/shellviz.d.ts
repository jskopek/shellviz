declare global {
  interface Window {
    shellviz: {
      log: (...data: any[]) => void;
      table: (data: any[], id?: string, append?: boolean) => void;
      json: (data: any, id?: string, append?: boolean) => void;
      card: (data: any, id?: string, append?: boolean) => void;
      markdown: (content: string, id?: string, append?: boolean) => void;
      number: (value: number, id?: string, append?: boolean) => void;
      progress: (value: number, id?: string, append?: boolean) => void;
      bar: (data: any[], id?: string, append?: boolean) => void;
      area: (data: any[], id?: string, append?: boolean) => void;
      pie: (data: any[], id?: string, append?: boolean) => void;
      show: (expandWidget?: boolean | undefined) => void;
    };
  }
}

export {};
