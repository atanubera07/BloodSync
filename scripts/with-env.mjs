import { loadEnvFile } from 'node:process';
import { spawn } from 'node:child_process';

try {
  loadEnvFile('.env');
} catch {
  console.error('Create .env from .env.example before starting local development.');
  process.exit(1);
}
const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, { stdio: 'inherit', env: process.env });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
