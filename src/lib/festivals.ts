export interface Festival {
  month: number
  day: number
  emoji: string
  greeting: string
  subGreeting: string
  history: string
}

export const FESTIVALS: Festival[] = [
  { month: 1, day: 1, emoji: '🎆', greeting: '新年快乐！', subGreeting: '新学期新开始', history: '元旦是一年的首日。"元"意为开始，"旦"指天亮。1949年起中国采用公历1月1日为元旦，各地张灯结彩，寄托对新年的美好期许。' },
  { month: 2, day: 14, emoji: '🌸', greeting: '今天也要好好上课哦', subGreeting: '爱与学习并存', history: '情人节源自罗马圣瓦伦丁的传说，如今已成为全球表达爱意的节日。无论是送花、巧克力还是手写卡片，都是向珍视之人传递温暖的仪式。' },
  { month: 3, day: 8, emoji: '💐', greeting: '妇女节快乐！', subGreeting: '致敬每一位她', history: '国际劳动妇女节始于20世纪初的女权运动。1908年纽约女工走上街头争取平等权利，百年后这个日子已成为致敬全球女性贡献与力量的重要节日。' },
  { month: 4, day: 1, emoji: '🤪', greeting: '愚人节快乐！', subGreeting: '今天的课表可不是开玩笑的', history: '愚人节起源众说纷纭，一说是1582年法国改用新历后，仍有人在4月1日庆祝新年而被戏称为"四月愚人"。如今以轻松恶作剧传递幽默，提醒人们保持童心。' },
  { month: 5, day: 1, emoji: '✊', greeting: '劳动节快乐！', subGreeting: '劳动最光荣', history: '五一国际劳动节源于1886年芝加哥工人大罢工，为争取八小时工作制而斗争。如今成为致敬每一位劳动者的节日，提醒我们劳动创造价值、也创造尊严。' },
  { month: 5, day: 4, emoji: '🔥', greeting: '青年节快乐！', subGreeting: '青春正当时', history: '五四青年节纪念1919年五四爱国运动。那一代青年以"爱国、进步、民主、科学"为旗帜，掀开了中国近代史崭新一页，激励着一代又一代年轻人奋发图强。' },
  { month: 6, day: 1, emoji: '🎈', greeting: '六一快乐！', subGreeting: '永葆童心', history: '国际儿童节定于每年6月1日，源自1949年国际民主妇女联合会的倡议。无论多大，都值得在这一天做回孩子——简单、快乐、对世界充满好奇。' },
  { month: 9, day: 10, emoji: '🎓', greeting: '教师节快乐！', subGreeting: '感恩每一位老师', history: '中国教师节始于1985年，定于每年9月10日。尊师重道是中华民族的传统美德，"传道、授业、解惑"，每一位老师都在用知识点亮学生的未来。' },
  { month: 10, day: 1, emoji: '🇨🇳', greeting: '国庆快乐！', subGreeting: '祝祖国繁荣昌盛', history: '1949年10月1日，中华人民共和国成立。从此这一天成为举国欢庆的日子，阅兵、升旗、烟花汇演…亿万国人共同为祖国庆生。' },
  { month: 10, day: 31, emoji: '🎃', greeting: '不给糖就捣蛋！', subGreeting: '万圣节快乐', history: '万圣节源于凯尔特人的萨温节，认为10月31日是夏季结束、亡灵归来的日子。现代万圣节以南瓜灯、奇装异服和"不给糖就捣蛋"闻名，充满神秘与童趣。' },
  { month: 12, day: 25, emoji: '🎄', greeting: 'Merry Christmas！', subGreeting: '圣诞快乐', history: '圣诞节纪念耶稣诞生，源自公元4世纪的罗马。圣诞树、礼物交换、圣诞老人…这些传统跨越大洋，成为全球最具仪式感的冬日庆典，传递着平安与团圆的温暖。' },
  { month: 12, day: 31, emoji: '🥂', greeting: '跨年快乐！', subGreeting: '新的一年即将开始', history: '元旦前夜是全球共同迎接新年的时刻。从纽约时代广场的水晶球倒计时，到各地的烟花与钟声，人们用不同的方式告别旧岁、拥抱新的开始。' },
]

export function getTodayFestival(date: Date = new Date()): Festival | null {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return FESTIVALS.find(f => f.month === m && f.day === d) ?? null
}
