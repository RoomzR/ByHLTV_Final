import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PlayersService } from "./players.service";

@Controller("players")
export class PlayersController {
  constructor(private players: PlayersService) {}

  @Public()
  @Get()
  list(@Query("status") status?: string) {
    return this.players.list(status);
  }

  @Public()
  @Get("transfers/recent")
  recentTransfers() {
    return this.players.recentTransfers();
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Get("admin/all")
  listAll() {
    return this.players.listAll();
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.players.bySlug(slug);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Post()
  create(@Body() body: unknown) {
    return this.players.create(body);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.players.update(id, body);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.players.softDelete(id);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Post(":id/history")
  history(@Param("id") id: string, @Body() body: unknown) {
    return this.players.addHistory(id, body);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("player.manage")
  @Post(":id/recompute")
  recompute(@Param("id") id: string) {
    return this.players.recomputeCareer(id);
  }
}
