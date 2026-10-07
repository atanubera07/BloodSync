import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { AdminGuard, AuthGuard } from './auth.guard';
import { MailService } from './mail.service';
import { HealthController } from './health.controller';
@Module({ controllers: [AuthController, HealthController], providers: [PrismaService, MailService, AuthService, AuthGuard, AdminGuard] })
export class AppModule {}
