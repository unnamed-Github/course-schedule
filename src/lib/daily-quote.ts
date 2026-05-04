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
  { text: '此中有真意，欲辨已忘言。', author: '陶渊明' },
  { text: '行到水穷处，坐看云起时。', author: '王维' },
  { text: '人生到处知何似，应似飞鸿踏雪泥。', author: '苏轼' },
  { text: '人间有味是清欢。', author: '苏轼' },
  { text: '醉后不知天在水，满船清梦压星河。', author: '唐温如' },
  { text: '疏影横斜水清浅，暗香浮动月黄昏。', author: '林逋' },
  { text: '山中何事？松花酿酒，春水煎茶。', author: '张可久' },
  { text: '从前慢，车马邮件都慢，一生只够爱一个人。', author: '木心' },
  { text: '比晚霞更美的，是那个愿意抬头看它的人。', author: '木心' },
  { text: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。', author: '辛弃疾' },
  { text: '仰天大笑出门去，我辈岂是蓬蒿人。', author: '李白' },
  { text: '人生自是有情痴，此恨不关风与月。', author: '欧阳修' },
  { text: '做你自己，因为别人都有人做了。', author: '王尔德' },
  { text: '我们都在阴沟里，但仍有人仰望星空。', author: '王尔德' },
  { text: '世界以痛吻我，要我报之以歌。', author: '泰戈尔' },
  { text: '天空不留下鸟的痕迹，但我已飞过。', author: '泰戈尔' },
  { text: '生活的意义在于生活本身。', author: '米兰·昆德拉' },
  { text: '重要的不是治愈，而是带着病痛活下去。', author: '加缪' },
  { text: '在深冬里，我终于发现，在我心里有一个不可战胜的夏天。', author: '加缪' },
  { text: '一个人可以被毁灭，但不能被打败。', author: '海明威' },
  { text: '人生而自由，却无往不在枷锁之中。', author: '卢梭' },
  { text: '今天不想写作业，那就明天再写。', author: '佚名' },
  { text: '像一棵树一样，安静地站在那里，就很好。', author: '佚名' },
  { text: '躺着也算一种生活方式。', author: '佚名' },
  { text: '天气好的时候，适合发呆。', author: '佚名' },
  { text: '不必太在意结果，体验本身就是收获。', author: '佚名' },
  { text: '有时候，什么都不做才是最重要的事。', author: '佚名' },
  { text: '宇宙很大，你的烦恼很小。', author: '佚名' },
  { text: '你已经做得很好了，歇一会儿吧。', author: '佚名' },
  { text: '放空也是一种能力。', author: '佚名' },
  { text: '我知道你今天很累。没关系，明天再来。', author: '佚名' },
  { text: '不是每一天都要闪闪发光，平平静静地过完就很好了。', author: '佚名' },
  { text: '你不需要时刻都准备好，可以慌乱，可以不安。', author: '佚名' },
  { text: '情绪低落的时候，不用急着好起来。', author: '佚名' },
  { text: '有时候什么都不想做，这不是懒，是身体在保护你。', author: '佚名' },
  { text: '想哭就哭吧，眼泪不是软弱，是你在面对自己。', author: '佚名' },
  { text: '累了就是累了，不需要理由。', author: '佚名' },
  { text: '不用在所有事上都做到最好，及格也可以。', author: '佚名' },
  { text: '撑不住的时候就不撑了，总有人会扶你一把。', author: '佚名' },
  { text: '一个人吃饭也可以很香，这不是孤独，是自在。', author: '佚名' },
  { text: '独处是和自己的一场约会。', author: '佚名' },
  { text: '一个人走在路上，听着歌，风从身边经过，这样就很好。', author: '佚名' },
  { text: '安静地待着，听雨声，什么都不想。', author: '佚名' },
  { text: '一碗热汤可以让一整天都好起来。', author: '佚名' },
  { text: '洗干净的床单晒在阳光里，这就是幸福的样子。', author: '佚名' },
  { text: '走到楼下闻到别人家炒菜的香味，忽然觉得很安心。', author: '佚名' },
  { text: '图书馆靠窗的位置，阳光刚好打在书页上。', author: '佚名' },
  { text: '黄昏时分路灯亮起的那一刻，世界忽然温柔了。', author: '佚名' },
  { text: '我今天的工作效率：打开电脑 → 发呆 → 关掉电脑。', author: '佚名' },
  { text: '今天的运动量：从床到冰箱走了三趟。', author: '佚名' },
  { text: '我的计划：今天要努力。现实：今天努力地躺平了。', author: '佚名' },
]

const FESTIVAL_QUOTES: Record<string, Quote[]> = {
  newyear: [
    { text: '辞旧迎新，万象更新。', author: '古语' },
    { text: '雄关漫道真如铁，而今迈步从头越。', author: '毛泽东' },
    { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
    { text: '数风流人物，还看今朝。', author: '毛泽东' },
  ],
  valentine: [
    { text: '爱是耐心，爱是善良。', author: '哥林多前书' },
    { text: '爱不是彼此凝视，而是一起朝同一个方向看。', author: '圣埃克苏佩里' },
    { text: '爱是即使见过对方最不堪的样子，依然选择留在身边。', author: '佚名' },
    { text: '喜欢一个人，大概就是想把今天看到的所有好东西都告诉他。', author: '佚名' },
  ],
  labor: [
    { text: '劳动最光荣，工作的时候也别忘了窗外的云。', author: '佚名' },
    { text: '不劳者不得食。', author: '列宁' },
    { text: '只有劳动才能使人幸福。', author: '高尔基' },
    { text: '劳动者创造世界。', author: '马克思' },
    { text: '人的一生应当这样度过：当他回首往事时，不因虚度年华而悔恨。', author: '奥斯特洛夫斯基' },
  ],
  youth: [
    { text: '世界是你们的，也是我们的，但归根结底是你们的。', author: '毛泽东' },
    { text: '青年如初春，如朝日，如百卉之萌动。', author: '陈独秀' },
    { text: '愿中国青年都摆脱冷气，只是向上走。', author: '鲁迅' },
    { text: '以青春之我，创建青春之国家。', author: '李大钊' },
  ],
  children: [
    { text: '儿童是祖国的花朵，是民族的未来和希望。', author: '佚名' },
    { text: '好好学习，天天向上。', author: '毛泽东' },
    { text: '所有大人都曾是小孩，只是很少有人记得。', author: '圣埃克苏佩里' },
  ],
  teacher: [
    { text: '师者，所以传道授业解惑也。', author: '韩愈' },
    { text: '教育者，非为已往，非为现在，而专为将来。', author: '蔡元培' },
    { text: '一棵树摇动另一棵树，一朵云推动另一朵云。', author: '雅斯贝尔斯' },
  ],
  national: [
    { text: '中华人民共和国成立了！', author: '毛泽东' },
    { text: '我是中国人民的儿子，我深情地爱着我的祖国和人民。', author: '邓小平' },
    { text: '此生无悔入华夏，来世还做中国人。', author: '佚名' },
    { text: '山河无恙，烟火寻常，可是你如愿的眺望。', author: '佚名' },
    { text: '大道之行也，天下为公。', author: '《礼记》' },
  ],
  womensday: [
    { text: '妇女能顶半边天。', author: '毛泽东' },
    { text: '每一位认真生活的女性，都值得被看见。', author: '佚名' },
    { text: '在革命斗争中，没有妇女的酵素，就不可能有伟大的社会变革。', author: '马克思' },
  ],
  halloween: [
    { text: '面对恐惧才能战胜恐惧。', author: '纳尔逊·曼德拉' },
    { text: '勇敢不是不害怕，而是害怕了依然前行。', author: '佚名' },
    { text: '今晚做一天别人，明天再做自己。', author: '佚名' },
  ],
  christmas: [
    { text: '给予比接受更快乐。', author: '佚名' },
    { text: '最美好的礼物是陪伴。', author: '佚名' },
    { text: '圣诞的真正礼物，是有人记得你。', author: '佚名' },
  ],
  newyeareve: [
    { text: '旧岁已展千重锦，新年再进百尺竿。', author: '佚名' },
    { text: '所有的告别都是为了更好的相遇。', author: '佚名' },
  ],
  qingming: [
    { text: '为有牺牲多壮志，敢教日月换新天。', author: '毛泽东' },
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
}

const SEASON_QUOTES: Record<string, Quote[]> = {
  spring: [
    { text: '春种一粒粟，秋收万颗子。', author: '李绅' },
    { text: '等闲识得东风面，万紫千红总是春。', author: '朱熹' },
    { text: '好雨知时节，当春乃发生。', author: '杜甫' },
    { text: '春天不是季节，而是内心。', author: '佚名' },
    { text: '你像一阵春风，轻轻柔柔吹入我心中。', author: '罗大佑' },
    { text: '春天适合重新开始，也适合重新认识自己。', author: '佚名' },
    { text: '春风十里，不如你。', author: '冯唐' },
    { text: '路边的樱花开了，记得抬头看一眼。', author: '佚名' },
  ],
  summer: [
    { text: '生如夏花之绚烂。', author: '泰戈尔' },
    { text: '接天莲叶无穷碧，映日荷花别样红。', author: '杨万里' },
    { text: '坐在夏天的门槛上，等待一场雨。', author: '佚名' },
    { text: '蝉鸣是夏天的白噪音，给思绪留一点空隙。', author: '佚名' },
    { text: '夏天是冰西瓜的味道和树影里的光斑。', author: '佚名' },
    { text: '夏夜的星空，是免费的宇宙纪录片。', author: '佚名' },
    { text: '空调、西瓜、Wi-Fi，人间三大发明。', author: '佚名' },
  ],
  autumn: [
    { text: '落霞与孤鹜齐飞，秋水共长天一色。', author: '王勃' },
    { text: '自古逢秋悲寂寥，我言秋日胜春朝。', author: '刘禹锡' },
    { text: '停车坐爱枫林晚，霜叶红于二月花。', author: '杜牧' },
    { text: '秋天是第二个春天，每一片叶子都是一朵花。', author: '加缪' },
    { text: '风把桂花香送到很远的地方。', author: '佚名' },
    { text: '秋天到了，叶子要做的事情就是落下来。', author: '佚名' },
    { text: '一层秋雨一层凉，记得添衣裳。', author: '佚名' },
  ],
  winter: [
    { text: '冬天来了，春天还会远吗？', author: '雪莱' },
    { text: '忽如一夜春风来，千树万树梨花开。', author: '岑参' },
    { text: '晚来天欲雪，能饮一杯无？', author: '白居易' },
    { text: '冬天适合安静地读一本书，等一场雪。', author: '佚名' },
    { text: '被窝是冬天最伟大的发明。', author: '佚名' },
    { text: '外面很冷，但屋里很暖，这样就够了。', author: '佚名' },
  ],
}

const TIME_QUOTES: Record<string, Quote[]> = {
  morning: [
    { text: '晨光熹微，万物可期。', author: '佚名' },
    { text: '早晨的第一缕阳光，是今天的第一份礼物。', author: '佚名' },
    { text: '给自己冲一杯咖啡的时间。', author: '佚名' },
    { text: '醒来的那一刻，世界很安静。', author: '佚名' },
    { text: '闹钟响了，但被窝说再待五分钟。', author: '佚名' },
    { text: '早上的阳光告诉你，昨天已经过去了。', author: '佚名' },
  ],
  afternoon: [
    { text: '午后阳光斜斜地照进来，像时间慢慢流过的样子。', author: '佚名' },
    { text: '下午茶的意义不在于茶，而在于那个停顿。', author: '佚名' },
    { text: '倦意袭来的时候，就闭一会儿眼睛吧。', author: '佚名' },
    { text: '下午三点，世界上最容易睡着的时间。', author: '佚名' },
    { text: '喝完这杯茶，我就开始认真工作（先喝完再说）。', author: '佚名' },
  ],
  evening: [
    { text: '晚风轻踩着云朵，月亮在贩售快乐。', author: '佚名' },
    { text: '一天结束了，不必什么都做好。', author: '佚名' },
    { text: '夜晚是白天的回音。', author: '佚名' },
    { text: '黄昏是一天中最温柔的告别。', author: '佚名' },
    { text: '今天辛苦了，晚餐吃点好的。', author: '佚名' },
  ],
  latenight: [
    { text: '星星都睡了，你也该休息了。', author: '佚名' },
    { text: '深夜适合安静的想念。', author: '佚名' },
    { text: '夜深了，世界很安静，你也安静下来吧。', author: '佚名' },
    { text: '熬夜的人，都在和自己聊心事。', author: '佚名' },
    { text: '凌晨两点，世界是黑白的，思绪是彩色的。', author: '佚名' },
  ],
}

const SEMESTER_QUOTES: Record<string, Quote[]> = {
  early: [
    { text: '每一门课都是一扇新的窗。', author: '佚名' },
    { text: '慢慢进入节奏就好，不急。', author: '佚名' },
    { text: '空白的第一页，等着你来写。', author: '佚名' },
    { text: '新学期，允许自己慢慢来。', author: '佚名' },
    { text: '不急，第一周是用来摸清地形的。', author: '佚名' },
  ],
  mid: [
    { text: '行百里者半九十。', author: '古语' },
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
    { text: '按自己的节奏走，不必慌张。', author: '佚名' },
    { text: '平静地穿越学期中段。', author: '佚名' },
    { text: '学期过半了，你很棒，继续走。', author: '佚名' },
    { text: '把考试看作一场游戏，不过是打怪升级。', author: '佚名' },
  ],
  late: [
    { text: '咬定青山不放松，立根原在破岩中。', author: '郑燮' },
    { text: '快结束了，再坚持一小会儿。', author: '佚名' },
    { text: '我们终将度过这段忙碌的日子。', author: '佚名' },
    { text: '只剩几周了，但睡眠也很重要。', author: '佚名' },
    { text: '期末不是终点，是学期这门课的最后一章。', author: '佚名' },
  ],
  exam: [
    { text: '临阵磨枪，不快也光。', author: '古语' },
    { text: '沉着冷静，方能发挥实力。', author: '佚名' },
    { text: '努力过就不必遗憾。', author: '佚名' },
    { text: '考完试就可以睡到自然醒了。', author: '佚名' },
    { text: '这只是一场考试，不会定义你的一生。', author: '佚名' },
  ],
  break: [
    { text: '什么也不做，也是一种重要的事。', author: '佚名' },
    { text: '放空自己，让风吹进来。', author: '佚名' },
    { text: '彻底的休息是对自己最好的奖励。', author: '佚名' },
    { text: '假期允许你彻底躺平。', author: '佚名' },
    { text: '休息不是罪恶，是充电。', author: '佚名' },
  ],
}

const HOLIDAY_QUOTES: Quote[] = [
  { text: '假期就是理直气壮地无所事事。', author: '佚名' },
  { text: '阳光很好，风很轻，今天什么也不想。', author: '佚名' },
  { text: '今天的时间，只属于自己。', author: '佚名' },
  { text: '今天的任务：什么也不做，并且享受它。', author: '佚名' },
  { text: '太阳晒到屁股了，翻个面继续晒。', author: '佚名' },
  { text: '假期第一天：制定计划。假期最后一天：看着计划笑了。', author: '佚名' },
  { text: '假期的人生格言：吃了睡，睡了吃，中间可以看点剧。', author: '佚名' },
  { text: '放假的意义就是：不被任何 KPI 追赶。', author: '佚名' },
]

const WEEKEND_QUOTES: Quote[] = [
  { text: '周末的早晨可以赖床，这是人类的正当权利。', author: '佚名' },
  { text: '周末不需要意义，它本身就是意义。', author: '佚名' },
  { text: '慢悠悠地度过这一天，就是最好的周末。', author: '佚名' },
  { text: '周末的闹钟，没有资格叫醒我。', author: '佚名' },
  { text: '懒觉是周末的基本人权。', author: '佚名' },
  { text: '周末只有一件事值得做：让自己舒服。', author: '佚名' },
]

const BUSY_QUOTES: Quote[] = [
  { text: '忙而不乱，才是真本事。', author: '佚名' },
  { text: '越是忙碌，越要冷静。', author: '佚名' },
  { text: '忙的时候也可以停下来喘口气。', author: '佚名' },
  { text: '忙完这阵子，就可以忙下一阵子了。但今天先休息。', author: '佚名' },
]

const LIGHT_QUOTES: Quote[] = [
  { text: '偷得浮生半日闲。', author: '李涉' },
  { text: '闲时要有吃紧的心思，忙时要有悠闲的趣味。', author: '洪应明' },
  { text: '慢下来，也是一种进步。', author: '佚名' },
  { text: '一天只有两节课，简直像放假。', author: '佚名' },
  { text: '今天的空气都是轻松的。', author: '佚名' },
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

  const festivalKey = getFestivalKey(month, day)

  // 节日当天：仅展示节日相关语录，不混入通用/季节/时段内容
  if (festivalKey && FESTIVAL_QUOTES[festivalKey]) {
    const qs = FESTIVAL_QUOTES[festivalKey]
    return qs[Math.floor(Math.random() * qs.length)]
  }

  // ctx.festival 兜底（调用方显式传入的节日，如 getTodayFestival 返回了但不在 getFestivalKey 映射中）
  if (ctx.festival) {
    const qs = GENERAL_QUOTES.filter(
      (q) => q.author === '佚名' && q.text.length <= 20
    )
    if (qs.length > 0) return qs[Math.floor(Math.random() * qs.length)]
    return { text: `${ctx.festival.emoji} ${ctx.festival.greeting}`, author: '今日' }
  }

  const candidates: { quote: Quote; weight: number }[] = []

  if (ctx.holiday) {
    for (const q of HOLIDAY_QUOTES) candidates.push({ quote: q, weight: 10 })
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
  let pick = Math.random() * totalWeight
  for (const c of candidates) {
    pick -= c.weight
    if (pick < 0) return c.quote
  }

  return candidates[0].quote
}
