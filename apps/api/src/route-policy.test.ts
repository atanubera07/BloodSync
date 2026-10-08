import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC } from './public';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { DonorController } from './donor.controller';
import { RequestController } from './request.controller';
import { HealthController } from './health.controller';
import { MeController } from './me.controller';

const controllers = [
  AuthController,
  AdminController,
  DonorController,
  RequestController,
  HealthController,
  MeController,
];
describe('route policy', () => {
  it('has explicit public metadata on every route that needs no user', () => {
    const open = new Set([
      'AuthController.register',
      'AuthController.requestVerification',
      'AuthController.verifyEmail',
      'AuthController.forgotPassword',
      'AuthController.resetPassword',
      'AuthController.login',
      'AuthController.refresh',
      'AuthController.logout',
      'HealthController.check',
      'HealthController.live',
      'HealthController.ready',
    ]);
    const found: string[] = [];
    for (const controller of controllers) {
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        const handler = (controller.prototype as unknown as Record<string, object>)[name];
        if (
          Reflect.getMetadata(PATH_METADATA, handler) === undefined ||
          Reflect.getMetadata(METHOD_METADATA, handler) === undefined
        )
          continue;
        if (Reflect.getMetadata(IS_PUBLIC, handler) || Reflect.getMetadata(IS_PUBLIC, controller))
          found.push(`${controller.name}.${name}`);
      }
    }
    expect(found.sort()).toEqual([...open].sort());
  });
});
