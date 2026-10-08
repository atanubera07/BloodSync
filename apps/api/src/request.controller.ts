import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RequestService } from './request.service';
import type { AuthRequest } from './actor';
import { requestSchema, requestUpdateSchema } from '@bloodsync/shared';
import type { z } from 'zod';
import { ZodBodyPipe } from './zod-body.pipe';
@Controller('requests')
@UseGuards(AuthGuard)
export class RequestController {
  constructor(private readonly requests: RequestService) {}
  @Post() create(
    @Req() req: AuthRequest,
    @Body(new ZodBodyPipe(requestSchema)) body: z.infer<typeof requestSchema>,
  ) {
    return this.requests.create(req.user, body);
  }
  @Get() list(@Req() req: AuthRequest, @Query('skip') skip?: string) {
    return this.requests.listOwn(req.user, skip);
  }
  @Get(':id') get(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requests.getOwn(req.user, id);
  }
  @Patch(':id') update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body(new ZodBodyPipe(requestUpdateSchema)) body: z.infer<typeof requestUpdateSchema>,
  ) {
    return this.requests.updateOwn(req.user, id, body);
  }
  @Delete(':id') @HttpCode(200) close(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requests.closeOwn(req.user, id);
  }
  @Get(':id/matches') matches(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requests.matches(req.user, id);
  }
  @Get(':id/interests') interests(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requests.interests(req.user, id);
  }
}
