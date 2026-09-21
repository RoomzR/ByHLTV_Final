import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "byhltv-api", ts: new Date().toISOString() };
  }
}
