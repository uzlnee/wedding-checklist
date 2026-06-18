export const CATS = [
  "예식장·플래너","스드메","본식 촬영·영상","예물·부케",
  "한복·혼주","청첩장","식순·인력","가족 행사","신혼여행",
];

export const PHASES = [
  { id:"p1", m:12, when:"상견례",              sub:"양가 첫 만남을 준비해요" },
  { id:"p2", m:9,  when:"결혼 준비 시작",       sub:"홀·스드메·예물을 계약해요" },
  { id:"p3", m:6,  when:"웨딩데이 6~5개월 전",  sub:"가봉·스튜디오 촬영을 진행해요" },
  { id:"p4", m:4,  when:"웨딩데이 4~3개월 전",  sub:"청첩장·인력·피부관리를 챙겨요" },
  { id:"p5", m:2,  when:"웨딩데이 2~1개월 전",  sub:"발송·피팅·리허설을 확인해요" },
  { id:"p6", d:14, when:"웨딩데이 2주 전",       sub:"식순을 확정해요" },
  { id:"p7", d:7,  when:"웨딩데이 1주 전",       sub:"하객 수·사례비를 점검해요" },
  { id:"p8", d:1,  when:"D-1",                  sub:"한복·예복·소품을 마무리해요" },
];

export const phaseDate = (weddingDate, phase) => {
  const d = new Date(weddingDate + "T00:00:00");
  if (phase.d != null) d.setDate(d.getDate() - phase.d);
  else d.setMonth(d.getMonth() - phase.m);
  return d;
};

export const seedItems = () => [
  { id:"venue",        cat:"예식장·플래너",  emoji:"🏛️", title:"예식장",            value:"더베르G",                  status:"done",       budget:"", memo:"", phase:"p1", tip:"날짜·홀·식대를 먼저 확정해야 나머지 일정이 맞춰져요." },
  { id:"planner",      cat:"예식장·플래너",  emoji:"💛", title:"플래너",            value:"베리굿",                   status:"done",       budget:"", memo:"", phase:"p1", tip:"스드메 계약 전에 정하면 연계 할인을 받기 좋아요." },
  { id:"meeting",      cat:"가족 행사",      emoji:"🕊️", title:"상견례",            value:"예정",                     status:"inprogress", budget:"", memo:"", phase:"p1", tip:"양가 일정을 맞춰 예식 6개월~1년 전에 진행해요." },
  { id:"studio",       cat:"스드메",         emoji:"📷", title:"스튜디오",          value:"라크마스튜디오",            status:"done",       budget:"", memo:"", phase:"p2", tip:"인기 스튜디오는 1년 전 마감되기도 해요." },
  { id:"dress",        cat:"스드메",         emoji:"👰", title:"드레스",            value:"아뜰리에로리에, 로즈로사",  status:"done",       budget:"", memo:"", phase:"p2", tip:"드레스 투어는 시간이 걸리니 여유 있게 예약해요." },
  { id:"makeup",       cat:"스드메",         emoji:"💄", title:"헤어·메이크업",     value:"드이희",                   status:"done",       budget:"", memo:"", phase:"p2", tip:"본식·리허설 메이크업을 함께 확인해요." },
  { id:"studiohair",   cat:"스드메",         emoji:"💇", title:"스튜디오 헤어변형", value:"다희",                     status:"done",       budget:"", memo:"", phase:"p2", tip:"촬영 콘셉트에 맞춰 미리 상담해요." },
  { id:"suit",         cat:"스드메",         emoji:"🤵", title:"예복",              value:"",                         status:"todo",       budget:"", memo:"", phase:"p4", tip:"맞춤은 가봉까지 한 달 이상 걸려요." },
  { id:"snap",         cat:"본식 촬영·영상", emoji:"📸", title:"본식 스냅",         value:"노이프로젝트",              status:"done",       budget:"", memo:"", phase:"p3", tip:"주말 예약이 빨리 차므로 일찍 잡아요." },
  { id:"dvd",          cat:"본식 촬영·영상", emoji:"📹", title:"본식 DVD(영상)",    value:"",                         status:"todo",       budget:"", memo:"", phase:"p3", tip:"스냅과 함께 묶으면 비용을 아낄 수 있어요." },
  { id:"iphone",       cat:"본식 촬영·영상", emoji:"📱", title:"아이폰 스냅",       value:"",                         status:"todo",       budget:"", memo:"", phase:"p6", tip:"하객 스냅 담당을 미리 정해요." },
  { id:"phototable",   cat:"본식 촬영·영상", emoji:"🎞️", title:"포토테이블 인화",   value:"",                         status:"todo",       budget:"", memo:"", phase:"p6", tip:"예식 1~2주 전 인화해요." },
  { id:"band",         cat:"예물·부케",      emoji:"💍", title:"웨딩밴드",          value:"불가리",                   status:"done",       budget:"", memo:"", phase:"p2", tip:"맞춤 제작은 3~4주 이상 걸려요." },
  { id:"bouquetshoot", cat:"예물·부케",      emoji:"🌹", title:"촬영 부케",         value:"플래너님",                 status:"done",       budget:"", memo:"", phase:"p3", tip:"촬영 당일 콘셉트에 맞춰 준비해요." },
  { id:"bouquet",      cat:"예물·부케",      emoji:"💐", title:"본식 부케",         value:"플래너님",                 status:"done",       budget:"", memo:"", phase:"p6", tip:"예식 2~3일 전 생화로 주문해요." },
  { id:"hanbokbride",  cat:"한복·혼주",      emoji:"👚", title:"신부 한복",         value:"",                         status:"todo",       budget:"", memo:"", phase:"p4", tip:"대여·맞춤 모두 최소 한 달 여유를 둬요." },
  { id:"hanbokgroom",  cat:"한복·혼주",      emoji:"👔", title:"신랑 한복",         value:"",                         status:"todo",       budget:"", memo:"", phase:"p4", tip:"신부 한복과 함께 톤을 맞춰요." },
  { id:"parenthanbok", cat:"한복·혼주",      emoji:"👘", title:"혼주 한복",         value:"",                         status:"todo",       budget:"", memo:"", phase:"p4", tip:"양가 혼주 의상 톤을 함께 맞춰요." },
  { id:"parentsuit",   cat:"한복·혼주",      emoji:"🥻", title:"혼주 정장",         value:"",                         status:"todo",       budget:"", memo:"", phase:"p4", tip:"맞춤·대여 일정을 미리 잡아요." },
  { id:"parentmakeup", cat:"한복·혼주",      emoji:"👫", title:"혼주 메이크업",     value:"",                         status:"todo",       budget:"", memo:"", phase:"p5", tip:"본식 당일 아침 예약을 잡아요." },
  { id:"invitation",   cat:"청첩장",         emoji:"💌", title:"청첩장",            value:"",                         status:"todo",       budget:"", memo:"", phase:"p5", tip:"예식 4~6주 전 발송을 목표로 해요." },
  { id:"minvitation",  cat:"청첩장",         emoji:"📧", title:"모바일 청첩장",     value:"",                         status:"todo",       budget:"", memo:"", phase:"p5", tip:"약도·계좌·갤러리를 함께 담아요." },
  { id:"singer",       cat:"식순·인력",      emoji:"🎼", title:"축가자",            value:"",                         status:"todo",       budget:"", memo:"", phase:"p5", tip:"곡 선정과 연습 일정을 미리 맞춰요." },
  { id:"mc",           cat:"식순·인력",      emoji:"🎤", title:"사회자",            value:"",                         status:"todo",       budget:"", memo:"", phase:"p5", tip:"식순을 함께 정리할 사회자를 섭외해요." },
  { id:"honeymoon",    cat:"신혼여행",       emoji:"🏝️", title:"신혼여행",          value:"스페인 + 포르투갈",        status:"done",       budget:"", memo:"", phase:"p3", tip:"성수기·항공권은 빠를수록 저렴해요." },
  { id:"airline",      cat:"신혼여행",       emoji:"✈️", title:"항공사",            value:"",                         status:"todo",       budget:"", memo:"", phase:"p3", tip:"마일리지·경유까지 비교해 일찍 발권해요." },
];

export const won = (n) => new Intl.NumberFormat("ko-KR").format(n);
export const uid = () => "x" + Math.random().toString(36).slice(2, 8);

export const C = {
  green:    "#16A34A",
  greenBg:  "#E7F6EC",
  amber:    "#F59E0B",
  amberBg:  "#FEF3E2",
  grey:     "#8B95A1",
  greyBg:   "#EDF0F3",
  red:      "#F04452",
  t900:     "#191F28",
  t700:     "#4E5968",
  t500:     "#8B95A1",
  t400:     "#B0B8C1",
  line:     "#E5E8EB",
  card:     "#FFFFFF",
};

export const STATUS = {
  done:       { label: "확정",   color: C.green, bg: C.greenBg },
  inprogress: { label: "진행중", color: C.amber, bg: C.amberBg },
  todo:       { label: "미정",   color: C.grey,  bg: C.greyBg  },
};
