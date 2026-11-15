"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Compass, ExternalLink, MapPin, RotateCcw, Save, Share2, Sparkles, Users, X } from "lucide-react";
import type { RoleKey } from "../../lib/navigation";
import { stage2Fetch, telegramStartParam } from "../../lib/stage2-api";
import { useTouristRuntime } from "../../lib/tourist-runtime";
import { tr } from "../../lib/tourist-i18n";
import { localizedField } from "../../lib/content-i18n";

type L = 'uk'|'en'|'pl';
type Navigate = (role:RoleKey,slug:string)=>void;
type Region = {id:string;name:string;name_en:string|null;name_pl:string|null;center_lat:number;center_lng:number;distance_km:number|null};
type Stop = {place_id:string;place_name:string;category_slug:string;address:string;translations?:Record<string,unknown>|null;lat:number;lng:number;image_url:string|null;time:string;
  duration_minutes:number;distance_from_previous_km:number;estimated_travel_minutes:number;price_level:number|null;hours_known?:boolean};
type TripDay = {date:string;number:number;stops:Stop[]};
type Variant = {key:string;index:number;days:TripDay[];stop_count:number};
type PlannerResult = {origin:{region_id:string;region_name:string;region_name_en?:string|null;region_name_pl?:string|null;place_name:string|null;
  address:string|null;lat:number;lng:number;source:string};criteria:Record<string,unknown>;
  candidates_count:number;nearby_cities:Region[];variants:Variant[];notice:string};
type Saved = {id:string;title:string;criteria:Record<string,unknown>;days:TripDay[];region_id:string;updated_at:string};
type FormData = {days:number;start_date:string;start_time:string;adults:number;children:number;radius_km:number;
  activities:string[];avoid:string[];custom_requirements:string;transport:string;max_travel_minutes:number;
  pace:string;load:string;budget:string;diet:string;destination_region_ids:string[]};
const today=()=>{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);};
const defaults=():FormData=>({days:1,start_date:today(),start_time:'09:00',adults:2,children:0,radius_km:20,activities:[],avoid:[],
  custom_requirements:'',transport:'driving',max_travel_minutes:60,pace:'balanced',load:'moderate',budget:'any',diet:'any',destination_region_ids:[]});
const I=(lang:L,uk:string,en:string,pl:string)=>tr(lang,uk,en,pl);
const groups={
 activities:[['nature','Природа','Nature','Natura'],['active','Активний відпочинок','Outdoor activities','Aktywny wypoczynek'],
  ['relax','SPA і релакс','SPA & relaxation','SPA i relaks'],['family','Для сім’ї','Family-friendly','Dla rodziny'],
  ['food','Кухня та кафе','Food & cafés','Kuchnia i kawiarnie'],['culture','Історія та культура','History & culture','Historia i kultura'],
  ['romance','Романтичний','Romantic','Romantyczny'],['adventure','Пригоди','Adventure','Przygody'],['shopping','Покупки','Shopping','Zakupy']],
 avoid:[['heights','Висота','Heights','Wysokość'],['crowds','Натовпи','Crowds','Tłumy'],['long_trips','Довгі переїзди','Long transfers','Długie przejazdy'],
  ['steep_climbs','Круті підйоми','Steep climbs','Strome podejścia'],['rain','Активності під дощем','Rainy-day activities','Aktywności w deszczu'],['stairs','Сходи','Stairs','Schody']],
 transport:[['driving','Власне авто','Own car','Własne auto'],['taxi','Таксі','Taxi','Taksówka'],['walking','Пішки','Walking','Pieszo'],['cycling','Велосипед','Cycling','Rower']],
 pace:[['relaxed','Спокійний','Relaxed','Spokojny'],['balanced','Збалансований','Balanced','Zrównoważony'],['dynamic','Насичений','Active pace','Intensywny']],
 load:[['light','Легке','Light','Lekki'],['moderate','Помірне','Moderate','Umiarkowany'],['intense','Інтенсивне','Intense','Intensywny']],
 budget:[['any','Будь-який','Any','Dowolny'],['economy','Економний','Budget','Ekonomiczny'],['medium','Середній','Mid-range','Średni'],['comfort','Комфорт','Comfort','Komfort']],
 diet:[['any','Без обмежень','No restrictions','Bez ograniczeń'],['vegetarian','Вегетаріанське','Vegetarian','Wegetariańskie'],['local','Місцева кухня','Local cuisine','Kuchnia lokalna']],
} as const;
function SelectButtons({items,lang,value,onChange,multiple=false}:{items:readonly (readonly string[])[];lang:L;value:string|string[];
  onChange:(value:string)=>void;multiple?:boolean}){
 const selected=Array.isArray(value)?value:[value];
 return <div className="gt-planner-choices" role="group">{items.map(([key,uk,en,pl])=><button key={key} type="button" aria-pressed={selected.includes(key)}
   className={selected.includes(key)?'active':''} onClick={()=>onChange(key)}><span>{I(lang,uk,en,pl)}</span>{selected.includes(key)?<Check size={16}/>:multiple?<span className="gt-planner-check"/>:null}</button>)}</div>;
}
function Qty({value,onChange,label,min=0,max=30}:{value:number;onChange:(v:number)=>void;label:string;min?:number;max?:number}){
 return <label className="gt-planner-qty"><span>{label}</span><span><button type="button" disabled={value<=min} onClick={()=>onChange(value-1)}>−</button><b>{value}</b>
   <button type="button" disabled={value>=max} onClick={()=>onChange(value+1)}>+</button></span></label>;
}
function kmLabel(km:number){return new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(km);}
function regionName(r:Region,language:L){return language==='en'?r.name_en||r.name:language==='pl'?r.name_pl||r.name:r.name;}

export function RealPlanScreen({navigate}:{navigate:Navigate}){
 const runtime=useTouristRuntime();const lang=runtime.language;
 const [mode,setMode]=useState<'home'|'express'|'extended'|'result'|'saved'>('home');
 const [survey,setSurvey]=useState<'express'|'extended'>('express');
 const [step,setStep]=useState(1);
 const [form,setForm]=useState<FormData>(defaults);
 const [regions,setRegions]=useState<Region[]>([]);const [region,setRegion]=useState('');
 const [loadingRegions,setLoadingRegions]=useState(true);
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const [result,setResult]=useState<PlannerResult|null>(null);const [chosen,setChosen]=useState(0);
 const [savedPlans,setSavedPlans]=useState<Saved[]>([]);const [savedPlan,setSavedPlan]=useState<Saved|null>(null);
 const origin=runtime.context;
 const hasQr=Boolean(telegramStartParam()&&origin?.qr);
 const baseLat=Number(origin?.place?.lat??origin?.region.lat);
 const baseLng=Number(origin?.place?.lng??origin?.region.lng);
 const originTitle=origin?.place?.name||I(lang,origin?.region.name||'QR не визначено',origin?.region.nameEn||'QR not detected',origin?.region.namePl||'Brak kodu QR');
 const originAddress=origin?.place?.address||origin?.region.name||'';
 const update=<K extends keyof FormData>(key:K,value:FormData[K])=>setForm(f=>({...f,[key]:value}));
 const toggle=(key:'activities'|'avoid'|'destination_region_ids',value:string)=>setForm(f=>({...f,[key]:f[key].includes(value)?f[key].filter(x=>x!==value):[...f[key],value]}));
 const total=mode==='extended'?6:3;
 const start=(kind:'express'|'extended')=>{setSurvey(kind);setMode(kind);setForm(defaults());setStep(1);setError('');setResult(null);setChosen(0);};
 useEffect(()=>{let alive=true;
   void stage2Fetch<Region[]>(`/planner/regions${Number.isFinite(baseLat)&&Number.isFinite(baseLng)?`?lat=${baseLat}&lng=${baseLng}`:''}`)
    .then(rows=>{if(alive){setRegions(rows);}})
    .catch(e=>{if(alive)setError(e instanceof Error?e.message:String(e));}).finally(()=>{if(alive)setLoadingRegions(false);});
   return()=>{alive=false;};
 },[baseLat,baseLng,hasQr]);
 useEffect(()=>{void stage2Fetch<Saved[]>('/me/plans').then(setSavedPlans).catch(()=>undefined);},[]);
 const selectedRegionCoords=regions.find(r=>r.id===region);
 const nearby=useMemo(()=>{
   if(hasQr)return regions.filter(r=>r.distance_km==null||r.distance_km<=form.radius_km);
   if(!selectedRegionCoords)return [];
   const radians=Math.PI/180;
   const distance=(a:Region,b:Region)=>{const dlat=(Number(b.center_lat)-Number(a.center_lat))*radians,dlng=(Number(b.center_lng)-Number(a.center_lng))*radians;
    const h=Math.sin(dlat/2)**2+Math.cos(Number(a.center_lat)*radians)*Math.cos(Number(b.center_lat)*radians)*Math.sin(dlng/2)**2;
    return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));};
   return regions.map(r=>({...r,distance_km:Math.round(distance(selectedRegionCoords,r)*10)/10}))
     .filter(r=>r.distance_km<=form.radius_km).sort((a,b)=>a.distance_km-b.distance_km);
 },[regions,form.radius_km,hasQr,selectedRegionCoords]);
 const activeVariant=result?.variants[chosen]||result?.variants[0];
 const generate=async()=>{
   if(!hasQr&&!region){setError(I(lang,'Оберіть базове місто','Select a starting town','Wybierz miasto początkowe'));return;}
   if(!form.activities.length){setError(I(lang,'Оберіть хоча б один вид відпочинку','Select at least one interest','Wybierz co najmniej jedno zainteresowanie'));return;}
   setLoading(true);setError('');
   try{
    const data=await stage2Fetch<PlannerResult>('/me/plans/generate',{method:'POST',body:JSON.stringify({...form,mode:survey,
      start_param:hasQr?telegramStartParam():'',region_id:hasQr?origin?.region.id:region})});
    setResult(data);setChosen(0);setMode('result');
   }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 };
 const save=async()=>{
  if(!result||!activeVariant)return;
  setLoading(true);setError('');
  try{
   const label=`${I(lang,'Мій маршрут','My route','Moja trasa')} · ${result.origin.place_name||result.origin.region_name} · ${String(form.start_date)}`;
   const saved=await stage2Fetch<Saved>('/me/plans',{method:'POST',body:JSON.stringify({title:label,region_id:result.origin.region_id,
     criteria:{...result.criteria,origin:result.origin},days:activeVariant.days})});
   setSavedPlan(saved);setSavedPlans(p=>[saved,...p.filter(x=>x.id!==saved.id)]);setMode('saved');
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 };
 const share=async()=>{
  if(!activeVariant)return;
  const text=activeVariant.days.map(day=>`${day.date}\n${day.stops.map(s=>`${s.time} — ${s.place_name}`).join('\n')}`).join('\n\n');
  try{if(navigator.share)await navigator.share({title:'Gid Tourist',text});else if(navigator.clipboard)await navigator.clipboard.writeText(text);}
  catch{/* sharing was cancelled */}
 };
 const dateLabel=(s:string)=>new Date(`${s}T12:00:00Z`).toLocaleDateString(lang==='uk'?'uk-UA':lang==='pl'?'pl-PL':'en-GB',{day:'numeric',month:'long',year:'numeric'});
 const header=(title:string,back:()=>void)=><header className="gt-planner-header"><button type="button" aria-label="Назад" onClick={back}><ArrowLeft size={21}/></button>
   <strong>{title}</strong><span className="gt-planner-brand"><Compass size={18}/></span></header>;
 const locationBlock=<section className="gt-planner-section"><h2><MapPin size={19}/>{I(lang,'Початок маршруту','Route starting point','Początek trasy')}</h2>
  {hasQr?<article className="gt-planner-qr-origin"><MapPin size={22}/><div><small>{I(lang,origin?.place?'Заклад із QR':'Центр міста з QR',origin?.place?'Place from QR':'City centre from QR',origin?.place?'Obiekt z QR':'Centrum miasta z QR')}</small>
   <strong>{originTitle}</strong><p>{originAddress}</p></div><Check size={19}/></article>
  :<label className="gt-planner-field"><span>{I(lang,'Місто початку','Starting town','Miasto początkowe')}</span>
    <select value={region} onChange={e=>setRegion(e.target.value)} disabled={loadingRegions}><option value="">{I(lang,'Оберіть місто','Select a town','Wybierz miasto')}</option>
    {regions.map(r=><option key={r.id} value={r.id}>{regionName(r,lang)}</option>)}</select></label>}
  <label className="gt-planner-field"><span>{I(lang,'Радіус пошуку, км','Search radius, km','Promień wyszukiwania, km')} — {form.radius_km}</span>
    <input type="range" min="5" max="100" step="5" value={form.radius_km} onChange={e=>update('radius_km',Number(e.target.value))}/></label>
  <div className="gt-planner-regions"><strong>{I(lang,'Населені пункти для пошуку (вибір необов’язковий)','Towns to include (optional selection)','Miejscowości do wyszukiwania (wybór opcjonalny)')}</strong>
  {nearby.length?nearby.slice(0,15).map(r=><button type="button" aria-pressed={form.destination_region_ids.includes(r.id)} className={form.destination_region_ids.includes(r.id)?'selected':''} key={r.id}
     onClick={()=>toggle('destination_region_ids',r.id)}><span>{regionName(r,lang)}</span><b>{r.distance_km!=null?`${kmLabel(r.distance_km)} ${I(lang,'км','km','km')}`:'—'}</b>
       {form.destination_region_ids.includes(r.id)?<Check size={16}/>:null}</button>):<p>{I(lang,'У вибраному радіусі немає інших зареєстрованих міст.','No other registered towns within this radius.','Brak innych zarejestrowanych miejscowości w tym promieniu.')}</p>}
  </div></section>;
 const activitiesBlock=<section className="gt-planner-section"><h2><Sparkles size={19}/>{I(lang,'Що хочете відвідати?','Your interests','Twoje zainteresowania')}</h2>
   <p>{I(lang,'Можна обрати декілька напрямів','Choose more than one','Możesz wybrać kilka')}</p>
   <SelectButtons items={groups.activities} lang={lang} value={form.activities} multiple onChange={v=>toggle('activities',v)}/>
   {mode==='extended'?<><h3>{I(lang,'Чого хочете уникати?','What would you avoid?','Czego chcesz unikać?')}</h3>
   <SelectButtons items={groups.avoid} lang={lang} value={form.avoid} multiple onChange={v=>toggle('avoid',v)}/></>:null}
   </section>;
 const durationBlock=<section className="gt-planner-section"><h2><CalendarDays size={19}/>{I(lang,'Коли і на скільки?','When and how long?','Kiedy i na jak długo?')}</h2>
   <div className="gt-planner-day-count">{[1,2,3,4,5].map(d=><button type="button" key={d} className={form.days===d?'active':''} onClick={()=>update('days',d)}>{d} {I(lang,'дн.','days','dni')}</button>)}</div>
   <div className="gt-planner-grid"><label className="gt-planner-field"><span>{I(lang,'Початкова дата','Start date','Data rozpoczęcia')}</span>
   <input type="date" min={today()} value={form.start_date} onChange={e=>update('start_date',e.target.value)}/></label>
   <label className="gt-planner-field"><span>{I(lang,'Зручний час початку','Preferred start time','Preferowana godzina')}</span>
   <input type="time" value={form.start_time} onChange={e=>update('start_time',e.target.value)}/></label></div>
   <h3><Users size={17}/>{I(lang,'Компанія','Travellers','Podróżnicy')}</h3>
   <div className="gt-planner-grid"><Qty value={form.adults} onChange={v=>update('adults',v)} min={1} label={I(lang,'Дорослих','Adults','Dorośli')}/>
     <Qty value={form.children} onChange={v=>update('children',v)} label={I(lang,'Дітей','Children','Dzieci')}/></div></section>;
 const mobilityBlock=<section className="gt-planner-section"><h2><Compass size={19}/>{I(lang,'Пересування та навантаження','Travel and activity','Transport i aktywność')}</h2>
  <h3>{I(lang,'Як будете пересуватись?','Transport','Transport')}</h3>
  <SelectButtons items={groups.transport} lang={lang} value={form.transport} onChange={v=>update('transport',v)}/>
  <label className="gt-planner-field"><span>{I(lang,'Максимальний час між зупинками','Maximum estimated travel per leg','Maksymalny szacowany czas przejazdu')} — {form.max_travel_minutes} {I(lang,'хв','min','min')}</span>
  <input type="range" min="10" max="300" step="5" value={form.max_travel_minutes} onChange={e=>update('max_travel_minutes',Number(e.target.value))}/></label>
  {mode==='extended'?<><h3>{I(lang,'Темп відпочинку','Pace','Tempo')}</h3>
  <SelectButtons items={groups.pace} lang={lang} value={form.pace} onChange={v=>update('pace',v)}/>
  <h3>{I(lang,'Фізичне навантаження','Physical intensity','Wysiłek fizyczny')}</h3>
  <SelectButtons items={groups.load} lang={lang} value={form.load} onChange={v=>update('load',v)}/></>:null}</section>;
 const extrasBlock=<section className="gt-planner-section"><h2>{I(lang,'Бюджет і харчування','Budget and food','Budżet i wyżywienie')}</h2>
  <h3>{I(lang,'Рівень бюджету','Budget level','Poziom budżetu')}</h3>
  <SelectButtons items={groups.budget} lang={lang} value={form.budget} onChange={v=>update('budget',v)}/>
  <h3>{I(lang,'Харчування','Food preferences','Preferencje żywieniowe')}</h3>
  <SelectButtons items={groups.diet} lang={lang} value={form.diet} onChange={v=>update('diet',v)}/>
  {mode==='extended'?<label className="gt-planner-field"><span>{I(lang,'Додаткові побажання (для нотаток до плану)','Additional requirements (plan notes)','Dodatkowe wymagania (notatki do planu)')}</span>
  <textarea rows={3} maxLength={500} value={form.custom_requirements} onChange={e=>update('custom_requirements',e.target.value)} placeholder={I(lang,'Наприклад: тихі місця, прогулянки без сходів','For example: quiet places, no stairs','Np. spokojne miejsca, bez schodów')}/></label>:null}</section>;
 const drawDay=(day:TripDay)=><section key={day.number} className="gt-planner-day"><h3>{I(lang,'День','Day','Dzień')} {day.number} <small>{dateLabel(day.date)}</small></h3>
  {Array.isArray(day.stops)&&day.stops.length?day.stops.map(s=><article key={s.place_id} className="gt-planner-stop">
    <div className="gt-planner-stop-image">{s.image_url?<img src={s.image_url} alt="" loading="lazy"/>:<MapPin size={22}/>}</div>
    <div className="gt-planner-stop-info"><small><Clock3 size={13}/>{s.time} · ~{s.estimated_travel_minutes} {I(lang,'хв у дорозі','min travel','min podróży')} · {kmLabel(s.distance_from_previous_km)} км</small>
    <strong>{localizedField(lang,{name:s.place_name,translations:s.translations},'name')}</strong><span>{s.address}</span>
    {!s.hours_known?<span>{I(lang,'Графік роботи потребує уточнення','Opening hours need confirmation','Godziny otwarcia wymagają potwierdzenia')}</span>:null}
    <button type="button" onClick={()=>{void stage2Fetch<import('../../lib/stage2-api').Stage2Place>(`/places/${encodeURIComponent(s.place_id)}`).then(p=>{runtime.setSelectedPlace(p);navigate('tourist','place');}).catch(e=>setError(e instanceof Error?e.message:String(e)));}}>{I(lang,'Переглянути заклад','View place','Zobacz miejsce')} <ArrowRight size={15}/></button>
    </div>
    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lng}`)}`} target="_blank" rel="noreferrer" aria-label={I(lang,'Маршрут на карті','Open directions','Otwórz trasę')}><ExternalLink size={18}/></a>
   </article>):<p>{I(lang,'Немає доступних місць, що відповідають умовам цього дня.','No matching places for this day.','Brak pasujących miejsc na ten dzień.')}</p>}
 </section>;
 return <div className="tourist-screen gt-screen gt-real-planner"><main className="gt-planner-layout">
  {mode==='home'?<>
    {header(I(lang,'Мій план','My trip plan','Mój plan'),()=>navigate('tourist','home'))}
    <section className="gt-planner-hero"><span><Compass size={29}/></span><h1>{I(lang,'Створіть власний маршрут','Build your own itinerary','Zaplanuj własną trasę')}</h1>
    <p>{I(lang,'Справжні локації з каталогу, ваша точка QR та побажання — без шаблонних маршрутів.','Real places from the catalog, your QR point and preferences — no sample itineraries.','Prawdziwe miejsca z katalogu, punkt QR i Twoje preferencje — bez przykładowych tras.')}</p></section>
    <button className="gt-planner-mode" type="button" onClick={()=>start('express')}><Clock3 size={26}/><span><strong>{I(lang,'Експрес-план','Quick plan','Plan ekspresowy')}</strong><small>{I(lang,'3 кроки · час, місце, інтереси','3 steps · time, location, interests','3 kroki · czas, miejsce, zainteresowania')}</small></span><ArrowRight/></button>
    <button className="gt-planner-mode" type="button" onClick={()=>start('extended')}><Sparkles size={26}/><span><strong>{I(lang,'Розширений план','Detailed plan','Plan szczegółowy')}</strong><small>{I(lang,'6 кроків · обмеження, навантаження, харчування','6 steps · restrictions, intensity, food','6 kroków · ograniczenia, wysiłek, jedzenie')}</small></span><ArrowRight/></button>
    {savedPlans.length?<section className="gt-planner-section"><h2>{I(lang,'Збережені маршрути','Saved itineraries','Zapisane trasy')}</h2>{savedPlans.slice(0,12).map(p=><button className="gt-planner-saved-link" key={p.id} type="button" onClick={()=>{setSavedPlan(p);setMode('saved');}}><Save size={17}/><span>{p.title}</span><ArrowRight size={16}/></button>)}</section>:null}
  </>:null}
  {mode==='express'||mode==='extended'?<>
    {header(I(lang,mode==='express'?'Експрес-план':'Розширений план',mode==='express'?'Quick plan':'Detailed plan',mode==='express'?'Plan ekspresowy':'Plan szczegółowy'),()=>step>1?setStep(step-1):setMode('home'))}
    <div className="gt-planner-progress"><span>{I(lang,'Крок','Step','Krok')} {step} / {total}</span><div><i style={{width:`${step/total*100}%`}}/></div></div>
    {mode==='express'?(step===1?durationBlock:step===2?<>{locationBlock}{activitiesBlock}</>:<>{mobilityBlock}{extrasBlock}</>):
     (step===1?durationBlock:step===2?locationBlock:step===3?activitiesBlock:step===4?<>{mobilityBlock}</>:step===5?extrasBlock:
      <section className="gt-planner-section"><h2>{I(lang,'Перевірте налаштування','Review your preferences','Sprawdź ustawienia')}</h2>
        <p>{form.days} {I(lang,'днів','days','dni')} · {form.start_date} · {form.start_time} · {form.radius_km} км</p>
        <p>{form.activities.map(a=>groups.activities.find(x=>x[0]===a)?.[lang==='uk'?1:lang==='en'?2:3]).filter(Boolean).join(', ')}</p>
        <button type="button" className="gt-planner-saved-link" onClick={()=>setStep(1)}><RotateCcw size={16}/>{I(lang,'Змінити параметри','Edit answers','Zmień odpowiedzi')}</button>
      </section>)}
    {error?<p role="alert" className="gt-planner-error">{error}</p>:null}
    <div className="gt-planner-footer"><button type="button" className="gt-planner-back" onClick={()=>step>1?setStep(step-1):setMode('home')}>{I(lang,'Назад','Back','Wstecz')}</button>
      <button type="button" className="gt-planner-primary" disabled={loading||!form.start_date} onClick={()=>{if(step<total){setError('');setStep(step+1);}else void generate();}}>
      {loading?I(lang,'Підбираємо місця…','Finding places…','Szukamy miejsc…'):step===total?I(lang,'Створити маршрут','Generate itinerary','Utwórz trasę'):I(lang,'Далі','Next','Dalej')}<ArrowRight size={18}/></button>
    </div>
  </>:null}
  {mode==='result'&&result?<>
    {header(I(lang,'Ваш маршрут','Your itinerary','Twoja trasa'),()=>{setMode(survey);setStep(survey==='express'?3:6);})}
    <section className="gt-planner-summary"><Sparkles size={28}/><h1>{I(lang,'План за вашими умовами','Itinerary matching your preferences','Plan dopasowany do Twoich preferencji')}</h1>
    <p>{result.origin.place_name||result.origin.region_name} · {form.days} {I(lang,'днів','days','dni')} · {result.candidates_count} {I(lang,'відповідних місць','matching places','pasujących miejsc')}</p></section>
    {result.variants.length?<>
      {result.variants.length>1?<div className="gt-planner-variant-tabs">{result.variants.map((v,i)=><button key={v.key} className={chosen===i?'active':''} type="button" onClick={()=>setChosen(i)}>
        {v.key==='nearby'?I(lang,'Поруч','Nearby','Blisko'):v.key==='activity'?I(lang,'За інтересами','Interest-focused','Zainteresowania'):I(lang,'Збалансований','Balanced','Zrównoważony')}</button>)}</div>:null}
      {activeVariant?.days.map(drawDay)}
      <p className="gt-planner-notice">{I(lang,'Відстані — географічні; час у дорозі орієнтовний. Перевіряйте актуальну доступність і ціни в закладі.',
        'Distances are straight-line estimates; travel time is approximate. Check availability and prices with the venue.',
        'Odległości są w linii prostej; czas przejazdu jest przybliżony. Sprawdź dostępność i ceny w obiekcie.')}</p>
      {error?<p role="alert" className="gt-planner-error">{error}</p>:null}
      <div className="gt-planner-footer"><button type="button" className="gt-planner-back" onClick={()=>void share()}><Share2 size={17}/>{I(lang,'Поділитися','Share','Udostępnij')}</button>
        <button type="button" disabled={loading} className="gt-planner-primary" onClick={()=>void save()}><Save size={17}/>{I(lang,'Зберегти план','Save itinerary','Zapisz plan')}</button></div>
    </>:<section className="gt-planner-section"><h2>{I(lang,'Немає придатних місць','No matching places','Brak pasujących miejsc')}</h2>
      <p>{I(lang,'Для вибраних обмежень у базі немає опублікованих закладів. Збільшіть радіус або змініть інтереси та бюджет.',
        'No approved places match these settings. Increase the radius or adjust interests and budget.',
        'Brak zatwierdzonych miejsc spełniających kryteria. Zwiększ promień lub zmień preferencje.')}</p>
      <button type="button" className="gt-planner-primary" onClick={()=>{setMode(survey);setStep(2);}}>{I(lang,'Змінити умови','Change preferences','Zmień ustawienia')}</button>
    </section>}
  </>:null}
  {mode==='saved'&&savedPlan?<>
    {header(I(lang,'Збережений план','Saved itinerary','Zapisany plan'),()=>setMode('home'))}
    <section className="gt-planner-summary"><Check size={28}/><h1>{savedPlan.title}</h1>
      <p>{I(lang,'Збережено у вашому акаунті','Saved to your account','Zapisano na Twoim koncie')}</p></section>
    {(Array.isArray(savedPlan.days)?savedPlan.days:[]).filter(d=>d&&typeof d==='object'&&Array.isArray(d.stops)).map(drawDay)}
    <button type="button" className="gt-planner-primary" onClick={()=>setMode('home')}>{I(lang,'До моїх планів','Back to my itineraries','Wróć do moich planów')}</button>
  </>:null}
 </main></div>;
}
