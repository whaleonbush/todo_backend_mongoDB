# Todo Backend (Node.js + Express + MongoDB)

할일(Todo) 앱을 위한 REST API 백엔드 서버입니다. **Express 5 + Mongoose 9 + MongoDB** 기반으로 구현되어 있으며, 프론트엔드([todo_frontend](https://github.com/whaleonbush/todo_frontend))와 함께 동작합니다.

## 주요 기능

- 할일 **생성 / 조회 / 수정 / 삭제** (CRUD)
- 우선순위(`low` / `medium` / `high`) · 마감일 · 태그 · 상세 설명 지원
- **검색** (제목 / 상세 설명, 정규식 기반)
- **필터** (우선순위, 태그)
- **정렬** (`createdAt`, `updatedAt`, `dueDate`, `priority`, `title`)
- **페이지네이션** (`page`, `limit`)
- Mongoose 스키마 레벨의 **유효성 검사** 및 친절한 한국어 에러 메시지
- `/health` 헬스체크 엔드포인트
- 프론트엔드를 위한 **CORS** 활성화

## 기술 스택

| 항목 | 사용 기술 |
|------|----------|
| 런타임 | Node.js 18+ (ESM) |
| 프레임워크 | Express 5 |
| ODM / DB | Mongoose 9 / MongoDB |
| 환경변수 | dotenv |
| 개발 도구 | nodemon |

## 프로젝트 구조

```
todo-backend/
├── src/
│   ├── index.js          # 앱 진입점 (서버 + DB 연결)
│   ├── models/
│   │   └── Todo.js       # Todo Mongoose 모델
│   └── routes/
│       └── todos.js      # /api/todos 라우터
├── .env.example          # 환경변수 예시 파일
├── .gitignore
├── package.json
└── README.md
```

## 시작하기

### 1. 사전 준비

- Node.js 18 이상
- 로컬 또는 클라우드(MongoDB Atlas 등) MongoDB 인스턴스

### 2. 설치

```bash
git clone https://github.com/whaleonbush/todo_backend_mongoDB.git
cd todo_backend_mongoDB
npm install
```

### 3. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 만든 뒤 값을 채웁니다.

```bash
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todo
```

### 4. 실행

```bash
npm run dev      # 개발 모드 (nodemon, 파일 변경 시 자동 재시작)
npm start        # 프로덕션 모드
```

서버가 정상 실행되면 콘솔에 다음과 같이 표시됩니다.

```
몽고디비 연결 성공 (host: ..., port: ..., db: todo)
서버 실행 중 - http://localhost:5000 (port: 5000)
```

## API 명세

기본 베이스 URL: `http://localhost:5000`

### 헬스체크

```
GET /health
```

응답 예시:

```json
{ "status": "ok", "uptime": 12.34, "db": "connected" }
```

### 할일 목록 조회

```
GET /api/todos
```

쿼리 파라미터:

| 이름 | 타입 | 기본값 | 설명 |
|------|-----|-------|-----|
| `priority` | `low` \| `medium` \| `high` | - | 우선순위 필터 |
| `tag` | string | - | 태그로 필터 |
| `search` | string | - | 제목/상세설명 검색 (대소문자 무시) |
| `sort` | string | `-createdAt` | `field` 또는 `-field` (내림차순). 허용 필드: `createdAt`, `updatedAt`, `dueDate`, `priority`, `title` |
| `page` | number | `1` | 페이지 번호 (1 이상) |
| `limit` | number | `20` | 페이지당 개수 (최대 100) |

응답 예시:

```json
{
  "data": [
    {
      "id": "65f...",
      "title": "Cursor 공부하기",
      "description": "",
      "priority": "high",
      "dueDate": null,
      "tags": [],
      "isOverdue": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 할일 단건 조회

```
GET /api/todos/:id
```

### 할일 생성

```
POST /api/todos
Content-Type: application/json
```

요청 본문:

```json
{
  "title": "새 할일",
  "description": "상세 설명 (선택)",
  "priority": "medium",
  "dueDate": "2026-12-31",
  "tags": ["work", "urgent"]
}
```

- `title`: **필수**, 1~200자
- `description`: 선택, 최대 2000자
- `priority`: `low` | `medium` | `high` (기본 `medium`)
- `dueDate`: ISO 날짜 문자열 (선택)
- `tags`: 문자열 배열, 각 태그 최대 30자

### 할일 수정

```
PATCH /api/todos/:id
Content-Type: application/json
```

수정 가능 필드: `title`, `description`, `priority`, `dueDate`, `tags`
빈 본문이거나 수정 가능한 필드가 하나도 없으면 400을 반환합니다.

### 할일 삭제

```
DELETE /api/todos/:id
```

### 에러 응답 형식

| 상태 | error 코드 | 의미 |
|-----|-----------|-----|
| 400 | `InvalidId` | 유효하지 않은 ObjectId |
| 400 | `ValidationError` | 입력값 유효성 검사 실패 (`details`로 필드별 메시지 반환) |
| 400 | `NoUpdatableFields` | 수정할 값이 없음 |
| 404 | `NotFound` | 해당 할일을 찾을 수 없음 |
| 500 | - | 서버 내부 오류 |

`ValidationError` 예시:

```json
{
  "error": "ValidationError",
  "message": "입력값이 올바르지 않습니다.",
  "details": {
    "title": "할일 제목은 1자 이상이어야 합니다."
  }
}
```

## 데이터 모델

`src/models/Todo.js` 참고.

| 필드 | 타입 | 설명 |
|------|-----|-----|
| `title` | String | 필수, 1~200자, trim |
| `description` | String | 선택, 최대 2000자 |
| `priority` | String | `low`/`medium`/`high`, 기본 `medium`, 인덱스 |
| `dueDate` | Date | 마감일, 기본 `null` |
| `tags` | [String] | 각 30자 이하 |
| `createdAt` / `updatedAt` | Date | 자동 생성 |
| `isOverdue` | Virtual | `dueDate < Date.now()` 여부 |

응답 직렬화 시 `_id` 는 `id` 로 매핑됩니다 (`toJSON.transform`).

## 프론트엔드와 연동

같이 사용하는 프론트엔드 저장소: [whaleonbush/todo_frontend](https://github.com/whaleonbush/todo_frontend)

프론트에서 `API_BASE`를 `http://localhost:5000/api` 로 설정하면 바로 동작합니다.

## 라이선스

[MIT](LICENSE)
