import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Throttle } from "@nestjs/throttler";
import { RequireCapability } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { DemosService } from "./demos.service";

@Controller("matches/:slug/demos")
@UseGuards(PermissionsGuard)
export class DemosController {
  constructor(private demos: DemosService) {}

  @Get()
  @RequireCapability("match.live_operate")
  list(
    @Param("slug") slug: string,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    return this.demos.list(slug, actor);
  }

  @Post()
  @RequireCapability("match.live_operate")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith(".dem")) {
          cb(new BadRequestException("Only .dem files are allowed") as never, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @Param("slug") slug: string,
    @CurrentUser() actor: { id: string; role: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query("mapName") mapName?: string,
  ) {
    return this.demos.upload(slug, actor, file, mapName);
  }

  @Post(":id/reparse")
  @RequireCapability("match.live_operate")
  reparse(
    @Param("slug") slug: string,
    @Param("id") id: string,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    return this.demos.reparse(slug, id, actor);
  }

  @Delete(":id")
  @RequireCapability("match.live_operate")
  remove(
    @Param("slug") slug: string,
    @Param("id") id: string,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    return this.demos.remove(slug, id, actor);
  }
}
