// Isolated tests for the two supported tourist entry-point modes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const code = fs.readFileSync(__dirname + '/backend/src/modules/stage2/planner.service.ts', 'utf8');
const js = ts.transpileModule(code, { compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true} }).outputText;
const exportsObj = {};
class BadRequestException extends Error {}
class NotFoundException extends Error {}
const customRequire = (name) => name==='@nestjs/common'
  ? {Injectable:()=>target=>target,BadRequestException,NotFoundException}
  : name.includes('database.service') ? {DatabaseService:class {}} : {};
vm.runInNewContext('(function(require,exports){'+js+'})',{console,Math,Number,Set,Date,Promise,JSON,RegExp,String,Error,Intl})(customRequire,exportsObj);
const regions=[
  {id:'region-a',name:'Кривий Ріг',name_en:'Kryvyi Rih',name_pl:'Krzywy Róg',center_lat:47.90,center_lng:33.40},
  {id:'region-b',name:'Дніпро',name_en:'Dnipro',name_pl:'Dnipro',center_lat:48.45,center_lng:35.04}
];
const db={query:async(sql,args)=>{
  if(sql.includes('FROM qr_points'))return {rows:[{region_id:'region-a',region_name:'Кривий Ріг',region_name_en:'Kryvyi Rih',region_name_pl:'Krzywy Róg',region_lat:47.90,region_lng:33.40,place_id:'hotel-1',place_name:'Готель QR',place_address:'Інша частина міста',place_lat:47.91,place_lng:33.42}]};
  if(sql.includes('FROM regions')&&sql.includes('WHERE id=$1'))return {rows:regions.filter(x=>x.id===args[0])};
  if(sql.includes('FROM regions'))return {rows:regions};
  throw new Error('Unexpected query '+sql);
}};
(async()=>{
  const planner=new exportsObj.PlannerService(db);
  const qr=await planner.origin({start_param:'hotel-qr',gps_lat:48.45,gps_lng:35.04});
  assert.equal(qr.source,'place_qr');
  assert.equal(qr.lat,47.91);assert.equal(qr.lng,33.42);assert.equal(qr.place_name,'Готель QR');
  const gps=await planner.origin({gps_lat:47.92,gps_lng:33.41});
  assert.equal(gps.source,'gps');assert.equal(gps.lat,47.92);assert.equal(gps.lng,33.41);assert.equal(gps.region_id,'region-a');
  const selected=await planner.origin({region_id:'region-b'});
  assert.equal(selected.source,'selected_region');assert.equal(selected.lat,48.45);
  await assert.rejects(planner.origin({}),/Спочатку виберіть/);
  console.log('PASS: QR overrides GPS; direct launch uses real GPS; manual fallback works; no fake default region');
})().catch(error=>{console.error(error);process.exitCode=1});
