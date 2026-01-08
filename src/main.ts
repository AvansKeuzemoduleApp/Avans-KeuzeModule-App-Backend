import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import helmet from "helmet";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // HSTS for production only
  app.use(
    helmet({
      hsts: process.env.NODE_ENV === "production"
        ? { maxAge: 15552000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  // Force HTTPS
  app.use((req: any, res: any, next: any) => {
    const xfProto = (req.headers["x-forwarded-proto"] ?? "").toString();
    const isHttps = req.secure || xfProto === "https";

    if (process.env.FORCE_HTTPS === "true" && !isHttps) {
      const host = req.headers.host;
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    next();
  })

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
