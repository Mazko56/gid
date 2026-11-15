const fs=require('fs'), vm=require('vm'), ts=require('typescript'),assert=require('node:assert/strict');
const base=__dirname;
function moduleLoad(file, deps){
 const source=fs.readFileSync(base+'/'+file,'utf8');
 const output=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true,esModuleInterop:true}}).outputText;
 const exports={};
 const requireStub=name=>name==='@nestjs/common'?{Injectable:()=>klass=>klass,BadRequestException:class extends Error {},NotFoundException:class extends Error {},UnauthorizedException:class extends Error {},BadGatewayException:class extends Error {}}:name==='node:crypto'?require('node:crypto'):name==='../../common/id.js'?{makeId:prefix=>prefix+'-'+require('node:crypto').randomUUID().slice(0,12)}:name.includes('nearby-filter-options')?{NEARBY_FILTERS_BY_CATEGORY:{entertainment:['Активний відпочинок'],rest:['SPA і басейни']}}:deps?.[name]||{};
 vm.runInNewContext('(function(require,exports){'+output+'})',{require:requireStub,exports,console,Math,Number,String,JSON,Date,Promise,Set,Map,RegExp,URL,Error,Intl,process:{env:{}}})(requireStub,exports);
 return exports;
}
const {Stage2Service}=moduleLoad('backend/src/modules/stage2/stage2.service.ts');
const {PlannerService}=moduleLoad('backend/src/modules/stage2/planner.service.ts');
const db={
 q:[],query:async (sql,args=[])=>{
  db.q.push([sql,args]);
  if(sql.includes('FROM regions WHERE active'))return {rows:[{id:'r1',name:'Кривий Ріг',center_lat:47.90,center_lng:33.36}]};
  if(sql.includes('FROM regions WHERE id='))return {rows:[{id:'r1',name:'Кривий Ріг',center_lat:47.90,center_lng:33.36}]};
  if(sql.includes('FROM (SELECT p.*'))return {rows:db.places||[]};
  throw Error('Unhandled query '+sql.slice(0,130));
 }
};
(async()=>{
 // Actual active leisure places in PostgreSQL: one venue alone must suffice for a real plan.
 const p={id:'actual-activity',region_id:'r1',name:'Відпочинок на території',description:'',category_slug:'rest',subcategory:'Відпочинок',tags:[],address:'Кривий Ріг',lat:47.901,lng:33.362,price_level:null,rating:0,attributes:{},work_hours:{daily:{from:'08:00',to:'22:00'}},image_url:null};
 db.places=[p];
 const planner=new PlannerService(db);
 const r=await planner.generate({id:'u1'},{region_id:'r1',activities:['active'],days:1,start_date:'2026-11-16',start_time:'10:00',radius_km:15});
 assert.equal(r.candidates_count,1,'Real rest place must match active');
 assert.equal(r.variants[0].stop_count,1,'One real stop should create a valid plan');
 assert.equal(r.variants[0].days[0].stops[0].place_id,p.id);
 const r2=await planner.generate({id:'u1'},{region_id:'r1',activities:['active','food','nature'],days:1,start_date:'2026-11-16',start_time:'10:00',radius_km:15});
 assert.equal(r2.variants[0].stop_count,1);
 console.log('PASS planner: real active/rest candidate, single stop, multi-interest');
 // Exact QR location should not suppress matching place with distance 0.
 const qrdb={query:async(sql,args)=>{
   if(sql.includes('FROM qr_points'))return {rows:[{region_id:'r1',region_name:'Кривий Ріг',region_lat:47.90,region_lng:33.36,place_id:'actual-activity',place_name:p.name,place_address:p.address,place_lat:p.lat,place_lng:p.lng}]};
   if(sql.includes('FROM regions'))return {rows:[{id:'r1',name:'Кривий Ріг',center_lat:47.90,center_lng:33.36}]};
   if(sql.includes('FROM (SELECT p.*'))return {rows:[p]};throw Error('unhandled '+sql)
 }};
 const qr=new PlannerService(qrdb);const qrResult=await qr.generate({id:'u1'},{start_param:'qr-p',activities:['active'],start_date:'2026-11-16',start_time:'10:00'});
 assert.equal(qrResult.variants[0].stop_count,1);
 console.log('PASS planner: matching place exactly at QR coordinates');
 // Archive partner: a reversible state change only; no deletes.
 const rows={partner:{id:'p1',organization_id:'org1',name:'Partner',status:'approved'}};
 const calls=[];
 const archiveClient={query:async(sql,args)=>{calls.push(sql);if(sql.includes('FROM places WHERE id=$1 FOR UPDATE'))return {rows:[rows.partner]};if(sql.includes('FROM bookings'))return {rows:[{count:'0'}]};if(sql.includes('FROM purchase_transactions'))return {rows:[{count:'0'}]};if(sql.includes('FROM places WHERE organization_id'))return {rows:[]};return {rows:[]}}};
 const stage=new Stage2Service({transaction:async cb=>cb(archiveClient)});
 const result=await stage.adminArchivePartner('p1');assert.equal(result.archived,true);
 assert.ok(calls.some(x=>x.includes("status='archived'")));
 assert.ok(calls.some(x=>x.includes('qr_points SET active=false')));
 assert.ok(!calls.some(x=>/^DELETE\s+FROM/i.test(x)));
 console.log('PASS archive: historical data retained, QR/access disabled');
 // Existing bookings should block deletion.
 const blocked=new Stage2Service({transaction:async cb=>cb({query:async sql=>{if(sql.includes('FROM places WHERE id='))return {rows:[rows.partner]};if(sql.includes('FROM bookings'))return {rows:[{count:'1'}]};return {rows:[]}}})});
 await assert.rejects(blocked.adminArchivePartner('p1'),/бронювання/);
 console.log('PASS archive: cannot archive with active bookings');
 // Repeat request must return existing record with no new side-effects.
 const existing={place_id:'p1',organization_id:'org1',status:'approved',start_param:'partner-test',telegram_ids:['123456789']};
 const repeatQueries=[];
 const repeats=new Stage2Service({query:async(sql,args)=>{repeatQueries.push(sql);return {rows:[existing]}}});
 const created=await repeats.adminCreatePartner({creation_request_id:'11111111-1111-4111-8111-111111111111'});
 assert.equal(created.place_id,'p1');assert.equal(repeatQueries.length,1);
 console.log('PASS idempotency: duplicate request returns existing place');
 // Public community endpoint uses current database value.
 const community=new Stage2Service({query:async(sql,args)=>{assert.equal(args[0],'r1');return {rows:[{community_url:'https://t.me/actualCommunity'}]}}});
 assert.equal((await community.community('r1')).community_url,'https://t.me/actualCommunity');
 console.log('PASS community: live URL loaded by QR region');
})().catch(err=>{console.error(err);process.exitCode=1;});
