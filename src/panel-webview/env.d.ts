/// <reference types="vite/client" />
// global.d.ts
declare global {
    interface Window {
      acquireVsCodeApi: any;
    }
  }
  
  export {};