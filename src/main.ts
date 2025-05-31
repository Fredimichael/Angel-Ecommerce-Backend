import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { IncomingMessage } from 'http';

declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuración mejorada de ValidationPipe (DEBE estar antes de otras middlewares)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        excludeExtraneousValues: false // Asegura que no se eliminen propiedades extrañas
      },
      whitelist: false, // Temporalmente desactivado para diagnóstico
      forbidNonWhitelisted: false, // Temporalmente desactivado
      // Habilita el detalle de errores
      exceptionFactory: (errors) => {
        console.error('Errores de validación:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    })
  );

  // Configuración CORS mejorada
  app.enableCors({
    origin: ['http://localhost:5173', 'https://mitunelreact.loca.lt','https://washing-fairfield-dispatched-ocean.trycloudflare.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // BodyParser con configuración extendida
  app.use(bodyParser.json({ 
    limit: '50mb',
    verify: (req, res, buf) => {
      req.rawBody = buf; // Guarda el body crudo para posibles verificaciones
    }
  }));
  
  app.use(bodyParser.urlencoded({ 
    limit: '50mb', 
    extended: true,
    parameterLimit: 100000 // Aumentar límite de parámetros
  }));

  // Session y Passport (configuración correcta)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'yourSecretKey',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 3600000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Rutas estáticas (configuración correcta)
  const uploadsPath = join(process.cwd(), 'src', 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  // Middleware de diagnóstico (SOLO PARA DESARROLLO)?????????/
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      next();
    });
  }

  await app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    console.log(`CORS configured for: http://localhost:5173`);
  });
}

bootstrap();