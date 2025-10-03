// MARK: type def
type Config = {
  enableCreeper: boolean;
  youtube: ConfigYoutube;
  amazon: ConfigAmazon;
  secret: ConfigSecret;
};
type ConfigYoutube = {
  isLiveAcceleration: boolean;
  liveAccelerationRate: number;
};

type ConfigAmazon = {
  enableSecret: boolean;
  showBuyButton: boolean;
  greeting: string; // サイドバー: こんにちは！
};
type ConfigSecret = {
  name: string; // 山田 太郎
  postCode: string; // 100-8111
  address: string; // 日本国 東京都千代田区千代田1-1
};

// MARK: Expand chrome api
declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: null): Promise<Config>;
      set(item: Config);
    }
  }
}

// MARK: Expand DOM api
interface Element {
  _addEventListener?: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
}
