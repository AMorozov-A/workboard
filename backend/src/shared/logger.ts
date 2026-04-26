type LogMeta = Record<string, unknown>;

function shouldLogDebug(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function toMetaString(meta?: LogMeta): string {
  if (!meta) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' [meta:unserializable]';
  }
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`[info] ${message}${toMetaString(meta)}`);
  },
  debug(message: string, meta?: LogMeta) {
    if (!shouldLogDebug()) return;
    if (process.env.NODE_ENV === 'test') return;
    console.log(`[debug] ${message}${toMetaString(meta)}`);
  },
  error(message: string, err?: unknown, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'test') return;
    const e = err instanceof Error ? err : undefined;
    console.error(`[error] ${message}`, e ?? err, meta ?? '');
  },
};

