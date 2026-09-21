import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole, hasMinRole } from "@byhltv/shared";
import { ROLES_KEY } from "../decorators/auth.decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();
    const ok = required.some((role) => hasMinRole(user.role as UserRole, role));
    if (!ok) throw new ForbiddenException("Insufficient role");
    return true;
  }
}
