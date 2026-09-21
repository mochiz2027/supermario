---
name: jev-decision
description: TypeSafe Jev(System One) 모델을 호출하여 텍스트 토큰 생성 비용 없이 70~500ms 내에 빠른 분기 선택(Choice) 및 위험 검증(Noul)을 수행합니다. 다중 분기 선택, 위험한 작업 사전 검증, 도구 호출 라우팅 시 사용합니다.
---

# Jev Decision Skill

## When to use this skill
- 에이전트 작업 중 여러 갈래의 실행 옵션 중 하나를 빠르게 선택해야 할 때
- 파일 삭제, 빌드 배포, DB 초기화 등 위험성이 있는 명령을 실행하기 전 검증이 필요할 때
- 비싼 LLM 생성 토큰을 낭비하지 않고 결정론적(Deterministic) 결정을 내려야 할 때

## Workflow & Instructions
1. 상황 문맥(State)과 가능한 선택지 목록(쉼표로 구분)을 준비합니다.
2. 아래 명령어로 파이썬 스크립트를 실행합니다:
   ```bash
   python .agent/skills/jev-decision/scripts/jev_decide.py "<상황 설명>" "<선택지1,선택지2,선택지3>"