#!/bin/bash
# test_api.sh — 生词本 API 手动测试脚本
# 用法：bash test_api.sh
# 前提：FastAPI 已在 localhost:8000 运行

BASE="http://localhost:8000/api"
echo "================================================"
echo "  LangReader API 测试"
echo "================================================"

# ── 1. 健康检查 ──────────────────────────────────────
echo ""
echo "1. 健康检查"
curl -s "$BASE/health" | python3 -m json.tool

# ── 2. 获取生词本（初始为空）────────────────────────
echo ""
echo "2. 获取生词本（应为空列表 []）"
curl -s "$BASE/vocabulary" | python3 -m json.tool

# ── 3. 添加单词 ephemeral ────────────────────────────
echo ""
echo "3. 添加单词 ephemeral"
curl -s -X POST "$BASE/vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "ephemeral",
    "phonetic": "/ɪˈfem.ər.əl/",
    "definitions": [
      {
        "pos": "adjective",
        "meaning": "短暂的；转瞬即逝的",
        "example": "Fame is ephemeral."
      }
    ]
  }' | python3 -m json.tool

# ── 4. 再添加一个单词 ─────────────────────────────────
echo ""
echo "4. 添加单词 resilience"
curl -s -X POST "$BASE/vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "resilience",
    "phonetic": "/rɪˈzɪliəns/",
    "definitions": [
      {
        "pos": "noun",
        "meaning": "韧性；恢复力；适应力",
        "example": "She showed great resilience in the face of adversity."
      }
    ]
  }' | python3 -m json.tool

# ── 5. 获取全部生词本 ─────────────────────────────────
echo ""
echo "5. 获取全部生词本（应有2个）"
curl -s "$BASE/vocabulary" | python3 -m json.tool

# ── 6. 按状态过滤 ─────────────────────────────────────
echo ""
echo "6. 过滤 status=new"
curl -s "$BASE/vocabulary?status=new" | python3 -m json.tool

# ── 7. 更新复习状态 ───────────────────────────────────
echo ""
echo "7. 把 ephemeral 标为 known"
curl -s -X PATCH "$BASE/vocabulary/ephemeral/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "known"}' | python3 -m json.tool

# ── 8. 验证状态已更新 ─────────────────────────────────
echo ""
echo "8. 过滤 status=known（应有 ephemeral）"
curl -s "$BASE/vocabulary?status=known" | python3 -m json.tool

# ── 9. 幂等添加测试 ───────────────────────────────────
echo ""
echo "9. 重复添加 ephemeral（应幂等返回，不报错）"
curl -s -X POST "$BASE/vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "ephemeral",
    "phonetic": "/ɪˈfem.ər.əl/",
    "definitions": [{"pos": "adj", "meaning": "短暂的", "example": "test"}]
  }' | python3 -m json.tool

# ── 10. 删除单词 ──────────────────────────────────────
echo ""
echo "10. 删除 resilience"
curl -s -X DELETE "$BASE/vocabulary/resilience" | python3 -m json.tool

# ── 11. 验证已删除 ────────────────────────────────────
echo ""
echo "11. 获取生词本（应只剩 ephemeral）"
curl -s "$BASE/vocabulary" | python3 -m json.tool

# ── 12. 删除不存在的词（应返回 404）──────────────────
echo ""
echo "12. 删除不存在的词（应返回 404）"
curl -s -X DELETE "$BASE/vocabulary/notexist" | python3 -m json.tool

echo ""
echo "================================================"
echo "  测试完成"
echo "================================================"

echo ""
echo "================================================"
echo "  复习接口测试"
echo "================================================"

# 先确保有单词
echo ""
echo "13. 先添加测试单词 serendipity"
curl -s -X POST "$BASE/vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "serendipity",
    "phonetic": "/ˌserənˈdɪpɪti/",
    "definitions": [{"pos": "noun", "meaning": "意外发现美好事物的能力", "example": "A fortunate stroke of serendipity."}]
  }' | python3 -m json.tool

echo ""
echo "14. 提交复习结果：serendipity → known"
curl -s -X POST "$BASE/vocabulary/serendipity/review" \
  -H "Content-Type: application/json" \
  -d '{"status": "known"}' | python3 -m json.tool

echo ""
echo "15. 再复习一次：serendipity → fuzzy（验证 SRS 字段变化）"
curl -s -X POST "$BASE/vocabulary/serendipity/review" \
  -H "Content-Type: application/json" \
  -d '{"status": "fuzzy"}' | python3 -m json.tool

echo ""
echo "16. 查看复习历史"
curl -s "$BASE/vocabulary/serendipity/logs" | python3 -m json.tool

echo ""
echo "17. 获取今日统计概况"
curl -s "$BASE/vocabulary/stats/summary" | python3 -m json.tool
