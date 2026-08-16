# AI 빌더스 랩 원페이지

## 로컬 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 확인과 빌드

```bash
npm run check
npm run test
npm run build
```

페이지 원본은 `index.html`, `styles.css`, `script.js`, `assets/`에 있습니다. 별도 프레임워크나 화면 라이브러리를 사용하지 않습니다.

## Airtable 교육 신청 설정

1. [수강생 DB 설정 문서](docs/airtable-student-db.md)를 따라 Airtable Base와 공개 신청 폼을 만듭니다.
2. 공개 폼을 `Anyone on the web`으로 공유하고 `See who submitted`는 끕니다.
3. [site-config.js](site-config.js)의 `AIRTABLE_FORM_URL`에 실제 Airtable 폼 공유 주소만 입력합니다.
4. 다시 `npm run check && npm run test && npm run build`를 실행합니다.

공개 폼 주소가 비어 있으면 홈페이지 신청 버튼은 `신청 폼 준비 중`으로 비활성화되고, 개인 카카오톡 문의만 제공합니다. Airtable API 키, Base ID, Table ID는 이 저장소나 브라우저 코드에 넣지 않습니다.

신청서가 들어오면 운영자가 Airtable 내부에서 휴대전화 정규화 값, 이름, 닉네임을 함께 확인한 뒤 기존 빌더 연결 또는 새 빌더 생성을 처리합니다. 같은 번호만으로 자동 병합하지 않습니다.
