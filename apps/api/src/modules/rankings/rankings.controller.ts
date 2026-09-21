import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RankingsService } from "./rankings.service";

@Controller("rankings")
@UseGuards(PermissionsGuard)
export class RankingsController {
  constructor(private rankings: RankingsService) {}

  @Public()
  @Get("teams")
  teams() {
    return this.rankings.teams();
  }

  @Public()
  @Get("players")
  players() {
    return this.rankings.players();
  }

  @Public()
  @Get("history")
  history(@Query("kind") kind = "team", @Query("id") id?: string) {
    return this.rankings.history(kind, id);
  }

  @RequireCapability("ranking.manage")
  @Patch("teams/:id")
  updateTeam(@Param("id") id: string, @Body() body: unknown) {
    return this.rankings.updateTeam(id, body);
  }

  @RequireCapability("ranking.manage")
  @Patch("players/:id")
  updatePlayer(@Param("id") id: string, @Body() body: unknown) {
    return this.rankings.updatePlayer(id, body);
  }

  @RequireCapability("ranking.manage")
  @Post("snapshot/teams")
  snapshotTeams() {
    return this.rankings.snapshotTeams();
  }

  @RequireCapability("ranking.manage")
  @Post("snapshot/players")
  snapshotPlayers() {
    return this.rankings.snapshotPlayers();
  }

  @RequireCapability("ranking.manage")
  @Post("sync/players-from-rating")
  syncPlayersFromRating() {
    return this.rankings.syncPlayersFromRating();
  }
}
