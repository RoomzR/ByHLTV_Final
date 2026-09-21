import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { GsiService } from "./gsi.service";
import { GSI_CFG_FILENAME } from "./gsi-cfg.service";

@Controller("gsi")
export class GsiController {
  constructor(private gsi: GsiService) {}

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Post("match/:slug/token")
  token(
    @Param("slug") slug: string,
    @CurrentUser() actor: { id: string; role: string },
    @Query("regenerate") regenerate?: string,
  ) {
    return this.gsi.ensureToken(slug, actor, {
      regenerate: regenerate === "1" || regenerate === "true",
    });
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Get("match/:slug/config")
  config(
    @Param("slug") slug: string,
    @CurrentUser() actor: { id: string; role: string },
    @Query("host") host?: string,
  ) {
    return this.gsi.getConfig(slug, actor, host);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Get("match/:slug/config/download")
  @Header("Content-Type", "text/plain; charset=utf-8")
  async download(
    @Param("slug") slug: string,
    @CurrentUser() actor: { id: string; role: string },
    @Query("host") host: string | undefined,
    @Res() res: Response,
  ) {
    const data = await this.gsi.getConfig(slug, actor, host);
    res.setHeader("Content-Disposition", `attachment; filename="${GSI_CFG_FILENAME}"`);
    res.send(data.cfg);
  }

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post(":token")
  ingest(@Param("token") token: string, @Body() body: unknown) {
    return this.gsi.ingest(token, body as never);
  }
}
