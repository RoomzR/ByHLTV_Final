import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  MatchStatus,
  UserRole,
  createMatchSchema,
  matchLiveUpdateSchema,
  matchRoundSchema,
  matchStatsBatchSchema,
  matchVetosSchema,
  updateMatchMetaSchema,
} from "@byhltv/shared";
import { Public, RequireCapability, Roles } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private matches: MatchesService) {}

  @Public()
  @Get()
  list(@Query("status") status?: MatchStatus) {
    return this.matches.list(status);
  }

  @Public()
  @Get("live")
  live() {
    return this.matches.list(MatchStatus.LIVE);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.publish", "match.live_operate")
  @Post()
  create(
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = createMatchSchema.parse(body);
    return this.matches.create(input, actor);
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.matches.bySlug(slug);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.publish", "match.live_operate")
  @Patch(":slug/meta")
  updateMeta(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = updateMatchMetaSchema.parse(body);
    return this.matches.updateMeta(slug, input, actor);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.publish", "match.live_operate")
  @Put(":slug/vetos")
  setVetos(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = matchVetosSchema.parse(body);
    return this.matches.setVetos(slug, input, actor);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":slug/score")
  updateScore(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = matchLiveUpdateSchema.parse(body);
    return this.matches.updateScore(slug, input, actor);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Patch(":slug/live")
  updateLive(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = matchLiveUpdateSchema.parse(body);
    return this.matches.updateLive(slug, input, actor);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Put(":slug/stats")
  upsertStats(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = matchStatsBatchSchema.parse(body);
    return this.matches.upsertStats(slug, input.stats, actor);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("match.live_operate")
  @Post(":slug/rounds")
  addRound(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const input = matchRoundSchema.parse(body);
    return this.matches.addRound(slug, input, actor);
  }
}
