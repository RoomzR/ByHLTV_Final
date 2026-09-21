import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NewsService } from "./news.service";

@Controller("news")
@UseGuards(PermissionsGuard)
export class NewsController {
  constructor(private news: NewsService) {}

  @Public()
  @Get()
  list(@Query("locale") locale = "be", @Query("category") category?: string) {
    return this.news.list(locale, category);
  }

  @RequireCapability("news.publish")
  @Get("admin/all")
  listAll() {
    return this.news.listAll();
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string, @Query("locale") locale = "be") {
    return this.news.bySlug(slug, locale);
  }

  @RequireCapability("news.publish")
  @Post()
  create(@Body() body: unknown, @CurrentUser() user: { id: string }) {
    return this.news.create(body, user.id);
  }

  @RequireCapability("news.publish")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.news.update(id, body);
  }

  @RequireCapability("news.publish")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.news.remove(id);
  }
}
