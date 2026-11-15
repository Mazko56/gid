const fs=require('fs'),vm=require('vm'),path=require('path');
let ts; try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); }
const root=__dirname;
function expect(x,s){if(!x) throw new Error(s);console.log('PASS:',s)}
const file=fs.readFileSync(path.join(root,'app/lib/stage2-api.ts'),'utf8');
const sf=ts.createSourceFile('api.ts',file,ts.ScriptTarget.ES2022,true);
function get(name){const n=sf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);if(!n)throw Error('Missing '+name);return n.getText(sf).replace(/^export /,'');}
const source=`const SELECTED_PLACE_KEY='gid-tourist-selected-place';const SELECTED_PLACE_PREVIEW_KEY='gid-tourist-selected-place-preview';\n${['setSelectedPlaceIdStorage','setSelectedPlacePreviewStorage'].map(get).join('\n')}`;
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const memory=new Map();let budget=1200;
const storage={setItem(k,v){if(v.length>budget)throw new Error('QuotaExceededError');memory.set(k,v)},getItem:k=>memory.get(k)||null,removeItem:k=>memory.delete(k)};
const context={window:{sessionStorage:storage},console};vm.createContext(context);vm.runInContext(js+'\nthis.saveId=setSelectedPlaceIdStorage;this.savePreview=setSelectedPlacePreviewStorage',context);
const place={id:'puri',region_id:'kr',category_slug:'food',name:'Puri Chveni',description:'Example',address:'Кривий Ріг',lat:47.9,lng:33.4,rating:4.5,review_count:1,image_url:'data:image/jpeg;base64,'+'x'.repeat(40000),details:{services:[{id:'kal',name:'Kalyan',image:'data:image/jpeg;base64,'+'y'.repeat(80000)}],logo_url:'data:image/png;base64,'+'x'.repeat(8000)}};
context.saveId(place.id);context.savePreview(place);
expect(memory.get('gid-tourist-selected-place')==='puri','QR venue ID stored correctly');
const stored=JSON.parse(memory.get('gid-tourist-selected-place-preview'));
expect(stored.id==='puri'&&stored.category_slug==='food','compact preview retains real venue and category');
expect(JSON.stringify(stored).length<1000,'base64 service photos are not persisted to WebView storage');
expect(!JSON.stringify(stored).includes('base64'),'preview contains no embedded images');
// Simulate a WebView where all writes fail: selection should still continue.
budget=0;context.saveId(place.id);context.savePreview(place);
expect(true,'full sessionStorage cannot interrupt navigation');
const partner=fs.readFileSync(path.join(root,'app/components/screens/partner-mobile-screens.tsx'),'utf8');
const routing=fs.readFileSync(path.join(root,'app/components/product-application.tsx'),'utf8');
const runtime=fs.readFileSync(path.join(root,'app/lib/tourist-runtime.tsx'),'utf8');
expect(partner.includes('rememberPriceTypePosition("add")')&&partner.includes('rememberPriceTypePosition("edit")'),'both add and edit save the scroll location');
expect(partner.includes('useRestorePriceTypePosition("add", draftReady)')&&partner.includes('useRestorePriceTypePosition("edit", serviceReady)'),'both editors restore their previous scroll position');
expect(partner.includes('if (draftReady) saveServiceDraft(draft)'),'initial empty draft no longer overwrites selected price');
expect(routing.includes('scroll: !priceNavigation'),'price type route does not force an unexpected top scroll');
expect(runtime.includes('setSelectedPlaceState(qrPlace)') && runtime.includes('setSelectedPlacePreviewStorage(qrPlace)'),'fresh QR resets stale selected place');
console.log('All service price and QR navigation checks passed');
