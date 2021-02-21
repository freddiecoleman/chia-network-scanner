import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL });

export { log };
