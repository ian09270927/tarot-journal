
export enum Arcana {
  Major = 'Major',
  Minor = 'Minor',
}

export enum Suit {
  Wands = 'Wands', // 權杖
  Cups = 'Cups',   // 聖杯
  Swords = 'Swords', // 寶劍
  Pentacles = 'Pentacles', // 錢幣
  None = 'None',
}

export interface TarotCard {
  id: string;
  name: string;
  nameCN: string;
  arcana: Arcana;
  suit: Suit;
  number?: number;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightSummary: string;
  reversedSummary: string;
  imagePlaceholder: string;
}

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  position: 'Past' | 'Present' | 'Future';
  positionCN: string;
}

// Firestore Document Structure
export interface ReadingDoc {
  id?: string;
  userId: string;
  question: string;
  cards: {
    cardId: string;
    isReversed: boolean;
    position: 'Past' | 'Present' | 'Future';
  }[];
  reportText: string; // The markdown/text interpretation
  reportHtml: string; // The full HTML string for download/display
  downloadUrl?: string; // Firebase Storage URL
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

export type ViewState = 'auth' | 'home' | 'reading' | 'history';
