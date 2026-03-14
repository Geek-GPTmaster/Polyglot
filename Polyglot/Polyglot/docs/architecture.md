# Architecture

## 整体架构

```
Browser (Next.js)
    │  /api/* → proxy
    ▼
FastAPI (port 8000)
    │
    ├─ api/routes/vocabulary.py   生词本 CRUD
    ├─ api/routes/review.py       复习 + SRS 计算
    └─ api/routes/articles.py     文章管理（待实现）
    │
    ▼
SQLite (backend/data/polyglot.db)
    ├─ vocabulary     生词本 + SRS 字段
    ├─ review_logs    每次复习记录
    ├─ articles       文章（待实现）
    └─ word_definitions 词典缓存（待实现）
```

## 目录职责

### backend/

```
app/
├─ api/routes/      HTTP 接口层（只做参数校验 + 调 service）
├─ core/            配置、数据库连接（全局单例）
├─ models/          SQLAlchemy ORM 模型（对应数据库表）
├─ schemas/         Pydantic 请求/响应模型（类型安全）
└─ services/        业务逻辑（词典查询、SRS 算法等）
```

### frontend/

```
app/            Next.js App Router 页面
components/     可复用 UI 组件
lib/            工具函数（api.ts、mockDictionary.ts）
types/          全局 TypeScript 类型定义
```

## 数据流

### 阅读 → 加入生词本

```
用户点击单词
  → mockLookupWord()（前端 mock，后续换真实 API）
  → WordCard 弹出
  → 点「加入生词本」
  → POST /api/vocabulary
  → SQLite vocabulary 表写入
```

### 复习流程

```
进入复习页
  → GET /api/vocabulary（按 new→fuzzy→known 排序）
  → 翻卡片 → 选择结果
  → POST /api/review/{word}
  → SRS 计算（_srs 函数）
  → review_logs 写入 + vocabulary 更新
  → 完成后 GET /api/review/stats/summary
```

## SRS 算法

当前实现：简化版 SM-2（`api/routes/review.py → _srs()`）

| 结果   | quality | 行为              |
|--------|---------|------------------|
| known  | 5       | 间隔 × ease_factor |
| fuzzy  | 3       | 短间隔继续         |
| new    | 1       | 重置为第 1 天      |

后续替换为完整 SM-2 或 FSRS 只需修改 `_srs()` 函数，数据库结构不变。
