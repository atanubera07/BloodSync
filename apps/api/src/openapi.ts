import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { z } from 'zod';
import {
  donorProfileSchema,
  loginSchema,
  registerSchema,
  requestSchema,
  requestUpdateSchema,
  passwordSchema,
} from '@bloodsync/shared';

/** Keep request-body documentation tied to the same Zod schemas used by the API. */
export function installOpenApi(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('BloodSync API')
      .setDescription('Version 1 API for the BloodSync MVP. No medical advice.')
      .setVersion('1.0')
      .build(),
  );
  document.components ??= {};
  document.components.schemas ??= {};
  const schemas = {
    Register: registerSchema,
    Login: loginSchema,
    DonorProfile: donorProfileSchema,
    BloodRequest: requestSchema,
    BloodRequestUpdate: requestUpdateSchema,
    PasswordReset: z.object({ token: z.string(), password: passwordSchema }),
  };
  for (const [name, schema] of Object.entries(schemas))
    document.components.schemas[name] = z.toJSONSchema(schema, {
      target: 'openapi-3.0',
      unrepresentable: 'any',
    }) as SchemaObject;
  const bodies: Record<string, string> = {
    'post /v1/auth/register': 'Register',
    'post /v1/auth/login': 'Login',
    'post /v1/auth/password/reset': 'PasswordReset',
    'put /v1/donors/me': 'DonorProfile',
    'post /v1/requests': 'BloodRequest',
    'patch /v1/requests/{id}': 'BloodRequestUpdate',
  };
  for (const [key, name] of Object.entries(bodies)) {
    const [method, path] = key.split(' ');
    const operation = document.paths?.[path]?.[method as 'post' | 'put' | 'patch'];
    if (operation)
      operation.requestBody = {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${name}` } } },
      };
  }
  SwaggerModule.setup('v1/docs', app, document);
}
