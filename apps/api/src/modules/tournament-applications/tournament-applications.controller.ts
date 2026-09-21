import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApplicationStatus,
  applicationReviewSchema,
  staffMessageSchema,
  tournamentApplicationSchema,
} from "@byhltv/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { TournamentApplicationsService } from "./tournament-applications.service";

@Controller("tournament-applications")
@UseGuards(PermissionsGuard)
export class TournamentApplicationsController {
  constructor(private apps: TournamentApplicationsService) {}

  @RequireCapability("apply.tournament_admin")
  @Post()
  apply(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: unknown,
  ) {
    const input = tournamentApplicationSchema.parse(body);
    return this.apps.apply(user.id, user.role, input);
  }

  @Get("me")
  mine(@CurrentUser() user: { id: string }) {
    return this.apps.myApplications(user.id);
  }

  @RequireCapability("review.tournament_applications")
  @Get()
  list(@Query("status") status?: ApplicationStatus) {
    return this.apps.list(status);
  }

  @RequireCapability("review.tournament_applications")
  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.apps.approve(id, user.id, input.reviewNote);
  }

  @RequireCapability("review.tournament_applications")
  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.apps.reject(id, user.id, input.reviewNote);
  }

  @Post(":id/messages")
  message(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() body: unknown,
  ) {
    const input = staffMessageSchema.parse(body);
    return this.apps.addMessage(id, user.id, user.role, input.body);
  }
}
