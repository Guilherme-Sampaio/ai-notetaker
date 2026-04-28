export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500
  }
}
