import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { Stage2Module } from "./modules/stage2/stage2.module.js";

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, Stage2Module],
})
export class AppModule {}
