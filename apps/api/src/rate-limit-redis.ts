import { Injectable } from '@nestjs/common';
import { connect } from 'node:tls';
import { ConfigService } from './config';

function encode(parts: (string | number)[]) {
  return `*${parts.length}\r\n${parts
    .map((part) => {
      const value = String(part);
      return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
    })
    .join('')}`;
}

function parse(buffer: Buffer, offset = 0): [unknown, number] | undefined {
  const end = buffer.indexOf('\r\n', offset);
  if (end < 0) return;
  const kind = String.fromCharCode(buffer[offset]);
  const line = buffer.toString('utf8', offset + 1, end);
  if (kind === '+' || kind === '-' || kind === ':') {
    if (kind === '-') throw new Error(`Redis error: ${line}`);
    return [kind === ':' ? Number(line) : line, end + 2];
  }
  if (kind === '$') {
    const length = Number(line);
    if (length === -1) return [null, end + 2];
    if (buffer.length < end + 2 + length + 2) return;
    return [buffer.toString('utf8', end + 2, end + 2 + length), end + 2 + length + 2];
  }
  if (kind === '*') {
    const result: unknown[] = [];
    let position = end + 2;
    for (let index = 0; index < Number(line); index++) {
      const item = parse(buffer, position);
      if (!item) return;
      result.push(item[0]);
      position = item[1];
    }
    return [result, position];
  }
  throw new Error('Unexpected Redis response');
}

@Injectable()
export class RateLimitRedis {
  readonly client: {
    ping: () => Promise<string>;
    eval: (script: string, keyCount: number, key: string, expiry: number) => Promise<unknown>;
  };

  constructor(config: ConfigService) {
    const url = new URL(config.values.REDIS_URL);
    if (url.protocol !== 'rediss:') throw new Error('Redis TLS URL required');
    const execute = (parts: (string | number)[]): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const socket = connect({
          host: url.hostname,
          port: Number(url.port || 6380),
          servername: url.hostname,
          rejectUnauthorized: true,
          timeout: 5000,
        });
        let buffer = Buffer.alloc(0);
        let received = 0;
        const auth = url.password
          ? [
              'AUTH',
              ...(url.username ? [decodeURIComponent(url.username)] : []),
              decodeURIComponent(url.password),
            ]
          : [];
        const expected = auth.length ? 2 : 1;
        socket.on('secureConnect', () =>
          socket.write((auth.length ? encode(auth) : '') + encode(parts)),
        );
        socket.on('data', (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);
          try {
            while (true) {
              const reply = parse(buffer);
              if (!reply) return;
              buffer = buffer.subarray(reply[1]);
              received++;
              if (received === expected) {
                socket.end();
                resolve(reply[0]);
                return;
              }
            }
          } catch (error) {
            socket.destroy();
            reject(error);
          }
        });
        socket.on('error', reject);
        socket.on('timeout', () => socket.destroy(new Error('Redis timeout')));
        socket.on('close', () => {
          if (received < expected) reject(new Error('Redis connection closed'));
        });
      });
    this.client = {
      ping: () => execute(['PING']) as Promise<string>,
      eval: (script, keyCount, key, expiry) => execute(['EVAL', script, keyCount, key, expiry]),
    };
  }
}
