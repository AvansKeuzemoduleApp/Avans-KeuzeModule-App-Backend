import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 'loopback');

  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigins =
    process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim().length > 0 ? 
      process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean) : ['http://localhost:5173'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
