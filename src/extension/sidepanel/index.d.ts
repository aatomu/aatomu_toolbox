type SlotSymbol = {
  url: string; // 画像ソース
  weight: number; // 出現率
  value: {
    base: number; // 基礎価値
    current: number; // 現在の価値
    amplifier: number; // 価値に対しての乗数
  };
};

type ComboLine = {
  name: string;
  amplifier: number;
  pattern: [number, number][];
};
