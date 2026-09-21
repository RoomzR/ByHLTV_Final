import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ForumsService } from "./forums.service";

@Controller("forums")
@UseGuards(PermissionsGuard)
export class ForumsController {
  constructor(private forums: ForumsService) {}

  @Public()
  @Get("categories")
  categories() {
    return this.forums.categories();
  }

  @Public()
  @Get("categories/:slug")
  category(@Param("slug") slug: string) {
    return this.forums.category(slug);
  }

  @Public()
  @Get("threads/:id")
  thread(@Param("id") id: string) {
    return this.forums.thread(id);
  }

  @Post("threads")
  createThread(
    @CurrentUser() user: { id: string },
    @Body() body: { categorySlug: string; title: string; body: string },
  ) {
    return this.forums.createThread(user.id, body);
  }

  @Post("threads/:id/posts")
  reply(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { body: string },
  ) {
    return this.forums.reply(id, user.id, body.body);
  }

  @RequireCapability("forum.moderate")
  @Post("posts/:id/hide")
  hide(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.forums.hidePost(id, user.id);
  }

  @RequireCapability("forum.moderate")
  @Delete("posts/:id")
  deletePost(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.forums.deletePost(id, user.id);
  }

  @RequireCapability("forum.moderate")
  @Patch("threads/:id/lock")
  lock(
    @Param("id") id: string,
    @Body() body: { locked: boolean },
    @CurrentUser() user: { id: string },
  ) {
    return this.forums.setLocked(id, body.locked, user.id);
  }

  @RequireCapability("forum.moderate")
  @Patch("threads/:id/pin")
  pin(
    @Param("id") id: string,
    @Body() body: { pinned: boolean },
    @CurrentUser() user: { id: string },
  ) {
    return this.forums.setPinned(id, body.pinned, user.id);
  }

  @RequireCapability("forum.moderate")
  @Delete("threads/:id")
  deleteThread(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.forums.deleteThread(id, user.id);
  }
}
