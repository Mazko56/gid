import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard, type AuthRequest } from "../../common/auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("phone/register")
  registerPhone(@Body() body: { phone?: string; name?: string; password?: string }) {
    return this.auth.registerPhone(body);
  }

  @Post("phone/login")
  loginPhone(@Body() body: { phone?: string; password?: string }) {
    return this.auth.loginPhone(body);
  }

  @UseGuards(SessionGuard) @Post("phone/link")
  linkPhone(@Req() request: AuthRequest, @Body() body: { phone?: string; password?: string }) {
    return this.auth.linkPhone(request.user!, body);
  }

  @UseGuards(SessionGuard) @Post("logout")
  logout(@Req() request: AuthRequest) {
    const authorization = String(request.headers.authorization ?? "");
    return this.auth.logout(authorization.replace(/^Bearer /, ""));
  }

  @Post("telegram")
  telegram(@Body() body: { initData?: string; devUser?: Record<string, unknown> }) {
    return this.auth.telegram(body.initData ?? "", body.devUser as never);
  }
}
