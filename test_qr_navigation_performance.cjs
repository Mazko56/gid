const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root=__dirname;
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const navJs=ts.transpileModule(read('app/lib/navigation.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const navModule={exports:{}};
vm.runInNewContext('(function(exports,module){'+navJs+'})',{})(navModule.exports,navModule);
assert.equal(navModule.exports.getScreen('tourist','saved-plans').slug,'saved-plans');
assert.notEqual(navModule.exports.getScreen('tourist','saved-plans').slug,navModule.exports.defaultScreenForRole('tourist'));
assert.match(read('app/components/screens/tourist-screens.tsx'), /case "saved-plans":\s*return <SavedPlansScreen navigate=\{navigate\}/);
assert.match(read('app/components/screens/tourist-screens.tsx'), /initialView="list"/);
const roleLayout=read('app/[role]/layout.tsx');
assert.match(roleLayout,/role === "tourist"\s*\? <TouristRuntimeProvider>\{children\}<\/TouristRuntimeProvider>/);
assert.match(read('app/page.tsx'), /<TouristRuntimeProvider><ProductApplication role="tourist"/);
assert.doesNotMatch(read('app/components/product-application.tsx'),/<TouristRuntimeProvider>/);
assert.match(read('app/lib/stage2-api.ts'),/let launchStartParam = ""/);
assert.match(read('app/lib/stage2-api.ts'),/return current \|\| launchStartParam/);
// Verify that the QR is retained when Next navigation drops query parameters.
const apiModule={exports:{}};
const apiWindow={location:{search:'?tgWebAppStartParam=qr-hotel',hash:''},localStorage:{getItem:()=>''},sessionStorage:{getItem:()=>''}};
const apiJS=ts.transpileModule(read('app/lib/stage2-api.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext('(function(exports,module){'+apiJS+'})',{window:apiWindow,URLSearchParams,Headers,Date,Number,Math,JSON,String,Array,Object})(apiModule.exports,apiModule);
assert.equal(apiModule.exports.telegramStartParam(),'qr-hotel');
apiWindow.location.search='';
assert.equal(apiModule.exports.telegramStartParam(),'qr-hotel');
apiWindow.location.search='?startapp=qr-new';
assert.equal(apiModule.exports.telegramStartParam(),'qr-new');
assert.match(read('app/lib/tourist-runtime.tsx'),/DISPLAY_CONTEXT_TTL_MS = 45_000/);
assert.match(read('app/lib/tourist-runtime.tsx'),/resolvedContext \? Promise.resolve\(resolvedContext\) : stage2Fetch/);
assert.match(read('app/components/screens/tourist-screens.tsx'),/if \(hasFreshCache\) return/);
assert.match(read('app/components/screens/tourist-screens.tsx'),/if \(inFlight \|\| Date.now\(\) - lastFetchedAt < refreshIntervalMs\) return/);

// Exercise the actual compiled Stage2Service.context() with two mocked indexed SQL queries.
// It must retrieve the target QR and ONE place and never query/filter the full place catalogue.
const serverJs=ts.transpileModule(read('backend/src/modules/stage2/stage2.service.ts'),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}
}).outputText;
class HTTPError extends Error {}
const stubRequire=(name)=>{
 if(name==='@nestjs/common') return {Injectable:()=>x=>x,BadGatewayException:HTTPError,BadRequestException:HTTPError,NotFoundException:HTTPError,UnauthorizedException:HTTPError};
 if(name==='node:crypto')return require('node:crypto');
 if(name.includes('id.js'))return {makeId:()=> 'stub'};
 if(name.includes('nearby-filter-options'))return {NEARBY_FILTERS_BY_CATEGORY:{}};
 return {};
};
const mod={exports:{}};
vm.runInNewContext('(function(exports,module,require){'+serverJs+'})', {console,Math,Number,Set,Map,Date,Promise,JSON,RegExp,String,Error,Intl,Buffer,URL,URLSearchParams,Array,Object,Boolean,encodeURIComponent,decodeURIComponent,AbortController,fetch,setTimeout,clearTimeout})(mod.exports,mod,stubRequire);
const sqlCalls=[];
const venue={id:'hotel-real-id',lat:47.912,lng:33.401,category_slug:'hotel',category_name:'Готелі',name:'Справжній готель',address:'Кривий Ріг',status:'approved',work_hours:null,rating:4.5,review_count:5,tags:[],details:{}};
const db={query:async(sql,args)=>{
 sqlCalls.push({sql,args});
 if(sql.includes('FROM qr_points q'))return {rows:[{id:'qr1',start_param:'hotel-qr',type:'entry_point',source:'hotel',region_id:'kryvyi',place_id:'hotel-real-id',region_name:'Кривий Ріг',region_name_en:'Kryvyi Rih',region_name_pl:'Krzywy Róg',center_lat:47.91,center_lng:33.40,community_url:null}]};
 if(sql.includes('FROM places p JOIN categories c'))return {rows:args[0]===venue.id?[venue]:[]};
 throw new Error('Unexpected full-catalog or external query: '+sql);
}};
const none={enabled:()=>false};
(async()=>{
 const service=new mod.exports.Stage2Service(db,none,none,none,none);
 const result=await service.context('hotel-qr');
 assert.equal(result.place.id,'hotel-real-id');
 assert.equal(result.place.name,'Справжній готель');
 assert.equal(result.region.name,'Кривий Ріг');
 assert.equal(sqlCalls.length,2,'QR must issue only two focused SQL reads');
 assert.match(sqlCalls[1].sql,/WHERE p\.id=\$1/);
 assert.match(sqlCalls[1].sql,/\(\$2::boolean=false OR p\.status='approved'\)/);
 assert.equal(JSON.stringify(sqlCalls[1].args), JSON.stringify(['hotel-real-id',false]));
 await service.place('hotel-real-id');
 assert.equal(JSON.stringify(sqlCalls[2].args), JSON.stringify(['hotel-real-id',true]));
 assert.equal(sqlCalls.length,3);
 console.log('PASS: saved-plans route & profile link, persistent tourist layout, QR URL retention/cache, throttled categories/weather, QR indexed venue SQL (3 queries for context + detail)');
})().catch(err=>{console.error(err);process.exitCode=1});
