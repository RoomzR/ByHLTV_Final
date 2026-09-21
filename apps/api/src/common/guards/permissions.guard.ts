import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { can, type Capability } from "@byhltv/shared";
import { CAPABILITIES_KEY } from "../decorators/auth.decorators";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability[]>(CAPABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();
    const ok = required.some((cap) => can(user.role, cap));
    if (!ok) throw new ForbiddenException("Missing capability");
    return true;
  }
}
