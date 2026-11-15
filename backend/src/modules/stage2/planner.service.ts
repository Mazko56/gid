import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { AuthUser } from '../../common/auth.guard.js';

// Every itinerary stop is an approved place from PostgreSQL. No sample locations or fixed routes.
type Place = {
  id: string; region_id: string; category_slug: string; subcategory: string | null;
  name: string; description: string; address: string; lat: number; lng: number;
  image_url: string | null; rating: number | string; price_level: number | null; work_hours:Record<string,unknown>|null;
  tags: string[] | null; attributes: Record<string, unknown> | null;
  translations: Record<string, unknown> | null;
};
type Region = { id: string; name: string; name_en: string|null; name_pl: string|null; center_lat: number; center_lng: number };
type PlannerInput = {
  start_param?: unknown; region_id?: unknown; gps_lat?: unknown; gps_lng?: unknown; destination_region_ids?: unknown; mode?: unknown; days?: unknown;
  start_date?: unknown; start_time?: unknown; adults?: unknown; children?: unknown;
  activities?: unknown; avoid?: unknown; custom_requirements?: unknown;
  transport?: unknown; radius_km?: unknown; max_travel_minutes?: unknown;
  pace?: unknown; load?: unknown; budget?: unknown; diet?: unknown;
};
type PlannerStop = {place_id:string;place_name:string;category_slug:string;address:string;translations:Record<string,unknown>|null;lat:number;lng:number;image_url:string|null;
  time:string;duration_minutes:number;distance_from_previous_km:number;estimated_travel_minutes:number;price_level:number|null;hours_known:boolean};
type PlannerDay = {date:string;number:number;stops:PlannerStop[]};
const km = (a:number,b:number,c:number,d:number) => {
  const r=Math.PI/180, diffLat=(c-a)*r,diffLng=(d-b)*r;
  const h=Math.sin(diffLat/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(diffLng/2)**2;
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
};
const numeric = (v:unknown, defaultValue:number, min:number, max:number) => {
  const n=Number(v);
  return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : defaultValue;
};
const allowedActivities=['nature','active','relax','family','food','culture','romance','adventure','shopping'];
const allowedAvoid=['heights','crowds','long_trips','steep_climbs','rain','stairs'];
const activityWords: Record<string,string[]> = {
  nature:['природ','гора','ліс','водосп','озер','краєвид','панорам','річк','nature','mountain','forest','waterfall','lake','view'],
  active:['похід','маршрут','спорт','велосип','bike','hiking','trail','rafting','adventure'],
  relax:['чан','саун','басейн','spa','спа','масаж','relax','pool','wellness'],
  family:['діти','сімейн','парк','музей','kids','family','children','playground'],
  food:['їжа','ресторан','кафе','піц','кухн','food','restaurant','cafe','coffee','dining'],
  culture:['музей','екскурс','істор','пам’ят','пам\'ят','архітект','culture','museum','historical','excursion'],
  romance:['затиш','панорам','вечер','масаж','romantic','viewpoint','spa'],
  adventure:['квадро','джип','екстрем','zip','rafting','jeep','atv','adventure'],
  shopping:['магазин','сувен','ярмар','shopping','store','market','souvenir'],
};
const foodWords=activityWords.food;
const isFood=(p:Place)=> [p.category_slug,p.subcategory||'',...(p.tags||[])].join(' ').toLowerCase().split(/\s+/).some(s=>foodWords.some(w=>s.includes(w)));
const normalizeList=(value:unknown, allowed:string[])=> Array.isArray(value)?[...new Set(value.filter((x):x is string=>typeof x==='string'&&allowed.includes(x)))]:[];
const clock=(minutes:number)=> `${String(Math.floor((minutes%(24*60))/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
const safeDate=(value:unknown)=>{
  const date=typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:new Date().toISOString().slice(0,10);
  const parsed=new Date(`${date}T12:00:00Z`);
  if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new BadRequestException('Некоректна дата планування');
  return date;
};

@Injectable()
export class PlannerService {
  constructor(private readonly db:DatabaseService) {}

  async regions(latitude?:string,longitude?:string) {
    const result=await this.db.query<Region>(`SELECT id,name,name_en,name_pl,center_lat,center_lng FROM regions WHERE active=true ORDER BY name`);
    const lat=Number(latitude),lng=Number(longitude);
    const hasCoords=latitude!==undefined&&longitude!==undefined&&Number.isFinite(lat)&&Number.isFinite(lng);
    return result.rows.map(r=>({...r,distance_km:hasCoords?Math.round(km(lat,lng,Number(r.center_lat),Number(r.center_lng))*10)/10:null}))
      .sort((a,b)=>(a.distance_km??Infinity)-(b.distance_km??Infinity));
  }

  private async origin(input:PlannerInput) {
    const startParam=String(input.start_param??'').trim().slice(0,150);
    if(startParam){
      const result=await this.db.query<{region_id:string;region_name:string;region_name_en:string|null;region_name_pl:string|null;
        region_lat:number;region_lng:number;place_id:string|null;place_name:string|null;place_address:string|null;place_lat:number|null;place_lng:number|null}>(
        `SELECT r.id AS region_id,r.name AS region_name,r.name_en AS region_name_en,r.name_pl AS region_name_pl,
          r.center_lat AS region_lat,r.center_lng AS region_lng,p.id AS place_id,p.name AS place_name,p.address AS place_address,
          p.lat AS place_lat,p.lng AS place_lng
         FROM qr_points q LEFT JOIN places p ON p.id=q.place_id
         JOIN regions r ON r.id=COALESCE(p.region_id,q.region_id)
         WHERE q.start_param=$1 AND q.active=true`,[startParam]);
      const row=result.rows[0];
      if(!row)throw new NotFoundException('QR-посилання більше неактивне або не знайдене');
      return {region_id:row.region_id,region_name:row.region_name,region_name_en:row.region_name_en,region_name_pl:row.region_name_pl,
        place_id:row.place_id,place_name:row.place_name,address:row.place_address,
        lat:Number(row.place_lat??row.region_lat),lng:Number(row.place_lng??row.region_lng),source:row.place_id?'place_qr':'region_qr'};
    }
    // A normal launch starts at the actual GPS coordinates. QR entry points always take precedence above.
    const gpsLat=Number(input.gps_lat),gpsLng=Number(input.gps_lng);
    const hasGps=input.gps_lat!==undefined&&input.gps_lng!==undefined&&Number.isFinite(gpsLat)&&Number.isFinite(gpsLng)&&Math.abs(gpsLat)<=90&&Math.abs(gpsLng)<=180&&!(gpsLat===0&&gpsLng===0);
    if(hasGps){
      const registered=await this.regions(String(gpsLat),String(gpsLng));
      const nearest=registered[0];
      if(!nearest)throw new NotFoundException('Немає жодного активного регіону в базі');
      return {region_id:nearest.id,region_name:nearest.name,region_name_en:nearest.name_en,region_name_pl:nearest.name_pl,
        place_id:null,place_name:null,address:null,lat:gpsLat,lng:gpsLng,source:'gps'};
    }
    const regionId=String(input.region_id??'').trim();
    if(!regionId)throw new BadRequestException('Спочатку виберіть реальне місто для початку маршруту');
    const rows=await this.db.query<Region>('SELECT id,name,name_en,name_pl,center_lat,center_lng FROM regions WHERE id=$1 AND active=true',[regionId]);
    const r=rows.rows[0];
    if(!r)throw new NotFoundException('Місто не знайдено');
    return {region_id:r.id,region_name:r.name,region_name_en:r.name_en,region_name_pl:r.name_pl,
      place_id:null,place_name:null,address:null,lat:Number(r.center_lat),lng:Number(r.center_lng),source:'selected_region'};
  }

  async generate(_user:AuthUser,input:PlannerInput) {
    const origin=await this.origin(input);
    const mode=input.mode==='extended'?'extended':'express';
    const count=Math.round(numeric(input.days,1,1,5));
    const date=safeDate(input.start_date);
    const time=typeof input.start_time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(input.start_time)?input.start_time:'09:00';
    const startMinutes=Number(time.slice(0,2))*60+Number(time.slice(3));
    const radiusKm=numeric(input.radius_km,20,1,100);
    const maxTravel=numeric(input.max_travel_minutes,60,10,300);
    const transport=['walking','driving','taxi','cycling'].includes(String(input.transport))?String(input.transport):'driving';
    const speed=transport==='walking'?4.5:transport==='cycling'?12:32;
    const activities=normalizeList(input.activities,allowedActivities);
    const avoid=normalizeList(input.avoid,allowedAvoid);
    const diet=['any','vegetarian','local'].includes(String(input.diet))?String(input.diet):'any';
    const pace=['relaxed','balanced','dynamic'].includes(String(input.pace))?String(input.pace):'balanced';
    const load=['light','moderate','intense'].includes(String(input.load))?String(input.load):'moderate';
    const budget=['any','economy','medium','comfort'].includes(String(input.budget))?String(input.budget):'any';
    const children=numeric(input.children,0,0,20);
    const adults=numeric(input.adults,1,1,30);
    const allRegions=await this.regions(String(origin.lat),String(origin.lng));
    const reachableIds=new Set(allRegions.filter(r=>r.distance_km!=null&&r.distance_km<=radiusKm).map(r=>r.id));
    const selectedRegions=Array.isArray(input.destination_region_ids)?[...new Set(input.destination_region_ids
      .filter((v):v is string=>typeof v==='string'&&reachableIds.has(v)))]:[];
    const criteria={...{mode,days:count,start_date:date,start_time:time,radius_km:radiusKm,max_travel_minutes:maxTravel,transport,
      activities,avoid,diet,pace,load,budget,children,adults,destination_region_ids:selectedRegions},
      custom_requirements:String(input.custom_requirements??'').slice(0,500)};
    const result=await this.db.query<Place>(`SELECT p.id,p.region_id,p.category_slug,p.subcategory,p.name,p.description,p.address,
      p.lat,p.lng,p.image_url,p.rating,p.price_level,p.tags,p.attributes,p.translations,p.work_hours
      FROM (SELECT p.*,COALESCE((SELECT json_agg(t.tag) FROM place_tags t WHERE t.place_id=p.id),'[]'::json)::jsonb AS tags
        FROM places p WHERE p.status='approved') p`);
    const withDistance=result.rows.map(p=>({...p,lat:Number(p.lat),lng:Number(p.lng),distance_km:km(origin.lat,origin.lng,Number(p.lat),Number(p.lng))}))
      .filter(p=>Number.isFinite(p.distance_km)&&p.distance_km<=radiusKm&&p.distance_km>0.005);
    const eligible=withDistance.filter(p=>{
      if(selectedRegions.length&&!selectedRegions.includes(p.region_id))return false;
      const searchable=[p.name,p.category_slug,p.subcategory||'',p.description,...(p.tags||[])].join(' ').toLowerCase();
      if(activities.length&&!activities.some(a=>activityWords[a].some(w=>searchable.includes(w))))return false;
      if(budget==='economy'&&p.price_level!=null&&Number(p.price_level)>1)return false;
      if(budget==='medium'&&p.price_level!=null&&Number(p.price_level)>2)return false;
      if(children>0&&p.attributes?.kids===false)return false;
      const text=[p.name,p.category_slug,p.subcategory,p.description,...(p.tags||[])].join(' ').toLowerCase();
      if((avoid.includes('heights')||avoid.includes('steep_climbs'))&&/скел|вершин|підйом|скелелаз|mountain climb|climbing/.test(text))return false;
      if(avoid.includes('crowds')&&/фестивал|концерт|festival|concert/.test(text))return false;
      if(load==='light'&&/скелелаз|рафтинг|важкий маршрут|extreme hiking|квадроцикл|atv/.test(text))return false;
      if(load==='moderate'&&/скелелаз|extreme hiking|високогірний маршрут/.test(text))return false;
      if(avoid.includes('stairs')&&p.attributes?.step_free!==true&&p.attributes?.wheelchair!==true)return false;
      if(avoid.includes('rain')&&p.attributes?.indoor!==true&&!/(ресторан|кафе|магазин|музей|галерея|спа|spa|сауна|басейн|restaurant|cafe|shop|museum)/.test(text))return false;
      if(diet==='vegetarian'&&isFood(p)&&p.attributes?.vegetarian!==true&&!/вегетар|vegetarian|vegan/.test(text))return false;
      if(diet==='local'&&isFood(p)&&p.attributes?.local_cuisine!==true&&!/українськ|традицій|локальн|місцев|ukrainian|traditional|local cuisine/.test(text))return false;
      return true;
    });
    const variants=mode==='extended'?['balanced','nearby','activity']:['balanced'];
    const perDay=pace==='relaxed'?2:pace==='dynamic'?4:3;
    const built=variants.map((variant,index)=>{
      const used=new Set<string>();
      const days:PlannerDay[]=[];
      for(let d=0;d<count;d++){
        const dayDate=new Date(`${date}T12:00:00Z`);dayDate.setUTCDate(dayDate.getUTCDate()+d);
        let lat=origin.lat,lng=origin.lng,minute=startMinutes;
        const stops:PlannerStop[]=[];
        for(let n=0;n<perDay;n++){
          const best=eligible.map(p=>{
            if(used.has(p.id))return null;
            const leg=km(lat,lng,p.lat,p.lng);
            // Approximation only: no road network or turn-by-turn routing is asserted.
            const travel=Math.ceil(leg/speed*60*1.25);
            if(travel>maxTravel || (avoid.includes('long_trips')&&travel>35))return null;
            if(minute+travel+45>20*60)return null;
            const hours= p.work_hours || {};
            const daily=hours.daily && typeof hours.daily==='object' ? hours.daily as {from?:string;to?:string} : undefined;
            if(hours.always_open!==true&&daily?.from&&daily?.to&&/^\d{2}:\d{2}$/.test(daily.from)&&/^\d{2}:\d{2}$/.test(daily.to)){
              const from=Number(daily.from.slice(0,2))*60+Number(daily.from.slice(3));
              const to=Number(daily.to.slice(0,2))*60+Number(daily.to.slice(3));
              const proposed=minute+travel;
              if(proposed<from||proposed+45>to)return null;
            }
            const text=[p.name,p.category_slug,p.subcategory,p.description,...(p.tags||[])].join(' ').toLowerCase();
            const matched=activities.filter(a=>activityWords[a].some(w=>text.includes(w))).length;
            const preference=activities.length?(matched?matched*9:-12):0;
            const foodBoost=n===1&&isFood(p)?5:0;
            const variantBoost=variant==='nearby'?-leg*2:variant==='activity'?matched*8:0;
            const activeBoost=load==='intense'&&/похід|трек|спорт|рафт|актив|adventure|hiking|trail/.test(text)?5:0;
            const dietaryBoost=diet==='local'&&isFood(p)&&/українськ|традицій|локальн|ukrainian|traditional/.test(text)?5:0;
            const score=preference+foodBoost+variantBoost+activeBoost+dietaryBoost+Math.min(5,Number(p.rating)||0)*1.2-leg*.55+(p.price_level==null?0:budget==='comfort'?Number(p.price_level):0);
            return {p,travel,leg,score};
          }).filter((x):x is NonNullable<typeof x>=>x!==null).sort((a,b)=>b.score-a.score)[0];
          if(!best)break;
          const duration=pace==='relaxed'?90:pace==='dynamic'?60:75;
          minute+=best.travel;
          stops.push({place_id:best.p.id,place_name:best.p.name,category_slug:best.p.category_slug,
            address:best.p.address,translations:best.p.translations,lat:best.p.lat,lng:best.p.lng,image_url:best.p.image_url,time:clock(minute),duration_minutes:duration,
            distance_from_previous_km:Math.round(best.leg*10)/10,estimated_travel_minutes:best.travel,price_level:best.p.price_level,
            hours_known:best.p.work_hours?.always_open===true || Boolean((best.p.work_hours?.daily as {from?:string;to?:string}|undefined)?.from)});
          used.add(best.p.id);lat=best.p.lat;lng=best.p.lng;minute+=duration+15;
        }
        days.push({date:dayDate.toISOString().slice(0,10),number:d+1,stops});
      }
      return {key:variant,index,days,stop_count:days.reduce((s,d)=>s+d.stops.length,0)};
    }).filter(v=>v.stop_count>0).filter((v,i,a)=>a.findIndex(x=>x.days.map(d=>d.stops.map(s=>s.place_id).join(',')).join('|')===v.days.map(d=>d.stops.map(s=>s.place_id).join(',')).join('|'))===i);
    return {origin,criteria,nearby_cities:allRegions.filter(r=>r.distance_km!==null&&r.distance_km<=radiusKm).slice(0,15),
      candidates_count:eligible.length,variants:built,
      notice:'Відстані між точками — географічні, час переїздів орієнтовний. Наявність вільних слотів, графік і точні ціни перевіряйте в картці закладу.'};
  }
}
