import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { AdsService } from "./ads.service";

function clientKey(req: Request) {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (typeof xf === "string" ? xf.split(",")[0]?.trim() : undefined) ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";
  return ip;
}

@Controller("ads")
@UseGuards(PermissionsGuard)
export class AdsController {
  constructor(private ads: AdsService) {}

  @Public()
  @Get("serve")
  serve(@Query("slot") slot = "") {
    return this.ads.serve(slot);
  }

  @RequireCapability("ads.manage")
  @Get("stats/overview")
  overview() {
    return this.ads.overview();
  }

  @RequireCapability("ads.manage")
  @Get("stats")
  stats(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("adId") adId?: string,
  ) {
    return this.ads.stats(from, to, adId);
  }

  @RequireCapability("ads.manage")
  @Get()
  list(@Query("status") status?: string, @Query("format") format?: string) {
    return this.ads.list(status, format);
  }

  @RequireCapability("ads.manage")
  @Get(":id")
  byId(@Param("id") id: string) {
    return this.ads.byId(id);
  }

  @RequireCapability("ads.manage")
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.ads.create(body, user.id);
  }

  @RequireCapability("ads.manage")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.ads.update(id, body);
  }

  @RequireCapability("ads.manage")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ads.remove(id);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post(":id/impression")
  impression(@Param("id") id: string, @Req() req: Request) {
    return this.ads.impression(id, clientKey(req));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(":id/click")
  click(@Param("id") id: string, @Req() req: Request) {
    return this.ads.click(id, clientKey(req));
  }
}
