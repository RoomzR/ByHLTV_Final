import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
    bodyParser: true,
    rawBody: false,
  });
  app.useBodyParser("json", { limit: "2mb" });
  const uploadDir = join(process.cwd(), "uploads");
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  const demosDir = join(uploadDir, "demos");
  if (!existsSync(demosDir)) mkdirSync(demosDir, { recursive: true });

  const webOrigin = process.env.CORS_ORIGIN?.split(",")[0]?.trim() ?? "http://localhost:3000";
  const apiOrigin =
    process.env.PUBLIC_ORIGIN?.replace(/\/$/, "") ?? `http://localhost:${process.env.PORT ?? 4000}`;

  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", apiOrigin, webOrigin],
          connectSrc: ["'self'", webOrigin, apiOrigin],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'", webOrigin],
        },
      },
    }),
  );
  app.useStaticAssets(uploadDir, { prefix: "/uploads/" });
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? ["http://localhost:3000"],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`ByHLTV API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
