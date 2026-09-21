import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { EventsService } from "./events.service";

@Controller("events")
@UseGuards(PermissionsGuard)
export class EventsController {
  constructor(private events: EventsService) {}

  @Public()
  @Get()
  list(@Query("status") status?: string) {
    return this.events.list(status);
  }

  @RequireCapability("event.manage", "event.manage_own")
  @Get("admin/all")
  listAll(@CurrentUser() user: { id: string; role: string }) {
    return this.events.listAll(user);
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.events.bySlug(slug);
  }

  @Public()
  @Get(":slug/brackets")
  brackets(@Param("slug") slug: string) {
    return this.events.brackets(slug);
  }

  @RequireCapability("event.manage")
  @Post()
  create(@Body() body: unknown) {
    return this.events.create(body);
  }

  @RequireCapability("event.manage", "event.manage_own")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.events.update(id, body, user);
  }
}
