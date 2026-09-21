import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { refreshTokenSchema } from "@byhltv/shared";
import { AuthService } from "./auth.service";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "./auth-cookies";
import { Public } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post("register")
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const issued = await this.auth.register(body);
    this.applyCookies(res, issued);
    return { user: issued.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const issued = await this.auth.login(body);
    this.applyCookies(res, issued);
    return { user: issued.user };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("refresh")
  async refresh(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = refreshTokenSchema.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const token =
      parsed.data.refreshToken ||
      (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (!token) throw new UnauthorizedException("Missing refresh token");
    const issued = await this.auth.refresh(token);
    this.applyCookies(res, issued);
    return { user: issued.user };
  }

  @Public()
  @Post("logout")
  async logout(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      body?.refreshToken || (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    await this.auth.logout(token);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  private applyCookies(
    res: Response,
    issued: {
      accessToken: string;
      refreshToken: string;
      accessMs: number;
      refreshMs: number;
    },
  ) {
    setAuthCookies(
      res,
      { accessToken: issued.accessToken, refreshToken: issued.refreshToken },
      { accessMs: issued.accessMs, refreshMs: issued.refreshMs },
    );
  }
}
