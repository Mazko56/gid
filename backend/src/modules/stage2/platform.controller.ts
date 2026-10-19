import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminKeyGuard, type AuthRequest, SessionGuard } from '../../common/auth.guard.js';
import { PlatformService } from './platform.service.js';

@Controller()
export class PlatformController {
  constructor(private readonly platform:PlatformService) {}

  @UseGuards(SessionGuard) @Get('wallet') wallet(@Req() r:AuthRequest) { return this.platform.wallet(r.user!); }
  @UseGuards(SessionGuard) @Get('wallet/ledger') ledger(@Req() r:AuthRequest) { return this.platform.wallet(r.user!); }
  @UseGuards(SessionGuard) @Post('qr/customer-token') qr(@Req() r:AuthRequest) { return this.platform.customerQr(r.user!); }
  @UseGuards(SessionGuard) @Post('partner/scan/resolve') scan(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.resolveScan(r.user!,b); }
  @UseGuards(SessionGuard) @Post('transactions/quote') quote(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.quote(r.user!,b); }
  @UseGuards(SessionGuard) @Get('transactions/pending') pending(@Req() r:AuthRequest) { return this.platform.pendingCustomer(r.user!); }
  @UseGuards(SessionGuard) @Post('transactions/confirm') confirm(@Req() r:AuthRequest,@Body() b:{id:string}) { return this.platform.confirmPurchase(r.user!,b.id); }
  @UseGuards(SessionGuard) @Post('transactions/decline') decline(@Req() r:AuthRequest,@Body() b:{id:string}) { return this.platform.declinePurchase(r.user!,b.id); }
  @UseGuards(SessionGuard) @Post('transactions/:id/refund') refund(@Req() r:AuthRequest,@Param('id') id:string) { return this.platform.refund(r.user!,id); }
  @UseGuards(SessionGuard) @Get('transactions') transactions(@Req() r:AuthRequest,@Query('place_id') p?:string) { return this.platform.purchases(r.user!,p); }
  @UseGuards(SessionGuard) @Get('partner/settlement') settlement(@Req() r:AuthRequest,@Query('place_id') p:string,@Query('from') from?:string,@Query('to') to?:string) { return this.platform.settlement(r.user!,p,from,to); }

  @UseGuards(SessionGuard) @Post('partner/settlement/payment-claims') paymentClaim(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.submitSettlementPayment(r.user!,b); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/payment-claims') paymentClaims() { return this.platform.adminPaymentClaims(); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/payment-claims/:id/receipt') paymentReceipt(@Param('id') id:string) { return this.platform.adminPaymentReceipt(id); }
  @UseGuards(AdminKeyGuard) @Patch('admin/platform/payment-claims/:id') moderateClaim(@Param('id') id:string,@Body() b:{status:string;comment?:string}) { return this.platform.moderateSettlementPayment(id,b.status,b.comment||''); }

  @UseGuards(SessionGuard) @Get('partner/offers') partnerOffers(@Req() r:AuthRequest) { return this.platform.partnerOffers(r.user!); }
  @UseGuards(SessionGuard) @Post('partner/offers') saveOffer(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.savePartnerOffer(r.user!,b); }
  @UseGuards(SessionGuard) @Patch('partner/offers/:id') updateOffer(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:Record<string,unknown>) { return this.platform.savePartnerOffer(r.user!,b,id); }
  @UseGuards(SessionGuard) @Delete('partner/offers/:id') deleteOffer(@Req() r:AuthRequest,@Param('id') id:string) { return this.platform.deletePartnerOffer(r.user!,id); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/offers/moderation') offerModeration() { return this.platform.adminPartnerOffersForModeration(); }
  @UseGuards(AdminKeyGuard) @Patch('admin/platform/offers/:id/moderate') moderateOffer(@Param('id') id:string,@Body() b:{status:string;comment?:string}) { return this.platform.moderatePartnerOffer(id,b.status,b.comment||''); }

  @Get('resources/:placeId') resources(@Param('placeId') id:string) { return this.platform.resources(id); }
  @UseGuards(SessionGuard) @Get('partner/resources/:placeId') partnerResources(@Req() r:AuthRequest,@Param('placeId') id:string) { return this.platform.partnerResources(r.user!,id); }
  @UseGuards(SessionGuard) @Post('partner/resources') saveResource(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.saveResource(r.user!,b); }
  @UseGuards(SessionGuard) @Delete('partner/resources/:id') removeResource(@Req() r:AuthRequest,@Param('id') id:string) { return this.platform.removeResource(r.user!,id); }
  @Get('bookings/availability') availability(@Query('place_id') id:string,@Query('date') date:string) { return this.platform.availability(id,date); }
  @UseGuards(SessionGuard) @Post('bookings') book(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.newBooking(r.user!,b); }
  @UseGuards(SessionGuard) @Post('partner/bookings/manual') manual(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.newBooking(r.user!,b,true); }
  @UseGuards(SessionGuard) @Get('bookings') bookings(@Req() r:AuthRequest,@Query('place_id') p?:string) { return this.platform.bookings(r.user!,p); }
  @UseGuards(SessionGuard) @Patch('bookings/:id/status') status(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:{status:string}) { return this.platform.bookingStatus(r.user!,id,b.status); }

  @UseGuards(SessionGuard) @Get('reviews/eligibility') reviewEligibility(@Req() r:AuthRequest,@Query('place_id') p?:string) { return this.platform.reviewEligibility(r.user!,p); }
  @UseGuards(SessionGuard) @Post('reviews') review(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.review(r.user!,b); }
  @Get('reviews/place/:id') reviews(@Param('id') id:string) { return this.platform.reviews(id); }
  @UseGuards(SessionGuard) @Patch('partner/reviews/:id/reply') reply(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:{text:string}) { return this.platform.respondReview(r.user!,id,b.text); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/reviews') adminReviews(@Query('region_id') p?:string) { return this.platform.moderatedReviews(p); }
  @UseGuards(AdminKeyGuard) @Patch('admin/platform/reviews/:id') moderation(@Param('id') id:string,@Body() b:{status:string;comment?:string}) { return this.platform.moderateReview(id,b.status,b.comment||''); }

  @UseGuards(SessionGuard) @Post('hotel/requests') hotelRequest(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.hotelRequest(r.user!,b); }
  @UseGuards(SessionGuard) @Get('partner/hotel/requests') hotelRequests(@Req() r:AuthRequest,@Query('place_id') p:string) { return this.platform.hotelRequests(r.user!,p); }
  @UseGuards(SessionGuard) @Patch('partner/hotel/requests/:id') hotelStatus(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:{status:string}) { return this.platform.hotelRequestStatus(r.user!,id,b.status); }

  @UseGuards(SessionGuard) @Get('me/export') exportUser(@Req() r:AuthRequest) { return this.platform.exportPersonalData(r.user!); }
  @UseGuards(SessionGuard) @Delete('me/account') deleteUser(@Req() r:AuthRequest) { return this.platform.deleteAccount(r.user!); }
  @UseGuards(SessionGuard) @Get('me/plans') plans(@Req() r:AuthRequest) { return this.platform.plans(r.user!); }
  @UseGuards(SessionGuard) @Post('me/plans') plan(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.savePlan(r.user!,b); }
  @UseGuards(SessionGuard) @Get('ambassador/me') ambassador(@Req() r:AuthRequest) { return this.platform.ambassador(r.user!); }
  @UseGuards(SessionGuard) @Post('ambassador/register') register(@Req() r:AuthRequest,@Body() b:Record<string,unknown>) { return this.platform.registerAmbassador(r.user!,b); }
  @UseGuards(SessionGuard) @Post('ambassador/attribute') attribute(@Req() r:AuthRequest,@Body() b:{start_param:string}) { return this.platform.attribute(r.user!,b.start_param); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/clients') clients() { return this.platform.adminClients(); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/clients/:id') client(@Param('id') id:string) { return this.platform.adminClient(id); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/partners/:id/summary') partnerSummary(@Param('id') id:string) { return this.platform.adminPartnerSummary(id); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/settlements') settlements() { return this.platform.adminSettlements(); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/analytics') analytics(@Query('region_id') p?:string) { return this.platform.adminAnalytics(p); }
  @UseGuards(AdminKeyGuard) @Get('admin/platform/audit') audit(@Query('region_id') p?:string) { return this.platform.auditLog(p); }
}
