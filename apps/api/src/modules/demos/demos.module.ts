import { Module, forwardRef } from "@nestjs/common";
import { LiveModule } from "../live/live.module";
import { MatchesModule } from "../matches/matches.module";
import { PlayersModule } from "../players/players.module";
import { DemoParserService } from "./demo-parser.service";
import { DemosController } from "./demos.controller";
import { DemosService } from "./demos.service";

@Module({
  imports: [forwardRef(() => MatchesModule), forwardRef(() => LiveModule), PlayersModule],
  controllers: [DemosController],
  providers: [DemosService, DemoParserService],
  exports: [DemosService],
})
export class DemosModule {}
