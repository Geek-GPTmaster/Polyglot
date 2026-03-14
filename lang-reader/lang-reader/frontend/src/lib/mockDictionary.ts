/**
 * mockDictionary.ts — 本地 Mock 词典
 * 内置约 60 个常用单词的中文释义，覆盖示例文章全部词汇。
 * 未命中的单词返回「查询中（模拟）」兜底数据。
 * 后续替换为真实 API 调用时只需修改 lookupWord 函数。
 */

import type { WordInfo } from "@/types";

const DICT: Record<string, Omit<WordInfo, "word" | "in_vocabulary">> = {
  the:         { phonetic: "/ðə/",   definitions: [{ pos: "article", meaning: "（定冠词）这个，那个", example: "The book is on the table." }] },
  a:           { phonetic: "/ə/",    definitions: [{ pos: "article", meaning: "（不定冠词）一个", example: "A cat sat on the mat." }] },
  an:          { phonetic: "/æn/",   definitions: [{ pos: "article", meaning: "（不定冠词）一个（用于元音前）", example: "An apple a day keeps the doctor away." }] },
  is:          { phonetic: "/ɪz/",   definitions: [{ pos: "verb", meaning: "是；存在（be 的第三人称单数）", example: "She is a doctor." }] },
  are:         { phonetic: "/ɑːr/",  definitions: [{ pos: "verb", meaning: "是；存在（be 的复数形式）", example: "They are students." }] },
  in:          { phonetic: "/ɪn/",   definitions: [{ pos: "preposition", meaning: "在……里面；在……期间", example: "She lives in Paris." }] },
  of:          { phonetic: "/əv/",   definitions: [{ pos: "preposition", meaning: "……的；关于", example: "A cup of tea." }] },
  and:         { phonetic: "/ænd/",  definitions: [{ pos: "conjunction", meaning: "和；并且", example: "Bread and butter." }] },
  to:          { phonetic: "/tuː/",  definitions: [{ pos: "preposition", meaning: "到；向；对于", example: "Go to school." }] },
  that:        { phonetic: "/ðæt/",  definitions: [{ pos: "pronoun", meaning: "那个；那", example: "That is my car." }] },
  for:         { phonetic: "/fɔːr/", definitions: [{ pos: "preposition", meaning: "为了；因为；对于", example: "This gift is for you." }] },
  // 示例文章核心词汇
  important:   { phonetic: "/ɪmˈpɔːrtənt/", definitions: [{ pos: "adjective", meaning: "重要的；重大的", example: "It is important to stay healthy." }] },
  thing:       { phonetic: "/θɪŋ/",           definitions: [{ pos: "noun",      meaning: "事物；东西；事情", example: "The most important thing is to try." }] },
  communication: { phonetic: "/kəˌmjuːnɪˈkeɪʃn/", definitions: [{ pos: "noun", meaning: "通讯；交流；沟通", example: "Good communication is key to success." }] },
  hearing:     { phonetic: "/ˈhɪərɪŋ/",       definitions: [{ pos: "noun", meaning: "听力；听觉；听证会", example: "He has excellent hearing." }, { pos: "verb", meaning: "听（hear 的现在分词）", example: "I am hearing great things about you." }] },
  management:  { phonetic: "/ˈmænɪdʒmənt/",   definitions: [{ pos: "noun", meaning: "管理；经营；管理层", example: "She studied business management." }] },
  doing:       { phonetic: "/ˈduːɪŋ/",         definitions: [{ pos: "verb", meaning: "做；执行（do 的现在分词）", example: "He is doing his homework." }] },
  things:      { phonetic: "/θɪŋz/",            definitions: [{ pos: "noun", meaning: "事情（thing 的复数）", example: "Things are getting better." }] },
  right:       { phonetic: "/raɪt/",            definitions: [{ pos: "adjective", meaning: "正确的；右边的", example: "You are absolutely right." }, { pos: "noun", meaning: "权利；右方", example: "Everyone has the right to speak." }] },
  leadership:  { phonetic: "/ˈliːdərʃɪp/",     definitions: [{ pos: "noun", meaning: "领导力；领导地位", example: "Strong leadership is essential in a crisis." }] },
  art:         { phonetic: "/ɑːrt/",            definitions: [{ pos: "noun", meaning: "艺术；技巧；美术", example: "She has a great talent for art." }] },
  language:    { phonetic: "/ˈlæŋɡwɪdʒ/",      definitions: [{ pos: "noun", meaning: "语言；言语；表达方式", example: "She speaks three languages fluently." }] },
  middle:      { phonetic: "/ˈmɪdl/",           definitions: [{ pos: "noun", meaning: "中间；中部", example: "She sat in the middle of the room." }] },
  every:       { phonetic: "/ˈevri/",            definitions: [{ pos: "adjective", meaning: "每个；所有的", example: "Every student must attend." }] },
  difficulty:  { phonetic: "/ˈdɪfɪkəlti/",     definitions: [{ pos: "noun", meaning: "困难；难题；艰难", example: "She faced many difficulties in life." }] },
  lies:        { phonetic: "/laɪz/",             definitions: [{ pos: "verb", meaning: "位于；躺（lie 的第三人称）", example: "The solution lies within the problem." }, { pos: "noun", meaning: "谎言（lie 的复数）", example: "His story is full of lies." }] },
  opportunity: { phonetic: "/ˌɒpəˈtjuːnəti/",  definitions: [{ pos: "noun", meaning: "机会；时机", example: "This is a great opportunity for growth." }] },
  life:        { phonetic: "/laɪf/",             definitions: [{ pos: "noun", meaning: "生命；生活；人生", example: "Life is full of surprises." }] },
  what:        { phonetic: "/wɒt/",              definitions: [{ pos: "pronoun", meaning: "什么；多么", example: "What are you doing?" }] },
  happens:     { phonetic: "/ˈhæpənz/",          definitions: [{ pos: "verb", meaning: "发生；碰巧（happen 的第三人称）", example: "What happens next?" }] },
  when:        { phonetic: "/wen/",              definitions: [{ pos: "conjunction", meaning: "当……时；在……时候", example: "Call me when you arrive." }] },
  busy:        { phonetic: "/ˈbɪzi/",            definitions: [{ pos: "adjective", meaning: "忙碌的；繁忙的", example: "I am too busy to talk right now." }] },
  making:      { phonetic: "/ˈmeɪkɪŋ/",          definitions: [{ pos: "verb", meaning: "制作；制造（make 的现在分词）", example: "She is making dinner." }] },
  other:       { phonetic: "/ˈʌðər/",            definitions: [{ pos: "adjective", meaning: "其他的；另外的", example: "Do you have any other questions?" }] },
  plans:       { phonetic: "/plænz/",            definitions: [{ pos: "noun", meaning: "计划；方案（plan 的复数）", example: "What are your plans for the weekend?" }] },
  future:      { phonetic: "/ˈfjuːtʃər/",        definitions: [{ pos: "noun", meaning: "未来；将来", example: "No one can predict the future." }] },
  belongs:     { phonetic: "/bɪˈlɒŋz/",          definitions: [{ pos: "verb", meaning: "属于；归属（belong 的第三人称）", example: "This book belongs to me." }] },
  those:       { phonetic: "/ðəʊz/",             definitions: [{ pos: "pronoun", meaning: "那些", example: "Those are my shoes." }] },
  who:         { phonetic: "/huː/",              definitions: [{ pos: "pronoun", meaning: "谁；……的人", example: "Who is calling?" }] },
  believe:     { phonetic: "/bɪˈliːv/",          definitions: [{ pos: "verb", meaning: "相信；认为；信任", example: "I believe in you." }] },
  beauty:      { phonetic: "/ˈbjuːti/",          definitions: [{ pos: "noun", meaning: "美；美丽；美人", example: "The beauty of nature is breathtaking." }] },
  their:       { phonetic: "/ðeər/",             definitions: [{ pos: "pronoun", meaning: "他们的；她们的", example: "They lost their keys." }] },
  dreams:      { phonetic: "/driːmz/",           definitions: [{ pos: "noun", meaning: "梦想；理想（dream 的复数）", example: "Follow your dreams." }, { pos: "verb", meaning: "做梦（dream 的第三人称）", example: "She dreams of becoming a writer." }] },
  knowledge:   { phonetic: "/ˈnɒlɪdʒ/",         definitions: [{ pos: "noun", meaning: "知识；了解；学问", example: "Knowledge is power." }] },
  power:       { phonetic: "/ˈpaʊər/",           definitions: [{ pos: "noun", meaning: "力量；权力；能力", example: "Knowledge is power." }, { pos: "verb", meaning: "驱动；为……提供动力", example: "The engine is powered by electricity." }] },
  time:        { phonetic: "/taɪm/",             definitions: [{ pos: "noun", meaning: "时间；时刻；次数", example: "Time flies when you're having fun." }] },
  money:       { phonetic: "/ˈmʌni/",            definitions: [{ pos: "noun", meaning: "钱；货币；金钱", example: "Time is money." }] },
  investment:  { phonetic: "/ɪnˈvestmənt/",      definitions: [{ pos: "noun", meaning: "投资；投入；投资额", example: "Real estate is a good investment." }] },
  best:        { phonetic: "/best/",             definitions: [{ pos: "adjective", meaning: "最好的；最优秀的", example: "This is the best movie I've ever seen." }] },
  interest:    { phonetic: "/ˈɪntrəst/",         definitions: [{ pos: "noun", meaning: "兴趣；利息；利益", example: "She has a great interest in music." }, { pos: "verb", meaning: "使感兴趣", example: "Does this topic interest you?" }] },
  education:   { phonetic: "/ˌedjʊˈkeɪʃn/",     definitions: [{ pos: "noun", meaning: "教育；学历；培训", example: "Education is the key to success." }] },
  not:         { phonetic: "/nɒt/",              definitions: [{ pos: "adverb", meaning: "不；没有；非", example: "I do not agree." }] },
  filling:     { phonetic: "/ˈfɪlɪŋ/",           definitions: [{ pos: "verb", meaning: "填充；充满（fill 的现在分词）", example: "She is filling the glass with water." }, { pos: "noun", meaning: "填充物；馅料", example: "The pie has a delicious filling." }] },
  pail:        { phonetic: "/peɪl/",             definitions: [{ pos: "noun", meaning: "桶；提桶", example: "She carried a pail of water." }] },
  but:         { phonetic: "/bʌt/",              definitions: [{ pos: "conjunction", meaning: "但是；然而；除了", example: "I tried, but I failed." }] },
  lighting:    { phonetic: "/ˈlaɪtɪŋ/",          definitions: [{ pos: "noun", meaning: "照明；点火；灯光效果", example: "The lighting in the room is perfect." }, { pos: "verb", meaning: "点燃；照亮（light 的现在分词）", example: "He is lighting the candles." }] },
  fire:        { phonetic: "/ˈfaɪər/",           definitions: [{ pos: "noun", meaning: "火；火灾；热情", example: "The fire kept us warm." }, { pos: "verb", meaning: "开枪；解雇；点燃", example: "He was fired from his job." }] },
  pays:        { phonetic: "/peɪz/",             definitions: [{ pos: "verb", meaning: "付款；值得（pay 的第三人称）", example: "It pays to be honest." }] },
};

/** 模拟网络延迟 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock 词典查询
 * - 命中内置词典：返回完整释义，延迟 200ms 模拟真实感
 * - 未命中：返回兜底数据，延迟 400ms
 */
export async function mockLookupWord(word: string): Promise<WordInfo> {
  await delay(180 + Math.random() * 150);

  const key = word.toLowerCase().replace(/['']/g, "'");
  const entry = DICT[key];

  if (entry) {
    return {
      word: key,
      phonetic: entry.phonetic ?? null,
      definitions: entry.definitions,
      in_vocabulary: false,
    };
  }

  // 兜底：未收录单词
  return {
    word: key,
    phonetic: null,
    definitions: [
      {
        pos: "—",
        meaning: `「${key}」暂无收录（Mock 数据）`,
        example: "Connect to real dictionary API for full coverage.",
      },
    ],
    in_vocabulary: false,
  };
}
