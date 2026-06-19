export const CATS = [
  "예식장·플래너","스드메","본식 촬영·영상","예물·부케",
  "한복·혼주","청첩장","식순·인력","가족 행사","신혼여행",
  "피부·뷰티","신혼 살림",
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
  // ── p1 · 상견례 ──
  { id:"meetingDate",    cat:"가족 행사",      emoji:"🗓️", title:"상견례 날짜 정하기",        value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"양가 일정 조율" },
  { id:"meetingPlace",   cat:"가족 행사",      emoji:"🍽️", title:"상견례 장소(식당) 예약",     value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"홀 근처 추천" },
  { id:"meetingGift",    cat:"가족 행사",      emoji:"🎁", title:"상견례 선물 준비",          value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"양가 부모님 선물" },
  { id:"meetingPpt",     cat:"가족 행사",      emoji:"📑", title:"상견례 PPT 자료 준비하기",   value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"가족 소개 자료" },
  { id:"meetingDday",    cat:"가족 행사",      emoji:"🤝", title:"상견례 D-Day",             value:"", status:"todo", budget:"", memo:"", phase:"p1", tip:"진행 순서 확인" },

  // ── p2 · 결혼 준비 시작 ──
  { id:"weddingcafe",    cat:"예식장·플래너",  emoji:"☕", title:"웨딩 카페 가입",            value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"추천인 혜택" },
  { id:"planner",        cat:"예식장·플래너",  emoji:"💛", title:"박람회 또는 플래너 상담",     value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"계약 전 비교" },
  { id:"venue",          cat:"예식장·플래너",  emoji:"🏛️", title:"웨딩홀 투어 & 계약",         value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"날짜·홀·식대 확정" },
  { id:"sdm",            cat:"스드메",         emoji:"📷", title:"스드메 상담 & 계약",         value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"스튜디오·드레스·메이크업" },
  { id:"dress",          cat:"스드메",         emoji:"👰", title:"결혼식 드레스 투어 & 계약",   value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"투어 일정 여유 있게" },
  { id:"band",           cat:"예물·부케",      emoji:"💍", title:"웨딩밴드 투어 & 구매",       value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"제작 3~4주" },
  { id:"honeymoon",      cat:"신혼여행",       emoji:"🏝️", title:"신혼여행 계약",             value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"항공권 일찍" },
  { id:"suit",           cat:"스드메",         emoji:"🤵", title:"신랑 예복 투어 & 계약",      value:"", status:"todo", budget:"", memo:"", phase:"p2", tip:"가봉까지 한 달+" },

  // ── p3 · 웨딩데이 6~5개월 전 ──
  { id:"parenthanbok",   cat:"한복·혼주",      emoji:"👘", title:"혼주 한복 & 메이크업 계약",   value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"양가 톤 맞춤" },
  { id:"hanbokbride",    cat:"한복·혼주",      emoji:"👚", title:"신부 한복",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"최소 한 달 여유" },
  { id:"hanbokgroom",    cat:"한복·혼주",      emoji:"👔", title:"신랑 한복",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"신부와 톤 맞춤" },
  { id:"parentsuit",     cat:"한복·혼주",      emoji:"🥻", title:"혼주 정장",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"맞춤·대여 일정" },
  { id:"dressfit",       cat:"스드메",         emoji:"✂️", title:"스튜디오 촬영 드레스 가봉",   value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"콘셉트 맞춰 가봉" },
  { id:"suitfit",        cat:"스드메",         emoji:"🧵", title:"신랑 예복 가봉",            value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"맞춤 예복 가봉" },
  { id:"studiohair",     cat:"스드메",         emoji:"💇", title:"스튜디오 헤어변형",         value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"콘셉트 상담" },
  { id:"shootprops",     cat:"예물·부케",      emoji:"🎈", title:"웨딩 촬영용 소품 준비",      value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"부케·풍선 등" },
  { id:"studioshoot",    cat:"스드메",         emoji:"🎬", title:"스튜디오 촬영 진행",         value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"당일 콘셉트 확인" },
  { id:"snap",           cat:"본식 촬영·영상", emoji:"📸", title:"본식 스냅",                value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"주말 예약 빨리" },
  { id:"dvd",            cat:"본식 촬영·영상", emoji:"📹", title:"본식 DVD(영상)",           value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"스냅과 묶으면 절약" },
  { id:"airline",        cat:"신혼여행",       emoji:"✈️", title:"신혼여행 항공사",           value:"", status:"todo", budget:"", memo:"", phase:"p3", tip:"마일리지 비교" },

  // ── p4 · 웨딩데이 4~3개월 전 ──
  { id:"skincare",       cat:"피부·뷰티",      emoji:"🧴", title:"신랑신부 피부관리 시작",      value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"보톡스·치아미백 미리" },
  { id:"invitation",     cat:"청첩장",         emoji:"💌", title:"모바일 & 종이 청첩장 제작",   value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"4~6주 전 발송 목표" },
  { id:"mc",             cat:"식순·인력",      emoji:"🎤", title:"사회자 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"식순 함께 정리" },
  { id:"singer",         cat:"식순·인력",      emoji:"🎼", title:"축가자 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"곡·연습 일정" },
  { id:"moneydesk",      cat:"식순·인력",      emoji:"💰", title:"축의대 섭외",              value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"접수 담당 지정" },
  { id:"bouquetgirl",    cat:"식순·인력",      emoji:"👜", title:"부케&가방순이 섭외",        value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"부케·가방 담당" },
  { id:"appliances",     cat:"신혼 살림",      emoji:"🔌", title:"신혼 가전 계약",            value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"가전 비교 계약" },
  { id:"invitationmeet", cat:"청첩장",         emoji:"🥂", title:"청첩장 모임 시작",          value:"", status:"todo", budget:"", memo:"", phase:"p4", tip:"모임 일정 잡기" },

  // ── p5 · 웨딩데이 2~1개월 전 ──
  { id:"prevideo",        cat:"본식 촬영·영상", emoji:"🎞️", title:"식전 영상 제작",           value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"상영 영상 제작" },
  { id:"minvitationsend", cat:"청첩장",         emoji:"📧", title:"모바일 청첩장 발송",        value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"약도·계좌·갤러리" },
  { id:"dressfitfinal",   cat:"스드메",         emoji:"👗", title:"본식 드레스 피팅",          value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"최종 피팅" },
  { id:"bouquet",         cat:"예물·부케",      emoji:"💐", title:"본식 부케 주문",            value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"2~3일 전 생화" },
  { id:"rehearsal",       cat:"식순·인력",      emoji:"🎬", title:"본식 리허설 확인(~2주 전)",  value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"음향·조명·꽃 정리" },
  { id:"phototable",      cat:"본식 촬영·영상", emoji:"🖼️", title:"포토테이블 인화",          value:"", status:"todo", budget:"", memo:"", phase:"p5", tip:"1~2주 전 인화" },

  // ── p6 · 웨딩데이 2주 전 ──
  { id:"ceremonyorder",  cat:"식순·인력",      emoji:"📋", title:"식순 확정",                value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"사회자와 최종 확정" },
  { id:"skincaution",    cat:"피부·뷰티",      emoji:"🚫", title:"다운타임 있는 피부관리 금지", value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"멍·부기 시술 금지" },
  { id:"iphone",         cat:"본식 촬영·영상", emoji:"📱", title:"아이폰 스냅(하객 담당)",     value:"", status:"todo", budget:"", memo:"", phase:"p6", tip:"하객 담당 지정" },

  // ── p7 · 웨딩데이 1주 전 ──
  { id:"guestcount",     cat:"식순·인력",      emoji:"👥", title:"하객 수 최종 점검",         value:"", status:"todo", budget:"", memo:"", phase:"p7", tip:"최종 인원 확인" },
  { id:"giftenvelope",   cat:"식순·인력",      emoji:"✉️", title:"사례비 봉투 준비",          value:"", status:"todo", budget:"", memo:"", phase:"p7", tip:"봉투 미리 준비" },

  // ── p8 · D-1 ──
  { id:"hanbokpickup",   cat:"한복·혼주",      emoji:"👘", title:"혼주 한복 픽업",            value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"전날 픽업" },
  { id:"suitpickup",     cat:"스드메",         emoji:"🤵", title:"신랑 예복 픽업",            value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"전날 픽업" },
  { id:"shoesprops",     cat:"예물·부케",      emoji:"👠", title:"웨딩 슈즈·부케 등 소품 준비", value:"", status:"todo", budget:"", memo:"", phase:"p8", tip:"슈즈·부케·소품" },
];

export const won = (n) => new Intl.NumberFormat("ko-KR").format(n);
export const uid = () => "x" + Math.random().toString(36).slice(2, 8);
export const makeCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

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
