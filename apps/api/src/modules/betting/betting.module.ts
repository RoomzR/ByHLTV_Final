import { Module } from "@nestjs/common";
import { BettingController } from "./betting.controller";

@Module({ controllers: [BettingController] })
export class BettingModule {}
