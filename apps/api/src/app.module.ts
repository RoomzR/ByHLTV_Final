import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { PlayersModule } from "./modules/players/players.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { EventsModule } from "./modules/events/events.module";
import { NewsModule } from "./modules/news/news.module";
import { AwardsModule } from "./modules/awards/awards.module";
import { RankingsModule } from "./modules/rankings/rankings.module";
import { StatsModule } from "./modules/stats/stats.module";
import { ForumsModule } from "./modules/forums/forums.module";
import { GalleryModule } from "./modules/gallery/gallery.module";
import { StreamsModule } from "./modules/streams/streams.module";
import { SearchModule } from "./modules/search/search.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { FantasyModule } from "./modules/fantasy/fantasy.module";
import { BettingModule } from "./modules/betting/betting.module";
import { AdminModule } from "./modules/admin/admin.module";
import { LiveModule } from "./modules/live/live.module";
import { TournamentApplicationsModule } from "./modules/tournament-applications/tournament-applications.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { GsiModule } from "./modules/gsi/gsi.module";
import { DemosModule } from "./modules/demos/demos.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { AdsModule } from "./modules/ads/ads.module";
import { HealthController } from "./modules/health/health.controller";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
    EventsModule,
    NewsModule,
    AwardsModule,
    RankingsModule,
    StatsModule,
    ForumsModule,
    GalleryModule,
    StreamsModule,
    SearchModule,
    NotificationsModule,
    FantasyModule,
    BettingModule,
    AdminModule,
    LiveModule,
    TournamentApplicationsModule,
    SubmissionsModule,
    GsiModule,
    DemosModule,
    CommentsModule,
    ReportsModule,
    UploadsModule,
    AdsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
