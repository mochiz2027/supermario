/**
 * ProceduralSprite — 외부 이미지 에셋 없이 Canvas API로 정교한 16×16 및 16×32 도트 스프라이트를 생성합니다.
 * 각 스프라이트는 색상 팔레트 인덱스 2D 배열로 정의되며, OffscreenCanvas에 캐싱됩니다.
 */

/** 색상 팔레트 (풍부한 음영과 하이라이트를 지원하는 슈퍼마리오 프리미엄 팔레트) */
const PALETTE: Record<string, string> = {
  _: 'transparent',     // 투명

  // 마리오 / 레드 톤
  R: '#b71515',         // 마리오 레드 (기본)
  r: '#e52521',         // 밝은 마리오 레드
  D: '#780a0a',         // 어두운 레드 (그림자)
  H: '#ff5c58',         // 레드 하이라이트

  // 오버롤 블루 / 데님
  U: '#0028a0',         // 짙은 블루 (그림자)
  u: '#0054e0',         // 마리오 블루
  L: '#3880f8',         // 밝은 블루

  // 피부톤
  S: '#f8a850',         // 피부 중간톤
  s: '#fce0a8',         // 피부 하이라이트
  d: '#c87830',         // 피부 그림자

  // 헤어 / 수염 / 브라운
  B: '#603008',         // 짙은 갈색
  b: '#884810',         // 밝은 갈색
  E: '#381800',         // 아주 어두운 갈색 / 가죽 그림자

  // 굼바 밤색
  M: '#a84000',         // 굼바 오렌지 브라운
  m: '#c85c18',         // 굼바 밝은 톤
  N: '#682000',         // 굼바 어두운 톤

  // 초록 (파이프 / 식물 / 깃발)
  G: '#009000',         // 기본 초록
  g: '#00c800',         // 밝은 초록
  P: '#005800',         // 어두운 초록
  p: '#60f040',         // 초록 하이라이트

  // 골드 / 옐로우 (물음표 블록, 코인)
  Y: '#f89800',         // 기본 골드
  y: '#f8d838',         // 밝은 옐로우
  I: '#ffe888',         // 코인 광택 화이트 옐로우
  J: '#a86000',         // 골드 그림자

  // 벽돌 블록 / 지형
  O: '#b84410',         // 벽돌 브릭 오렌지
  o: '#d86828',         // 밝은 브릭
  Q: '#782800',         // 브릭 그림자
  T: '#c88c50',         // 지면 타일 갈색
  t: '#885420',         // 지면 타일 그림자
  A: '#e8b478',         // 지면 타일 하이라이트

  // 성채 타일 (Castle)
  C: '#a84010',         // 성벽 브릭
  c: '#d86028',         // 밝은 성벽
  Z: '#581800',         // 성문 어둠
  z: '#200800',         // 성문 완전한 암흑

  // 무채색 / 하이라이트
  W: '#ffffff',         // 순백색
  w: '#d0d8e8',         // 밝은 회색
  K: '#101018',         // 검정 / 윤곽선
  k: '#484858',         // 짙은 슬레이트 회색
};

type SpriteData = string[];

/** 스프라이트 정의 (16x16 및 16x32) */
const SPRITES: Record<string, SpriteData> = {
  // ─── 작은 마리오 (Idle) ─────
  mario_idle: [
    '____rrrrrH______',
    '___rRRRRRRr_____',
    '___BBBssKd______',
    '__BbSsssSdss____',
    '__BbEESssSdss___',
    '__BEdSSSSSdBBB__',
    '____sssssssd____',
    '___RRuuuRR______',
    '__rRRuuuRRR_____',
    '_rRRuuuuuRRR____',
    '_WsRuLYLuRsw____',
    '_sssUUUUUsss____',
    '_ssUUUUUUUss____',
    '___uuu_uuu______',
    '__bBB___BBb_____',
    '_EBBB___BBBE____',
  ],

  // ─── 작은 마리오 (Walk 1) ─────
  mario_walk1: [
    '____rrrrrH______',
    '___rRRRRRRr_____',
    '___BBBssKd______',
    '__BbSsssSdss____',
    '__BbEESssSdss___',
    '__BEdSSSSSdBBB__',
    '____sssssssd____',
    '___rRRuuRR______',
    '__WsRRuuRRRs____',
    '_sssRuuuuRRss___',
    '_ssuuLYLUuus____',
    '___uuuuUUU______',
    '__bBBuuuu_______',
    '_EBBBuuuu_______',
    '_____bBB________',
    '____EBBB________',
  ],

  // ─── 작은 마리오 (Walk 2) ─────
  mario_walk2: [
    '____rrrrrH______',
    '___rRRRRRRr_____',
    '___BBBssKd______',
    '__BbSsssSdss____',
    '__BbEESssSdss___',
    '__BEdSSSSSdBBB__',
    '____sssssssd____',
    '____rRRR________',
    '___rRRRRuu______',
    '__ssuLYLuuu_____',
    '_sssUUUUuuRs____',
    '__ssuuuuuuRRw___',
    '___uuu_uuu______',
    '___BBb__bBB_____',
    '__EBBB___BBBE___',
    '________________',
  ],

  // ─── 작은 마리오 (Jump) ─────
  mario_jump: [
    '____rrrrrH______',
    '___rRRRRRRr_____',
    '___BBBssKd______',
    '__BbSsssSdss____',
    '__BbEESssSdss___',
    '__BEdSSSSSdBBB__',
    '____sssssssd____',
    '_ss_RRuuRR______',
    'sssRRRuuRRRw____',
    '_sRuLYLuRRRss___',
    '__ruUUUUuuRs____',
    '__uuuuuuuu______',
    '_bBBuu__uu______',
    'EBBBu____bBB____',
    '__________BBBE__',
    '________________',
  ],

  // ─── 슈퍼 마리오 (큰 마리오 Idle: 16×32) ─────
  mario_big_idle: [
    '____rrrrrr______',
    '___rrrrrrrrr____',
    '___rrrrrrrrr____',
    '___BBBBssKd_____',
    '__BBbSSsssSdss__',
    '__BBbEEESssSdss_',
    '__BEEddSSSSSdBBB',
    '____dssssssssd__',
    '___rrrrrrrrrr___',
    '__rrrrrrrrrrrr__',
    '__rrRRuuuuRRrr__',
    '__rrRRuuuuRRrr__',
    '_WssRRuYYuRRssW_',
    '_WssRRuYYuRRssW_',
    '_WsssUuuuuUsssW_',
    '__ss_UuuuuU_ss__',
    '_____uuuuuu_____',
    '____uuuuuuuu____',
    '___uuuuuuuuuu___',
    '___uuuuuuuuuu___',
    '___uuuu__uuuu___',
    '___uuuu__uuuu___',
    '___uuuu__uuuu___',
    '___uuuu__uuuu___',
    '___uuuu__uuuu___',
    '___uuuu__uuuu___',
    '___bBBB__BBBb___',
    '__bBBBB__BBBBb__',
    '__EBBBB__BBBBE__',
    '_EEBBBB__BBBBE__',
    '_EEBBBB__BBBBE__',
    '________________',
  ],

  // ─── 슈퍼 마리오 (큰 마리오 Walk 1: 16×32) ─────
  mario_big_walk1: [
    '____rrrrrr______',
    '___rrrrrrrrr____',
    '___rrrrrrrrr____',
    '___BBBBssKd_____',
    '__BBbSSsssSdss__',
    '__BBbEEESssSdss_',
    '__BEEddSSSSSdBBB',
    '____dssssssssd__',
    '___rrrrrrrrrr___',
    '__rrrrrrrrrrrr__',
    '__rrRRuuuuRRrr__',
    '_WssRRuYYuRRrr__',
    '_WsssRuYYuRRssW_',
    '_WssssUuuuUsssW_',
    '__ssssUuuuUss___',
    '_____uuuuuu_____',
    '____uuuuuuuu____',
    '___uuuuuuuuuu___',
    '__uuuuuuuuuuuu__',
    '__uuuu____uuuu__',
    '_uuuu______uuuu_',
    '_uuuu______uuuu_',
    '_uuuu_______uuu_',
    '_uuuu_______uuu_',
    '_uuuu_______uuu_',
    '_bBBB_______bBB_',
    'bBBBB______bBBBb',
    'EBBBB______EBBBE',
    'EEBBB______EBBBE',
    '_EBBB_______EEB_',
    '________________',
    '________________',
  ],

  // ─── 슈퍼 마리오 (큰 마리오 Walk 2: 16×32) ─────
  mario_big_walk2: [
    '____rrrrrr______',
    '___rrrrrrrrr____',
    '___rrrrrrrrr____',
    '___BBBBssKd_____',
    '__BBbSSsssSdss__',
    '__BBbEEESssSdss_',
    '__BEEddSSSSSdBBB',
    '____dssssssssd__',
    '___rrrrrrrrrr___',
    '__rrrrrrrrrrrr__',
    '__rrRRuuuuRRrr__',
    '__rrRRuYYuRRssW_',
    '_WssRRuYYuRRssW_',
    '_WsssUuuuuUsssW_',
    '__ss_UuuuuU_ss__',
    '_____uuuuuu_____',
    '____uuuuuuuu____',
    '___uuuuuuuuuu___',
    '____uuuuuuuu____',
    '____uuuuuuuu____',
    '_____uuuuuu_____',
    '_____uuuuuu_____',
    '_____uuuuuu_____',
    '_____uuuuuu_____',
    '____uuuu__uu____',
    '___bBBBB__bBB___',
    '__bBBBBB__BBBb__',
    '__EBBBBB__BBBE__',
    '_EEBBBBB__BBBEE_',
    '________________',
    '________________',
    '________________',
  ],

  // ─── 슈퍼 마리오 (큰 마리오 Jump: 16×32) ─────
  mario_big_jump: [
    '______Wss_______',
    '____rrWssrrr____',
    '___rrrrrrrrr____',
    '___BBBBssKd_____',
    '__BBbSSsssSdss__',
    '__BBbEEESssSdss_',
    '__BEEddSSSSSdBBB',
    '____dssssssssd__',
    '___rrrrrrrrrr___',
    '__rrrrrrrrrrrr__',
    '__rrRRuuuuRRrr__',
    '__rrRRuYYuRRssW_',
    '___ssRuYYuRRssW_',
    '____sUuuuuU_ssW_',
    '_____uuuuuu_____',
    '____uuuuuuuu____',
    '___uuuuuuuuuu___',
    '__uuuu____uuuu__',
    '_uuuu______uuuu_',
    '_uuuu______uuuu_',
    '_bBBB______bBB__',
    'bBBBB_____bBBBb_',
    'EBBBE_____EBBBE_',
    'EEBBE_____EEBBE_',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ],

  // ─── 슈퍼 버섯 (Super Mushroom: 16×16) ─────
  mushroom: [
    '_____rrrrrr_____',
    '___rrWWrrrrWW___',
    '__rWWWWrrrrWWWW_',
    '_rWWWWrrrrrrWWWW',
    '_rrWWrrrrrrrrWW_',
    'rRRrrrrWWWWrrrrR',
    'rRRrrrWWWWWWrrrR',
    'rRRrrrWWWWWWrrrR',
    'rRRrrrWWWWWWrrrR',
    'KKKKKKKKKKKKKKKK',
    '___ssssssssss___',
    '__ssKssKsssKss__',
    '__ssKssKsssKss__',
    '__ssssssssssss__',
    '___ddssssssdd___',
    '____KKKKKKKK____',
  ],

  // ─── 깃발 (Flag: 16×16, 봉 왼쪽에 밀착되는 ◀ 형태) ─────
  flag: [
    '_______________G',
    '_____________pGG',
    '___________pGGGG',
    '_________pGGGWGG',
    '________pGGGPWGG',
    '_______pGGPPGWGG',
    '________pGGGPWGG',
    '_________pGGGWGG',
    '___________pGGGG',
    '_____________pGG',
    '_______________G',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ],

  // ─── 성벽 타일 (Castle Brick: 16×16) ─────
  castle_brick: [
    'cccccccccccccccZ',
    'cCCCCCCCCCCCCCcZ',
    'cCCCCCCCCCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccZcccccccZ',
    'cCCCCCcZcCCCCCcZ',
    'cCCCCCcZcCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccccccccccZ',
    'cCCCCCCCCCCCCCcZ',
    'cCCCCCCCCCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccZcccccccZ',
    'cCCCCCcZcCCCCCcZ',
    'cCCCCCcZcCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
  ],

  // ─── 성 흉벽 탑 상단 (Castle Top: 16×16) ─────
  castle_top: [
    'cCCCZ_cCCCZ_cCCC',
    'cCCCZ_cCCCZ_cCCC',
    'cCCCZ_cCCCZ_cCCC',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccccccccccZ',
    'cCCCCCCCCCCCCCcZ',
    'cCCCCCCCCCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccZcccccccZ',
    'cCCCCCcZcCCCCCcZ',
    'cCCCCCcZcCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
    'cccccccccccccccZ',
    'cCCCCCCCCCCCCCcZ',
    'cCCCCCCCCCCCCCcZ',
    'ZZZZZZZZZZZZZZZZ',
  ],

  // ─── 성문 아치 (Castle Door: 16×16) ─────
  castle_door: [
    'cCCC_____CCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'ZZzzzzzzzzzZZZZZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'ZZzzzzzzzzzZZZZZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'ZZzzzzzzzzzZZZZZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'cCCzzzzzzzCCCCcZ',
    'ZZzzzzzzzzzZZZZZ',
  ],

  // ─── 마리오 (사망) ─────
  mario_die: [
    '____rrrrrH______',
    '___rRRRRRRr_____',
    '___BBBssKd______',
    '__BbSKssKdss____',
    '__BbEESssSdss___',
    '__BEdSSSSSdBBB__',
    '____sssssssd____',
    '___RRRRRRRR_____',
    '__RRRRRRRRRR____',
    '_RRuuuuuuuuRR___',
    '_ssuLYLLLYLus___',
    'sssUUUUUUUUsss__',
    '_ssuuuuuuuuuu___',
    '___uuu__uuu_____',
    '__bBB____BBb____',
    '_EBBB____BBBE___',
  ],

  // ─── 바닥 타일 (Ground) ─────
  ground: [
    'AAAAAAAAAAAAAAAt',
    'ATTTTTTTTTTTTTTt',
    'ATTTTTTTTTTTTTTt',
    'ATTTTTTTTTTTTTTt',
    'Attttttttttttttt',
    'AAAAAAAAtAAAAAAt',
    'ATTTTTTTtATTTTTt',
    'ATTTTTTTtATTTTTt',
    'ATTTTTTTtATTTTTt',
    'AtttttttAttttttt',
    'AAAtAAAAAAAAAAAt',
    'ATTtATTTTTTTTTTt',
    'ATTtATTTTTTTTTTt',
    'ATTtATTTTTTTTTTt',
    'AtttAttttttttttt',
    'tttttttttttttttt',
  ],

  // ─── 지하/동굴 바닥 타일 (Ground Blue) ─────
  ground_blue: [
    'wwwwwwwwwwwwwwwk',
    'wLLLLLLLLLLLLLLk',
    'wLLLLLLLLLLLLLLk',
    'wLLLLLLLLLLLLLLk',
    'wkkkkkkkkkkkkkkk',
    'wwwwwwwwkwwwwwwk',
    'wLLLLLLLkLLLLLLk',
    'wLLLLLLLkLLLLLLk',
    'wLLLLLLLkLLLLLLk',
    'wkkkkkkkwkkkkkkk',
    'wwwkwwwwwwwwwwwk',
    'wLLkwLLLLLLLLLLk',
    'wLLkwLLLLLLLLLLk',
    'wLLkwLLLLLLLLLLk',
    'wkkkwkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk',
  ],

  // ─── 물음표 블록 (Question Block) ─────
  question_block: [
    'IIyyyyyyyyyyyyyJ',
    'IyYYYYYYYYYYYYYJ',
    'yYYJKKKKKYYYKKyJ',
    'yYYKKyyyKKYYKKyJ',
    'yYYKyyyyyKYYYYyJ',
    'yYYYYyyyKKYYYYyJ',
    'yYYYYYYKKYYYYYyJ',
    'yYYYYYKKKYYYYYyJ',
    'yYYYYYKKKYYYYYyJ',
    'yYYYYYYYYYYYYYyJ',
    'yYYYYYKKKYYYYYyJ',
    'yYYYYYKKKYYYYYyJ',
    'yYYYYYYYYYYYYYyJ',
    'yKKYYYYYYYYYKKyJ',
    'yKKYYYYYYYYYKKyJ',
    'JJJJJJJJJJJJJJJJ',
  ],

  // ─── 빈 블록 (Empty Block) ─────
  empty_block: [
    'AAAAAAAAAAAAAAAA',
    'AttttttttttttttQ',
    'AtKKttttttttKKtQ',
    'AtKKttttttttKKtQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AttttttttttttttQ',
    'AtKKttttttttKKtQ',
    'AtKKttttttttKKtQ',
    'AttttttttttttttQ',
    'QQQQQQQQQQQQQQQQ',
  ],

  // ─── 벽돌 블록 (Brick) ─────
  brick: [
    'oooooooooooooooQ',
    'oOOOOOOOOOOOOOoQ',
    'oOOOOOOOOOOOOOoQ',
    'QQQQQQQQQQQQQQQQ',
    'oooooooQoooooooQ',
    'oOOOOOoQoOOOOOoQ',
    'oOOOOOoQoOOOOOoQ',
    'QQQQQQQQQQQQQQQQ',
    'oooooooooooooooQ',
    'oOOOOOOOOOOOOOoQ',
    'oOOOOOOOOOOOOOoQ',
    'QQQQQQQQQQQQQQQQ',
    'oooooooQoooooooQ',
    'oOOOOOoQoOOOOOoQ',
    'oOOOOOoQoOOOOOoQ',
    'QQQQQQQQQQQQQQQQ',
  ],

  // ─── 지하 벽돌 블록 (Brick Blue) ─────
  brick_blue: [
    'LLLLLLLLLLLLLLLk',
    'LuLLLLLLLLLLLLuk',
    'LuLLLLLLLLLLLLuk',
    'kkkkkkkkkkkkkkkk',
    'LLLLLLLkLLLLLLLk',
    'LuLLLLukLuLLLLuk',
    'LuLLLLukLuLLLLuk',
    'kkkkkkkkkkkkkkkk',
    'LLLLLLLLLLLLLLLk',
    'LuLLLLLLLLLLLLuk',
    'LuLLLLLLLLLLLLuk',
    'kkkkkkkkkkkkkkkk',
    'LLLLLLLkLLLLLLLk',
    'LuLLLLukLuLLLLuk',
    'LuLLLLukLuLLLLuk',
    'kkkkkkkkkkkkkkkk',
  ],

  // ─── 파이프 상단 (Pipe Top) ─────
  pipe_top: [
    'KppggggGGGGGGPPK',
    'KpgggggGGGGGGPPK',
    'KpggGggGGGGGGPPK',
    'KpgggggGGGGGGPPK',
    'KKKKKKKKKKKKKKKK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KPPPPPLLLLLLPPK',
  ],

  // ─── 파이프 몸통 (Pipe Body) ─────
  pipe_body: [
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
    '_KpggggGGGGGGPPK',
  ],

  // ─── 굼바 (걷기 1) ─────
  goomba_walk1: [
    '______NNNN______',
    '____NNmmmmNN____',
    '___NmmmmmmmmN___',
    '__NmmmMMMMmmmN__',
    '__NmMWKMMKWmN___',
    '_NmMMWKMMKWMmN__',
    '_NmMKKKMMKKKMmN_',
    '_NmMMMMMMMMMMmN_',
    'NNmMMMMMMMMMMmNN',
    'NNNNNNNNNNNNNNNN',
    '___sddssssdds___',
    '__ssddssssddss__',
    '__ssddssssddss__',
    '__EEBB____bBB___',
    '_EEBBB___bBBBE__',
    '________________',
  ],

  // ─── 굼바 (걷기 2) ─────
  goomba_walk2: [
    '______NNNN______',
    '____NNmmmmNN____',
    '___NmmmmmmmmN___',
    '__NmmmMMMMmmmN__',
    '__NmMWKMMKWmN___',
    '_NmMMWKMMKWMmN__',
    '_NmMKKKMMKKKMmN_',
    '_NmMMMMMMMMMMmN_',
    'NNmMMMMMMMMMMmNN',
    'NNNNNNNNNNNNNNNN',
    '___sddssssdds___',
    '__ssddssssddss__',
    '__ssddssssddss__',
    '___BBb____BBEE__',
    '__EBBBb___BBEE__',
    '________________',
  ],

  // ─── 굼바 (밟힘) ─────
  goomba_crushed: [
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '______NNNN______',
    '____NNmmmmNN____',
    '___NmmmmmmmmN___',
    '__NmMKWMMWKMMN__',
    '_NmmKKKMMKKKmmN_',
    'NNNNNNNNNNNNNNNN',
    'EEBBBBssssBBBBEE',
    '_EEBBBBssBBBBEE_',
    '________________',
  ],

  // ─── 코인 (기본) ─────
  coin: [
    '______YYYY______',
    '____YyyyyyyY____',
    '___YyyIIyyyYY___',
    '__YyyIIddyyyyY__',
    '__YyyIIddyyyyY__',
    '_YyyyIIddyyyyyY_',
    '_YyyyIIddyyyyyY_',
    '_YyyyIIddyyyyyY_',
    '_YyyyIIddyyyyyY_',
    '_YyyyIIddyyyyyY_',
    '__YyyIIddyyyyY__',
    '__YyyIIddyyyyY__',
    '___YyyIIyyyYY___',
    '____YyyyyyyY____',
    '______YYYY______',
    '________________',
  ],

  // ─── 깃대 (Flagpole) ─────
  flagpole: [
    '______YY________',
    '____yYYYYy______',
    '____yYYYYy______',
    '______YY________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '______ww________',
    '_____kwwk_______',
  ],
};

/** 캐시된 오프스크린 캔버스 맵 */
const spriteCache = new Map<string, OffscreenCanvas>();

/**
 * 스프라이트 데이터를 OffscreenCanvas에 렌더링하여 캐싱합니다.
 * 가변 높이(16x16, 16x32 등)를 자동으로 지원합니다.
 */
function renderToCache(_name: string, data: SpriteData): OffscreenCanvas {
  const height = data.length;
  const width = data[0]?.length ?? 16;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < height; row++) {
    const line = data[row]!;
    for (let col = 0; col < line.length; col++) {
      const ch = line[col]!;
      const color = PALETTE[ch];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(col, row, 1, 1);
    }
  }

  return canvas;
}

/**
 * 이름으로 스프라이트의 OffscreenCanvas를 가져옵니다 (lazy 캐싱).
 */
export function getSprite(name: string): OffscreenCanvas {
  let cached = spriteCache.get(name);
  if (cached) return cached;

  const data = SPRITES[name];
  if (!data) {
    throw new Error(`Unknown sprite: ${name}`);
  }

  cached = renderToCache(name, data);
  spriteCache.set(name, cached);
  return cached;
}

/**
 * 스프라이트를 메인 캔버스에 그립니다.
 * @param ctx - 메인 캔버스 렌더링 컨텍스트
 * @param name - 스프라이트 이름
 * @param x - 그릴 X 위치 (픽셀)
 * @param y - 그릴 Y 위치 (픽셀)
 * @param flipX - 좌우 반전 여부
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  flipX: boolean = false,
): void {
  const sprite = getSprite(name);
  const w = sprite.width;

  if (flipX) {
    ctx.save();
    ctx.translate(Math.floor(x) + w, Math.floor(y));
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(sprite, Math.floor(x), Math.floor(y));
  }
}

/**
 * 등록된 스프라이트 이름 목록을 반환합니다.
 */
export function getSpriteNames(): string[] {
  return Object.keys(SPRITES);
}
