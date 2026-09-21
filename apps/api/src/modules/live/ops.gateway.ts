import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";
import {
  UserRole,
  hasStaffMinRole,
  isContentStaff,
  isEffectivelyBanned,
  isTournamentAdmin,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ACCESS_COOKIE } from "../auth/auth-cookies";

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "/ops",
})
export class OpsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization?.replace("Bearer ", "") as string | undefined) ||
        cookieValue(client.handshake.headers.cookie, ACCESS_COOKIE) ||
        undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = this.config.get<string>("JWT_ACCESS_SECRET");
      if (!secret) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, { secret });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || isEffectivelyBanned(user)) {
        client.disconnect();
        return;
      }
      const canOps = isContentStaff(user.role) || isTournamentAdmin(user.role);
      if (!canOps) {
        client.disconnect();
        return;
      }
      (client.data as { userId: string; role: string }).userId = user.id;
      (client.data as { userId: string; role: string }).role = user.role;
      client.emit("ops:ready", { userId: user.id, role: user.role });
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage("ops:join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { submissionId?: string; applicationId?: string },
  ) {
    const userId = (client.data as { userId?: string }).userId;
    const role = (client.data as { role?: string }).role;
    if (!userId || !role) return { ok: false };

    if (data.submissionId) {
      const sub = await this.prisma.eventSubmission.findUnique({
        where: { id: data.submissionId },
        select: { authorId: true, eventId: true },
      });
      if (!sub) return { ok: false };
      const isAuthor = sub.authorId === userId;
      const isStaff = isContentStaff(role);
      let isOrganizer = false;
      if (!isAuthor && !isStaff && sub.eventId && isTournamentAdmin(role)) {
        const org = await this.prisma.eventOrganizer.findUnique({
          where: { eventId_userId: { eventId: sub.eventId, userId } },
        });
        isOrganizer = Boolean(org);
      }
      if (!isAuthor && !isStaff && !isOrganizer) return { ok: false };
      client.join(`submission:${data.submissionId}`);
    }

    if (data.applicationId) {
      const app = await this.prisma.tournamentAdminApplication.findUnique({
        where: { id: data.applicationId },
        select: { userId: true },
      });
      if (!app) return { ok: false };
      const isApplicant = app.userId === userId;
      const canReview = hasStaffMinRole(role, UserRole.ADMIN);
      if (!isApplicant && !canReview) return { ok: false };
      client.join(`application:${data.applicationId}`);
    }

    return { ok: true };
  }

  broadcastMessage(room: string, message: unknown) {
    this.server?.to(room).emit("ops:message", message);
  }

  broadcastSubmissionStatus(submissionId: string, payload: unknown) {
    this.server?.to(`submission:${submissionId}`).emit("ops:submission_status", payload);
  }
}
