import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CommentsService } from "./comments.service";

@Controller("comments")
@UseGuards(PermissionsGuard)
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @RequireCapability("comment.create")
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.comments.create(user.id, body);
  }

  @Public()
  @Get()
  list(@Query("newsId") newsId?: string, @Query("matchId") matchId?: string) {
    if (newsId) return this.comments.listForNews(newsId);
    if (matchId) return this.comments.listForMatch(matchId);
    return [];
  }

  @RequireCapability("comment.moderate")
  @Patch(":id/hide")
  hide(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.comments.hide(id, user.id);
  }

  @RequireCapability("comment.moderate")
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.comments.remove(id, user.id);
  }
}
