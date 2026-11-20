# AI 빌더스 랩 홈페이지

동탄 AI 빌더스 랩의 정적 홈페이지입니다. 별도 프레임워크나 외부 분석·결제 서비스를 사용하지 않습니다.

## 로컬 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 확인과 빌드

```bash
npm run check
npm run build
npm run test
```

`npm run test`는 교육 섹션, 카카오 CTA, 로고 MP4 연결, 공개 Google Calendar, JSON-LD, sitemap, 설치 페이지 보존 조건을 검사합니다. 실제 버튼 조작과 영상 재생은 브라우저에서 별도로 확인합니다.

## 로고 영상과 홈페이지 스타일

홈페이지는 `home.css`, 기존 상세·멤버 도구 화면은 `styles.css`를 사용합니다. 새 로고 영상은 `assets/builderslab-brand-motion.mp4`이며 12초·1920×1080·30fps·무음 반복 영상입니다. 기존 로고와 Wanted Sans를 사용하고 외부 영상 서비스나 브라우저 애니메이션 라이브러리를 추가하지 않습니다.

오프라인 재렌더링에는 설치된 `@napi-rs/canvas`와 FFmpeg가 필요합니다. `NODE_PATH`를 해당 패키지 폴더로 지정하고 `node scripts/render-brand-motion.cjs`를 실행합니다. `--preview`를 붙이면 확인용 JPG만 생성합니다. 영상 인코딩이 성공한 뒤에만 기존 MP4를 교체합니다. Wanted Sans 공식 출처는 `https://github.com/wanteddev/wanted-sans`, 라이선스는 `assets/fonts/OFL.txt`에 포함합니다.

## 공개 운영 정보

- 수요일·토요일, 3시간
- 참가비 20,000원, 3시간
- 그 외 시간은 별도 연락 후 협의
- 최대 3명, 동탄
- 개인 노트북과 충전기 지참
- 주 신청 채널: 개인 카카오톡
- 당근 모임은 보조 채널로 제공합니다.

정확한 일정, 공간, 주차, 신청 확정 절차, 취소·환불·노쇼 기준은 신청 전 개인 카카오로 확인합니다. 공개 댓글과 채팅에는 주민등록번호, 상세 주소, 계정 비밀번호, API 키, 결제정보를 보내지 마세요.

히어로 브랜드 영상은 웹용 경량 MP4를 음소거 상태로 자동·반복 재생하며, 모션 감소 설정에서는 정지합니다.

## Google Calendar 실시간 연동

메인 일정 영역은 공개된 AI 빌더스 랩 Google Calendar를 직접 표시합니다. 데스크톱에서는 월간 보기, 모바일에서는 일정 목록 보기를 사용하며 `일정 새로고침` 버튼으로 최신 공개 일정을 다시 불러올 수 있습니다. 별도의 API 키나 비밀키는 사용하지 않습니다.

## 관련 페이지

- `hermes.html`: Hermes와 LLM Wiki 3시간 상세 안내
- 메인 교육 선택: 홈페이지, 대시보드, 게임, 웹 레포트, Hermes와 LLM Wiki 기본 설치
- `install/`: macOS·Windows 설치 사전 안내
- `lounge/`: 빌더스 라운지 홈(검색 제외). 다음 기수 신청, 샘플 영상 미리보기, 빌더 결과물, 참여 안내를 한 화면에 모읍니다. `AI 회의록`과 `AI 쇼츠 스튜디오`는 이름과 연결 자리만 제공하며 OAuth, 업로드, 생성, 결제는 포함하지 않습니다.
- `lounge/apply/`: 기수별 신청 안내. 신청은 `site-config.js`의 개인 카카오톡 링크로만 받습니다.
- `lounge/data/cohorts.js`: 다음 기수 모집 상태(`모집 중`·`대기 신청`·`마감`, 정원, 신청 인원)와 기수별 정보·수료생 수. `lounge/data/faq.js`: 공개 페이지 FAQ. 바꾼 뒤 `npm run build`(또는 `npm run lounge:render`)를 실행하면 `scripts/render-lounge.mjs`가 홈·신청·샘플·쇼케이스 HTML과 JSON-LD를 다시 씁니다. `npm test`는 HTML이 데이터와 다르면 실패합니다.
- `lounge/upload/`: 로그인 없이 한 화면에 한 질문씩 답하는 결과물 올리기(검색 제외). 기존 `/lounge/api/entries`를 그대로 사용합니다.
- `lounge/showcase/`: 로그인 없는 공개 결과물 쇼케이스. 파일은 `services/showcase-api`가 VPS 디스크에 저장합니다.
- `lounge/samples/`: 수업용 샘플 영상 11편. 영상 파일은 서버의 `/lounge/media/samples/`에 있습니다.
- 적용 순서는 `deploy/README.md`를 따릅니다.
- `site-config.js`: 공개 신청 채널, 교육 정보, 캘린더 주소

비밀키, 토큰, 비밀번호, 결제정보를 저장소나 공개 문서에 넣지 않습니다.
