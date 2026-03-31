export {};

declare global {
  namespace Express {
    interface Request {
      /** Заполняется middleware после успешной проверки JWT */
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}
