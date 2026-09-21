import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { isEffectivelyBanned, loginSchema, registerSchema } from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  async register(raw: unknown) {
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const data = parsed.data;
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (exists) throw new BadRequestException("Email or username already taken");
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName ?? data.username,
        passwordHash,
      },
    });
    return this.issueTokens(user);
  }

  async login(raw: unknown) {
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const user = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    // Constant-time-ish path: always run bcrypt even when user is missing
    const DUMMY =
      "$2a$12$C6UzMDM.H6dfI/f/IKxGhu0g.k5YQ7nqGkqGkqGkqGkqGkqGkqGkqG";
    const hash = user?.passwordHash ?? DUMMY;
    const ok = await bcrypt.compare(parsed.data.password, hash);
    if (!user || !ok || isEffectivelyBanned(user)) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const secret = this.requireRefreshSecret();
      const payload = await this.jwt.verifyAsync<{ sub: string; jti: string }>(refreshToken, {
        secret,
      });
      const denied = await this.redis.get(`deny:${payload.jti}`);
      if (denied) throw new UnauthorizedException();
      const hash = this.hash(refreshToken);
      const session = await this.prisma.session.findFirst({
        where: {
          userId: payload.sub,
          refreshTokenHash: hash,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });
      if (!session) throw new UnauthorizedException();
      if (isEffectivelyBanned(session.user)) {
        await this.prisma.session.deleteMany({ where: { userId: session.userId } });
        throw new UnauthorizedException("Account restricted");
      }
      await this.redis.set(`deny:${payload.jti}`, "1", 7 * 24 * 3600);
      await this.prisma.session.delete({ where: { id: session.id } });
      return this.issueTokens(session.user);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { ok: true };
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string; sub: string }>(refreshToken, {
        secret: this.requireRefreshSecret(),
      });
      await this.redis.set(`deny:${payload.jti}`, "1", 7 * 24 * 3600);
      await this.prisma.session.deleteMany({ where: { userId: payload.sub } });
    } catch {
      /* ignore */
    }
    return { ok: true };
  }

  async revokeSessions(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    username: string;
    role: string;
    displayName: string;
    avatarUrl?: string | null;
  }) {
    const jti = randomUUID();
    const accessTtl = (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as `${number}${"s" | "m" | "h" | "d"}`;
    const refreshTtl = (this.config.get<string>("JWT_REFRESH_TTL") ?? "7d") as `${number}${"s" | "m" | "h" | "d"}`;
    const accessMs = this.parseTtlMs(accessTtl);
    const refreshMs = this.parseTtlMs(refreshTtl);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.requireAccessSecret(),
        expiresIn: accessTtl,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      {
        secret: this.requireRefreshSecret(),
        expiresIn: refreshTtl,
      },
    );
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshMs),
      },
    });
    return {
      accessToken,
      refreshToken,
      accessMs,
      refreshMs,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  private parseTtlMs(ttl: string): number {
    const m = /^(\d+)([smhd])$/i.exec(ttl.trim());
    if (!m) return 7 * 24 * 3600 * 1000;
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
    return n * mult;
  }

  private requireAccessSecret() {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
    this.assertStrongSecret(secret, "JWT_ACCESS_SECRET");
    return secret;
  }

  private requireRefreshSecret() {
    const secret = this.config.get<string>("JWT_REFRESH_SECRET");
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
    this.assertStrongSecret(secret, "JWT_REFRESH_SECRET");
    return secret;
  }

  private assertStrongSecret(secret: string, name: string) {
    if (process.env.NODE_ENV !== "production") return;
    const weak = [
      "byhltv-access-dev-secret-change-me",
      "byhltv-refresh-dev-secret-change-me",
      "change-me",
      "secret",
    ];
    if (weak.includes(secret) || secret.length < 32) {
      throw new Error(`${name} is too weak for production`);
    }
  }

  private hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
