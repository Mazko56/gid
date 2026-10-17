import { PlatformController } from "./platform.controller.js";
import { PlatformService } from "./platform.service.js";
import { Module } from "@nestjs/common";
import { AdminKeyGuard, SessionGuard } from "../../common/auth.guard.js";
import { Stage2Controller } from "./stage2.controller.js";
import { Stage2Service } from "./stage2.service.js";
import { GooglePlacesService } from "./google-places.service.js";
import { GeoapifyPlacesService } from "./geoapify-places.service.js";
import { OutscraperPlacesService } from "./outscraper-places.service.js";
import { PublicPlaceMediaService } from "./public-place-media.service.js";

@Module({ controllers: [Stage2Controller, PlatformController], providers: [PlatformService, Stage2Service, GooglePlacesService, GeoapifyPlacesService, OutscraperPlacesService, PublicPlaceMediaService, SessionGuard, AdminKeyGuard] })
export class Stage2Module {}
