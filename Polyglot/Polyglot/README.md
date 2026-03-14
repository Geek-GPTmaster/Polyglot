# Polyglot

> 英文阅读学习器 — 导入文章 · 点词查义 · 积累生词 · 间隔复习

---

## 快速启动

### 后端
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API 文档：`http://localhost:8000/docs`

### 前端
```bash
cd frontend
npm install && npm run dev
```
访问：`http://localhost:3000`

---

## 项目结构

```
Polyglot/
├─ frontend/                  # Next.js 14
│  ├─ app/                    # 页面（App Router）
│  ├─ components/             # UI 组件
│  ├─ lib/                    # api.ts、mockDictionary.ts
│  ├─ types/                  # TypeScript 类型
│  └─ next.config.js          # /api/* 代理到后端
│
├─ backend/                   # FastAPI
│  ├─ app/
│  │  ├─ api/routes/          # HTTP 接口
│  │  ├─ core/                # 配置 + 数据库
│  │  ├─ models/              # ORM 模型
│  │  ├─ schemas/             # Pydantic 模型
│  │  └─ services/            # 词典服务
│  ├─ data/                   # SQLite（自动创建，已 gitignore）
│  └─ tests/                  # pytest 测试
│
├─ docs/                      # 架构、API、路线图
├─ vercel.json
└─ .gitignore
```

---

## 测试

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 文档
- [架构说明](docs/architecture.md)
- [API 参考](docs/api.md)
- [路线图](docs/roadmap.md)
