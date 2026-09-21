import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Public, RequireCapability } from "../../common/decorators/auth.decorators";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { GalleryService } from "./gallery.service";

@Controller("gallery")
@UseGuards(PermissionsGuard)
export class GalleryController {
  constructor(private gallery: GalleryService) {}

  @Public()
  @Get()
  list() {
    return this.gallery.list();
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.gallery.bySlug(slug);
  }

  @RequireCapability("gallery.manage")
  @Post()
  create(@Body() body: unknown) {
    return this.gallery.create(body);
  }

  @RequireCapability("gallery.manage")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.gallery.update(id, body);
  }

  @RequireCapability("gallery.manage")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gallery.remove(id);
  }
}
