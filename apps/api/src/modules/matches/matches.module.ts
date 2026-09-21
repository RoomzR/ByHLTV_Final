import { Module, forwardRef } from "@nestjs/common";
import { MatchesController } from "./matches.controller";
import { MatchesService } from "./matches.service";
import { LiveModule } from "../live/live.module";
import { PlayersModule } from "../players/players.module";

@Module({
  imports: [forwardRef(() => LiveModule), PlayersModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
