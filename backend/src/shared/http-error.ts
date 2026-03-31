/** Ошибка с HTTP-статусом для передачи в `next(err)` и обработки в `errorHandler`. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
