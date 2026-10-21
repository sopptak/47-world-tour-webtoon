#!/usr/bin/env node
/* Regenerate text-free 720x900 SVG panels for episodes 1–5 from their scripts. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const colors = [
  null,
  ["#efede9","#d6d1ca","#82796f","#393735","#dfb99f","#faf9f6","#53545b","#cfd4d5","#fff4dd"],
  ["#f2eadc","#d5b997","#876044","#3d3731","#e7bda1","#fffdf7","#3c414b","#c9d9e6","#fff1d2"],
  ["#eee8dc","#d4b38d","#815b3f","#393530","#e5b99d","#f8f7f1","#41434a","#c8d8dc","#ffe7bd"],
  ["#f2eadc","#caa983","#795840","#393530","#e5b99d","#f8f7f1","#42444a","#cbd8ce","#fff0d0"],
  ["#f4ead8","#cda77e","#765439","#3b332d","#e4b99e","#f9f6ed","#42434a","#cad6d6","#ffe6ad"]
].map((row) => row && ({wall:row[0],floor:row[1],wood:row[2],ink:row[3],skin:row[4],shirt:row[5],pants:row[6],sky:row[7],light:row[8]}));

function field(block, name) {
  const prefix = "- **" + name + "**: ";
  const line = block.split("\n").find((row) => row.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : "";
}
function cutsFor(no) {
  const file = path.join(root,"scripts","episodes",String(no).padStart(3,"0")+".md");
  return fs.readFileSync(file,"utf8").replace(/\r/g,"").split(/^### 컷 /m).slice(1).map((block,i)=>({
    n:i+1, scene:field(block,"장면"), people:field(block,"인물"), place:field(block,"배경"), line:field(block,"대사/내레이션")
  }));
}
function sceneFor(c,no) {
  if(no===5) return ({1:"darkHome",2:"minimal",3:"home",4:"bedroom",5:"clutter",6:"drawer",7:"drawerClose",8:"mapClose",9:"mapFloor",10:"mapClose",11:"bedroom",12:"bedroom",13:"desk",14:"reflection"})[c.n]||"home";
  const p=c.place.toLowerCase();
  if(/안방|서랍장/.test(p))return "bedroom";
  if(/노트와 계산기/.test(p))return "budget";
  if(/식탁/.test(p))return "table";
  if(/지도/.test(p))return "map";
  if(/책상/.test(p))return "desk";
  if(/가족 대화/.test(p))return "family";
  if(/거실|퇴근한 집/.test(p))return "home";
  const s=(c.scene+" "+c.line).toLowerCase();
  if(/회사|사무실|출근|직장/.test(s))return "desk";
  if(/계산기|통장|예산|돈|수입|지출|가계부|보험|대출|가격|수수료/.test(s))return "budget";
  return "living";
}
function windowArt(p,night) {
  const sky=night?"#344252":p.sky, glow=night?"#f5cf91":p.light;
  return '<g><rect x="50" y="82" width="245" height="205" rx="8" fill="'+p.wood+'"/><rect x="61" y="93" width="223" height="182" fill="'+sky+'"/>'+
  '<circle cx="235" cy="132" r="24" fill="'+glow+'"/><path d="M61 233q60-40 113-2t110-17v61H61z" fill="'+(night?"#293946":"#92a68f")+'"/>'+
  '<path d="M173 93v182M61 184h223" stroke="'+p.wood+'" stroke-width="9"/></g>';
}
function furniture(p,scene,open) {
  if(scene==="bedroom"||scene==="drawer"||scene==="drawerClose") return '<g stroke="'+p.ink+'" stroke-width="5"><rect x="414" y="277" width="242" height="346" rx="8" fill="#956d4d"/>'+
    '<rect x="432" y="294" width="206" height="80" fill="#b58c65"/><rect x="432" y="386" width="206" height="91" fill="'+(open?"#6c4d36":"#b58c65")+'"/>'+
    '<rect x="432" y="490" width="206" height="108" fill="'+(open?"#6c4d36":"#b58c65")+'"/><circle cx="536" cy="431" r="7" fill="#e5c795"/>'+
    (open?'<path d="M430 411h-92v66h92M430 516h-118v82h118" fill="#e3c899"/>':'')+'</g>';
  if(scene==="home"||scene==="darkHome"||scene==="living"||scene==="family") return '<g stroke="'+p.ink+'" stroke-width="5" stroke-linejoin="round"><path d="M82 510q0-42 38-42h64q20 0 28 21 8-21 28-21h54q38 0 38 42v91H82z" fill="#9e8268"/>'+
    '<path d="M74 546h272v79H74z" fill="#b19478"/><path d="M116 509h69v56h-69zM222 509h62v56h-62z" fill="none" stroke="#d7c0a2" stroke-width="4"/></g>';
  if(scene==="table")return '<g stroke="'+p.ink+'" stroke-width="5" stroke-linejoin="round"><path d="M82 520h550v42H82z" fill="'+p.wood+'"/><path d="M124 562v155M590 562v155" stroke-width="12"/>'+
    '<ellipse cx="240" cy="488" rx="42" ry="14" fill="#faf4e6"/><path d="M211 488q0-27 29-27t29 27" fill="#b7c7bd"/><ellipse cx="485" cy="487" rx="48" ry="17" fill="#faf4e6"/><circle cx="485" cy="486" r="8" fill="#dfb87d"/></g>';
  if(scene==="clutter")return '<g stroke="'+p.ink+'" stroke-width="4" stroke-linejoin="round"><path d="M90 698h220v114H90z" fill="#d6b488"/><path d="M112 680q28-40 56-8t54-3q37-24 66 8" fill="none" stroke="#313236" stroke-width="10"/>'+
    '<rect x="385" y="704" width="68" height="91" rx="12" fill="#59656b"/><path d="M482 716h131v82H482z" fill="#c6b8a2"/></g>';
  if(scene==="minimal"||scene==="mapClose"||scene==="mapFloor"||scene==="reflection")return "";
  const budget=scene==="budget", map=scene==="map";
  return '<g stroke="'+p.ink+'" stroke-width="5" stroke-linejoin="round"><path d="M90 548h540v35H90z" fill="'+p.wood+'"/><path d="M118 583v134M602 583v134" stroke-width="12"/>'+
    (budget?'<rect x="165" y="442" width="195" height="102" rx="8" fill="#f8f2e6"/><path d="M185 465h145M185 487h112M185 509h128" stroke="#8d9a9d" stroke-width="4"/>'+
    '<rect x="420" y="467" width="110" height="76" rx="9" fill="#434b56"/><rect x="433" y="478" width="84" height="34" fill="#c7d9dc"/>':
    map?'<path d="M176 477q38-29 78 0t80 0v66q-40-24-80 0t-78 0z" fill="#e7d5a6"/><path d="M254 477v66" fill="none" stroke="#9a8d6d" stroke-width="3"/>'+
    '<circle cx="477" cy="500" r="42" fill="#86a79a"/><path d="M435 500h84M477 458q-25 42 0 84" fill="none" stroke="#567b70" stroke-width="3"/>':
    '<rect x="190" y="457" width="238" height="78" rx="7" fill="#f4ead6"/><path d="M210 480h190M210 500h154M210 520h174" stroke="#9a8d7f" stroke-width="4"/>')+'</g>';
}
function mapOnFloor(p,old) {
  return '<g stroke="'+p.ink+'" stroke-width="4" stroke-linejoin="round"><path d="M83 575q55-35 110-5t104-4q58-31 108 7v178q-50-31-108 4t-104 5q-55-29-110 4z" fill="'+(old?"#dfc98f":"#e7dfc8")+'"/>'+
    '<path d="M187 570v180M297 566v180" fill="none" stroke="'+(old?"#9b7044":"#6d8990")+'" stroke-width="3"/>'+
    '<path d="M120 620q15-24 38-9l15 20-17 20-26-2zM220 607l34 8 18 30-17 17-30-8-10-21zM330 635l39-8 18 22-19 18-31-4z" fill="#b2bd9f" stroke="none"/>'+
    (old?'<path d="M129 698q58-40 104-17t113-10" fill="none" stroke="#a87a49" stroke-width="4" stroke-dasharray="5 9"/>':'')+'</g>';
}
function mapCloseup(p) {
  return '<g stroke="'+p.ink+'" stroke-width="5" stroke-linejoin="round"><path d="M58 164q80-50 160-5t166-7q74-34 226 12v444q-116-55-226 0t-166 3q-80-45-160 7z" fill="#dfc98f"/>'+
    '<path d="M218 159v459M384 152v459" fill="none" stroke="#b99a67" stroke-width="7"/>'+
    '<path d="M115 268q22-32 59-12l22 24-21 31-47-4zM271 236l61 13 26 51-28 27-53-15-19-40zM460 321l66-15 31 38-33 36-55-8zM164 438l61 7 31 46-36 28-49-24z" fill="#b5bd98" stroke="none"/>'+
    '<path d="M95 523q94-79 172-29t151-31q61-44 153 3" fill="none" stroke="#a87a49" stroke-width="6" stroke-dasharray="7 15"/>'+
    '<path d="M201 487l15-15 15 15-15 15zM409 461l15-15 15 15-15 15z" fill="#a45b4c"/></g>';
}
function kneelingTimon(p) {
  return '<g stroke="'+p.ink+'" stroke-width="6" stroke-linejoin="round"><ellipse cx="456" cy="623" rx="123" ry="15" fill="#473d34" opacity=".12" stroke="none"/>'+
    '<path d="M411 529h96q42 39 16 79l-126 8q-51-5-45-37z" fill="'+p.pants+'"/><path d="M411 561q-39 27-86 53-23 15-12 34 11 14 34 2l105-38M490 566q42 9 74 45 19 22 2 36-17 12-34-2l-88-38" fill="'+p.pants+'"/>'+
    '<path d="M408 421q43-28 91 0l29 112q-69 32-151 0z" fill="'+p.shirt+'"/><path d="M416 444q-28 46-61 131" fill="none" stroke="'+p.skin+'" stroke-width="25" stroke-linecap="round"/><path d="M496 443q34 36 39 82" fill="none" stroke="'+p.skin+'" stroke-width="25" stroke-linecap="round"/>'+
    '<ellipse cx="458" cy="346" rx="72" ry="83" fill="'+p.skin+'"/><path d="M390 333q-2-69 66-77 66 7 75 71l-14 39-16-28-5-34q-33 20-76 8l-18 37z" fill="#201e1d"/>'+
    '<path d="M418 351q12-8 23 0M472 351q12-8 23 0" fill="none" stroke-width="6"/><circle cx="429" cy="368" r="4" fill="'+p.ink+'"/><circle cx="484" cy="368" r="4" fill="'+p.ink+'"/><path d="M438 399q21 12 41 0" fill="none" stroke-width="4"/></g>';
}
function person(p,x,y,scale,expression,shirt,back,pose) {
  if(back) return '<g transform="translate('+x+' '+y+') scale('+scale+')"><ellipse cx="110" cy="490" rx="88" ry="14" fill="#473d34" opacity=".13"/>'+
    '<path d="M46 235q64-24 128 0l22 245H24z" fill="'+shirt+'" stroke="'+p.ink+'" stroke-width="6"/><circle cx="110" cy="143" r="69" fill="#272423"/>'+
    '<path d="M54 133q-9-82 57-96 67 14 58 96" fill="#272423" stroke="'+p.ink+'" stroke-width="5"/></g>';
  const mouth=expression==="smile"?"M98 183q22 24 45 0":expression==="worried"?"M98 191q22-17 45 0":expression==="surprised"?"M116 179q12 5 8 20-12 9-17-1-2-11 9-19z":"M101 186q19 4 38 0";
  const gest=pose==="gesture";
  return '<g transform="translate('+x+' '+y+') scale('+scale+')"><ellipse cx="120" cy="500" rx="105" ry="16" fill="#473d34" opacity=".14"/>'+
    '<path d="M75 385h42v114H75zM128 385h42v114h-42z" fill="'+p.pants+'" stroke="'+p.ink+'" stroke-width="5"/>'+
    '<path d="M65 483h61q12 0 12 14v8H56v-8q0-14 9-14zM123 483h61q12 0 12 14v8h-82v-8q0-14 9-14z" fill="#393a3e" stroke="'+p.ink+'" stroke-width="5"/>'+
    '<path d="M62 236q17-20 59-21 46 0 62 22l20 147q-80 27-162 0z" fill="'+shirt+'" stroke="'+p.ink+'" stroke-width="6"/>'+
    '<path d="'+(gest?"M67 263Q28 290 7 242M171 263q44-16 59-63":"M67 263Q34 310 28 353M171 263q42 35 37 80")+'" fill="none" stroke="'+p.skin+'" stroke-width="24" stroke-linecap="round"/>'+
    '<ellipse cx="120" cy="126" rx="76" ry="89" fill="'+p.skin+'" stroke="'+p.ink+'" stroke-width="5"/>'+
    '<path d="M49 112Q42 51 82 35q23-19 62-9 46 10 51 64l-12 43-16-24-5-32q-33 22-76 9l-19 30z" fill="#201e1d"/>'+
    '<path d="M78 134q15-10 29 0M137 134q15-10 29 0" fill="none" stroke="'+p.ink+'" stroke-width="7" stroke-linecap="round"/>'+
    '<circle cx="94" cy="151" r="5" fill="'+p.ink+'"/><circle cx="151" cy="151" r="5" fill="'+p.ink+'"/>'+
    '<path d="M122 148l-7 20 10 4" fill="none" stroke="'+p.ink+'" stroke-width="4"/><path d="'+mouth+'" fill="none" stroke="'+p.ink+'" stroke-width="4" stroke-linecap="round"/></g>';
}
function wife(p) {
  return '<g transform="translate(478 382) scale(.68)"><path d="M55 212q50-24 100 0l24 155H31z" fill="#d2c2a7" stroke="'+p.ink+'" stroke-width="5"/>'+
    '<path d="M60 245l-35 87M146 245l31 77" fill="none" stroke="'+p.skin+'" stroke-width="19" stroke-linecap="round"/>'+
    '<ellipse cx="105" cy="118" rx="63" ry="73" fill="'+p.skin+'" stroke="'+p.ink+'" stroke-width="5"/>'+
    '<path d="M44 124Q36 42 96 35q69-8 77 65l-10 106-22-37-4-86q-37 24-81 8l-4 92-17 8z" fill="#1d1d1c"/>'+
    '<path d="M74 123q12-8 24 0M119 123q12-8 24 0" stroke="'+p.ink+'" stroke-width="5" fill="none"/><circle cx="86" cy="139" r="4"/><circle cx="132" cy="139" r="4"/>'+
    '<path d="M95 176q15 3 29 0" fill="none" stroke="'+p.ink+'" stroke-width="4"/></g>';
}
function buildSvg(no,c) {
  const p=colors[no], scene=sceneFor(c,no), text=(c.scene+" "+c.line).toLowerCase();
  const night=scene==="darkHome"||/밤|야경/.test(text)||(no===4&&c.n<4)||(no===5&&c.n>=13);
  const expression=/\?!|놀라|발견|없네|막막|안도/.test(text)?"surprised":/얼마|걱정|고민|형편|대출/.test(text)?"worried":/웃|피식|공짜|간식|시작|다시|꼭/.test(text)?"smile":"neutral";
  let art;
  if(scene==="minimal") {
    art='<rect width="720" height="900" fill="#fffdf9"/><path d="M95 690q80-18 150 2t155-1" fill="none" stroke="#e8e2da" stroke-width="4"/>';
  } else if(scene==="mapClose") {
    art='<rect width="720" height="900" fill="#ded8c9"/>'+mapCloseup(p);
  } else if(scene==="mapFloor") {
    art='<rect width="720" height="900" fill="#e8d9bc"/><path d="M-80 130L240 900h180L95 0z" fill="#fff8df" opacity=".28"/>'+mapOnFloor(p,true);
  } else {
    art='<rect width="720" height="900" fill="'+p.wall+'"/><path d="M0 630h720v270H0z" fill="'+p.floor+'"/>';
    if(scene!=="drawerClose") art+=windowArt(p,night);
    art+=furniture(p,scene,no===5&&c.n>=7);
  }
  if(no===5&&c.n===4) art+='<g stroke="'+p.ink+'" stroke-width="4"><path d="M72 753h170l-12 112H84z" fill="#d8c5a4"/><path d="M266 735h150v130H266z" fill="#c5d1c8"/><path d="M72 753l84-52 86 52M266 735l73-45 77 45" fill="none"/></g>';
  if(no===5&&c.n===13) art+='<g stroke="'+p.ink+'" stroke-width="4"><path d="M132 469q65-29 120 0t124 0v75q-62-28-124 1t-120-1z" fill="#e8d8ae"/><path d="M407 462q58-25 110 0t93 0v81q-52-27-102 0t-101 0z" fill="#dfc98f"/><path d="M252 469v74M509 462v81" stroke="#ad9466" stroke-width="3"/><path d="M181 506q55-31 95 2t90-4M456 500q52-29 93 3" fill="none" stroke="#9f7548" stroke-width="3" stroke-dasharray="5 8"/></g>';
  if(scene==="map"&&no!==5) art+=mapOnFloor(p,false);
  if(no===5&&c.n===14) art+='<rect x="401" y="90" width="238" height="355" rx="12" fill="#27333b" opacity=".32"/><rect x="414" y="103" width="212" height="329" rx="7" fill="#56646c" opacity=".5"/>';
  let figure;
  const pose=/말해|묻|질문|설명|얘기|정하|검토|잠깐|머뭇/.test(text)?"gesture":"rest";
  if(scene==="reflection") figure=person(p,80,292,1.02,"surprised",p.shirt,false,"rest")+'<path d="M421 544q30-68 90-44 58 24 50 97v180H421z" fill="#f8f0df" opacity=".6"/>'+person(p,423,414,.67,"neutral","#ddd2bc",false,"rest");
  else if(scene==="drawerClose") figure='<path d="M-30 708Q130 608 285 614t220 73" fill="none" stroke="'+p.skin+'" stroke-width="46" stroke-linecap="round"/><path d="M405 680q-40-38-75-8l-22 25 38 25 43-8" fill="'+p.skin+'" stroke="'+p.ink+'" stroke-width="5" stroke-linejoin="round"/>';
  else if(scene==="mapClose") figure='<path d="M0 729h720" stroke="#fff" stroke-width="28" opacity=".4"/><path d="M520 690q-75-56-130-2" fill="none" stroke="'+p.skin+'" stroke-width="36" stroke-linecap="round"/>';
  else if(scene==="mapFloor") figure=kneelingTimon(p);
  else figure=person(p,scene==="map"?196:scene==="bedroom"||scene==="drawer"||scene==="drawerClose"?80:scene==="minimal"?240:230,scene==="minimal"?330:292,scene==="home"||scene==="family"||scene==="darkHome"?.88:scene==="minimal"?.72:1.03,expression,p.shirt,false,pose);
  if(/아내/.test(c.people+" "+c.line)||(no===4&&c.n>=8)||(no===5&&[1,3,4,5,6,11,12].includes(c.n)))figure+=wife(p);
  if(/아들|딸|아이들|아빠,/.test(c.people+" "+c.line))figure+='<g opacity=".94">'+person(p,87,420,.46,"neutral","#60717b",true)+person(p,520,422,.43,"neutral","#9b8066",true)+'</g>';
  const glow=night?'<path d="M421 0h299v640H421z" fill="url(#lamp)" opacity=".32"/>':'';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900" role="img" aria-label="웹툰 장면 삽화"><defs>'+
    '<linearGradient id="wall" x2="0" y2="1"><stop stop-color="'+p.wall+'"/><stop offset="1" stop-color="'+p.floor+'"/></linearGradient>'+
    '<linearGradient id="lamp" x2="1" y2="1"><stop stop-color="'+p.light+'"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
    '<radialGradient id="shade"><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="'+p.ink+'" stop-opacity=".13"/></radialGradient></defs>'+
    '<rect width="720" height="900" fill="url(#wall)"/>'+art+glow+'<path d="M0 630h720" stroke="'+p.ink+'" opacity=".16" stroke-width="5"/>'+figure+
    '<rect width="720" height="900" fill="url(#shade)"/></svg>';
}
function main() {
  for(let no=1;no<=5;no++){
    const cuts=cutsFor(no),folder=path.join(root,"episodes",String(no).padStart(3,"0"));
    fs.mkdirSync(folder,{recursive:true});
    for(const c of cuts)fs.writeFileSync(path.join(folder,String(c.n).padStart(2,"0")+".svg"),buildSvg(no,c)+"\n","utf8");
    console.log("EP."+String(no).padStart(2,"0")+": "+cuts.length+" panels");
  }
}
if(require.main===module)main();
module.exports={buildSvg,cutsFor,sceneFor};
