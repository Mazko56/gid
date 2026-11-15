const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/backend/src/modules/stage2/planner.service.ts','utf8');
const compiled=ts.transpileModule(src,{fileName:'planner.service.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
const modExports={};
const fakeCommon={Injectable:()=>x=>x,BadRequestException:class extends Error{},NotFoundException:class extends Error{}};
const r=(name)=>name==='@nestjs/common'?fakeCommon:name.includes('database.service')?{DatabaseService:class {}}:{};
vm.runInNewContext('(function(require,exports){'+compiled+'})',{require:r,exports:modExports,console,Date,Math,Set,Number,String,JSON,Promise,Intl,Error,RegExp})(r,modExports);
const base={id:'p1',region_id:'r1',category_slug:'nature',subcategory:'Водоспад',name:'Гірський водоспад',description:'Природа та озера',address:'вул. Зелена',lat:48.35,lng:24.58,image_url:null,rating:4.6,price_level:1,tags:['природа'],attributes:{kids:true},translations:null};
const places=[base,{...base,id:'p2',name:'Озеро Синє',lat:48.36,lng:24.58,rating:5},{...base,id:'p3',name:'Скелі',lat:48.4,lng:24.65,region_id:'r2',attributes:{stairs:true}},
{...base,id:'p4',name:'Ресторан затишний',category_slug:'food',subcategory:'Кухня',description:'українська кухня',tags:['кухня'],lat:48.346,lng:24.582},
{...base,id:'p5',name:'Далекі гори',lat:50,lng:25}];
const db={query:async(sql,args)=>{
 if(sql.includes('FROM qr_points'))return {rows:[{region_id:'r1',region_name:'Татарів',region_name_en:'Tatariv',region_name_pl:'Tatarów',region_lat:48.345,region_lng:24.579,place_id:'p0',place_name:'QR закладу',place_address:'Татарів',place_lat:48.345,place_lng:24.579}]};
 if(sql.includes('FROM regions'))return {rows:[{id:'r1',name:'Татарів',center_lat:48.345,center_lng:24.579},{id:'r2',name:'Ворохта',center_lat:48.39,center_lng:24.63}]};
 if(sql.includes('FROM (SELECT p.*'))return {rows:places};
 throw new Error('Unexpected query '+sql);
}};
const svc=new modExports.PlannerService(db);
(async()=>{
 const user={id:'test'};
 const common={start_param:'qr-real',days:2,start_date:'2026-11-15',start_time:'10:45',radius_km:30,max_travel_minutes:60,transport:'driving',activities:['nature'],adults:2,children:0};
 const result=await svc.generate(user,common);
 assert.equal(result.origin.place_name,'QR закладу');assert.equal(result.origin.source,'place_qr');
 assert.equal(result.variants[0].days.length,2);
 assert.ok(result.variants[0].days.flatMap(x=>x.stops).every(x=>['p1','p2','p3'].includes(x.place_id)));
 assert.ok(result.variants[0].days.flatMap(x=>x.stops).every(x=>x.time>='10:45'));
 const restricted=await svc.generate(user,{...common,destination_region_ids:['r2']});
 assert.ok(restricted.variants.every(v=>v.days.flatMap(d=>d.stops).every(s=>s.place_id==='p3')));
 const noMatches=await svc.generate(user,{...common,activities:['adventure'],radius_km:5});
 assert.equal(noMatches.variants.length,0);
 const tooFar=await svc.generate(user,{...common,radius_km:5});
 assert.ok(tooFar.variants[0].days.flatMap(d=>d.stops).every(s=>s.place_id!=='p5'));
 const blocked=await svc.generate(user,{...common,avoid:['stairs'],load:'light'});
 assert.ok(blocked.variants.every(v=>v.days.flatMap(d=>d.stops).every(s=>s.place_id!=='p3')));
 await assert.rejects(svc.generate(user,{days:2}),/Спочатку виберіть/);
 console.log('PASS 7 planner checks: QR, real places, dates/time, region filtering, empty result, radius, restrictions, no QR');
})().catch(e=>{console.error(e);process.exitCode=1});
