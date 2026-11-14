import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { SessionGuard } from "../../common/auth.guard.js";

@Module({ controllers: [AuthController], providers: [AuthService, SessionGuard], exports: [AuthService] })
export class AuthModule {}
