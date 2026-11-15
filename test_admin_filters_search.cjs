const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const path=require('node:path');
const base=__dirname;
const nearby={
  food:['Ресторани','Кафе','Бари','Піцерії','Кондитерські','Фастфуд','Їжа з собою','Традиційна кухня'],
  shop:['Продукти','Сувеніри','Одяг і взуття','Товари для дому','Аптеки','Техніка','Будівництво','Косметика'],
};
function load(file){
 const src=fs.readFileSync(path.join(base,file),'utf8');
 const js=ts.transpileModule(src,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true,emitDecoratorMetadata:false}}).outputText;
 const m={exports:{}};
 const err=(name)=>class extends Error {constructor(text){super(text);this.name=name}};
 const imports={
  '@nestjs/common':{Injectable:()=>x=>x,BadRequestException:err('BadRequestException'),NotFoundException:err('NotFoundException'),BadGatewayException:err('BadGatewayException'),UnauthorizedException:err('UnauthorizedException')},
  './nearby-filter-options.js':{NEARBY_FILTERS_BY_CATEGORY:nearby},
  '../../common/id.js':{makeId:(prefix='')=>`${prefix}test${Math.random().toString(36).slice(2,14)}`}
 };
 const req=(name)=>imports[name]||((name.startsWith('node:'))?require(name):{});
 vm.runInNewContext(js,{module:m,exports:m.exports,require:req,console,process,Buffer,setTimeout,clearTimeout,URL,fetch,Intl}, {filename:file});
 return m.exports;
}
(async()=>{
 const {Stage2Service}=load('backend/src/modules/stage2/stage2.service.ts');
 const restaurant={id:'p1',region_id:'district-a',category_slug:'food',category_name:'Де поїсти',name:'Тестовий заклад',description:'',address:'Кривий Ріг, вул. Соборності, 21',lat:47.9,lng:33.4,subcategory:'Неукраїнська кухня',tags:['Неукраїнська кухня','Фаст фуд','Піцерії','Кафе'],details:{admin_category_subcategories:['Неукраїнська кухня','Фаст фуд'],admin_nearby_filters:['Піцерії','Кафе']},rating:5,review_count:10,price_level:2,work_hours:{always_open:true},attributes:{kids:true,parking:false,partner:true},status:'approved'};
 let lastArgs=[];
 const db={query:async(sql,args=[])=>{
  lastArgs=args;
  if(sql.includes('FROM places p JOIN categories')) return {rows:[restaurant]};
  if(sql.includes('SELECT slug,subcategories FROM categories'))return {rows:[{slug:'food',subcategories:['Неукраїнська кухня','Фаст фуд']}]};
  return {rows:[]};
 },transaction:async(fn)=>{const statements=[];await fn({query:async(sql,args)=>{statements.push([sql,args]);return {rows:[]}}});return statements}};
 const service=new Stage2Service(db,{enabled:()=>false},{enabled:()=>false},{},{});
 const baseq={region_id:'different-district',lat:'47.9',lng:'33.4',radius:'20000',category:'food'};
 let res=await service.places({...baseq,q:'соборності'});
 assert.equal(res.length,1,'search by address returns restaurant despite QR from another district');
 assert.equal(lastArgs[0],null,'geographical radius search must not be limited by QR administrative region');
 res=await service.places({...baseq,q:'Піцерії'});assert.equal(res.length,1,'search by explicit nearby filter label');
 res=await service.places({...baseq,q:'кафе'});assert.equal(res.length,1,'search by second nearby filter');
 res=await service.places({...baseq,subcategory:'Піцерії'});assert.equal(res.length,1,'nearby filter #1 works');
 res=await service.places({...baseq,subcategory:'Кафе'});assert.equal(res.length,1,'nearby filter #2 works');
 res=await service.places({...baseq,subcategory:'Фаст фуд'});assert.equal(res.length,1,'main category additional subcategory works');
 res=await service.places({...baseq,subcategory:'Бари'});assert.equal(res.length,0,'unassigned nearby filter excluded');
 res=await service.places({...baseq,kids:'true'});assert.equal(res.length,1,'kids filter');
 res=await service.places({...baseq,parking:'true'});assert.equal(res.length,0,'parking filter');
 res=await service.places({...baseq,price_level:'3'});assert.equal(res.length,0,'price filter');
 res=await service.places({...baseq,lat:'50.4',lng:'30.5',radius:'500'});assert.equal(res.length,0,'radius enforced');
 // Check create and update preserve the existing table, add managed tags only, no DDL needed.
 const transactions=[];
 db.transaction=async fn=>{const statements=[];await fn({query:async(sql,args=[])=>{statements.push([sql,args]);return{rows:[]}}});transactions.push(statements);return undefined};
 service.verifiedAddressFromBody=async()=>({lat:47.9,lng:33.4,city:'Кривий Ріг',region:'Дніпропетровська область',formatted_address:'Кривий Ріг, Соборності 21'});
 service.ensureRegionForPlace=async()=> 'district-a';
 const makeBody={name:'Тестова піцерія',category_slug:'food',telegram_ids:['12345678'],city:'Кривий Ріг',map_selected:false,category_subcategories:['Неукраїнська кухня','Фаст фуд'],nearby_filters:['Піцерії','Кафе']};
 const created=await service.adminCreatePartner(makeBody);
 assert.ok(created.place_id);assert.equal(transactions.length,1);
 const createdTags=transactions[0].filter(s=>s[0].includes('INSERT INTO place_tags')).map(s=>s[1][1]);
 assert.deepEqual(createdTags.sort(),['Неукраїнська кухня','Фаст фуд','Піцерії','Кафе'].sort(),'both sets saved to place_tags');
 assert.ok(transactions[0].some(s=>s[0].includes('INSERT INTO places')&&s[1][4]==='Неукраїнська кухня'));
 service.adminPartner=async()=>({...restaurant,organization_id:'org1',details:{...restaurant.details,city:'Кривий Ріг'},telegram_ids:['12345678']});
 await service.adminUpdatePartner('p1',{...makeBody,nearby_filters:['Кафе'],category_subcategories:['Фаст фуд'],map_selected:true,address:restaurant.address,lat:restaurant.lat,lng:restaurant.lng});
 const updated=transactions[1];
 assert.ok(updated.some(s=>s[0].includes('DELETE FROM place_tags')&&s[1][1].includes('Піцерії')),'old admin-managed tags replaced');
 assert.deepEqual(updated.filter(s=>s[0].includes('INSERT INTO place_tags')).map(s=>s[1][1]).sort(),['Кафе','Фаст фуд'].sort());
 await assert.rejects(service.adminCreatePartner({...makeBody,nearby_filters:['Чужий фільтр']}), /Фільтр/);
 console.log('PASS: 16 assertions – real search, category/nearby multi-filtering, cross-region radius, preservation, create/update, validation');
})().catch(e=>{console.error(e);process.exitCode=1});
