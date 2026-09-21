import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("streams")
export class StreamsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  list() {
    return this.prisma.stream.findMany({ orderBy: [{ isLive: "desc" }, { viewers: "desc" }] });
  }
}
