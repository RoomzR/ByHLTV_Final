import { Module, forwardRef } from "@nestjs/common";
import { LiveModule } from "../live/live.module";
import { TournamentApplicationsController } from "./tournament-applications.controller";
import { TournamentApplicationsService } from "./tournament-applications.service";

@Module({
  imports: [forwardRef(() => LiveModule)],
  controllers: [TournamentApplicationsController],
  providers: [TournamentApplicationsService],
  exports: [TournamentApplicationsService],
})
export class TournamentApplicationsModule {}
