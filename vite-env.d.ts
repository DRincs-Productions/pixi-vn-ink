interface ImportMeta {
    hot?: {
        on: (event: string, callback: (data: any) => void) => void;
    };
}
