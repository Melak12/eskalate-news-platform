export class ArticleReadEvent {
  constructor(
    public readonly articleId: string,
    public readonly userId?: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
