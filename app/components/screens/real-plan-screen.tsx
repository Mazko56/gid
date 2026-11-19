"use client";

import {useEffect,useMemo,useState,type ReactNode} from "react";
import {ArrowLeft,ArrowRight,BadgeCheck,Banknote,Bike,CalendarDays,CalendarRange,CarFront,Check,ChevronRight,ClipboardCheck,Clock3,Compass,ExternalLink,Flame,Flower2,Footprints,Gauge,Heart,Info,ListChecks,Map as MapIcon,MapPin,Minus,MountainSnow,Navigation,Pencil,Plus,Route,Save,Share2,Sparkles,TentTree,Timer,UserRound,UsersRound,Utensils} from "lucide-react";
import type {RoleKey} from "../../lib/navigation";
import {stage2Fetch,telegramStartParam,type Stage2Place} from "../../lib/stage2-api";
import {useTouristRuntime} from "../../lib/tourist-runtime";
import {tr} from "../../lib/tourist-i18n";
import {localizedField} from "../../lib/content-i18n";

type L='uk'|'en'|'pl';
type Navigate=(role:RoleKey,slug:string)=>void;
type Region={id:string;name:string;name_en:string|null;name_pl:string|null;center_lat:number;center_lng:number;distance_km:number|null};
type Stop={place_id:string;place_name:string;category_slug:string;address:string;translations?:Record<string,unknown>|null;lat:number;lng:number;image_url:string|null;time:string;duration_minutes:number;distance_from_previous_km:number;estimated_travel_minutes:number;price_level:number|null;hours_known?:boolean};
type TripDay={date:string;number:number;stops:Stop[]};
type Variant={key:string;index:number;days:TripDay[];stop_count:number};
type PlannerResult={origin:{region_id:string;region_name:string;region_name_en?:string|null;region_name_pl?:string|null;place_name:string|null;address:string|null;lat:number;lng:number;source:string};criteria:Record<string,unknown>;candidates_count:number;nearby_cities:Region[];variants:Variant[];notice:string};
type Saved={id:string;title:string;criteria:Record<string,unknown>;days:TripDay[];region_id:string;updated_at:string};
type FormData={days:number;start_date:string;start_time:string;adults:number;children:number;radius_km:number;activities:string[];avoid:string[];custom_requirements:string;transport:string;max_travel_minutes:number;pace:string;load:string;budget:string;diet:string;destination_region_ids:string[]};
const today=()=>{const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);};
const earliestStart = () => {const now=new Date();const minute=Math.ceil((now.getHours()*60+now.getMinutes()+1)/5)*5;const day=minute>=24*60?new Date(now.getTime()+24*60*60*1000):now;return {date:new Date(day.getTime()-day.getTimezoneOffset()*60000).toISOString().slice(0,10),time:minute>=24*60?'00:00':`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`};};
const defaults=():FormData=>({days:1,start_date:earliestStart().date,start_time:earliestStart().time,adults:2,children:1,radius_km:15,activities:[],avoid:[],custom_requirements:'',transport:'driving',max_travel_minutes:60,pace:'balanced',load:'moderate',budget:'medium',diet:'any',destination_region_ids:[]});
const I=(language:L,uk:string,en:string,pl:string)=>tr(language,uk,en,pl);
const groups={
 activities:[['nature','Природа','Nature','Natura'],['active','Активний','Active','Aktywnie'],['relax','SPA','SPA','SPA'],['family','Сімейний','Family','Rodzinny'],['food','Їжа','Food','Jedzenie'],['culture','Екскурсії','Excursions','Wycieczki'],['romance','Романтичний','Romantic','Romantyczny'],['adventure','Екстрим','Adventure','Przygoda'],['shopping','Покупки','Shopping','Zakupy']],
 avoid:[['heights','Перепади висоти','Steep terrain','Strome tereny'],['crowds','Багатолюдні місця','Crowded places','Tłoczne miejsca'],['long_trips','Довгі переїзди','Long transfers','Długie przejazdy'],['steep_climbs','Без крутих підйомів','No steep climbs','Bez stromych podejść'],['rain','Без дощу','Avoid rain','Bez deszczu'],['stairs','Без сходів','No stairs','Bez schodów']],
 transport:[['walking','Пішки','Walking','Pieszo'],['driving','Власне авто','Own car','Samochód'],['taxi','Таксі','Taxi','Taksówka'],['cycling','Велосипед','Cycling','Rower']],
 pace:[['relaxed','Розслаблений','Relaxed','Spokojny'],['balanced','Збалансований','Balanced','Zrównoważony'],['dynamic','Динамічний','Dynamic','Dynamiczny']],
 load:[['light','Легке','Light','Lekki'],['moderate','Помірне','Moderate','Umiarkowany'],['intense','Інтенсивне','Intense','Intensywny']],
 budget:[['any','Будь-який','Any','Dowolny'],['economy','Економний','Budget','Ekonomiczny'],['medium','Середній','Mid-range','Średni'],['comfort','Комфорт','Comfort','Komfort']],
 diet:[['any','Без обмежень','No restrictions','Bez ograniczeń'],['vegetarian','Вегетаріанське','Vegetarian','Wegetariańskie'],['local','Місцева кухня','Local food','Kuchnia lokalna']]
} as const;
function labelOf(items:readonly (readonly string[])[],key:string,lang:L){const item=items.find(x=>x[0]===key);return item?item[lang==='uk'?1:lang==='en'?2:3]:key;}
function PlanArtIcon(){return <span className="gt-plan-art-icon" aria-hidden="true"><ClipboardCheck/><TentTree/></span>;}
function SurveyHeader({step,total,onBack,lang}:{step:number;total:number;onBack:()=>void;lang:L}){
 const progress=Math.max(0,Math.min(100,(step-1)/Math.max(1,total-1)*100));
 return <header className="gt-plan-survey-header"><button type="button" aria-label={I(lang,'Назад','Back','Wstecz')} onClick={onBack}><ArrowLeft size={22}/></button><span aria-hidden="true"/><span className="gt-plan-survey-info"><Info size={19}/></span>
  <div className="gt-plan-progress-steps" aria-label={`${I(lang,'Крок','Step','Krok')} ${step} / ${total}`}><i style={{width:`${progress}%`}}/>{Array.from({length:total}).map((_,index)=><span key={index} className={index+1<step?'is-complete':index+1===step?'is-current':''}>{index+1<step?<Check size={11}/>:null}</span>)}</div>
  <small className="gt-plan-progress-label">{I(lang,'Крок','Step','Krok')} {step} / {total}</small></header>;
}
function Stepper({label,value,onChange,min=0}:{label:string;value:number;onChange:(v:number)=>void;min?:number}){return <div className="gt-plan-stepper"><span>{label}</span><div><button type="button" disabled={value<=min} onClick={()=>onChange(Math.max(min,value-1))}><Minus size={17}/></button><strong>{value}</strong><button type="button" onClick={()=>onChange(Math.min(30,value+1))}><Plus size={17}/></button></div></div>;}
function Footer({onNext,label,disabled=false,lang}:{onNext:()=>void;label:string;disabled?:boolean;lang:L}){return <div className="gt-plan-flow-footer"><button type="button" disabled={disabled} className="is-primary" onClick={onNext}>{label}<ChevronRight size={19}/></button></div>;}
function PlanChoice({items,value,onChange,lang}:{items:readonly (readonly string[])[];value:string;onChange:(v:string)=>void;lang:L}){return <div className="gt-plan-choice-list">{items.map(([key,uk,en,pl])=>{const Icon=key==='solo'?UserRound:key==='couple'?Heart:key==='family'||key==='friends'||key==='group'?UsersRound:key==='relaxed'?Flower2:key==='dynamic'?MountainSnow:Gauge;return <button type="button" key={key} className={value===key?'is-selected':''} onClick={()=>onChange(key)}><Icon size={19}/><span>{I(lang,uk,en,pl)}</span>{value===key?<Check size={18}/>:null}</button>;})}</div>;}
function PlanChips({items,selected,onSelect,lang,className=''}:{items:readonly (readonly string[])[];selected:string[];onSelect:(key:string)=>void;lang:L;className?:string}){return <div className={`gt-plan-chip-group ${className}`.trim()}>{items.map(([key,uk,en,pl])=><button type="button" key={key} aria-pressed={selected.includes(key)} className={selected.includes(key)?'is-selected':''} onClick={()=>onSelect(key)}>{I(lang,uk,en,pl)}</button>)}</div>;}
function SmallSelector({items,value,onChange,lang,className=''}:{items:readonly (readonly string[])[];value:string;onChange:(v:string)=>void;lang:L;className?:string}){return <PlanChips items={items} selected={[value]} onSelect={onChange} lang={lang} className={className}/>;}
function kmLabel(km:number){return new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(km);}
function regionName(r:Region,lang:L){return lang==='en'?r.name_en||r.name:lang==='pl'?r.name_pl||r.name:r.name;}
const travelerItems=[['solo','Я сам / сама','Just me','Tylko ja'],['couple','Пара','Couple','Para'],['family','Сім’я з дітьми','Family with children','Rodzina z dziećmi'],['friends','Друзі','Friends','Przyjaciele'],['group','Велика компанія','Big group','Duża grupa']];
const activityIcons=[TentTree,MountainSnow,Flower2,UsersRound,Utensils,MapIcon,Heart,Flame,Bike];

export function RealPlanScreen({navigate,initialView="home"}:{navigate:Navigate;initialView?:"home"|"list"}){
 const runtime=useTouristRuntime();const lang=runtime.language;
 const [mode,setMode]=useState<'home'|'express'|'extended'|'result'|'saved'|'list'>(initialView);
 const [selectedMode,setSelectedMode]=useState<'express'|'extended'>('express');
 const [survey,setSurvey]=useState<'express'|'extended'>('express');
 const [step,setStep]=useState(1);const [traveler,setTraveler]=useState('family');
 const [savedLoading,setSavedLoading]=useState(true);const [savedError,setSavedError]=useState('');const [savedNotice,setSavedNotice]=useState('');
 const [form,setForm]=useState<FormData>(defaults);const [regions,setRegions]=useState<Region[]>([]);const [region,setRegion]=useState('');
 const [loadingRegions,setLoadingRegions]=useState(true);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const [result,setResult]=useState<PlannerResult|null>(null);const [chosen,setChosen]=useState(0);
 const [savedPlans,setSavedPlans]=useState<Saved[]>([]);const [savedPlan,setSavedPlan]=useState<Saved|null>(null);
 const origin=runtime.context;const hasQr=Boolean(telegramStartParam()&&origin?.qr);
 const gps= !hasQr && runtime.location?.source==='gps' ? runtime.location : null;
 const baseLat=hasQr?Number(origin?.place?.lat??origin?.region.lat):(gps?.lat??NaN);
 const baseLng=hasQr?Number(origin?.place?.lng??origin?.region.lng):(gps?.lng??NaN);
 const originTitle=origin?.place?.name||I(lang,origin?.region.name||'QR не визначено',origin?.region.nameEn||'QR not detected',origin?.region.namePl||'Brak kodu QR');
 const originAddress=origin?.place?.address||origin?.region.name||'';
 const update=<K extends keyof FormData>(key:K,value:FormData[K])=>setForm(f=>({...f,[key]:value}));
 const toggle=(key:'activities'|'avoid'|'destination_region_ids',value:string)=>setForm(f=>({...f,[key]:f[key].includes(value)?f[key].filter(x=>x!==value):[...f[key],value]}));
 const total=mode==='extended'?6:4;
 const start=(kind:'express'|'extended')=>{setSurvey(kind);setMode(kind);setForm(defaults());setStep(1);setTraveler('family');setError('');setSavedNotice('');setSavedPlan(null);setResult(null);setChosen(0);};
 const onTravelerSelect=(kind:string)=>{setTraveler(kind);const counts:Record<string,[number,number]>={solo:[1,0],couple:[2,0],family:[2,1],friends:[3,0],group:[5,0]};const [adults,children]=counts[kind]||[2,0];setForm(f=>({...f,adults,children}));};
 const validStart=()=>form.start_date>=today()&&(form.start_date!==today()||form.start_time>=earliestStart().time);
 const startError=()=>I(lang,'Початок сьогодні не може бути раніше поточного часу','Today’s start time cannot be in the past','Godzina rozpoczęcia dzisiaj nie może być w przeszłości');
 useEffect(()=>{let alive=true;void stage2Fetch<Region[]>(`/planner/regions${Number.isFinite(baseLat)&&Number.isFinite(baseLng)?`?lat=${baseLat}&lng=${baseLng}`:''}`)
  .then(rows=>{if(alive)setRegions(rows);}).catch(e=>{if(alive)setError(e instanceof Error?e.message:String(e));}).finally(()=>{if(alive)setLoadingRegions(false);});return()=>{alive=false;};},[baseLat,baseLng,hasQr]);
 useEffect(()=>{let alive=true;void stage2Fetch<Saved[]>('/me/plans').then(items=>{if(alive)setSavedPlans(items);}).catch(e=>{if(alive)setSavedError(e instanceof Error?e.message:String(e));}).finally(()=>{if(alive)setSavedLoading(false);});return()=>{alive=false;};},[]);
 const selectedRegionCoords=regions.find(r=>r.id===region);
 const nearby=useMemo(()=>{if(hasQr||gps)return regions.filter(r=>r.distance_km!=null&&r.distance_km<=form.radius_km);if(!selectedRegionCoords)return [];
  const radians=Math.PI/180;const distance=(a:Region,b:Region)=>{const dlat=(Number(b.center_lat)-Number(a.center_lat))*radians,dlng=(Number(b.center_lng)-Number(a.center_lng))*radians;const h=Math.sin(dlat/2)**2+Math.cos(Number(a.center_lat)*radians)*Math.cos(Number(b.center_lat)*radians)*Math.sin(dlng/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));};
  return regions.map(r=>({...r,distance_km:Math.round(distance(selectedRegionCoords,r)*10)/10})).filter(r=>r.distance_km<=form.radius_km).sort((a,b)=>a.distance_km-b.distance_km);},[regions,form.radius_km,hasQr,gps?.lat,gps?.lng,selectedRegionCoords]);
 const activeVariant=result?.variants[chosen]||result?.variants[0];
 const generate=async()=>{if(!validStart()){setError(startError());setMode(survey);setStep(2);return;}if(!form.activities.length){setError(I(lang,'Оберіть хоча б один вид відпочинку','Select at least one interest','Wybierz co najmniej jedno zainteresowanie'));setMode(survey);setStep(survey==='express'?3:4);return;}if(!hasQr&&!gps&&!region){setError(I(lang,'Дозвольте геолокацію або виберіть місто','Allow location access or select a city','Zezwól na lokalizację lub wybierz miasto'));return;}
  setLoading(true);setError('');try{const data=await stage2Fetch<PlannerResult>('/me/plans/generate',{method:'POST',body:JSON.stringify({...form,mode:survey,start_param:hasQr?telegramStartParam():'',region_id:hasQr?origin?.region.id:region, gps_lat:gps?.lat, gps_lng:gps?.lng})});setResult(data);setChosen(0);setMode('result');}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}};
 const save=async()=>{if(!result||!activeVariant)return;setLoading(true);setError('');try{const title=`${I(lang,'Мій маршрут','My itinerary','Moja trasa')} · ${result.origin.place_name||result.origin.region_name} · ${form.start_date}`;
  const saved=await stage2Fetch<Saved>('/me/plans',{method:'POST',body:JSON.stringify({title,region_id:result.origin.region_id,criteria:{...result.criteria,origin:result.origin},days:activeVariant.days})});setSavedPlan(saved);setSavedPlans(p=>[saved,...p.filter(x=>x.id!==saved.id)]);setSavedNotice(I(lang,'План збережено в профілі','Saved to your profile','Zapisano w profilu'));}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}};
 const share=async()=>{if(!result)return;const text=`${I(lang,'Мій маршрут','My itinerary','Moja trasa')}: ${result.origin.place_name||result.origin.region_name}\n${activeVariant?.days.flatMap(d=>d.stops.map(s=>`${s.time} ${s.place_name}`)).join('\n')||''}`;try{if(navigator.share)await navigator.share({title:'Gid Tourist',text});else if(navigator.clipboard)await navigator.clipboard.writeText(text);}catch{/* user cancelled share */}};
 const dateLabel=(s:string)=>new Date(`${s}T12:00:00Z`).toLocaleDateString(lang==='uk'?'uk-UA':lang==='pl'?'pl-PL':'en-GB',{day:'numeric',month:'long'});
 const back=()=>{if(step>1)setStep(x=>x-1);else setMode('home');};
 const next=()=>{if(step===2&&!validStart()){setError(startError());return;}if((mode==='express'&&step===3||mode==='extended'&&step===4)&&!form.activities.length){setError(I(lang,'Оберіть хоча б один вид відпочинку','Select at least one interest','Wybierz co najmniej jedno zainteresowanie'));return;}setError('');if(step<total)setStep(x=>x+1);else void generate();};
 const busyMsg=error?<p role="alert" className="gt-plan-inline-error">{error}</p>:null;
 const travelBlock=<><div className="gt-plan-steppers"><Stepper label={I(lang,'Дорослі','Adults','Dorośli')} value={form.adults} min={1} onChange={v=>update('adults',v)}/><Stepper label={I(lang,'Діти','Children','Dzieci')} value={form.children} onChange={v=>update('children',v)}/></div></>;
 const durationBlock=<><div className="gt-plan-chip-group gt-plan-chip-group--choice-list">{[1,2,3,4,5].map(d=><button type="button" key={d} className={form.days===d?'is-selected':''} onClick={()=>update('days',d)}>{d} {I(lang,'дн.','days','dni')}</button>)}</div>
  <div className="gt-plan-date-cards"><label><span>{I(lang,'Початок','Start','Początek')}</span><input type="date" min={today()} value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value,start_time:e.target.value===today()&&f.start_time<earliestStart().time?earliestStart().time:f.start_time}))}/><CalendarRange/></label>
   <label><span>{I(lang,'Зручний час','Start time','Godzina')}</span><input type="time" min={form.start_date===today()?earliestStart().time:undefined} value={form.start_time} onChange={e=>update('start_time',form.start_date===today()&&e.target.value<earliestStart().time?earliestStart().time:e.target.value)}/><Clock3/></label></div></>;
 const locationBlock=<><h2>{I(lang,'Де ви перебуваєте?','Where are you staying?','Gdzie jesteś?')}</h2>
  {hasQr||gps?<div className="gt-plan-location"><MapPin size={22}/><span><small>{I(lang,'Поточне місце (за QR)','Current place (QR)','Obecne miejsce (QR)')}</small><strong>{hasQr?originTitle:I(lang,'Ваше фактичне місцезнаходження','Your current location','Twoja obecna lokalizacja')}</strong><em>{hasQr?originAddress:`${gps?.lat.toFixed(5)}, ${gps?.lng.toFixed(5)}`}</em></span><Check size={18}/></div>
   :<label className="gt-plan-location gt-plan-city-select"><MapPin size={22}/><span><small>{I(lang,'Місто початку','Starting city','Miasto początkowe')}</small><select value={region} disabled={loadingRegions} onChange={e=>{setRegion(e.target.value);update('destination_region_ids',[]);}}><option value="">{I(lang,'Оберіть місто','Select city','Wybierz miasto')}</option>{regions.map(r=><option value={r.id} key={r.id}>{regionName(r,lang)}</option>)}</select></span></label>}
  <h2>{I(lang,'Радіус для пошуку локацій','Search radius','Promień wyszukiwania')}</h2>
  <SmallSelector lang={lang} className="gt-plan-chip-group--radius" items={[["5","5 км","5 km","5 km"],["15","15 км","15 km","15 km"],["30","30 км","30 km","30 km"],["50","50 км","50 km","50 km"],["100","100 км","100 km","100 km"]]} value={String(form.radius_km)} onChange={v=>update('radius_km',Number(v))}/>
  <h2>{I(lang,'Міста поруч (вибір необов’язковий)','Nearby towns (optional)','Miasta w pobliżu (opcjonalnie)')}</h2>
  <div className="gt-plan-distance-list">{nearby.length?nearby.slice(0,15).map(r=><button type="button" className={form.destination_region_ids.includes(r.id)?'is-selected':''} key={r.id} onClick={()=>toggle('destination_region_ids',r.id)}><span>{regionName(r,lang)}</span><b>{r.distance_km!=null?`${kmLabel(r.distance_km)} км`:'—'} {form.destination_region_ids.includes(r.id)?'✓':''}</b></button>):<span>{I(lang,'Населених пунктів у цьому радіусі немає','No towns in this radius','Brak miast w tym promieniu')}</span>}</div></>;
 const interestsBlock=<><div className="gt-plan-activity-grid gt-plan-activity-grid--wide">{groups.activities.map(([key,uk,en,pl],index)=>{const Icon=activityIcons[index];return <button type="button" aria-pressed={form.activities.includes(key)} className={form.activities.includes(key)?'is-selected':''} key={key} onClick={()=>toggle('activities',key)}><Icon size={21}/><span>{I(lang,uk,en,pl)}</span></button>;})}</div></>;
 const transportBlock=<><h2>{I(lang,'Як пересуваєтесь?','How will you travel?','Jak podróżujesz?')}</h2><div className="gt-plan-transport-row gt-plan-transport-row--compact">{groups.transport.map(([key,uk,en,pl],index)=>{const Icon=[Footprints,CarFront,Navigation,Bike][index];return <button type="button" key={key} className={form.transport===key?'is-selected':''} onClick={()=>update('transport',key)}><Icon size={20}/>{I(lang,uk,en,pl)}</button>;})}</div>
  <h2>{I(lang,'Максимальний час у дорозі','Maximum travel time','Maksymalny czas dojazdu')}</h2>
  <SmallSelector lang={lang} className="gt-plan-chip-group--single-row" items={[["30","до 30 хв","up to 30m","do 30 min"],["60","до 1 год","up to 1h","do 1 godz"],["120","1–2 год","1–2h","1–2 godz"],["180","2–3 год","2–3h","2–3 godz"]]} value={String(form.max_travel_minutes)} onChange={v=>update('max_travel_minutes',Number(v))}/></>;
 const budgetBlock=<><h2>{I(lang,'Бюджет на день (орієнтовно)','Daily budget (estimate)','Budżet na dzień')}</h2><div className="gt-plan-budget-grid">{groups.budget.filter(x=>x[0]!=='any').map(([key,uk,en,pl])=><button type="button" key={key} className={form.budget===key?'is-selected':''} onClick={()=>update('budget',key)}><strong>{I(lang,uk,en,pl)}</strong></button>)}</div>
  <h2>{I(lang,'Харчування','Food preferences','Wyżywienie')}</h2><PlanChips lang={lang} className="gt-plan-tag-cloud--single-row" items={groups.diet} selected={[form.diet]} onSelect={v=>update('diet',v)}/></>;
 const footer=(label?:string)=><>{busyMsg}<Footer lang={lang} disabled={loading} label={loading?I(lang,'Підбираємо місця…','Finding places…','Szukamy miejsc…'):label||I(lang,'Далі','Next','Dalej')} onNext={next}/></>;
 const summary=<div className="gt-plan-summary-list">
   <div><UsersRound/><span><small>{I(lang,'Компанія','Travellers','Podróżnicy')}</small><strong>{form.adults} + {form.children}</strong></span></div>
   <div><CalendarDays/><span><small>{I(lang,'Період','Dates','Termin')}</small><strong>{form.start_date} · {form.start_time} · {form.days} {I(lang,'дн.','days','dni')}</strong></span></div>
   <div><MapPin/><span><small>{I(lang,'Звідки','Starting at','Początek')}</small><strong>{hasQr?originTitle:gps?I(lang,'Ваша GPS-позиція','Your GPS location','Twoja pozycja GPS'):regionName(regions.find(r=>r.id===region)||{name:'—',name_en:null,name_pl:null,id:'',center_lat:0,center_lng:0,distance_km:null},lang)}</strong></span></div>
   <div><TentTree/><span><small>{I(lang,'Відпочинок','Interests','Zainteresowania')}</small><strong>{form.activities.map(v=>labelOf(groups.activities,v,lang)).join(', ')||'—'}</strong></span></div>
   <div><CarFront/><span><small>{I(lang,'Транспорт','Transport','Transport')}</small><strong>{labelOf(groups.transport,form.transport,lang)}</strong></span></div>
  </div>;
 const openPlace=(id:string)=>{void stage2Fetch<Stage2Place>(`/places/${encodeURIComponent(id)}`).then(p=>{runtime.setSelectedPlace(p);navigate('tourist','place');}).catch(e=>setError(e instanceof Error?e.message:String(e)));};
 const renderDay=(day:TripDay)=><div className="gt-plan-days" key={day.number}>{(day.stops||[]).length?day.stops.map(stop=><article key={stop.place_id}>
  {stop.image_url?<img className="gt-plan-real-photo" src={stop.image_url} alt="" loading="lazy"/>:<span className="gt-plan-real-photo gt-plan-real-photo--empty"><MapPin size={23}/></span>}
  <div><small>{I(lang,'День','Day','Dzień')} {day.number} · {dateLabel(day.date)} · {stop.time}</small>
   <strong>{localizedField(lang,{name:stop.place_name,translations:stop.translations},'name')}</strong><ul><li>{stop.address}</li><li>~{stop.estimated_travel_minutes} {I(lang,'хв у дорозі','min travel','min podróży')} · {kmLabel(stop.distance_from_previous_km)} км</li>{!stop.hours_known?<li>{I(lang,'Уточніть графік','Check opening hours','Sprawdź godziny otwarcia')}</li>:null}</ul></div>
  <button type="button" className="gt-plan-open-place" aria-label={I(lang,'Відкрити заклад','Open place','Otwórz miejsce')} onClick={()=>openPlace(stop.place_id)}><ChevronRight size={18}/></button>
 </article>):<p>{I(lang,'Немає відповідних місць','No matching places','Brak pasujących miejsc')}</p>}</div>;
 const resultView=(days:TripDay[],title:string,sub:string,canSave:boolean)=><section className="gt-plan-result">
  <div className="gt-plan-result-title"><span><Sparkles size={24}/></span><div><h1>{title}</h1><p>{sub}</p></div></div>
  {canSave&&result&&result.variants.length>1?<><h2 className="gt-plan-variant-title">{I(lang,'Варіанти плану','Itinerary options','Warianty planu')}</h2><div className="gt-plan-variant-row">{result.variants.map((v,index)=><article key={v.key} className={chosen===index?'is-selected':''}><div className="gt-plan-variant-art"><TentTree size={22}/></div><strong>{v.key==='nearby'?I(lang,'Поруч','Nearby','Blisko'):v.key==='activity'?I(lang,'За інтересами','Interests','Zainteresowania'):I(lang,'Збалансований','Balanced','Zrównoważony')}</strong><small>{v.stop_count} {I(lang,'місць','stops','miejsc')}</small><button type="button" onClick={()=>setChosen(index)}>{chosen===index?I(lang,'Обрано','Selected','Wybrano'):I(lang,'Обрати','Choose','Wybierz')}</button></article>)}</div></>:null}
  {days.map(renderDay)}
  {canSave&&!result?.variants.length?<p>{result?.notice||I(lang,'Відповідних місць у базі поки немає — змініть радіус або вподобання.','No matching places found — adjust radius or interests.','Brak miejsc — zmień promień lub zainteresowania.')}</p>:null}
  {canSave?<p className="gt-plan-real-notice">{lang==='uk'&&result?.notice?result.notice:I(lang,'Відстані географічні, час приблизний. Графік і ціни уточнюйте в закладі.','Straight-line distances; travel time is approximate. Verify opening hours and prices.','Odległości w linii prostej, czas przybliżony. Sprawdź godziny i ceny.')}</p>:null}
  {busyMsg}{canSave&&savedNotice?<p className="gt-plan-saved-notice" role="status"><Check size={16}/>{savedNotice} <button type="button" onClick={()=>navigate('tourist','saved-plans')}>{I(lang,'Мої плани','My plans','Moje plany')}<ChevronRight size={15}/></button></p>:null}{canSave?<div className="gt-plan-result-actions"><button type="button" onClick={()=>void share()}><Share2 size={18}/>{I(lang,'Поділитися','Share','Udostępnij')}</button>
  <button type="button" disabled={loading||!result?.variants.length} onClick={()=>void save()}><Save size={18}/>{I(lang,'Зберегти план','Save itinerary','Zapisz plan')}</button></div>:null}
 </section>;
 if(mode==='home')return <div className="tourist-screen gt-screen gt-plan-screen"><main className="gt-plan-home">
  <header className="gt-plan-home-header"><h1>{I(lang,'Мій план','My plan','Mój plan')}</h1><Info size={22}/></header>
  <section className="gt-plan-home-hero"><PlanArtIcon/><h2>{I(lang,'Створимо Ваш','Let’s create your','Stwórzmy Twój')}<br/>{I(lang,'оптимальний план відпочинку','ideal travel itinerary','idealny plan wypoczynku')}</h2>
  <p>{I(lang,'Відповідайте на кілька запитань і ми підберемо найкращий сценарій відпочинку для вас.','Answer a few questions and we’ll suggest the best trip for you.','Odpowiedz na kilka pytań, a dobierzemy plan dla Ciebie.')}</p></section>
  <div className="gt-plan-mode-list"><button type="button" className={selectedMode==='express'?'is-selected':''} onClick={()=>setSelectedMode('express')}><span><Timer size={38}/></span>
   <div><strong>{I(lang,'Експрес-опитування','Quick questionnaire','Ankieta ekspresowa')}</strong><p>{I(lang,'1–2 хв','1–2 min','1–2 min')} <i/> {I(lang,'короткі запитання','short questions','krótkie pytania')}</p>
   <small><Check/> {I(lang,'Швидко та зручно','Quick and easy','Szybko i łatwo')}</small><small><Check/> {I(lang,'Ідеально для швидкого планування','Ideal for a quick plan','Idealny do szybkiego planowania')}</small></div><ChevronRight/></button>
  <button type="button" className={selectedMode==='extended'?'is-selected':''} onClick={()=>setSelectedMode('extended')}><span><ListChecks size={38}/></span>
   <div><strong>{I(lang,'Розширене опитування','Detailed questionnaire','Ankieta rozszerzona')}</strong><p>{I(lang,'3–5 хв','3–5 min','3–5 min')} <i/> {I(lang,'більше деталей і точніший план','more detail and precision','więcej szczegółów')}</p>
   <small><Check/> {I(lang,'Глибше розуміння ваших побажань','More about your wishes','Lepsze dopasowanie')}</small><small><Check/> {I(lang,'Точніший план під ваш стиль відпочинку','Itinerary for your travel style','Plan do Twojego stylu')}</small></div><ChevronRight/></button></div>
  <button type="button" className="gt-plan-start-button" onClick={()=>start(selectedMode)}>{I(lang,'Почати','Start','Rozpocznij')}</button>
 </main></div>;
 if(mode==='list')return <div className="tourist-screen gt-screen gt-plan-screen gt-plan-library"><main className="gt-plan-home">
  <header className="gt-plan-library-header"><button type="button" className="gt-plan-library-back" aria-label={I(lang,'Назад до профілю','Back to profile','Powrót do profilu')} onClick={()=>navigate('tourist','profile')}><ArrowLeft size={20}/></button><div><h1>{I(lang,'Мої плани','My plans','Moje plany')}</h1><p>{I(lang,'Ваші збережені маршрути','Your saved itineraries','Zapisane trasy')}</p></div></header>
  {savedLoading?<p className="gt-plan-library-empty">{I(lang,'Завантажуємо плани…','Loading plans…','Ładowanie planów…')}</p>:savedError?<p className="gt-plan-inline-error" role="alert">{savedError}</p>:savedPlans.length?<div className="gt-plan-library-list">{savedPlans.map(p=><button type="button" key={p.id} className="gt-plan-library-card" onClick={()=>{setSavedPlan(p);setMode('saved');}}><span className="gt-plan-library-card-icon"><Route size={22}/></span><span className="gt-plan-library-card-text"><strong>{p.title}</strong><small>{p.days.length} {I(lang,'дн.','days','dni')} · {p.days.reduce((n,d)=>n+(d.stops?.length||0),0)} {I(lang,'місць','places','miejsc')} · {new Date(p.updated_at).toLocaleDateString(lang==='en'?'en-GB':lang==='pl'?'pl-PL':'uk-UA')}</small></span><ChevronRight size={19}/></button>)}</div>
  :<div className="gt-plan-library-empty"><span><Route size={32}/></span><strong>{I(lang,'Поки що немає збережених планів','No saved itineraries yet','Nie masz jeszcze zapisanych planów')}</strong><p>{I(lang,'Створіть план відпочинку і збережіть його — він з’явиться тут.','Create and save an itinerary to see it here.','Utwórz i zapisz plan, aby pojawił się tutaj.')}</p></div>}
  <button type="button" className="gt-plan-start-button" onClick={()=>navigate('tourist','plan')}>{I(lang,'Створити новий план','Create a new plan','Utwórz nowy plan')}<ChevronRight size={18}/></button>
 </main></div>;
 if(mode==='result'&&result)return <div className="tourist-screen gt-screen gt-plan-screen"><main className="gt-plan-survey"><SurveyHeader lang={lang} step={survey==='express'?5:7} total={survey==='express'?5:7} onBack={()=>{setMode(survey);setStep(survey==='express'?4:6);}}/>
  {resultView(activeVariant?.days||[],I(lang,'Ваш план готовий 🎉','Your plan is ready 🎉','Twój plan jest gotowy 🎉'),`${result.origin.place_name||result.origin.region_name} · ${form.days} ${I(lang,'днів','days','dni')}`,true)}</main></div>;
 if(mode==='saved'&&savedPlan)return <div className="tourist-screen gt-screen gt-plan-screen"><main className="gt-plan-survey"><SurveyHeader lang={lang} step={1} total={1} onBack={()=>setMode(initialView==='list'?'list':'home')}/>
  {resultView(savedPlan.days,savedPlan.title,I(lang,'Збережено у вашому акаунті','Saved to your account','Zapisano na Twoim koncie'),false)}
  <button type="button" className="gt-plan-start-button" onClick={()=>setMode('list')}>{I(lang,'До моїх планів','Back to my plans','Wróć do planów')}</button></main></div>;
 return <div className="tourist-screen gt-screen gt-plan-screen"><main className="gt-plan-survey">
  <SurveyHeader lang={lang} step={step} total={mode==='extended'?7:5} onBack={back}/>
  {mode==='express'?(step===1?<section className="gt-plan-question"><h1>{I(lang,'Хто подорожує?','Who is travelling?','Kto podróżuje?')}</h1><p>{I(lang,'Оберіть склад вашої компанії','Choose your travel group','Wybierz towarzystwo')}</p>
   <PlanChoice lang={lang} value={traveler} onChange={onTravelerSelect} items={travelerItems}/>{travelBlock}{footer()}</section>
  :step===2?<section className="gt-plan-question gt-plan-question--express-days"><h1>{I(lang,'На скільки днів?','How many days?','Na ile dni?')}</h1><p>{I(lang,'Тривалість вашої подорожі','Trip duration','Czas podróży')}</p>{durationBlock}
   {locationBlock}{footer()}</section>
  :step===3?<section className="gt-plan-question"><h1>{I(lang,'Який відпочинок вам підходить?','What do you enjoy?','Jaki wypoczynek lubisz?')}</h1><p>{I(lang,'Оберіть напрямки відпочинку','Select interests','Wybierz zainteresowania')}</p>{interestsBlock}{transportBlock}{budgetBlock}{footer()}</section>
  :<section className="gt-plan-question"><h1>{I(lang,'Підсумок побажань','Your preferences','Podsumowanie')}</h1><p>{I(lang,'Перевірте дані перед створенням плану','Review before generating','Sprawdź przed utworzeniem') }</p>{summary}
   <button type="button" className="gt-plan-change" onClick={()=>setStep(1)}><Pencil size={17}/>{I(lang,'Змінити відповіді','Edit answers','Zmień odpowiedzi')}</button>{footer(I(lang,'Підібрати план','Build my plan','Utwórz plan'))}
   <button type="button" className="gt-plan-cancel" onClick={()=>setMode('home')}>{I(lang,'Скасувати','Cancel','Anuluj')}</button></section>)
  :(step===1?<section className="gt-plan-question"><h1>{I(lang,'Хто подорожує?','Who is travelling?','Kto podróżuje?')}</h1><p>{I(lang,'Розкажіть про вашу компанію','Tell us about your group','Opowiedz o grupie')}</p>
    <PlanChoice lang={lang} value={traveler} onChange={onTravelerSelect} items={travelerItems}/>{travelBlock}{footer()}</section>
   :step===2?<section className="gt-plan-question gt-plan-question--period"><h1>{I(lang,'На який період створити план?','When should we plan?','Na jaki okres?')}</h1><p>{I(lang,'Оберіть тривалість та зручний час','Choose dates and time','Wybierz daty i czas')}</p>{durationBlock}{footer()}</section>
   :step===3?<section className="gt-plan-question"><h1>{I(lang,'Де ви перебуваєте?','Where are you?','Gdzie jesteś?')}</h1><p>{I(lang,'Вкажіть точку для пошуку місць поруч','Choose the search origin','Wybierz lokalizację początkową')}</p>{locationBlock}{footer()}</section>
   :step===4?<section className="gt-plan-question"><h1>{I(lang,'Який відпочинок вам подобається?','What do you enjoy?','Co lubisz?')}</h1><p>{I(lang,'Можна обрати декілька напрямів','Choose multiple interests','Wybierz kilka zainteresowań')}</p>{interestsBlock}
    <h2>{I(lang,'Що вам не подобається?','What would you avoid?','Czego nie lubisz?')}</h2><div className="gt-plan-toggle-list">{groups.avoid.map(([key,uk,en,pl])=><label key={key}><span>{I(lang,uk,en,pl)}</span><input type="checkbox" checked={form.avoid.includes(key)} onChange={()=>toggle('avoid',key)}/></label>)}</div>{footer()}</section>
   :step===5?<section className="gt-plan-question"><h1>{I(lang,'Темп і активність','Pace and activity','Tempo i aktywność')}</h1><p>{I(lang,'Оберіть комфортний ритм подорожі','Choose your preferred pace','Wybierz wygodne tempo')}</p>
    <PlanChoice lang={lang} items={groups.pace} value={form.pace} onChange={v=>update('pace',v)}/><h2>{I(lang,'Фізичне навантаження','Physical intensity','Wysiłek fizyczny')}</h2>
    <SmallSelector lang={lang} items={groups.load} value={form.load} onChange={v=>update('load',v)}/>
    <h2>{I(lang,'Обмеження та побажання','Restrictions and preferences','Ograniczenia i życzenia')}</h2>
    <div className="gt-plan-tag-cloud">{groups.avoid.map(([key,uk,en,pl])=><button type="button" key={key} className={form.avoid.includes(key)?'is-selected':''} onClick={()=>toggle('avoid',key)}>{I(lang,uk,en,pl)}</button>)}</div>{footer()}</section>
   :<section className="gt-plan-question"><h1>{I(lang,'Транспорт і бюджет','Transport and budget','Transport i budżet')}</h1><p>{I(lang,'Останні деталі для точного підбору','Final preferences','Ostatnie szczegóły')}</p>{transportBlock}{budgetBlock}
    <label className="gt-plan-extra-notes"><span>{I(lang,'Додаткові побажання','Additional wishes','Dodatkowe życzenia')}</span><textarea value={form.custom_requirements} maxLength={500} onChange={e=>update('custom_requirements',e.target.value)}/></label>{footer(I(lang,'Показати варіанти','Show plans','Pokaż warianty'))}</section>)}
 </main></div>;
}
