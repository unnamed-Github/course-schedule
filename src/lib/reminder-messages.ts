const WATER_MESSAGES = [
  '该喝水了 💧\n少量多次，每次一小杯，全天均匀补充水分',
  '起来喝口水吧 🥤\n久坐不动更要多喝水，促进血液循环',
  '补水时间到 💦\n身体缺水会影响注意力和代谢哦',
  '喝杯水休息一下 ☕\n别等渴了再喝，定时补水更科学',
  '水分补给提醒 🌊\n每天建议喝 1.5-2 升水，你已经喝够了吗？',
  '暂停一下，喝口水 🚰\n让眼睛也休息休息，看看远方',
  '来杯水吧 ⛲\n充足水分让大脑更清醒，学习效率更高',
  '水杯该举起来了 🍵\n温水最佳，冰水伤胃，记得小口慢饮',
]

const KEGEL_MESSAGE = '提肛时间！💪\n收紧肛门 5 秒 → 放松 3 秒，重复 10 次'

const NIGHT_MESSAGES = [
  '夜深了，该休息了 🌙\n充足的睡眠是明天精力的保障',
  '早点休息吧 😴\n熬夜伤身，明天还有课呢',
  '该睡觉了 🛏️\n关机，闭眼，给大脑放个假',
  '很晚了，准备入睡 🌜\n今晚早睡，明天元气满满',
]

let waterIndex = -1
let nightIndex = -1

export function pickWaterMessage(): string {
  let idx: number
  do {
    idx = Math.floor(Math.random() * WATER_MESSAGES.length)
  } while (idx === waterIndex && WATER_MESSAGES.length > 1)
  waterIndex = idx
  return WATER_MESSAGES[idx]
}

export function getKegelMessage(): string {
  return KEGEL_MESSAGE
}

export function pickNightMessage(): string {
  let idx: number
  do {
    idx = Math.floor(Math.random() * NIGHT_MESSAGES.length)
  } while (idx === nightIndex && NIGHT_MESSAGES.length > 1)
  nightIndex = idx
  return NIGHT_MESSAGES[idx]
}
