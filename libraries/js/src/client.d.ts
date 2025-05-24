declare module 'shellviz' {
    export function send(data: any, options?: { id?: string; view?: string; append?: boolean; wait?: boolean }): Promise<void>;
    export function clear(): void;
    export function wait(): Promise<void>;
    export function showUrl(): void;
    export function showQrCode(): void;
    export function table(data: any, id?: string): void;
    export function log(...args: any[]): void;
    export function json(data: any, id?: string): void;
    export function markdown(data: any, id?: string): void;
    export function progress(data: any, id?: string): void;
    export function pie(data: any, id?: string): void;
    export function number(data: any, id?: string): void;
    export function area(data: any, id?: string): void;
    export function bar(data: any, id?: string): void;
    export function card(data: any, id?: string): void;
    export function location(data: any, id?: string): void;
    export function raw(data: any, id?: string): void;
    export function stack(locals?: any, id?: string): void;
    export function Shellviz(): any;
} 