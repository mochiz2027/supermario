# 2D 레트로 플랫폼 게임(Super Mario Style) 개발 가이드

이 문서는 구글 안티그래비티(Google Antigravity) 에이전트 환경에서 2D 횡스크롤 플랫폼 게임을 기획부터 구현, 검증까지 일관되게 진행할 수 있도록 작성된 종합 개발 명세서(Specification)입니다.

---

## 1. 프로젝트 개요 및 환경 규격

* **게임 장르**: 2D 정통 횡스크롤 플랫포머 (Super Mario Bros. 스타일)
* **목표 플랫폼**: Web Browser (데스크톱 및 모바일 반응형 터치 지원)
* **기술 스택**: 
  * **런타임 & 빌드**: Vite + TypeScript (모던 모듈러 환경)
  * **렌더링 엔진**: HTML5 Canvas 2D API (외부 대형 엔진 의존성 없이 가볍고 결정론적 제어 가능) 또는 Phaser 3
  * **사운드**: Web Audio API (외부 에셋 다운로드 실패 방지를 위한 8비트 절차적 사운드 신시사이저 내장)
* **해상도 및 뷰포트**:
  * 내부 가상 해상도: $256 \times 240$ 픽셀 (NES 정규 규격)
  * 화면 렌더링: CSS `image-rendering: pixelated` 적용, 뷰포트 비율에 맞춘 정수 배율(Scale: $2\times, 3\times, 4\times$) 자동 업스케일링
  * 목표 프레임: 고정 60 FPS ($dt \approx 0.0167\text{s}$)

---

## 2. 디렉터리 아키텍처

안티그래비티 환경에서 모듈 간 책임을 분리하고 파일 단위 작업을 최적화하기 위한 구조입니다:

```text
super-mario-game/
├── index.html                  # 캔버스 뷰포트 및 진입점
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                 # 게임 루프 및 씬 관리자 초기화
│   ├── core/
│   │   ├── Game.ts             # 메인 루프 (Fixed Timestep Loop)
│   │   ├── Input.ts            # 키보드 / 가상 터치 입력 핸들러
│   │   ├── Camera.ts           # 횡스크롤 추적 및 좌측 락(Lock)
│   │   └── Sound.ts            # Web Audio API 칩튠 사운드 엔진
│   ├── physics/
│   │   ├── Collision.ts        # AABB 바운딩 박스 및 타일맵 충돌 판정
│   │   └── Vector2.ts          # 2차원 벡터 연산 클래스
│   ├── entities/
│   │   ├── Entity.ts           # 베이스 엔티티 인터페이스
│   │   ├── Player.ts           # 마리오 물리, 상태머신(작은/큰 상태, 웅크리기)
│   │   └── Goomba.ts           # 굼바 AI (순찰, 밟힘 판정)
│   ├── levels/
│   │   ├── Tilemap.ts          # 타일셋 배열 파서 및 타일 렌더러
│   │   └── Level1_1.ts         # 1-1 스테이지 데이터 정의 (타일, 오브젝트 배치)
│   ├── graphics/
│   │   └── ProceduralSprite.ts # 외부 이미지 없이 즉시 그리는 도트 스프라이트
│   └── ui/
│       └── HUD.ts              # 상단 점수, 코인, 월드, 남은 시간 렌더링
└── .agent/
    └── workflows/              # 안티그래비티 에이전트 전용 작업 지침
```

---

## 3. 핵심 물리 엔진 사양 (Physics Specifications)

모든 물리 계산은 이산 시간 미분 방정식에 따라 매 틱(Tick)마다 고정 시간 단계($\Delta t = 1/60$)로 갱신합니다.

### 3.1 플레이어 운동역학 (Kinematics)

1. **수평 이동 (Horizontal Movement)**:
   * 걷기 가속도: $a_{\text{walk}} = 0.098\,\text{px}/\text{frame}^2$
   * 달리기(대시) 가속도: $a_{\text{run}} = 0.14\,\text{px}/\text{frame}^2$
   * 최대 걷기 속도: $v_{\text{walk\_max}} = 1.5\,\text{px}/\text{frame}$
   * 최대 달리기 속도: $v_{\text{run\_max}} = 2.5\,\text{px}/\text{frame}$
   * 마찰 감속도(Friction): 입력이 없을 때 $f = 0.08\,\text{px}/\text{frame}^2$로 감속
   * 역방향 브레이크(Skid): 이동 중 반대 키 입력 시 급감속 적용 ($f_{\text{skid}} = 0.18\,\text{px}/\text{frame}^2$)

2. **수직 점프 및 중력 (Vertical Jump & Gravity)**:
   * 기본 하향 중력: $g = 0.35\,\text{px}/\text{frame}^2$
   * 점프 초속도: $v_{\text{jump0}} = -4.0\,\text{px}/\text{frame}$
   * **가변 점프(Variable Height Jump)**:
     * 점프 키를 누르고 있는 동안: 기본 중력 $g$ 적용
     * 점프 상승 중($v_y < 0$) 점프 키를 뗐을 때: 중력을 $3 \times g$로 급증시켜 낮은 점프로 즉시 전이
   * 최대 낙하 종단 속도(Terminal Velocity): $v_{y\text{\_max}} = 4.5\,\text{px}/\text{frame}$

### 3.2 충돌 판정 규칙 (Collision Rules)

* **타일맵 크기**: 단일 타일은 $16 \times 16$ 픽셀 그리드.
* **AABB 분리 축 충돌(Separating Axis)**:
  * 수평 이동 후 수평 충돌($X$축) 검사 $\rightarrow$ 침투 보정 및 $v_x = 0$.
  * 수직 이동 후 수직 충돌($Y$축) 검사 $\rightarrow$ 침투 보정 및 $v_y = 0$.
* **특수 상호작용**:
  * **아래에서 천장 타격 (Headbonk)**: $v_y < 0$ 상태에서 타일 상단 충돌 시 해당 타일의 액션 트리거.
    * 물음표 블록(? Block): 코인 사운드 재생, 코인 스프라이트 튀어오름, 빈 블록(Empty Block)으로 변환.
  * **적 밟기 (Stomp)**:
    * 플레이어가 하강 중($v_y > 0$) 적의 상단 $25\%$ 높이와 교차 시 발생.
    * 적은 `crushed` 상태로 전이 (일정 시간 후 소멸).
    * 플레이어는 반동 도약력 부여 ($v_y = -3.0\,\text{px}/\text{frame}$).

---

## 4. 사운드 시스템 (Web Audio API Synthesizer)

외부 오디오 에셋 404 에러나 라이선스 문제를 배제하기 위해, 자바스크립트 내장 `AudioContext`로 8비트 사운드를 실시간 합성합니다.

* **점프음 (Jump SFX)**:
  * 주파수: $150\,\text{Hz} \rightarrow 600\,\text{Hz}$ (주파수 지수 상승 0.15초)
  * 파형: Square(사각파)
* **코인 획득음 (Coin SFX)**:
  * 주파수: $987\,\text{Hz}$ ($B_5$) 0.08초 재생 후 $1318\,\text{Hz}$ ($E_6$) 0.25초 유지
  * 파형: Sine(사인파)
* **적 밟기음 (Stomp SFX)**:
  * 주파수: $120\,\text{Hz} \rightarrow 40\,\text{Hz}$ (급격한 감쇠 0.1초)
  * 파형: Triangle(삼각파)
* **플레이어 사망 (Die SFX)**:
  * 주파수: $500\,\text{Hz} \rightarrow 100\,\text{Hz}$ 하강 아르페지오

---

## 5. 단계별 구현 마일스톤 (Milestones)

안티그래비티 에이전트에게 지시할 개발 단계 순서입니다.

```
[Phase 1: 기반 세팅]
  ├── Vite 환경 구성 및 256x240 Canvas 렌더 루프 구현
  └── 절차적 도트 생성기(ProceduralSprite) 작성 (플레이어, 바닥 타일, 물음표 블록)

[Phase 2: 코어 물리 & 조작]
  ├── Input 시스템 (화살표/WASD + Space 점프)
  ├── Player 클래스 물리 방정식($v_x, v_y, g$) 및 가변 점프 완성
  └── 고정 바닥 타일과의 AABB 착지 판정

[Phase 3: 타일맵 & 월드 1-1]
  ├── 16x16 그리드 타일맵 시스템 구현
  ├── 물음표 블록(?), 벽돌, 바닥, 파이프 배치
  └── 수평 추적 카메라 (뒤로 돌아가지 못하는 좌측 스크롤 락 구현)

[Phase 4: 적(Enemy) 및 상호작용]
  ├── 굼바(Goomba) 좌우 순찰 및 벽 튕김 AI
  ├── 플레이어-적 충돌 분기 (상단 밟기 vs 측면 피격 사망)
  └── Web Audio 사운드 연동

[Phase 5: UI & 게임 상태]
  ├── 상단 HUD (SCORE, COIN, WORLD 1-1, TIME 카운트다운)
  ├── 게임 오버 / 스테이지 클리어 깃대 시퀀스
  └── 모바일 화면을 위한 가상 D-Pad 및 A/B 터치 컨트롤러 오버레이
```

---

## 6. 안티그래비티 에이전트 실행 지침 (Prompt Template)

프로젝트 개발 시 안티그래비티 채팅창에 아래와 같이 프롬프트를 입력하여 작업을 위임합니다.

> **안티그래비티 작업 시작 프롬프트 예시**:
> 
> ```text
> 프로젝트 루트의 SUPER_MARIO_DEV_GUIDE.md 문서를 분석해줘.
> 
> 먼저 [Phase 1]과 [Phase 2]를 수행할 거야:
> 1. Vite + TypeScript 환경을 구성하고, 외부 이미지 파일 없이 Canvas 2D에 절차적으로 도트를 렌더링하는 ProceduralSprite 모듈을 만들어줘.
> 2. 가변 점프와 관성 감속이 포함된 Player 물리 엔진과 바닥 충돌 판정을 완성하고, index.html을 브라우저에서 열었을 때 방향키와 스페이스바로 조작할 수 있게 해줘.
> ```