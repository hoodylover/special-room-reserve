# 특별실 현황

초등학교와 중학교가 함께 있는 학교에서 체육관, 시청각실, 컴퓨터실, 과학실, 음악실, 놀이실 같은
특별실이 **언제 누구에게 배정되어 있는지**와 **지금 실제로 사용 중인지**를 한곳에서 확인하는 웹앱이에요.
로그인 없이 링크만 있으면 누구나 보고, 예약하고, 상태를 바꿀 수 있어요.

## 기능 (MVP)

- **특별실 현황**: 날짜를 고르면 특별실별 예약 시간, 직책 표시, 사용 목적, 상태(예약됨·사용 중·사용 완료·미사용)를 보여 줘요.
  오늘 날짜에는 특별실마다 "지금 비어 있음 / 지금 사용 중 / 지금 예약 시간·사용 시작 전" 표시가 붙어요. 30초마다, 그리고 화면으로 돌아올 때 자동으로 새로 고쳐요.
- **상태 버튼**: 「사용 시작」(예약됨 → 사용 중), 「미사용」(예약됨 → 미사용), 「사용 종료」(사용 중 → 사용 완료). 실제 시작·종료 시각이 기록돼요.
  두 사람이 동시에 눌러도 한 번만 반영돼요.
- **예약 추가·수정**: 특별실, 날짜, 시작·종료 시각, 사용 목적, 직책 표시. 필수값이 빠졌거나 시간이 겹치면 저장하지 않고 이유를 보여 줘요.
- **예약 삭제 확인** 화면.

### 시간 겹침 규칙

같은 특별실에서 **예약됨·사용 중** 예약끼리 시간이 겹치면 저장되지 않아요. 앞 예약의 종료 시각과 뒤 예약의 시작 시각이 같으면(10:00–11:00 다음 11:00–12:00) 허용해요.
**미사용**이나 **사용 완료**로 바뀐 예약은 그 시간이 비었다는 뜻이라 겹침 검사에서 빠져요. 예를 들어 일찍 끝난 시간에 다른 교사가 바로 예약할 수 있어요.
Supabase에서는 DB 제약(`exclude using gist`)으로도 막아서 동시에 저장해도 겹치지 않아요.

### 개인정보

로그인이 없으므로 직책 표시는 입력한 문구일 뿐 신원 확인 정보가 아니에요. 학생 이름·학번·명단은 저장하지 않으며, 입력 화면에도 안내가 있어요.

MVP 제외: 반복 예약, 알림, 이용 통계, 승인 절차, 파일 첨부, 사용자 계정.

## 기술 스택

- Next.js 15 (App Router, Server Actions) + TypeScript + Tailwind CSS 4
- DB: Supabase (Postgres). 환경변수가 없으면 로컬 파일(`.data/dev-db.json`)에 저장하는 개발용 모드로 동작해요.
- 시간대: 오늘 날짜와 실제 사용 시각은 한국 시간(Asia/Seoul) 기준이에요.

## 로컬에서 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

Supabase 없이 바로 돌아가요. 특별실 6개가 자동으로 만들어져요.

## 배포 (Supabase + Vercel)

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만들고, **SQL Editor**에 [`supabase/schema.sql`](supabase/schema.sql)을 붙여넣어 실행해요. 테이블, 겹침 제약, 접근 권한, 기본 특별실 6개가 만들어져요.
2. Supabase **Project Settings → API**에서 Project URL과 `anon` public key를 복사해요.
3. Vercel에서 이 저장소를 Import하고, Environment Variables에 다음을 넣어요.
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy. 교사들에게 배포 주소를 공유하면 돼요.

> 프리뷰 배포에는 Vercel Deployment Protection이 기본으로 걸려 있어 로그인한 사람만 볼 수 있어요. 교사들이 로그인 없이 보려면 프로덕션 도메인을 공유하거나 Settings → Deployment Protection에서 보호를 꺼 주세요.

## 데이터 구조

| PRD 이름 | 테이블 / 칸 |
| --- | --- |
| 특별실 | `rooms`: `id`(특별실 번호), `name`, `created_by`, `created_at`, `updated_at` |
| 예약 및 사용 기록 | `reservations`: `id`(기록 번호), `room_id`, `use_date`, `start_time`, `end_time`, `purpose`, `role_label`(직책 표시), `status`, `actual_start_at`, `actual_end_at`, `created_by`, `created_at`, `updated_at` |

`status` 값: `reserved`(예약됨), `in_use`(사용 중), `done`(사용 완료), `unused`(미사용).

접근 권한은 PRD대로 링크를 가진 누구나 읽기·넣기·고치기·지우기가 가능해요(RLS 정책 `using (true)`).

## 폴더 구조

```
src/app/page.tsx                      특별실 현황
src/app/reservations/new              예약 입력
src/app/reservations/[id]/edit        예약 수정
src/app/reservations/[id]/delete      예약 삭제 확인
src/app/actions.ts                    저장·상태 변경·삭제 (Server Actions)
src/lib/store/                        저장소 (supabase.ts / 로컬 file.ts)
supabase/schema.sql                   DB 스키마
```
