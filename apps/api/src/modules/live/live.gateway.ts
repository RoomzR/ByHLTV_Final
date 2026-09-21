import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { sanitizeMatch } from "../../common/utils/sanitize-match";

@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"] },
  namespace: "/live",
})
export class LiveGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit("live:ready", { ok: true });
  }

  private scrub(match: { slug?: string; id?: string } & Record<string, unknown>) {
    return sanitizeMatch(match as { gsiToken?: string | null } & typeof match);
  }

  broadcastMatchUpdate(match: { slug?: string; id?: string } & Record<string, unknown>) {
    const payload = this.scrub(match);
    this.server?.emit("match:update", payload);
    if (payload.slug) this.server?.to(`match:${payload.slug}`).emit("match:update", payload);
    if (payload.id) this.server?.to(`match:${payload.id}`).emit("match:update", payload);
  }

  broadcastStatsUpdate(match: { slug?: string } & Record<string, unknown>) {
    const payload = this.scrub(match);
    this.server?.emit("stats:update", payload);
    if (payload.slug) this.server?.to(`match:${payload.slug}`).emit("stats:update", payload);
  }

  broadcastRoundsUpdate(match: { slug?: string } & Record<string, unknown>) {
    const payload = this.scrub(match);
    this.server?.emit("rounds:update", payload);
    if (payload.slug) this.server?.to(`match:${payload.slug}`).emit("rounds:update", payload);
  }

  @SubscribeMessage("match:subscribe")
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { slug?: string; id?: string },
  ) {
    const room = data.slug ? `match:${data.slug}` : data.id ? `match:${data.id}` : null;
    if (room) client.join(room);
    return { event: "match:subscribed", data: { room } };
  }

  @SubscribeMessage("match:unsubscribe")
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { slug?: string; id?: string },
  ) {
    const room = data.slug ? `match:${data.slug}` : data.id ? `match:${data.id}` : null;
    if (room) client.leave(room);
    return { event: "match:unsubscribed", data: { room } };
  }
}
