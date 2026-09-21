import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { FantasyService } from "./fantasy.service";

@Controller("fantasy")
export class FantasyController {
  constructor(private fantasy: FantasyService) {}

  @Public()
  @Get()
  leagues() {
    return this.fantasy.leagues();
  }

  @Public()
  @Get(":eventSlug")
  byEvent(@Param("eventSlug") eventSlug: string) {
    return this.fantasy.byEvent(eventSlug);
  }

  @Public()
  @Get(":eventSlug/leaderboard")
  leaderboard(@Param("eventSlug") eventSlug: string) {
    return this.fantasy.leaderboard(eventSlug);
  }

  @Post(":eventSlug/draft")
  draft(
    @Param("eventSlug") eventSlug: string,
    @CurrentUser() user: { id: string },
    @Body() body: { name: string; playerIds: string[] },
  ) {
    return this.fantasy.draft(eventSlug, user.id, body);
  }
}
