# PowerShell 스크립트 - Windows에서 실행
# 1. 이 파일을 Windows에서 실행: powershell -ExecutionPolicy Bypass -File setup-pa.ps1

$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Edge를 Power Automate 페이지로 열기
Start-Process $EdgePath -ArgumentList "https://make.powerautomate.com"

Write-Host "Edge가 열렸습니다."
Write-Host ""
Write-Host "=== 수동 완료 단계 ==="
Write-Host "1. Microsoft 로그인 (minho.kim@grupopremo.com / Alshtm***REMOVED***!@)"
Write-Host "2. Create > Automated cloud flow"
Write-Host "3. 이름: Resend-Email-Forward"
Write-Host "4. Gmail 검색 > When a new email arrives"
Write-Host "5. Gmail 연결 (koghminho@gmail.com / wns***REMOVED***8392!@)"
Write-Host "6. + New step > Outlook Send an email"
Write-Host "7. Save"
