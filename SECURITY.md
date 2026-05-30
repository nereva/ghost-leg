# Security Policy

## Supported Versions

현재 보안 업데이트가 지원되는 버전은 아래와 같습니다.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

네온 시크릿 사다리 게임은 순수 클라이언트 사이드(HTML/CSS/JS) 애플리케이션으로 서버와 데이터베이스를 사용하지 않아 대부분의 웹 보안 위협으로부터 안전합니다. 

하지만 보안 취약점을 발견하셨다면 다음 절차를 따라주세요.

1. 공개적인 GitHub Issue 대신, 이 저장소의 **[Security > Advisories]** 탭을 통해 '비공개 취약점 보고(Private vulnerability reporting)' 기능으로 제보해 주세요.
2. 제보하실 때는 취약점을 재현할 수 있는 상세한 단계와 스크린샷 등을 포함해 주시면 빠른 확인에 도움이 됩니다.
3. 제보 후 48시간 이내에 접수 확인 및 조치 계획에 대해 회신드리겠습니다.

여러분의 제보가 프로젝트를 더 안전하게 만듭니다. 감사합니다!

## Security Audits

현재 프로젝트는 기본적인 보안 점검을 마쳤습니다.
- **XSS(Cross-Site Scripting) 방지**: 사용자 입력값(이름, 상품명)을 화면에 출력할 때 `innerHTML` 대신 안전한 `textContent`를 사용하여 악성 스크립트 실행을 원천 차단했습니다.
- **데이터 처리**: 모든 게임 데이터는 브라우저 메모리상에서만 휘발성으로 처리되며 어딘가로 전송되거나 저장되지 않습니다.
