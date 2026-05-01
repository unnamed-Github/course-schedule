export interface Festival {
  month: number
  day: number
  emoji: string
  greeting: string
  subGreeting: string
  history: string
}

export const FESTIVALS: Festival[] = [
  { month: 1, day: 1, emoji: '🎆', greeting: '新年快乐！', subGreeting: '新学期新开始', history: '"元"意为始，"旦"指天亮，元旦即新年的第一个早晨。中国古代以农历正月初一为元旦，1912年民国改用公历后定1月1日为元旦，1949年新中国沿用此制。日本、韩国等国也在这一天庆祝新年。' },
  { month: 2, day: 14, emoji: '🌸', greeting: '今天也要好好上课哦', subGreeting: '爱与学习并存', history: '情人节与罗马帝国时期的基督教殉道者瓦伦丁有关。相传他因违抗禁婚令为情侣主持婚礼而被处刑。14世纪英国诗人乔叟首次将2月14日与浪漫爱情联系起来，此后逐渐风靡全球。' },
  { month: 3, day: 8, emoji: '💐', greeting: '妇女节快乐！', subGreeting: '致敬每一位她', history: '1908年1.5万名纽约女工上街游行，要求缩短工时、提高薪酬和选举权。1910年哥本哈根国际社会主义妇女代表大会通过设立国际妇女节的决议。1977年联合国正式承认3月8日为国际妇女节。' },
  { month: 4, day: 1, emoji: '🤪', greeting: '愚人节快乐！', subGreeting: '今天的课表可不是开玩笑的', history: '愚人节起源最流行的说法是：1582年法国改用格里高利历，新年从4月1日改为1月1日，仍按旧历庆祝的人被称为"四月愚人"。英国民间也有4月1日为"愚人日"的传统，恶作剧只能在中午12点前进行。' },
  { month: 5, day: 1, emoji: '✊', greeting: '劳动节快乐！', subGreeting: '劳动最光荣', history: '1886年5月1日，芝加哥21万工人举行大罢工，要求实行八小时工作制，引发"干草市场事件"。1889年第二国际巴黎大会将5月1日定为国际劳动节以纪念此事。中国自1920年起纪念五一，1949年定为法定假日。' },
  { month: 5, day: 4, emoji: '🔥', greeting: '青年节快乐！', subGreeting: '青春正当时', history: '1919年5月4日，北京大学等校学生因巴黎和会外交失败而上街游行，提出"外争主权、内除国贼"，引发全国性反帝反封建运动。1939年陕甘宁边区将5月4日定为中国青年节，沿用至今。' },
  { month: 6, day: 1, emoji: '🎈', greeting: '六一快乐！', subGreeting: '永葆童心', history: '1949年11月，国际民主妇女联合会在莫斯科召开会议，为悼念二战中死难的儿童，决定将6月1日定为国际儿童节。此前1925年日内瓦也曾提出儿童节倡议，但各国日期不一，6月1日为社会主义阵营国家普遍采用。' },
  { month: 9, day: 10, emoji: '🎓', greeting: '教师节快乐！', subGreeting: '感恩每一位老师', history: '1931年教育家邰爽秋等首次倡议设立教师节，定6月6日。1951年教育部曾与劳动节合并庆祝。1985年1月，第六届全国人大常委会第九次会议通过议案，正式确定9月10日为中国教师节，当年9月10日为第一个教师节。' },
  { month: 10, day: 1, emoji: '🇨🇳', greeting: '国庆快乐！', subGreeting: '祝祖国繁荣昌盛', history: '1949年10月1日下午3时，毛泽东在天安门城楼宣告中华人民共和国中央人民政府成立。1949年12月2日，中央人民政府委员会通过决议，定10月1日为国庆日。1950年起每年举行庆典，逢十周年举行盛大阅兵。' },
  { month: 10, day: 31, emoji: '🎃', greeting: '不给糖就捣蛋！', subGreeting: '万圣节快乐', history: '万圣节前夜源自两千年前凯尔特人的萨温节（Samhain），他们认为这一天生者与亡者的界限最为模糊，需点燃篝火驱邪。罗马征服后融入了波莫纳节（果树女神）的元素。南瓜灯传统来自爱尔兰传说"吝啬鬼杰克"，19世纪随爱尔兰移民传入美国。' },
  { month: 12, day: 25, emoji: '🎄', greeting: 'Merry Christmas！', subGreeting: '圣诞快乐', history: '圣诞节最早文献记载见于公元354年的罗马历书。12月25日可能源自罗马冬至节"不可战胜的太阳诞辰"。圣诞树传统始于16世纪德国宗教改革家马丁·路德，他首次在树上点蜡烛。圣诞老人的形象则融合了4世纪米拉主教圣尼古拉斯和19世纪美国诗人摩尔的诗歌创作。' },
  { month: 12, day: 31, emoji: '🥂', greeting: '跨年快乐！', subGreeting: '新的一年即将开始', history: '跨年倒计时传统始于1907年的纽约时代广场，当年用铁木球下落标志午夜降临，此后每年延续。苏格兰的"除夕夜"（Hogmanay）是欧洲最盛大的跨年庆典之一，有"第一步"传统——新年第一个进屋的人象征全年运气。' },
]

export function getTodayFestival(date: Date = new Date()): Festival | null {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return FESTIVALS.find(f => f.month === m && f.day === d) ?? null
}
