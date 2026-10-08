import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { AdminGuard, AuthGuard } from './auth.guard';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MatchingService } from './matching.service';
import { MailService } from './mail.service';
import { HealthController } from './health.controller';
import { RequestExpiryService } from './request-expiry.service';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { AuditInterceptor } from './audit.interceptor';
@Module({
  controllers: [
    AuthController,
    HealthController,
    MeController,
    DonorController,
    RequestController,
    AdminController,
  ],
  providers: [
    PrismaService,
    MailService,
    AuthService,
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    AdminGuard,
    MatchingService,
    DonorService,
    RequestService,
    RequestExpiryService,
    MeService,
    AdminService,
  ],
})
export class AppModule {}
