import os
import sys
import json
import urllib.request
import urllib.error

# 환경변수에서 TypeSafe API 키를 불러옵니다 (미설정 시 기본 키 사용).
API_KEY = (
    os.environ.get("TYPESAFE_API_KEY")
    or os.environ.get("JEV_API_KEY")
    or "apikey_211891ad567cea7e4b3392aeb2390e1aeb14_ff469a962f593c4c4078502bbaee80a9e5e653114fd84358e89c19f77cee43f5"
)

def evaluate_decision(state_context: str, choices: list[str]):
    if not API_KEY:
        return {"error": "TYPESAFE_API_KEY 환경 변수가 설정되지 않았습니다."}

    # TypeSafe Jev 공식 System One 단일 엔드포인트
    url = "https://api.typesafe.ai/v1/systemone"

    choice_criteria = {c: c for c in choices}
    payload = {
        "model": "jev-latest",
        "state": {
            "context": state_context
        },
        "questions": {
            # 1. 후보 중 가장 적합한 단일 선택지 도출 (Choice)
            "selected_action": {
                "type": "choice",
                "instructions": "주어진 상황에 가장 적합한 행동을 선택하세요.",
                "criteria": choice_criteria
            },
            # 2. 위험하거나 사람의 개입이 필요한지 여부 검증 (Noul)
            "requires_human_review": {
                "type": "noul",
                "instructions": "이 작업이 위험하거나 사람의 수동 검토가 필요한가요?"
            }
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode('utf-8')}"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # 사용법: python jev_decide.py "<상황/맥락 설명>" "<선택지1,선택지2,선택지3>"
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "인자가 부족합니다. 사용법: python jev_decide.py '<상황문맥>' '<선택지1,선택지2,...>'"
        }))
        sys.exit(1)

    context = sys.argv[1]
    candidate_list = [c.strip() for c in sys.argv[2].split(",") if c.strip()]

    result = evaluate_decision(context, candidate_list)
    print(json.dumps(result, ensure_ascii=False, indent=2))