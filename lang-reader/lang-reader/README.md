# LangReader — 英文阅读学习器

> 导入英文文章 → 点击单词查看释义 → 收入生词本 → 卡片复习

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS |
| 后端 | FastAPI + SQLAlchemy |
| 数据库 | SQLite（本地文件，零配置） |
| 词典 | Free Dictionary API（免费，无需 Key） |

---

## 项目结构

```
lang-reader/
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/            # 页面路由（App Router）
│   │   │   ├── page.tsx              # 首页：导入文章
│   │   │   ├── reader/[id]/page.tsx  # 阅读页
│   │   │   ├── vocabulary/page.tsx   # 生词本
│   │   │   └── review/page.tsx       # 复习页
│   │   ├── components/     # 共享 UI 组件
│   │   │   ├── NavBar.tsx            # 顶部导航
│   │   │   ├── ArticleReader.tsx     # 文章渲染 + 单词点击
│   │   │   ├── WordCard.tsx          # 单词卡片弹窗
│   │   │   └── ReviewCard.tsx        # 复习翻转卡片
│   │   ├── lib/
│   │   │   └── api.ts      # 所有后端请求封装
│   │   └── types/
│   │       └── index.ts    # 共享 TypeScript 类型
│   ├── next.config.js       # 代理 /api → localhost:8000
│   └── package.json
│
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # 入口：注册路由、CORS
│   │   ├── database.py     # SQLite 连接 & Session
│   │   ├── models.py       # ORM 模型（3 张表）
│   │   ├── schemas.py      # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── articles.py     # 文章 CRUD
│   │   │   ├── words.py        # 单词查询
│   │   │   └── vocabulary.py   # 生词本管理
│   │   └── services/
│   │       └── dictionary.py   # 词典 API 封装
│   ├── data/               # SQLite 数据库文件（自动创建）
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 本地启动指南

### 前置要求

- Node.js >= 18
- Python >= 3.11
- （可选）使用虚拟环境管理 Python 依赖

---

### 1. 启动后端

```bash
cd backend

# 创建并激活虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器（热重载）
uvicorn app.main:app --reload --port 8000
```

后端运行在：`http://localhost:8000`
API 文档（自动生成）：`http://localhost:8000/docs`

---

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在：`http://localhost:3000`

> **代理说明**：`next.config.js` 已配置将 `/api/*` 代理到 `localhost:8000`，开发时前端直接调用 `/api/...` 即可，无需处理跨域。

---

### 3. 初始化数据库

数据库会在首次启动后端时**自动创建**，文件位于：

```
backend/data/lang_reader.db
```

无需手动执行 SQL，SQLAlchemy 会自动建表。

---

## API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 健康检查 |
| `POST` | `/api/articles` | 提交文章 |
| `GET` | `/api/articles` | 文章列表 |
| `GET` | `/api/articles/{id}` | 获取单篇文章 |
| `DELETE` | `/api/articles/{id}` | 删除文章 |
| `GET` | `/api/words/{word}` | 查询单词释义 |
| `GET` | `/api/vocabulary` | 生词本列表 |
| `POST` | `/api/vocabulary` | 加入生词本 |
| `PATCH` | `/api/vocabulary/{word}/status` | 更新复习状态 |
| `DELETE` | `/api/vocabulary/{word}` | 删除生词 |

---

## 开发进度

- [ ] 后端：文章 CRUD
- [ ] 后端：词典查询 + 缓存
- [ ] 后端：生词本管理
- [ ] 前端：首页（粘贴 + 上传 + 列表）
- [ ] 前端：阅读页（单词点击 + WordCard）
- [ ] 前端：生词本页面
- [ ] 前端：复习页面
- [ ] UI 细化（阅读器风格）

---

## 常见问题

**Q: 词典 API 有限制吗？**
A: 使用 [Free Dictionary API](https://api.dictionaryapi.dev)，完全免费，无需注册，有频率限制但日常使用够用。词义查询结果会缓存到本地 SQLite，同一个词只请求一次外部 API。

**Q: 中文释义从哪来？**
A: Free Dictionary API 只提供英文释义，中文释义需要后续接入有道词典 / 必应词典（需申请 API Key）。第一版以英文释义为主。

**Q: 数据存在哪里？**
A: 全部存在本地 `backend/data/lang_reader.db`，SQLite 文件，便于备份迁移。
