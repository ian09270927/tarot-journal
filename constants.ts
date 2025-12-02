
import { Arcana, Suit, TarotCard } from './types';

// Helper to generate image URL. Using a tarot-specific placeholder service if available would be better, 
// but random abstract art from picsum works for "mystical" vibes with seeded IDs.
const getImageUrl = (id: string) => `https://picsum.photos/seed/${id}/300/500`;

const createCard = (
  id: string, 
  name: string, 
  nameCN: string, 
  arcana: Arcana, 
  suit: Suit, 
  number: number,
  uprightKeywords: string[],
  reversedKeywords: string[],
  uprightSummary: string,
  reversedSummary: string
): TarotCard => ({
  id,
  name,
  nameCN,
  arcana,
  suit,
  number,
  uprightKeywords,
  reversedKeywords,
  uprightSummary,
  reversedSummary,
  imagePlaceholder: getImageUrl(id)
});

// Major Arcana
const MAJOR_ARCANA: TarotCard[] = [
  createCard('maj_0', 'The Fool', '愚者', Arcana.Major, Suit.None, 0, ['開始', '冒險', '純真'], ['魯莽', '風險', '愚蠢'], '新的旅程即將開始，保持開放的心。', '當心過於衝動或未經深思熟慮的決定。'),
  createCard('maj_1', 'The Magician', '魔術師', Arcana.Major, Suit.None, 1, ['創造力', '技能', '意志力'], ['欺騙', '無能', '猶豫'], '你擁有實現目標所需的所有資源。', '注意溝通不良或被誤導的可能性。'),
  createCard('maj_2', 'The High Priestess', '女祭司', Arcana.Major, Suit.None, 2, ['直覺', '潛意識', '神祕'], ['壓抑', '膚淺', '混亂'], '傾聽內在的聲音，相信你的直覺。', '你可能忽略了內心的指引或被表面蒙蔽。'),
  createCard('maj_3', 'The Empress', '皇后', Arcana.Major, Suit.None, 3, ['豐饒', '母性', '自然'], ['依賴', '窒息', '匱乏'], '享受生活中的富足與美好，創造力的展現。', '注意過度保護或情感上的勒索。'),
  createCard('maj_4', 'The Emperor', '皇帝', Arcana.Major, Suit.None, 4, ['權威', '結構', '控制'], ['暴政', '僵化', '冷酷'], '建立秩序與規則，展現領導力。', '避免過於專斷或固執己見。'),
  createCard('maj_5', 'The Hierophant', '教皇', Arcana.Major, Suit.None, 5, ['傳統', '信仰', '學習'], ['反叛', '束縛', '偽善'], '尋求精神指引或遵循傳統智慧。', '是時候打破陳規，尋找自己的真理。'),
  createCard('maj_6', 'The Lovers', '戀人', Arcana.Major, Suit.None, 6, ['愛', '和諧', '選擇'], ['不和', '失衡', '分離'], '重要的關係或決定，這關乎價值觀的選擇。', '面臨情感上的矛盾或錯誤的選擇。'),
  createCard('maj_7', 'The Chariot', '戰車', Arcana.Major, Suit.None, 7, ['勝利', '意志', '決心'], ['失控', '失敗', '攻擊'], '透過自律與意志力克服障礙。', '情緒可能失控，或方向迷失。'),
  createCard('maj_8', 'Strength', '力量', Arcana.Major, Suit.None, 8, ['勇氣', '耐心', '同情'], ['軟弱', '自卑', '恐懼'], '以柔克剛，內在的力量比外在更強大。', '這時候需要克服內心的恐懼與自我懷疑。'),
  createCard('maj_9', 'The Hermit', '隱士', Arcana.Major, Suit.None, 9, ['內省', '孤獨', '引導'], ['孤立', '迷失', '拒絕'], '這是一段需要獨處與反思的時間。', '過度封閉自己，拒絕他人的幫助。'),
  createCard('maj_10', 'Wheel of Fortune', '命運之輪', Arcana.Major, Suit.None, 10, ['改變', '週期', '命運'], ['厄運', '抗拒', '中斷'], '順應時勢，改變是不可避免的。', '面對突如其來的變化，感到無力掌控。'),
  createCard('maj_11', 'Justice', '正義', Arcana.Major, Suit.None, 11, ['公平', '真理', '因果'], ['不公', '偏見', '逃避'], '誠實面對自己，承擔行為的後果。', '可能遭受不公平的對待，或在逃避責任。'),
  createCard('maj_12', 'The Hanged Man', '吊人', Arcana.Major, Suit.None, 12, ['犧牲', '等待', '新視角'], ['停滯', '無謂犧牲', '拖延'], '換個角度看世界，有時候暫停是為了更好的前進。', '無謂的犧牲或陷入僵局，無法動彈。'),
  createCard('maj_13', 'Death', '死神', Arcana.Major, Suit.None, 13, ['結束', '轉變', '重生'], ['抗拒改變', '停滯', '腐敗'], '舊的不去新的不來，這是一個深刻轉變的時刻。', '恐懼結束，死守著不再服務於你的事物。'),
  createCard('maj_14', 'Temperance', '節制', Arcana.Major, Suit.None, 14, ['平衡', '適度', '耐心'], ['失衡', '極端', '匆忙'], '尋找中庸之道，保持身心靈的平衡。', '生活失去平衡，過度縱容或缺乏耐心。'),
  createCard('maj_15', 'The Devil', '惡魔', Arcana.Major, Suit.None, 15, ['束縛', '物質', '誘惑'], ['釋放', '覺醒', '脫離'], '面對內心的慾望與陰影，不要被物質束縛。', '意識到束縛的存在，並嘗試從中解脫。'),
  createCard('maj_16', 'The Tower', '高塔', Arcana.Major, Suit.None, 16, ['災難', '劇變', '啟示'], ['恐懼', '勉強維持', '混亂'], '雖然痛苦，但崩壞是為了重建更堅固的基礎。', '抗拒不可避免的改變，只會帶來更多痛苦。'),
  createCard('maj_17', 'The Star', '星星', Arcana.Major, Suit.None, 17, ['希望', '靈感', '平靜'], ['絕望', '失望', '悲觀'], '充滿希望的未來，保持信心。', '感到氣餒，失去了對未來的憧憬。'),
  createCard('maj_18', 'The Moon', '月亮', Arcana.Major, Suit.None, 18, ['幻覺', '恐懼', '潛意識'], ['清晰', '釋放', '困惑'], '事情並非表象所見，面對內心的不安。', '迷霧逐漸散去，真相將會大白。'),
  createCard('maj_19', 'The Sun', '太陽', Arcana.Major, Suit.None, 19, ['快樂', '成功', '活力'], ['憂鬱', '短暫', '虛榮'], '如同陽光普照般的喜悅與成功。', '雖然有快樂，但可能被烏雲暫時遮蔽。'),
  createCard('maj_20', 'Judgement', '審判', Arcana.Major, Suit.None, 20, ['重生', '召喚', '覺醒'], ['懷疑', '拒絕', '後悔'], '回應內心的召喚，做出重要的決定。', '忽視良知的聲音，或對過去感到後悔。'),
  createCard('maj_21', 'The World', '世界', Arcana.Major, Suit.None, 21, ['完成', '整合', '旅行'], ['未完成', '遲滯', '空虛'], '一個階段的完美結束，享受成果。', '感覺缺少了什麼，無法畫下完美的句點。'),
];

// Helper to generate Minor Arcana (Simplified keywords for brevity, but full deck logic)
const SUITS = [
  { type: Suit.Wands, nameCN: '權杖', keywords: ['行動', '熱情', '靈感'] },
  { type: Suit.Cups, nameCN: '聖杯', keywords: ['情感', '關係', '直覺'] },
  { type: Suit.Swords, nameCN: '寶劍', keywords: ['思想', '衝突', '真相'] },
  { type: Suit.Pentacles, nameCN: '錢幣', keywords: ['物質', '工作', '財富'] },
];

const NUMBERS = [
  { num: 1, name: 'Ace', nameCN: '王牌', meaning: '新的開始' },
  { num: 2, name: 'Two', nameCN: '二', meaning: '選擇與平衡' },
  { num: 3, name: 'Three', nameCN: '三', meaning: '合作與成長' },
  { num: 4, name: 'Four', nameCN: '四', meaning: '穩定與固守' },
  { num: 5, name: 'Five', nameCN: '五', meaning: '衝突與失落' },
  { num: 6, name: 'Six', nameCN: '六', meaning: '和諧與回憶' },
  { num: 7, name: 'Seven', nameCN: '七', meaning: '策略與評估' },
  { num: 8, name: 'Eight', nameCN: '八', meaning: '專注與細節' },
  { num: 9, name: 'Nine', nameCN: '九', meaning: '獨處與完成' },
  { num: 10, name: 'Ten', nameCN: '十', meaning: '圓滿與傳承' },
  { num: 11, name: 'Page', nameCN: '侍者', meaning: '學習與消息' },
  { num: 12, name: 'Knight', nameCN: '騎士', meaning: '行動與追求' },
  { num: 13, name: 'Queen', nameCN: '皇后', meaning: '滋養與理解' },
  { num: 14, name: 'King', nameCN: '國王', meaning: '掌控與權威' },
];

const MINOR_ARCANA: TarotCard[] = [];

SUITS.forEach(suit => {
  NUMBERS.forEach(num => {
    const id = `${suit.type.toLowerCase()}_${num.num}`;
    const cardName = `${num.name} of ${suit.type}`;
    const cardNameCN = `${suit.nameCN}${num.nameCN}`;
    
    MINOR_ARCANA.push(createCard(
      id,
      cardName,
      cardNameCN,
      Arcana.Minor,
      suit.type,
      num.num,
      [...suit.keywords, num.meaning, '正向'],
      [...suit.keywords, '阻礙', '反向'],
      `${suit.nameCN}領域中關於${num.meaning}的課題。`,
      `${suit.nameCN}能量的阻滯或過度，${num.meaning}受到挑戰。`
    ));
  });
});

export const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];
