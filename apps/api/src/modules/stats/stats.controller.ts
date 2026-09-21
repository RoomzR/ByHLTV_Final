import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { StatsService } from "./stats.service";

@Controller("stats")
export class StatsController {
  constructor(private stats: StatsService) {}

  @Public()
  @Get("overview")
  overview() {
    return this.stats.overview();
  }

  @Public()
  @Get("leaderboards")
  leaderboards(@Query("metric") metric = "rating") {
    return this.stats.leaderboards(metric);
  }

  @Public()
  @Get("compare")
  compare(@Query("players") players?: string) {
    return this.stats.compare((players ?? "").split(",").filter(Boolean));
  }

  @Public()
  @Get("maps")
  maps() {
    return this.stats.maps();
  }
}
