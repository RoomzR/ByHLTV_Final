import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  SubmissionStatus,
  UserRole,
  applicationReviewSchema,
  eventSubmissionSchema,
  staffMessageSchema,
} from "@byhltv/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapability, Roles } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SubmissionsService } from "./submissions.service";

@Controller("submissions")
@UseGuards(PermissionsGuard)
export class SubmissionsController {
  constructor(private submissions: SubmissionsService) {}

  @RequireCapability("submission.create")
  @Post()
  create(@CurrentUser() user: { id: string; role: string }, @Body() body: unknown) {
    const input = eventSubmissionSchema.parse(body);
    return this.submissions.create(user.id, user.role, input);
  }

  @RequireCapability("submission.create")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() body: unknown,
  ) {
    const input = eventSubmissionSchema.partial().parse(body);
    return this.submissions.update(id, user.id, user.role, input);
  }

  @RequireCapability("submission.create")
  @Post(":id/submit")
  submit(@Param("id") id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.submissions.submit(id, user.id, user.role);
  }

  @Get("mine")
  mine(@CurrentUser() user: { id: string }) {
    return this.submissions.mine(user.id);
  }

  @RequireCapability("event.manage_own")
  @Get("my-events")
  myEvents(@CurrentUser() user: { id: string }) {
    return this.submissions.listMyEvents(user.id);
  }

  @RequireCapability("submission.review")
  @Get("queue")
  queue(@Query("status") status?: SubmissionStatus) {
    return this.submissions.queue(status);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("assign-organizer")
  assign(
    @Body() body: { eventId: string; userId: string; role?: "OWNER" | "OPERATOR" },
  ) {
    return this.submissions.assignOrganizer(body.eventId, body.userId, body.role);
  }

  @Get(":id")
  byId(@Param("id") id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.submissions.byId(id, user);
  }

  @RequireCapability("submission.review")
  @Post(":id/request-changes")
  requestChanges(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.submissions.requestChanges(id, user.id, input.reviewNote);
  }

  @RequireCapability("submission.review")
  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.submissions.approve(id, user.id, input.reviewNote);
  }

  @RequireCapability("submission.review")
  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.submissions.reject(id, user.id, input.reviewNote);
  }

  @RequireCapability("match.publish")
  @Post(":id/publish")
  publish(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const input = applicationReviewSchema.parse(body ?? {});
    return this.submissions.publish(id, user.id, input.reviewNote);
  }

  @Post(":id/messages")
  message(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() body: unknown,
  ) {
    const input = staffMessageSchema.parse(body);
    return this.submissions.addMessage(id, user.id, user.role, input.body);
  }
}
