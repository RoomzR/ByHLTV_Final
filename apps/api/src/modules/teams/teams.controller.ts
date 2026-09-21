import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { TeamsService } from "./teams.service";

@Controller("teams")
@UseGuards(PermissionsGuard)
export class TeamsController {
  constructor(private teams: TeamsService) {}

  @Public()
  @Get()
  list() {
    return this.teams.list();
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.teams.bySlug(slug);
  }

  @RequireCapability("team.manage")
  @Post()
  create(@Body() body: unknown) {
    return this.teams.create(body);
  }

  @RequireCapability("team.manage")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.teams.update(id, body);
  }
}
