import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { AwardsService } from "./awards.service";

@Controller("awards")
@UseGuards(PermissionsGuard)
export class AwardsController {
  constructor(private awards: AwardsService) {}

  @Public()
  @Get()
  list(
    @Query("kind") kind?: string,
    @Query("year") year?: string,
    @Query("eventId") eventId?: string,
    @Query("playerId") playerId?: string,
  ) {
    const y = year ? Number(year) : undefined;
    return this.awards.list(
      kind,
      Number.isFinite(y) ? y : undefined,
      eventId,
      playerId,
    );
  }

  @RequireCapability("awards.manage")
  @Post()
  create(@Body() body: unknown) {
    return this.awards.create(body);
  }

  @RequireCapability("awards.manage")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.awards.update(id, body);
  }

  @RequireCapability("awards.manage")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.awards.remove(id);
  }
}
