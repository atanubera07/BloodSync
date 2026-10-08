import { Controller, Get } from '@nestjs/common';
import { Public } from './public';
@Controller('health')
export class HealthController {
  @Public() @Get() check() {
    return { status: 'ok' };
  }
}
