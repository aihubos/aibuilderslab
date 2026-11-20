# 빌더 결과물 쇼케이스 적용

이 문서는 제안된 서버 설정입니다. 저장소에 기존 `nginx.conf`, `docker-compose.yml`, `deploy.sh`는 없습니다. 운영 중인 `/opt/aibuilderslab/nginx.conf`와 웹 컨테이너 마운트에 아래 내용을 직접 넣습니다.

쇼케이스 API와 업로드는 `/opt/aibuilderslab/public` 안에 두면 안 됩니다. `deploy.sh`의 `rsync -a --delete`가 그 디렉터리를 지웁니다.

정적 페이지는 `lounge/showcase/`입니다. 라운지 본문(`/lounge/`)은 계속 `noindex,nofollow`이고, 쇼케이스만 `index,follow`입니다.

## 1. 디렉터리와 관리 토큰

토큰 파일은 저장소에 넣지 않습니다.

```bash
sudo install -d -o 1000 -g 1000 -m 750 /opt/aibl-showcase/data
sudo install -d -o 1000 -g 1000 -m 750 /opt/aibl-showcase/uploads
sudo install -d -o 1000 -g 1000 -m 755 /opt/aibl-showcase/media/samples
sudo install -d -o 1000 -g 1000 -m 700 /opt/aibl-showcase/secrets
sudo install -d -o root -g root -m 750 /opt/backups/aibl-showcase
umask 077
openssl rand -base64 32 | sudo tee /opt/aibl-showcase/secrets/admin-token >/dev/null
sudo chown 1000:1000 /opt/aibl-showcase/secrets/admin-token
sudo chmod 600 /opt/aibl-showcase/secrets/admin-token
```

관리 화면은 `https://aibuilderslab.kr/lounge/showcase/?admin` 입니다. 토큰은 페이지 입력칸에 넣고, 요청 헤더 `X-Admin-Token`으로만 전송합니다. URL에 붙이지 않습니다.

Turnstile을 쓰려면 컨테이너 환경변수 `TURNSTILE_SITE_KEY`와 `TURNSTILE_SECRET_KEY`만 넣습니다. 둘 다 비어 있으면 확인 단계는 꺼집니다.

## 2. API 컨테이너

코드가 `/opt/aibuilderslab/src`에 들어온 뒤:

```bash
cd /opt/aibuilderslab/src
sudo docker compose -f deploy/docker-compose.showcase.yml build
sudo docker compose -f deploy/docker-compose.showcase.yml up -d
sudo docker compose -f deploy/docker-compose.showcase.yml ps
curl -fsS http://127.0.0.1:4332/health
```

서비스 이름과 컨테이너 이름은 `aibl-showcase-api`입니다. `aibuilderslab_default` 네트워크에만 붙고, 공개 포트는 없습니다. 디버그는 `127.0.0.1:4332`입니다. 루트 파일시스템은 읽기 전용이고, 데이터는 `/opt/aibl-showcase/data/showcase.db`, 업로드는 `/opt/aibl-showcase/uploads/`입니다. 메모리 256MB, CPU 0.5입니다.

## 3. 웹 컨테이너 마운트

`aibuilderslab-web`에 읽기 전용 마운트를 추가합니다. 기존 public, nginx.conf 마운트는 유지합니다.

```yaml
- /opt/aibl-showcase/uploads:/var/showcase/uploads:ro
- /opt/aibl-showcase/media/samples:/var/showcase/media/samples:ro
```

마운트를 바꾼 뒤에는 웹 컨테이너를 다시 만듭니다. `nginx -t`가 성공한 다음에만 reload 또는 recreate 합니다.

## 4. nginx

`/opt/aibuilderslab/nginx.conf`를 먼저 복사해 둡니다.

```bash
sudo cp -a /opt/aibuilderslab/nginx.conf /opt/aibuilderslab/nginx.conf.bak-showcase
```

`deploy/nginx/showcase-locations.conf`의 `location` 블록만 기존 `server { }` 안에 붙여 넣습니다. 파일 전체를 교체하지 않습니다. 확인 후 컨테이너 설정 파일을 다시 읽힙니다.

```bash
sudo docker exec aibuilderslab-web nginx -t
sudo docker exec aibuilderslab-web nginx -s reload
```

적용되는 제한:

- `/lounge/api/`는 API로 프록시하고 `client_max_body_size 25m`입니다. `CF-Connecting-IP`를 그대로 넘깁니다.
- `/lounge/uploads/`는 업로드 디스크의 별칭입니다. `nosniff`, `Content-Security-Policy: default-src 'none'`, `X-Robots-Tag: noindex`를 붙입니다. 이미지가 아닌 파일은 `Content-Disposition: attachment`입니다.
- `/lounge/media/samples/`는 샘플 mp4 별칭이고 `expires 30d`입니다. Range 요청은 nginx 기본 동작으로 동작합니다.

## 5. 정적 파일

소유자가 배포를 승인한 뒤에만 기존 배포 스크립트를 실행합니다. 이 변경만으로 자동 배포하지 않습니다.

```bash
sudo /opt/aibuilderslab/deploy.sh
```

`lounge/showcase/`와 포스터 webp가 `public/`로 복사됩니다. 업로드 디렉터리는 rsync 대상이 아닙니다.

## 6. 샘플 영상

원본 mp4는 저장소에 없습니다. 원본 폴더 구조(`01_숏드라마_캐릭터/`, `02_매장홍보_실사합성/`, `03_당근홍보_더미광고/`, `thumbs/`)를 서버에 둔 다음:

```bash
sudo bash /opt/aibuilderslab/src/scripts/prepare-samples.sh \
  /path/to/original-samples \
  /opt/aibl-showcase/media/samples
sudo chown -R 1000:1000 /opt/aibl-showcase/media
```

스크립트는 ffmpeg로 CRF 26, maxrate 2.5M, AAC 96k, `+faststart`, 720x1280으로 다시 인코딩해 `samples.json`의 ASCII 슬러그 파일명으로 저장합니다. 포스터는 이미 `lounge/showcase/posters/`에 있습니다. 포스터를 다시 만들 때는 같은 명령 끝에 `--posters`를 붙입니다.

당근 홍보 6개 카드에는 `샘플용 가상 광고` 배지가 표시됩니다.

## 7. 매일 백업

호스트에 `sqlite3`가 있으면 그 명령으로, 없으면 API 컨테이너의 `better-sqlite3` 백업으로 동작합니다. 최근 7일만 남깁니다.

```bash
sudo apt-get install -y sqlite3
sudo bash /opt/aibuilderslab/src/deploy/backup-showcase.sh
sudo crontab -e
```

cron 예:

```cron
15 3 * * * /opt/aibuilderslab/src/deploy/backup-showcase.sh >> /var/log/aibl-showcase-backup.log 2>&1
```

## 8. 동작 확인

- `https://aibuilderslab.kr/lounge/showcase/` 빈 목록
- 테스트 항목 1개 등록. 수정 코드가 한 번 보이는지 확인
- 이미지, 첨부, 유튜브 임베드, 외부 링크의 `rel="ugc nofollow noopener"`
- 샘플 영상 탭과 모달 재생
- `/?admin`은 경로가 아니라 `https://aibuilderslab.kr/lounge/showcase/?admin`

제한: 이미지 jpg/png/webp/gif 각 5MB, 4장. 첨부 pdf/zip/pptx/docx/xlsx/txt/md 각 20MB, 4개. 요청 합계 25MB. 전체 업로드 3GB를 넘으면 새 파일을 거절합니다. 같은 IP는 한 시간에 5번, 하루에 20번까지 등록·수정·삭제할 수 있습니다. 허니팟 칸은 `company_website`입니다.

## 9. 롤백

데이터 디렉터리는 지우지 않습니다.

```bash
sudo docker compose -f /opt/aibuilderslab/src/deploy/docker-compose.showcase.yml down
sudo cp -a /opt/aibuilderslab/nginx.conf.bak-showcase /opt/aibuilderslab/nginx.conf
```

웹 컨테이너에서 쇼케이스 마운트 두 줄을 제거한 뒤 `nginx -t`와 reload를 다시 합니다. 정적 페이지만 되돌리려면 이전 커밋으로 `deploy.sh`를 다시 실행합니다. 업로드와 DB는 `/opt/aibl-showcase/`에 남습니다.

## 로컬 확인

Docker 없이:

```bash
cd services/showcase-api
npm ci
npm test
node src/dev-server.js
```

브라우저에서 `http://127.0.0.1:4180/lounge/showcase/`를 엽니다. 로컬 Docker는 `deploy/docker-compose.local.yml`을 사용합니다. 운영 네트워크 이름 `aibuilderslab_default`는 만들지 않습니다.
