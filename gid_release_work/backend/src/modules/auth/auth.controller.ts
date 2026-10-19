import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("telegram")
  telegram(@Body() body: { initData?: string; devUser?: Record<string, unknown> }) {
    return this.auth.telegram(body.initData ?? "", body.devUser as never);
  }
}
