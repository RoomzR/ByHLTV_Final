import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(PermissionsGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @RequireCapability("report.create")
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.reports.create(user.id, body);
  }

  @RequireCapability("report.review")
  @Get()
  list(@Query("status") status?: string) {
    return this.reports.list(status);
  }

  @RequireCapability("report.review")
  @Patch(":id")
  review(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    return this.reports.review(id, user.id, body);
  }
}
