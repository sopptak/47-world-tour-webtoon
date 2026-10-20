import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episodes = [
  { no: 1, title: '47세, 세계일주를 꿈꾸다', date: '2026-10-20', lines: [
    '퇴근. 오늘도 별일 없이 하루가 갔다.', '그런데 왜 마음 한구석은 자꾸 먼 데를 보지?', '세계일주라… 말은 시원한데.', '내 체력은 동네 마트 왕복도 협상 중인데.',
    '아빠, 또 여행 영상 봐?', '응. 보는 건 공짜니까.', '가고 싶은 이유부터 적어 봐요. 어디 말고, 왜요.', '…그 질문은 생각보다 어렵네.',
    '스무 살엔 지도에 동그라미를 쳤다.', '군대에선 하루를 적으며 버텼고.', '필리핀 교실에선 내가 가르치러 갔다가 더 많이 배웠다.', '결국 오래 남는 건 장소보다 사람과 배운 것인가.',
    '여행은 도망이 아니었으면 좋겠다.', '우리 가족한테도 좋은 시간이 될 수 있을까?', '그 전에, 내 꿈을 가족의 일정처럼 말하면 안 되겠지.', '한 번에 다 정하지 말고 오늘은 이유만 적자.',
    '“낯선 곳에서 배우고, 돌아와서 나누기.”', '오… 아빠치고 문장이 괜찮은데?', '아빠치고라니. 칭찬 맞지?', '꿈을 적었다. 이제 숫자와 가족의 마음도 적어야 한다.'
  ]},
  { no: 2, title: '세계일주에는 돈이 얼마나 들까', date: '2026-10-20', lines: [
    '세계일주 비용 검색. 숫자가 서로 너무 다른데?', '여행 기간도, 나라 수도, 잠자리도 다르니까.', '가족 넷? 다 같이 가는지, 중간에 합류하는지도 먼저 정해야 해.', '그리고 집에 남아 계속 나갈 돈.',
    '항공·현지 이동·숙박·식비.', '보험·비자·통신·예상 못 한 지출도.', '관리비와 대출 같은 집의 고정비도 여행 중엔 사라지지 않아.', '학비와 가족 일정은 비용표보다 먼저 상의하고.',
    '그러니까 “여행비 얼마” 한 줄로는 안 되네.', '기간별 하루 예산 × 여행 일수부터 가정해 볼까?', '그 값에 이동·준비 비용을 더하고,', '집의 계속 나갈 돈과 비상 여유도 따로 적기.',
    '환율과 성수기, 여행 방식에 따라 계속 바뀌겠네.', '검색 상단의 최저가를 우리 예산처럼 믿지 말자.', '숫자는 정답이 아니라 비교할 가정이구나.', '아빠, 엑셀 표에 간식 항목도 있어?',
    '있지. 간식은 변수가 아니라 상수야.', '그럼 간식 예산은 누가 검토해?', '가족 감사위원회요.', '오늘의 결론: 기간·인원·방식·집 비용을 정한 뒤 범위로 계산한다.'
  ]},
  { no: 3, title: '그런데 내 통장에는…', date: '2026-10-20', lines: [
    '막막해서 통장을 열었다. 숨은 한 번 쉬고.', '잔액 하나로 사람의 가능성을 정하진 말자.', '먼저 지난달 지출을 고정·변동·일회성으로 나눴다.', '아… 구독료가 이렇게 조용히 살았네.',
    '아이들 학업과 생활비는 무턱대고 줄일 항목이 아니지.', '줄일 곳을 찾는 것과 수입을 키우는 걸 같이 보자.', '내가 해 온 일 중 다른 사람에게 도움 될 건?', '노트 정리, 자료 만들기… AI로 초안을 빨리 잡을 수 있겠다.',
    'AI에게 여행 예산표 초안을 부탁했다.', '오, 표는 금방 나오네.', '하지만 가격과 경로가 맞다는 보증은 아니야.', '공식 안내와 실제 판매처에서 하나씩 확인.',
    '개인 계좌 내역은 AI에 붙여 넣지 않는다.', '가정과 출처를 적어야 남도 검토할 수 있지.', '작은 예산 체크리스트로 다듬어 올려 볼까?', '판매가 5천 원, 수수료를 10%라 가정하면…',
    '수수료 500원. 그래도 순수익은 아니네. 시간과 제작비도 빼야 해.', '세금도 실제 소득 유형에 따라 확인해야 하고.', '첫날부터 돈 벌 거란 기대는 접자. 피드백부터 보자.', '작은 실험도 기록하고 고치면 다음 시도가 된다.'
  ]},
  { no: 4, title: '아내에게 말해야 할까', date: '2026-10-20', lines: [
    '오늘은 아내에게 말하려고 했다. 몇 번이나.', '해군 때는 답답한 날도 일단 적어 뒀다.', '필리핀에서는 서툰 영어로 수업하다 아이들한테 배웠고.', '그때도 내 계획보다 상대가 필요한 걸 먼저 봐야 했지.',
    '여보, 나 세계일주를…', '잠깐. 내가 이미 결론까지 정해 놓고 통보하려 했네.', '당신이 꼭 해 보고 싶은 건 뭐야?', '아내: 나는 당신이 무슨 생각인지 먼저 듣고 싶어.',
    '나는 언젠가 가족과 오래 여행해 보고 싶어.', '당장 떠나자는 건 아니야. 기간과 돈부터 같이 따져 보고 싶어.', '고3 아들은 입시 일정이 있고, 중1 딸도 자기 생활이 있지.', '아이들 의견도 듣자. 부모 꿈이 가족 숙제는 아니니까.',
    '아내: 여행을 싫어하는 건 아니야. 다만 우리 형편을 함께 보자.', '응. 나도 그게 맞다고 생각해.', '그럼 기간·동행 여부·집에 남는 비용부터 적어 보자.', '그리고 각자 꼭 지키고 싶은 일도 같이.',
    '아빠, 여행 가면 내 방은 누가 치워?', '그건… 출발 전에 네가 직접 확인하는 걸로.', '아빠, 계획표에 청소 항목 추가요.', '꿈은 혼자 쓰지만, 가족의 여행은 같이 고쳐 쓰는 거였다.'
  ]}
];

const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const palettes = [
  ['#f6efe3','#c9d9da','#e7b183'], ['#f4f0e6','#dbe3e2','#d9b77e'],
  ['#f3efe8','#d8e0eb','#e8c77c'], ['#f3eee7','#d6dfd4','#d9b4a1']
];
function art(ep, i, line) {
  const [paper, wall, accent] = palettes[ep.no - 1];
  const scene = ['거실','식탁','노트','지도','회사','대화'][i % 6];
  const isMemory = ep.no === 1 && [8,9,10].includes(i) || ep.no === 4 && [1,2].includes(i);
  const bg = isMemory ? '#eee4d3' : wall;
  const pose = ['calm','think','surprise','smile','write'][i % 5];
  const arms = {
    calm: 'M250 600l-80 95M455 600l70 95',
    think: 'M250 600l-70 70 90-95M455 600l45 50',
    surprise: 'M250 600l-95-75M455 600l95-75',
    smile: 'M250 600l-65 45M455 600l85-90',
    write: 'M250 600l-75 90M455 600l-28-75 120-20'
  }[pose];
  const face = {
    calm: 'M290 385q25 -10 48 0M365 385q25 -10 48 0M300 425q48 8 98 0',
    think: 'M290 380q25 -18 48 -4M365 376q25 -10 48 4M300 432q48 -6 98 0M350 395l-7 25',
    surprise: 'M290 380q25 -14 48 0M365 380q25 -14 48 0M300 430q48 48 98 0',
    smile: 'M290 388q25 -14 48 0M365 388q25 -14 48 0M300 420q48 35 98 0',
    write: 'M290 386q25 -12 48 0M365 386q25 -12 48 0M300 425q48 4 98 0'
  }[pose];
  const woman = ep.no === 4 && i >= 7 && i <= 15;
  const kid = ep.no === 2 && i >= 15 || ep.no === 4 && i >= 16;
  const fx = scene === '지도' ? '<path d="M70 250 Q160 190 240 250 T420 230 T650 250" fill="none" stroke="#a2b9a6" stroke-width="8"/><circle cx="360" cy="235" r="13" fill="#e0906e"/>' :
    scene === '노트' ? '<rect x="410" y="355" width="210" height="130" rx="8" fill="#fffdf8" stroke="#4d6073" stroke-width="5"/><path d="M435 390h155M435 420h120M435 450h140" stroke="#8a9baa" stroke-width="4"/>' :
    scene === '회사' ? '<rect x="60" y="345" width="600" height="95" fill="#a77e5d"/><rect x="420" y="245" width="150" height="90" fill="#dce9eb" stroke="#60777c" stroke-width="5"/>' :
    '<rect x="65" y="250" width="220" height="140" rx="10" fill="#f5ead9" stroke="#9b8874" stroke-width="5"/><path d="M65 295h220M175 250v140" stroke="#9b8874" stroke-width="5"/>';
  const main = `<g stroke="#262522" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M205 755 Q210 615 230 545 Q260 500 355 500 Q445 505 475 555 Q490 630 500 755Z" fill="#f7f6f1"/><path d="M250 755h195" fill="none"/><ellipse cx="350" cy="390" rx="112" ry="130" fill="#e8bc9e"/><path d="M240 365 Q228 270 285 260 Q345 220 410 260 Q470 290 458 365 L435 335 Q390 315 355 320 Q310 315 260 350Z" fill="#181817"/><path d="${face}" fill="none"/>${pose === 'surprise' ? '<circle cx="314" cy="397" r="7" fill="#262522"/><circle cx="389" cy="397" r="7" fill="#262522"/>' : ''}<path d="M350 396l-8 23" fill="none"/><path d="${arms}" fill="none"/><rect x="260" y="752" width="75" height="80" fill="#34363b"/><rect x="370" y="752" width="75" height="80" fill="#34363b"/></g>`;
  const side = woman ? '<g stroke="#292725" stroke-width="6" stroke-linejoin="round"><path d="M510 770q8-155 25-210h108q26 70 30 210z" fill="#d7c9b7"/><ellipse cx="590" cy="440" rx="73" ry="89" fill="#e7b99b"/><path d="M518 435q-10-105 80-103t71 107q-23-48-79-48-26 0-72 44" fill="#242322"/></g>' : '';
  const child = kid ? '<g stroke="#292725" stroke-width="5"><path d="M80 760v-115h65v115" fill="#8b9db1"/><circle cx="112" cy="600" r="43" fill="#e8bd9e"/><path d="M70 590q10-65 85-34" fill="#252424"/><path d="M590 770v-108h65v108" fill="#c98e86"/><circle cx="622" cy="610" r="40" fill="#e8bd9e"/><path d="M580 595q12-55 82-25" fill="#252424"/></g>' : '';
  const bubbles = ['…','하…','음.','좋아.','잠깐.'];
  const emoji = /\?|막막|아…|놀|무섭|어렵|헉/.test(line) ? '?!' : (i % 7 === 0 ? '…' : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900" role="img" aria-label="웹툰 장면"><rect width="720" height="900" fill="${paper}"/><rect x="0" y="0" width="720" height="510" fill="${bg}"/>${fx}<path d="M0 800 Q180 770 360 800 T720 790V900H0Z" fill="${accent}" opacity=".45"/>${child}${main}${side}<g font-family="sans-serif" font-weight="700" fill="#514b43"><text x="52" y="100" font-size="24">${esc(scene)}</text><text x="635" y="110" font-size="36">${emoji || bubbles[i%5]}</text></g></svg>`;
}
function script(ep) {
  const nextTitle = episodes[ep.no]?.title || (ep.no === 4 ? '서랍 속 오래된 지도' : undefined);
  const next = nextTitle ? `\n- **다음 화 예고**: 「EP.${String(ep.no+1).padStart(2,'0')} ${nextTitle}」` : '';
  const cuts = ep.lines.map((line,i)=>`### 컷 ${i+1}\n- **장면**: ${line}\n- **인물**: 티몽${ep.no===4 && i>=7 && i<=15 ? ', 아내' : ''}${(ep.no===2 && i>=15 || ep.no===4 && i>=16) ? ', 고3 아들, 중1 딸' : ''}\n- **배경**: ${['거실','식탁','노트와 계산기','지도','퇴근한 집','가족 대화'][i%6]}\n- **대사/내레이션**: ${line}\n- **연출**: 같은 얼굴·짧은 부스스한 검은 머리·굵은 눈썹·둥근 얼굴·보통 체형. 흰 티셔츠와 짙은 바지를 고정. 말풍선은 이미지 밖에 배치.${i===19 ? next : ''}\n`).join('\n');
  return `# EP.${String(ep.no).padStart(3,'0')} ${ep.title}\n\n모바일 세로 스크롤 · 20컷 · 그림 내부 컷 번호 없음\n\n${cuts}`;
}
for (const ep of episodes) {
  const dir = path.join(root, 'episodes', String(ep.no).padStart(3,'0'));
  fs.mkdirSync(dir, {recursive:true});
  ep.lines.forEach((line,i)=>fs.writeFileSync(path.join(dir,`${String(i+1).padStart(2,'0')}.svg`), art(ep,i,line), 'utf8'));
  fs.writeFileSync(path.join(root,'scripts','episodes',`${String(ep.no).padStart(3,'0')}.md`),script(ep),'utf8');
}
fs.writeFileSync(path.join(root,'data','dialogues.js'), `(function(root){var data={${episodes.map(ep=>`${ep.no}:${JSON.stringify(ep.lines)}`).join(',')}};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.WEBTOON_DIALOGUES=data;})(this);\n`, 'utf8');
console.log('Generated 80 consistent SVG panels, dialogue data, and four scripts.');
