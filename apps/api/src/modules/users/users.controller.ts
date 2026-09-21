import { BadRequestException, Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { UserRole, roleUpdateSchema, banLimitedSchema } from "@byhltv/shared";
import { Roles, Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("profile")
  profile(@CurrentUser() user: { id: string }) {
    return this.users.getProfile(user.id);
  }

  @Patch("profile")
  updateProfile(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.users.updateProfile(user.id, body);
  }

  @Public()
  @Get(":username")
  byUsername(@Param("username") username: string) {
    return this.users.byUsername(username);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id/role")
  setRole(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const parsed = roleUpdateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.users.setRole(id, parsed.data.role, actor);
  }

  @UseGuards(PermissionsGuard)
  @RequireCapability("user.ban_limited")
  @Patch(":id/ban-limited")
  banLimited(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const parsed = banLimitedSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.users.banLimited(id, actor, parsed.data);
  }
}
