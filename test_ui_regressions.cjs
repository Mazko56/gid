const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const planner = read('app/components/screens/real-plan-screen.tsx');
const admin = read('app/components/screens/admin-desktop-screens.tsx');
const tourist = read('app/components/screens/tourist-screens.tsx');
const front = read('app/lib/nearby-filter-options.ts');
const back = read('backend/src/modules/stage2/nearby-filter-options.ts');

// Run the exact unmodified date helpers from the application with controlled device clocks.
const helperSource = planner.match(/const today=\(\)=>\{[^\n]+\};\nconst earliestStart = \(\) => \{[^\n]+\};/);
assert.ok(helperSource, 'Date helpers not found');
function clockAt(iso) {
  const now = new Date(iso);
  class FakeDate extends Date {constructor(...args){super(...(args.length ? args : [now.getTime()]));} static now(){return now.getTime();}}
  const sandbox={Date:FakeDate}; vm.runInNewContext(`${helperSource[0]}\nthis.current = {today,earliestStart}`, sandbox);
  return sandbox.current;
}
const at1151=clockAt('2026-11-15T11:51:00');
assert.equal(at1151.earliestStart().time, '11:55');
assert.equal(at1151.earliestStart().date, '2026-11-15');
const at2358=clockAt('2026-11-15T23:58:00');
assert.equal(at2358.earliestStart().time, '00:00');
assert.equal(at2358.earliestStart().date,'2026-11-16');
assert.match(planner,/const onTravelerSelect=.*?solo:\[1,0\].*?couple:\[2,0\].*?family:\[2,1\]/);
assert.match(planner,/adults:2,children:1,radius_km/);
assert.ok(planner.includes("setStep(survey==='express'?3:4)"), 'Activity error must route to interests step');
assert.match(planner,/if\(\(mode==='express'&&step===3\|\|mode==='extended'&&step===4\)&&!form\.activities\.length\)/);
assert.ok(planner.includes('initialView="list"')===false, 'Plan component is mode-aware, but wrapper is in tourist screen');
assert.match(tourist,/initialView="list"/);
assert.ok(tourist.includes('case "saved-plans":'));
assert.match(tourist,/navigate\('tourist','saved-plans'\)/);
assert.ok(!planner.includes('gt-plan-saved-existing'), 'Saved plan list must not be rendered on planner home');
for (const field of ['city','street','house']) {
  assert.ok(admin.includes(`geoActiveField !== "${field}"`), `${field} Geo request must require explicit field activation`);
  assert.ok(admin.includes(`geoActiveField === "${field}" && ${field}Suggestions.length`), `${field} suggestions require active field`);
}
const names = ['Де поїсти','Де купити','Природа','Цікаве','Розваги','Трансфер','Корисне','Маршрути'];
const keys = ['food','shop','nature','interesting','entertainment','transfer','useful','routes'];
const originalGroups = tourist.split('const subcategoryGroups:')[1].split('\n  const activeSubcategories')[0];
let checked = 0;
for (let i=0;i<keys.length;i++) {
 const original = originalGroups.split('"'+names[i]+'": [')[1]?.split('],')[0];
 assert.ok(original, `Missing original filters for ${names[i]}`);
 const labels=[...original.matchAll(/label: "([^"]+)"/g)].map(m=>m[1]);
 const extract=x=>[...(x.split(keys[i]+': [')[1]?.split('],')[0]||'').matchAll(/'([^']+)'/g)].map(m=>m[1]);
 assert.deepEqual(extract(front),labels,`Frontend admin filters changed labels for ${names[i]}`);
 assert.deepEqual(extract(back),labels,`Backend filters changed labels for ${names[i]}`);
 checked+=labels.length;
}
assert.equal(checked,64);
console.log(`PASS: date/time now+midnight, travelers, activity-step validation, saved plans profile, Geoapify focus gating, ${checked} untouched filter labels`);
