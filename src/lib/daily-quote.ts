export interface Quote {
  text: string
  author: string
}

export interface QuoteContext {
  date?: Date
  festival?: { emoji: string; greeting: string } | null
  holiday?: { name: string } | null
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'latenight'
  semesterPhase?: 'early' | 'mid' | 'late' | 'exam' | 'break'
  isWeekend?: boolean
  courseCount?: number
}

const GENERAL_QUOTES: Quote[] = [
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '知人者智，自知者明。', author: '老子' },
  { text: '吾生也有涯，而知也无涯。', author: '庄子' },
  { text: '未经审视的人生不值得过。', author: '苏格拉底' },
  { text: '真正的发现之旅不在于寻找新风景，而在于拥有新眼光。', author: '普鲁斯特' },
  { text: '世界上只有一种英雄主义，就是认清生活的真相后依然热爱它。', author: '罗曼·罗兰' },
  { text: '自由不是让你想做什么就做什么，自由是教你不想做什么就可以不做什么。', author: '康德' },
  { text: '我们听到的一切都是一个观点，不是事实；我们看到的一切都是一个视角，不是真相。', author: '马可·奥勒留' },
  { text: '常识就是人到十八岁为止累积的所有偏见。', author: '爱因斯坦' },
  { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
  { text: '不要因为走得太远，而忘了为什么出发。', author: '纪伯伦' },
  { text: '教育的目的不是填满桶，而是点燃火。', author: '叶芝' },
  { text: '人生没有白走的路，每一步都算数。', author: '李宗盛' },
  { text: '你不能控制风向，但你可以调整风帆。', author: '吉米·迪恩' },
  { text: '最困难的事情就是认识自己。', author: '泰勒斯' },
  { text: '凡是过往，皆为序章。', author: '莎士比亚' },
  { text: '人不能两次踏进同一条河流。', author: '赫拉克利特' },
  { text: '我思故我在。', author: '笛卡尔' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '人法地，地法天，天法道，道法自然。', author: '老子' },
  { text: '万物皆有裂痕，那是光照进来的地方。', author: '莱昂纳德·科恩' },
  { text: '怕什么真理无穷，进一寸有一寸的欢喜。', author: '胡适' },
  { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
  { text: '草在结它的种子，风在摇它的叶子。我们站着，不说话，就十分美好。', author: '顾城' },
  { text: '你微微地笑着，不同我说什么话。而我觉得，为了这个，我已等待很久了。', author: '泰戈尔' },
  { text: '月光还是少年的月光，九州一色还是李白的霜。', author: '余光中' },
  { text: '风后面是风，天空上面是天空，道路前面还是道路。', author: '海子' },
  { text: '生活是很好玩的。', author: '汪曾祺' },
  { text: '如果你来访我，我不在，请和我门外的花坐一会儿。', author: '汪曾祺' },
  { text: '日子就是这么一天天过去的。', author: '汪曾祺' },
  { text: '每个人心中都有一团火，路过的人只看到烟。', author: '梵高' },
  { text: '你站在桥上看风景，看风景的人在楼上看你。', author: '卞之琳' },
  { text: '从来如此，便对么？', author: '鲁迅' },
  { text: '安静是一种力量。', author: '佚名' },
  { text: '允许一切发生。', author: '佚名' },
  { text: '慢慢来，比较快。', author: '佚名' },
  { text: '所有大人都曾是小孩，只是很少有人记得。', author: '圣埃克苏佩里' },
  { text: '这世界有那么多来不及，还好我们有此刻。', author: '佚名' },
]

const FESTIVAL_QUOTES: Record<string, Quote[]> = {
  newyear: [
    { text: '辞旧迎新，万象更新。', author: '古语' },
    { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
    { text: '未来属于那些相信梦想之美的人。', author: '埃莉诺·罗斯福' },
  ],
  valentine: [
    { text: '爱是耐心，爱是善良。', author: '哥林多前书' },
    { text: '爱不是彼此凝视，而是一起朝同一个方向看。', author: '圣埃克苏佩里' },
  ],
  labor: [
    { text: '工作的时候，也别忘了窗外的云。', author: '佚名' },
    { text: '休息是劳动的调味品。', author: '普鲁塔克' },
  ],
  youth: [
    { text: '年轻不是一段时间，而是一种状态。', author: '佚名' },
    { text: '愿你出走半生，归来仍是少年。', author: '佚名' },
  ],
  children: [
    { text: '所有大人都曾是小孩，只是很少有人记得。', author: '圣埃克苏佩里' },
    { text: '保持好奇心，就是保持年轻。', author: '佚名' },
  ],
  teacher: [
    { text: '师者，所以传道授业解惑也。', author: '韩愈' },
    { text: '教育的根是苦的，但果实是甜的。', author: '亚里士多德' },
  ],
  national: [
    { text: '此心安处是吾乡。', author: '苏轼' },
    { text: '山河远阔，人间烟火。', author: '佚名' },
  ],
  halloween: [
    { text: '面对恐惧才能战胜恐惧。', author: '纳尔逊·曼德拉' },
    { text: '勇敢不是不害怕，而是害怕了依然前行。', author: '佚名' },
  ],
  christmas: [
    { text: '给予比接受更快乐。', author: '佚名' },
    { text: '最美好的礼物是陪伴。', author: '佚名' },
  ],
  newyeareve: [
    { text: '旧岁已展千重锦，新年再进百尺竿。', author: '佚名' },
    { text: '所有的告别都是为了更好的相遇。', author: '佚名' },
  ],
  qingming: [
    { text: '清明时节雨纷纷，路上行人欲断魂。', author: '杜牧' },
    { text: '慎终追远，民德归厚矣。', author: '论语' },
  ],
  duanwu: [
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
    { text: '亦余心之所善兮，虽九死其犹未悔。', author: '屈原' },
  ],
  midautumn: [
    { text: '但愿人长久，千里共婵娟。', author: '苏轼' },
    { text: '海上生明月，天涯共此时。', author: '张九龄' },
  ],
  aprilfools: [
    { text: '幽默是智慧的最高体现。', author: '佚名' },
    { text: '人生如戏，偶尔也需要一点幽默感。', author: '佚名' },
  ],
  womensday: [
    { text: '女人不是天生的，而是后天成为的。', author: '波伏娃' },
    { text: '她力量，不可限量。', author: '佚名' },
  ],
}

const SEASON_QUOTES: Record<string, Quote[]> = {
  spring: [
    { text: '春种一粒粟，秋收万颗子。', author: '李绅' },
    { text: '等闲识得东风面，万紫千红总是春。', author: '朱熹' },
    { text: '好雨知时节，当春乃发生。', author: '杜甫' },
    { text: '春天不是季节，而是内心。', author: '佚名' },
    { text: '你像一阵春风，轻轻柔柔吹入我心中。', author: '罗大佑' },
  ],
  summer: [
    { text: '生如夏花之绚烂。', author: '泰戈尔' },
    { text: '接天莲叶无穷碧，映日荷花别样红。', author: '杨万里' },
    { text: '坐在夏天的门槛上，等待一场雨。', author: '佚名' },
    { text: '蝉鸣是夏天的白噪音，给思绪留一点空隙。', author: '佚名' },
    { text: '夏天是冰西瓜的味道和树影里的光斑。', author: '佚名' },
  ],
  autumn: [
    { text: '落霞与孤鹜齐飞，秋水共长天一色。', author: '王勃' },
    { text: '自古逢秋悲寂寥，我言秋日胜春朝。', author: '刘禹锡' },
    { text: '停车坐爱枫林晚，霜叶红于二月花。', author: '杜牧' },
    { text: '秋天是第二个春天，每一片叶子都是一朵花。', author: '加缪' },
    { text: '风把桂花香送到很远的地方。', author: '佚名' },
  ],
  winter: [
    { text: '冬天来了，春天还会远吗？', author: '雪莱' },
    { text: '忽如一夜春风来，千树万树梨花开。', author: '岑参' },
    { text: '晚来天欲雪，能饮一杯无？', author: '白居易' },
    { text: '冬天适合安静地读一本书，等一场雪。', author: '佚名' },
  ],
}

const TIME_QUOTES: Record<string, Quote[]> = {
  morning: [
    { text: '晨光熹微，万物可期。', author: '佚名' },
    { text: '早晨的第一缕阳光，是今天的第一份礼物。', author: '佚名' },
    { text: '给自己冲一杯咖啡的时间。', author: '佚名' },
    { text: '醒来的那一刻，世界很安静。', author: '佚名' },
  ],
  afternoon: [
    { text: '午后阳光斜斜地照进来，像时间慢慢流过的样子。', author: '佚名' },
    { text: '下午茶的意义不在于茶，而在于那个停顿。', author: '佚名' },
    { text: '倦意袭来的时候，就闭一会儿眼睛吧。', author: '佚名' },
  ],
  evening: [
    { text: '晚风轻踩着云朵，月亮在贩售快乐。', author: '佚名' },
    { text: '一天结束了，不必什么都做好。', author: '佚名' },
    { text: '夜晚是白天的回音。', author: '佚名' },
  ],
  latenight: [
    { text: '星星都睡了，你也该休息了。', author: '佚名' },
    { text: '深夜适合安静的想念。', author: '佚名' },
    { text: '夜深了，世界很安静，你也安静下来吧。', author: '佚名' },
  ],
}

const SEMESTER_QUOTES: Record<string, Quote[]> = {
  early: [
    { text: '每一门课都是一扇新的窗。', author: '佚名' },
    { text: '慢慢进入节奏就好，不急。', author: '佚名' },
    { text: '空白的第一页，等着你来写。', author: '佚名' },
  ],
  mid: [
    { text: '行百里者半九十。', author: '古语' },
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
    { text: '按自己的节奏走，不必慌张。', author: '佚名' },
    { text: '平静地穿越学期中段。', author: '佚名' },
  ],
  late: [
    { text: '咬定青山不放松，立根原在破岩中。', author: '郑燮' },
    { text: '快结束了，再坚持一小会儿。', author: '佚名' },
    { text: '我们终将度过这段忙碌的日子。', author: '佚名' },
  ],
  exam: [
    { text: '临阵磨枪，不快也光。', author: '古语' },
    { text: '沉着冷静，方能发挥实力。', author: '佚名' },
    { text: '努力过就不必遗憾。', author: '佚名' },
  ],
  break: [
    { text: '什么也不做，也是一种重要的事。', author: '佚名' },
    { text: '放空自己，让风吹进来。', author: '佚名' },
    { text: '彻底的休息是对自己最好的奖励。', author: '佚名' },
  ],
}

const HOLIDAY_QUOTES: Quote[] = [
  { text: '假期就是理直气壮地无所事事。', author: '佚名' },
  { text: '阳光很好，风很轻，今天什么也不想。', author: '佚名' },
  { text: '今天的时间，只属于自己。', author: '佚名' },
]

const WEEKEND_QUOTES: Quote[] = [
  { text: '周末的早晨可以赖床，这是人类的正当权利。', author: '佚名' },
  { text: '周末不需要意义，它本身就是意义。', author: '佚名' },
  { text: '慢悠悠地度过这一天，就是最好的周末。', author: '佚名' },
]

const BUSY_QUOTES: Quote[] = [
  { text: '忙而不乱，才是真本事。', author: '佚名' },
  { text: '越是忙碌，越要冷静。', author: '佚名' },
  { text: '忙的时候也可以停下来喘口气。', author: '佚名' },
]

const LIGHT_QUOTES: Quote[] = [
  { text: '偷得浮生半日闲。', author: '李涉' },
  { text: '闲时要有吃紧的心思，忙时要有悠闲的趣味。', author: '洪应明' },
  { text: '慢下来，也是一种进步。', author: '佚名' },
]

function getFestivalKey(month: number, day: number): string | null {
  const key = `${month}-${day}`
  const map: Record<string, string> = {
    '1-1': 'newyear',
    '2-14': 'valentine',
    '3-8': 'womensday',
    '4-1': 'aprilfools',
    '4-5': 'qingming',
    '5-1': 'labor',
    '5-4': 'youth',
    '6-1': 'children',
    '6-19': 'duanwu',
    '9-10': 'teacher',
    '10-1': 'national',
    '10-31': 'halloween',
    '12-25': 'christmas',
    '12-31': 'newyeareve',
  }
  return map[key] ?? null
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'latenight' {
  if (hour >= 0 && hour < 6) return 'latenight'
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

export function getDailyQuote(ctx: QuoteContext = {}): Quote {
  const date = ctx.date ?? new Date()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const seed = date.getFullYear() * 10000 + month * 100 + day

  const candidates: { quote: Quote; weight: number }[] = []

  if (ctx.holiday) {
    for (const q of HOLIDAY_QUOTES) candidates.push({ quote: q, weight: 10 })
  }

  const festivalKey = getFestivalKey(month, day)
  if (festivalKey && FESTIVAL_QUOTES[festivalKey]) {
    for (const q of FESTIVAL_QUOTES[festivalKey]) candidates.push({ quote: q, weight: 8 })
  }

  const season = ctx.season ?? getSeason(month)
  if (SEASON_QUOTES[season]) {
    for (const q of SEASON_QUOTES[season]) candidates.push({ quote: q, weight: 4 })
  }

  const timeOfDay = ctx.timeOfDay ?? getTimeOfDay(hour)
  if (TIME_QUOTES[timeOfDay]) {
    for (const q of TIME_QUOTES[timeOfDay]) candidates.push({ quote: q, weight: 3 })
  }

  if (ctx.semesterPhase && SEMESTER_QUOTES[ctx.semesterPhase]) {
    for (const q of SEMESTER_QUOTES[ctx.semesterPhase]) candidates.push({ quote: q, weight: 5 })
  }

  if (ctx.isWeekend) {
    for (const q of WEEKEND_QUOTES) candidates.push({ quote: q, weight: 3 })
  }

  if (ctx.courseCount !== undefined) {
    if (ctx.courseCount >= 4) {
      for (const q of BUSY_QUOTES) candidates.push({ quote: q, weight: 2 })
    } else if (ctx.courseCount <= 1) {
      for (const q of LIGHT_QUOTES) candidates.push({ quote: q, weight: 2 })
    }
  }

  for (const q of GENERAL_QUOTES) candidates.push({ quote: q, weight: 1 })

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let pick = seed % totalWeight
  for (const c of candidates) {
    pick -= c.weight
    if (pick < 0) return c.quote
  }

  return candidates[0].quote
}
