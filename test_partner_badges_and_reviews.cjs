const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ts=require('typescript');
const root=__dirname;
const err=(name)=>class extends Error{constructor(s){super(s);this.name=name}};
const imports={
 '@nestjs/common':{Injectable:()=>x=>x,Logger:class{},BadRequestException:err('BadRequestException'),NotFoundException:err('NotFoundException'),BadGatewayException:err('BadGatewayException'),UnauthorizedException:err('UnauthorizedException'),ConflictException:err('ConflictException'),ForbiddenException:err('ForbiddenException')},
 './nearby-filter-options.js':{NEARBY_FILTERS_BY_CATEGORY:{food:['Кафе','Бари','Ресторани']}},
 '../../common/id.js':{makeId:(prefix='')=>prefix+Math.random().toString(36).slice(2,18)}
};
function load(file) {const source=fs.readFileSync(path.join(root,file),'utf8');const output=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true,emitDecoratorMetadata:false}}).outputText;const module={exports:{}};vm.runInNewContext(output,{module,exports:module.exports,require:name=>imports[name]||(name.startsWith('node:')?require(name):{}),console,process,Buffer,setTimeout,clearTimeout,URL,fetch,Intl});return module.exports}
(async()=>{
const {Stage2Service}=load('backend/src/modules/stage2/stage2.service.ts');
const originalAttributes={partner:true,rate_percent:5,placement_type:'social',display_badges:['partner']};
const originalDetails={city:'Кривий Ріг',admin_category_subcategories:['Кафе'],admin_nearby_filters:['Кафе']};
const current={id:'place-1',organization_id:'org-1',region_id:'region-kr',category_slug:'food',subcategory:'Кафе',name:'Наш заклад',description:'Опис',address:'Кривий Ріг, вулиця Соборності, 21',lat:47.9,lng:33.4,phone:'',image_url:'',price_level:1,work_hours:{always_open:true},attributes:originalAttributes,details:originalDetails,translations:{},telegram_ids:['12345678'],status:'approved'};
const tx=[];const queries=[];
const db={query:async(sql,args=[])=>{queries.push([sql,args]);if(sql.includes('FROM categories WHERE slug='))return{rows:[{slug:'food',subcategories:['Кафе']}]};if(sql.includes('SELECT v.id,v.place_id,v.rating'))return{rows:[{id:'review-1',place_id:'place-1',rating:5,text:'Було чудово',author:'Олена',created_at:'2026-11-15T08:00:00.000Z',partner_reply:'Дякуємо!'}]};return{rows:[]}},transaction:async fn=>{const statements=[];await fn({query:async(sql,args=[])=>{statements.push([sql,args]);return{rows:[]}}});tx.push(statements)}};
const service=new Stage2Service(db,{enabled:()=>false},{enabled:()=>false},{},{});
service.verifiedAddressFromBody=async()=>({lat:47.9,lng:33.4,city:'Кривий Ріг',region:'Дніпропетровська область',formatted_address:current.address});
service.ensureRegionForPlace=async()=> 'region-kr';
service.adminPartner=async()=>current;
const body={name:'Наш заклад',category_slug:'food',category_subcategories:['Кафе'],nearby_filters:['Кафе'],city:'Кривий Ріг',map_selected:true,lat:47.9,lng:33.4,address:current.address,telegram_ids:['12345678'],display_badges:['advertisement','recommended']};
const created=await service.adminCreatePartner(body);assert.ok(created.place_id);
const createQuery=tx[0].find(([sql])=>sql.includes('INSERT INTO places'));
const insertedAttributes=JSON.parse(createQuery[1][14]);assert.deepEqual([...insertedAttributes.display_badges],['advertisement','recommended']);assert.equal(insertedAttributes.partner,true);
assert.equal(insertedAttributes.placement_type,'social');
await service.adminUpdatePartner('place-1',body);
const updateQuery=tx[1].find(([sql])=>sql.includes('UPDATE places SET'));
const updatedAttributes=JSON.parse(updateQuery[1][13]);assert.deepEqual([...updatedAttributes.display_badges],['advertisement','recommended']);assert.equal(updatedAttributes.partner,true);
assert.equal(updatedAttributes.rate_percent,5,'existing rate preserved when not edited');
await assert.rejects(service.adminCreatePartner({...body,display_badges:['unapproved']}),/позначки/);
await assert.rejects(service.adminUpdatePartner('place-1',{...body,display_badges:'Реклама'}),/позначки/);
await service.adminUpdatePartner('place-1',{...body,display_badges:[]});const emptyAttributes=JSON.parse(tx[2].find(([sql])=>sql.includes('UPDATE places SET'))[1][13]);assert.equal(emptyAttributes.display_badges.length,0,'badges can be unselected entirely');
// A partner may edit ordinary fields, but cannot award itself a recommendation/advertisement label.
service.place=async()=>current;service.categoryForPlaceType=async()=> 'food';
const priorQuery=db.query;
db.query=async(sql,args=[])=>sql.includes('SELECT p.id FROM places p JOIN organizations')?{rows:[{id:'place-1'}]}:priorQuery(sql,args);
await service.updatePartnerPlace({id:'user-1',telegram_id:'12345678'},'place-1',{city:'Кривий Ріг',region_name:'Дніпропетровська область',attributes:{display_badges:['recommended'],parking:true}});
const partnerSelfUpdate=queries.filter(([sql])=>sql.includes('UPDATE places SET region_id=$2')).at(-1);
const selfAttributes=JSON.parse(partnerSelfUpdate[1][15]);
assert.deepEqual([...selfAttributes.display_badges],['partner'],'partner cannot set administrator recommendation');
assert.equal(selfAttributes.parking,true,'ordinary partner attributes still editable');
const {PlatformService}=load('backend/src/modules/stage2/platform.service.ts');const platform=new PlatformService(db);const rows=await platform.reviews('place-1');assert.equal(rows.length,1);assert.equal(rows[0].author,'Олена');assert.equal(rows[0].text,'Було чудово');assert.equal(rows[0].partner_reply,'Дякуємо!');
const reviewQuery=queries.find(([sql])=>sql.includes('FROM review_entries v JOIN users'));assert.ok(reviewQuery[0].includes("v.status='approved'"));assert.ok(reviewQuery[0].includes("p.status='approved'"));assert.equal(reviewQuery[1][0],'place-1');
const tourist=fs.readFileSync(path.join(root,'app/components/screens/tourist-screens.tsx'),'utf8');
const admin=fs.readFileSync(path.join(root,'app/components/screens/admin-desktop-screens.tsx'),'utf8');
assert.ok(admin.includes('Позначки закладу') && admin.includes('display_badges: displayBadges'));
for(const badge of ['Партнер','Реклама','Ми рекомендуємо'])assert.ok(admin.includes(badge));
assert.ok(tourist.includes('`/reviews/place/${encodeURIComponent(current.id)}`'));
assert.ok(tourist.includes('nativeReviews.map(review =>'));
assert.ok(!tourist.includes('`відгуків`, "reviews", "opinii")} · Google'));assert.ok(!tourist.includes('Відгуки Google", "Google reviews"'));
assert.ok(tourist.includes('gt-review-partner-reply'));
for(const f of ['app/components/screens/admin-desktop-screens.tsx','app/components/screens/tourist-screens.tsx','backend/src/modules/stage2/stage2.service.ts']){
 const code=fs.readFileSync(path.join(root,f),'utf8'); const parsed=ts.createSourceFile(f,code,ts.ScriptTarget.Latest,true,f.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);assert.equal(parsed.parseDiagnostics.length,0,'syntax '+f);
}
console.log('PASS: server badges create/update/reject/clear; review rows are approved, from same place; client loads real reviews; badges wired; TS syntax');
})().catch(error=>{console.error(error);process.exitCode=1});
