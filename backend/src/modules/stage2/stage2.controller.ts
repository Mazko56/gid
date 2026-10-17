import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AdminKeyGuard, type AuthRequest, SessionGuard } from "../../common/auth.guard.js";
import { Stage2Service } from "./stage2.service.js";

@Controller()
export class Stage2Controller {
  constructor(private readonly service: Stage2Service) {}

  @Get("context/:startParam")
  context(@Param("startParam") startParam: string) { return this.service.context(startParam); }

  @Get("categories")
  categories() { return this.service.categories(); }

  @Get("place-type-templates")
  placeTypeTemplates(@Query("category") category = "") { return this.service.placeTypeTemplates(category); }

  @Get("geo/autocomplete")
  geoAutocomplete(@Query("input") input = "", @Query("mode") mode = "city", @Query("city") city = "", @Query("street") street = "") {
    const resolved = mode === "street" || mode === "house" ? mode : "city";
    return this.service.geoAutocomplete(input, resolved, city, street);
  }

  @Get("geo/place/:placeId")
  geoDetails(@Param("placeId") placeId: string) { return this.service.geoDetails(placeId); }

  @Get("geo/reverse")
  geoReverse(@Query("lat") lat = "", @Query("lng") lng = "") { return this.service.geoReverse(Number(lat), Number(lng)); }

  @Get("google/photo")
  async googlePhoto(@Query("name") name = "", @Res() response: any) {
    const photo = await this.service.googlePhoto(name);
    response.setHeader("Content-Type", photo.contentType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    return response.send(photo.buffer);
  }

  @Get("google/photo-uri")
  googlePhotoUri(@Query("name") name = "") {
    return this.service.googlePhotoUri(name);
  }

  @Get("google/place-photo")
  async googlePlacePhoto(@Query("id") id = "", @Res() response: any) {
    const photo = await this.service.googlePlacePhoto(id);
    response.setHeader("Content-Type", photo.contentType);
    response.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return response.send(photo.buffer);
  }

  @Get("places")
  places(@Query() query: Record<string, unknown>) { return this.service.places(query); }

  @Post("places/enrich")
  enrichPlaces(@Body() body: Record<string, unknown>) { return this.service.enrichPlaces(body); }

  @Get("weather")
  weather(@Query("lat") lat = "", @Query("lng") lng = "") { return this.service.weather(Number(lat), Number(lng)); }

  @Get("places/:id")
  place(@Param("id") id: string, @Query("lat") lat = "", @Query("lng") lng = "") {
    const originLat = lat === "" ? undefined : Number(lat);
    const originLng = lng === "" ? undefined : Number(lng);
    return this.service.place(id, true, originLat, originLng);
  }

  @Get("emergency")
  emergency(@Query("region_id") regionId = "region-tatariv") { return this.service.emergency(regionId); }

  @Get("emergency-services")
  emergencyServices(@Query("region_id") regionId = "region-tatariv") { return this.service.emergencyServices(regionId); }

  @Get("offers")
  offers(@Query("region_id") regionId = "region-tatariv") { return this.service.hotOffers(regionId); }

  @Get("page-content/:pageKey")
  pageContent(@Param("pageKey") pageKey: string, @Query("region_id") regionId = "region-tatariv") {
    return this.service.pageContent(regionId, pageKey);
  }

  @UseGuards(SessionGuard)
  @Get("me")
  me(@Req() request: AuthRequest) { return this.service.profile(request.user!); }

  @UseGuards(SessionGuard)
  @Patch("me")
  updateMe(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateProfile(request.user!, body); }

  @UseGuards(SessionGuard)
  @Get("me/favorites")
  favorites(@Req() request: AuthRequest) { return this.service.favorites(request.user!); }

  @UseGuards(SessionGuard)
  @Post("me/favorites/:placeId")
  addFavorite(@Req() request: AuthRequest, @Param("placeId") placeId: string) { return this.service.addFavorite(request.user!, placeId); }

  @UseGuards(SessionGuard)
  @Delete("me/favorites/:placeId")
  removeFavorite(@Req() request: AuthRequest, @Param("placeId") placeId: string) { return this.service.removeFavorite(request.user!, placeId); }

  @UseGuards(SessionGuard)
  @Get("me/activity")
  activity(@Req() request: AuthRequest) { return this.service.recentActivity(request.user!); }

  @UseGuards(SessionGuard)
  @Post("me/place-submissions")
  createPlaceSubmission(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.createUserPlaceSubmission(request.user!, body); }

  @UseGuards(SessionGuard)
  @Post("events")
  event(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.addEvent(request.user!, body); }

  @UseGuards(SessionGuard)
  @Get("partner/access-diagnostic/:startParam")
  partnerAccessDiagnostic(@Req() request: AuthRequest, @Param("startParam") startParam: string) { return this.service.partnerAccessDiagnostic(request.user!, startParam); }

  @UseGuards(SessionGuard)
  @Get("partner/access/:startParam")
  partnerAccess(@Req() request: AuthRequest, @Param("startParam") startParam: string) { return this.service.partnerAccess(request.user!, startParam); }

  @UseGuards(SessionGuard)
  @Get("partner/places")
  partnerPlaces(@Req() request: AuthRequest) { return this.service.partnerPlaces(request.user!); }

  @UseGuards(SessionGuard)
  @Post("partner/onboarding")
  partnerOnboarding(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.createPartnerPlace(request.user!, body); }

  @UseGuards(SessionGuard)
  @Patch("partner/places/:id")
  partnerUpdate(@Req() request: AuthRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) { return this.service.updatePartnerPlace(request.user!, id, body); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/partners")
  adminPartners() { return this.service.adminPartners(); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/partners")
  adminCreatePartner(@Body() body: Record<string, unknown>) { return this.service.adminCreatePartner(body); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/partners/:id")
  adminPartner(@Param("id") id: string) { return this.service.adminPartner(id); }

  @UseGuards(AdminKeyGuard)
  @Patch("admin/stage2/partners/:id")
  adminUpdatePartner(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.service.adminUpdatePartner(id, body); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/regions")
  adminRegions() { return this.service.adminRegions(); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/places")
  adminPlaces(@Query("status") status = "approved") { return this.service.adminPlaces(status); }

  @UseGuards(AdminKeyGuard)
  @Patch("admin/stage2/regions/:id")
  adminRegion(@Param("id") id: string, @Body() body: Record<string, unknown>) { return this.service.adminUpdateRegion(id, body); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/moderation")
  adminModeration() { return this.service.adminPending(); }

  @UseGuards(AdminKeyGuard)
  @Patch("admin/stage2/places/:id/status")
  adminStatus(@Param("id") id: string, @Body() body: { status: string; comment?: string; category_slug?: string }) {
    return this.service.adminStatus(id, body.status, body.comment, body.category_slug);
  }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/qr")
  adminQr() { return this.service.adminQrList(); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/qr")
  adminCreateQr(@Body() body: Record<string, unknown>) { return this.service.adminCreateQr(body); }

  @UseGuards(AdminKeyGuard)
  @Patch("admin/stage2/qr/:id")
  adminToggleQr(@Param("id") id: string, @Body() body: { active: boolean }) { return this.service.adminToggleQr(id, Boolean(body.active)); }

  @UseGuards(AdminKeyGuard)
  @Delete("admin/stage2/qr/:id")
  adminDeleteQr(@Param("id") id: string) { return this.service.adminDeleteQr(id); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/categories")
  adminCategory(@Body() body: Record<string, unknown>) { return this.service.adminCreateCategory(body); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/place-type-templates")
  adminTemplate(@Body() body: Record<string, unknown>) { return this.service.adminSaveTemplate(body); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/emergency")
  adminEmergencyList(@Query("region_id") regionId = "region-tatariv") { return this.service.emergency(regionId); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/emergency")
  adminEmergency(@Body() body: Record<string, unknown>) { return this.service.adminEmergency(body); }

  @UseGuards(AdminKeyGuard)
  @Delete("admin/stage2/emergency/:id")
  adminDeleteEmergency(@Param("id") id: string) { return this.service.adminDeleteEmergency(id); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/emergency-services")
  adminEmergencyServices(@Query("region_id") regionId = "region-tatariv") { return this.service.emergencyServices(regionId, true); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/emergency-services")
  adminEmergencyService(@Body() body: Record<string, unknown>) { return this.service.adminEmergencyService(body); }

  @UseGuards(AdminKeyGuard)
  @Delete("admin/stage2/emergency-services/:id")
  adminDeleteEmergencyService(@Param("id") id: string) { return this.service.adminDeleteEmergencyService(id); }

  @UseGuards(AdminKeyGuard)
  @Get("admin/stage2/offers")
  adminOffers(@Query("region_id") regionId = "region-tatariv") { return this.service.hotOffers(regionId, true); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/offers")
  adminSaveOffer(@Body() body: Record<string, unknown>) { return this.service.adminSaveHotOffer(body); }

  @UseGuards(AdminKeyGuard)
  @Delete("admin/stage2/offers/:id")
  adminDeleteOffer(@Param("id") id: string) { return this.service.adminDeleteHotOffer(id); }

  @UseGuards(AdminKeyGuard)
  @Post("admin/stage2/page-content/:pageKey")
  adminSavePageContent(@Param("pageKey") pageKey: string, @Body() body: Record<string, unknown>) {
    return this.service.adminSavePageContent(pageKey, body);
  }
}
