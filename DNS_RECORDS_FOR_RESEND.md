# grupopremo.com 도메인 Resend 인증을 위한 DNS 레코드

DNS 관리자 (servidoresdns.net)에게 아래 레코드 추가를 요청하세요.

## 1. SPF 레코드 (기존 레코드에 추가)
- **Type**: TXT
- **Name**: @ (루트 도메인)
- **Value**: `v=spf1 include:amazonses.com include:_spf.resend.com ~all`

## 2. DKIM 레코드 (새로 추가)
- **Type**: TXT  
- **Name**: `resend._domainkey`
- **Value**: 
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDy0ZZxlbPai3cNlzgbhqmD6XnyEW/fJqkEisnkbr7Oal7M3jCeca2uLigtBjZBxMdiw28KYPvIF39IwCQ0Qwdifnk+VkRlCwCGXvJmR6Z9GvDv+aMthOJQ2QFXY7WNCSnJJDaTYD6WY+ri3k/p+ckKUJezLX+Hq40A+PJivdLtOwIDAQAB
```

## 3. (선택) MX 레코드 - 수신 이메일 필요시
- **Type**: MX
- **Name**: `feedback-smtp.us-east-1.amazonses.com`
- **Priority**: 10

---

DNS 레코드 추가 후 https://resend.com/domains 에서 인증 상태 확인
인증 완료 후 이메일 발송이 정상 작동합니다.
