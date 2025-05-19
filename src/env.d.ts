declare namespace NodeJS {
  interface ProcessEnv {
    DATA_DIR: string;
    SERVER_URL: string;
    PASSWORD: string;
    SYNC_ID: string;
  }
} 