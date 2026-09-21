import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { LiveGateway } from "./live.gateway";
import { OpsGateway } from "./ops.gateway";
import { MatchesModule } from "../matches/matches.module";

@Module({
  imports: [forwardRef(() => MatchesModule), JwtModule.register({})],
  providers: [LiveGateway, OpsGateway],
  exports: [LiveGateway, OpsGateway],
})
export class LiveModule {}
