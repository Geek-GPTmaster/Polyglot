# API Reference

Base URL: `http://localhost:8000`
文档（Swagger UI）: `http://localhost:8000/docs`

---

## 生词本 `/api/vocabulary`

### GET /api/vocabulary
获取生词列表

**Query**
| 参数   | 类型   | 说明                    |
|--------|--------|------------------------|
| status | string | 可选：new \| fuzzy \| known |

**Response** `200`
```json
[
  {
    "id": 1,
    "word": "ephemeral",
    "phonetic": "/ɪˈfem.ər.əl/",
    "definitions": [{"pos": "adjective", "meaning": "短暂的", "example": "Fame is ephemeral."}],
    "status": "new",
    "ease_factor": 2.5,
    "interval_days": 1,
    "repetitions": 0,
    "next_review_at": null,
    "added_at": "2024-01-01T00:00:00Z",
    "reviewed_at": null
  }
]
```

### POST /api/vocabulary
加入生词本（幂等：已存在直接返回）

**Body**
```json
{
  "word": "ephemeral",
  "phonetic": "/ɪˈfem.ər.əl/",
  "definitions": [{"pos": "adjective", "meaning": "短暂的", "example": "Fame is ephemeral."}],
  "article_id": null
}
```

**Response** `201`（新增）或 `200`（已存在）

### DELETE /api/vocabulary/{word}
删除生词

**Response** `200 {"message": "'ephemeral' removed"}`
**Error** `404` 不存在

### PATCH /api/vocabulary/{word}/status
仅更新状态

**Body** `{"status": "known"}`
**Response** `200` 更新后的完整对象

---

## 复习 `/api/review`

### POST /api/review/{word}
提交复习结果，触发 SRS 计算

**Body** `{"status": "known"}` （known | fuzzy | new）
**Response** `200` 更新后的 VocabularyOut

### GET /api/review/stats/summary
今日复习统计

**Response**
```json
{
  "today_reviewed": 10,
  "today_known": 7,
  "today_fuzzy": 2,
  "today_new": 1,
  "total_words": 42,
  "due_count": 5
}
```

### GET /api/review/{word}/logs
单词完整复习历史

**Response**
```json
[
  {
    "id": 1,
    "word": "ephemeral",
    "result": "known",
    "reviewed_at": "2024-01-01T10:00:00Z",
    "ease_factor_before": 2.5,
    "ease_factor_after": 2.6,
    "interval_days_before": 1,
    "interval_days_after": 1
  }
]
```

---

## 健康检查

### GET /
```json
{"status": "ok", "app": "Polyglot", "version": "0.2.0"}
```

### GET /api/health
```json
{"status": "ok"}
```
