import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { randomUUID } from "crypto";
import { RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

function hasImageMagic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WEBP (RIFF....WEBP)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true;
  }
  return false;
}

@Controller("uploads")
@UseGuards(PermissionsGuard)
export class UploadsController {
  @Post()
  @RequireCapability("media.upload")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED.has(ext) || !file.mimetype.startsWith("image/")) {
          cb(new Error("Only image files are allowed"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("File is required");
    const path = join(UPLOAD_DIR, file.filename);
    try {
      const head = readFileSync(path).subarray(0, 16);
      if (!hasImageMagic(head)) {
        unlinkSync(path);
        throw new BadRequestException("File content is not a valid image");
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      try {
        unlinkSync(path);
      } catch {
        /* ignore */
      }
      throw new BadRequestException("Upload validation failed");
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
