import { Module, forwardRef } from "@nestjs/common";
import { LiveModule } from "../live/live.module";
import { PlayersModule } from "../players/players.module";
import { GsiCfgService } from "./gsi-cfg.service";
import { GsiController } from "./gsi.controller";
import { GsiService } from "./gsi.service";

@Module({
  imports: [forwardRef(() => LiveModule), PlayersModule],
  controllers: [GsiController],
  providers: [GsiService, GsiCfgService],
  exports: [GsiService, GsiCfgService],
})
export class GsiModule {}
