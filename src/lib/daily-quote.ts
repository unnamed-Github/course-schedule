export interface Quote {
  text: string
  author: string
}

const QUOTES: Quote[] = [
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '知人者智，自知者明。', author: '老子' },
  { text: '吾生也有涯，而知也无涯。', author: '庄子' },
  { text: '未经审视的人生不值得过。', author: '苏格拉底' },
  { text: '真正的发现之旅不在于寻找新风景，而在于拥有新眼光。', author: '普鲁斯特' },
  { text: '世界上只有一种英雄主义，就是认清生活的真相后依然热爱它。', author: '罗曼·罗兰' },
  { text: '人的一切痛苦，本质上都是对自己无能的愤怒。', author: '王小波' },
  { text: '自由不是让你想做什么就做什么，自由是教你不想做什么就可以不做什么。', author: '康德' },
  { text: '我们听到的一切都是一个观点，不是事实；我们看到的一切都是一个视角，不是真相。', author: '马可·奥勒留' },
  { text: '把每一天当作最后一天来过，终有一天你会如愿以偿。', author: '霍勒斯' },
  { text: '人最大的悲哀在于不可逆转地走向死亡，最大的幸运也在于此。', author: '加缪' },
  { text: '当你凝视深渊时，深渊也在凝视你。', author: '尼采' },
  { text: '常识就是人到十八岁为止累积的所有偏见。', author: '爱因斯坦' },
  { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
  { text: '不要因为走得太远，而忘了为什么出发。', author: '纪伯伦' },
  { text: '教育的目的不是填满桶，而是点燃火。', author: '叶芝' },
  { text: '人生没有白走的路，每一步都算数。', author: '李宗盛' },
  { text: '你不能控制风向，但你可以调整风帆。', author: '吉米·迪恩' },
  { text: '最困难的事情就是认识自己。', author: '泰勒斯' },
  { text: '凡是过往，皆为序章。', author: '莎士比亚' },
  { text: '知不足者好学，耻下问者自满。', author: '林逋' },
  { text: '人不能两次踏进同一条河流。', author: '赫拉克利特' },
  { text: '我思故我在。', author: '笛卡尔' },
  { text: '生活总是让我们遍体鳞伤，但到后来，那些受伤的地方会变成我们最强壮的地方。', author: '海明威' },
  { text: '真理永远在少数人一边。', author: '布莱克' },
  { text: '人类的悲欢并不相通，我只觉得他们吵闹。', author: '鲁迅' },
  { text: '知识就是力量。', author: '培根' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '人法地，地法天，天法道，道法自然。', author: '老子' },
]

export function getDailyQuote(date: Date = new Date()): Quote {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const idx = seed % QUOTES.length
  return QUOTES[idx]
}
