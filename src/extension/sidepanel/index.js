// MARK: Const
const SlotLever = document.getElementById("slot-lever")
const SlotLeverButton = document.getElementById("slot-lever-button")
const SlotReel = document.getElementById("slot-reel")
const InfoSymbol = document.getElementById("info-symbol")

// MARK: Vars
let isSpinning

const sounds = new Map()
sounds.set("pull_fail", "./assets/Fizz.ogg")
sounds.set("pull", "./assets/Piston_extend_JE3.ogg.mp3")
sounds.set("reel", "./assets/Click_stereo.ogg.mp3")
sounds.set("combo", "./assets/Successful_hit.ogg")
sounds.set("combo_last", "./assets/Random_levelup.ogg")

function play(name) {
  const sound = new Audio(sounds.get(name))
  sound.play()
}

// MARK: ReelSymbol
class ReelSymbol {
  /** @type {Map<string, SlotSymbol>} */
  symbols = new Map()
  /** @type {{total:number,list:{value:number,symbol:string}[]}} */
  weights = { total: 0, list: [] }

  constructor() { }

  /**
   * 
   * @param {string} key 
   * @param {string} url 
   * @param {number} weight
   * @param {number} value
   */
  Add(key, url, weight, value) {
    this.symbols.set(key, {
      url: url,
      weight: weight,
      value: {
        base: value,
        current: value,
        amplifier: 1
      }
    })
  }

  Update() {
    while (InfoSymbol.children.length > 0) {
      InfoSymbol.children[0].remove()
    }

    this.weights.total = 0
    this.weights.list = []
    for (const key of this.symbols.keys()) {
      const symbol = this.symbols.get(key)
      this.weights.total += symbol.weight
      this.weights.list.push({ value: this.weights.total, symbol: key })
    }

    for (const weight of this.weights.list) {
      const symbol = this.symbols.get(weight.symbol)
      const tr = document.createElement("tr")

      const nameBody = document.createElement("td")
      const name = document.createElement("img")
      name.src = symbol.url
      nameBody.append(name)
      tr.append(nameBody)

      const chance = document.createElement("td")
      chance.textContent = ((symbol.weight / this.weights.total) * 100).toFixed(2) + "%"
      tr.append(chance)

      const value = document.createElement("td")
      value.textContent = `${symbol.value.current}(x${symbol.value.amplifier})`
      tr.append(value)

      InfoSymbol.append(tr)
    }
  }

  GetRandom() {
    const rand = Math.floor(Math.random() * this.weights.total);

    for (let i = 0; i < this.weights.list.length; i++) {
      if (rand < this.weights.list[i].value) return this.weights.list[i].symbol
    }
    return this.weights.list[0].symbol
  }

  /**
   * @param {string} key 
   * @return {SlotSymbol}
   */
  GetData(key) {
    return this.symbols.get(key)
  }
}

class ReelCombo {
  // MARK: Reel
  // hidden x3, view x3
  /** @type {[string,string,string,string,string,string][]} */
  reel = []
  /** @type {[string,string,string,string,string,string][]} */
  checkReel = []
  /** @type {ComboLine[][]} */
  // 長い順にすること!
  // 重複除外を1d
  // 2dはパターンセット
  comboList = [
    [
      { name: "Jackpot", amplifier: 10, pattern: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]] }
    ],
    [
      { name: "横5", amplifier: 3, pattern: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
      { name: "横4", amplifier: 2, pattern: [[0, 0], [1, 0], [2, 0], [3, 0]] },
      { name: "横3", amplifier: 1, pattern: [[0, 0], [1, 0], [2, 0]] },
    ],
    [
      { name: "V", amplifier: 2, pattern: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] }
    ],
    [{ name: "^", amplifier: 2, pattern: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]] }
    ],
    [
      { name: "縦", amplifier: 1, pattern: [[0, 0], [0, 1], [0, 2]] },
    ],
    [
      { name: "右斜め", amplifier: 1, pattern: [[0, 0], [1, 1], [2, 2]] },
    ],
    [
      { name: "左斜め", amplifier: 1, pattern: [[0, 2], [1, 1], [2, 0]] },
    ]
  ]

  constructor() { }
  /** 
   * @param {ReelBase} reel
   * */
  Set(reel) {
    this.reel = structuredClone(reel.reel)
  }

  Update() {
    /** @type {HTMLTableSectionElement} */
    // @ts-expect-error
    const InfoCombo = document.getElementById("info-combo")
    while (InfoCombo.children.length > 1) {
      InfoCombo.lastElementChild.remove()
    }

    for (const comboGroup of this.comboList) {
      for (const combo of comboGroup) {
        const tr = document.createElement("tr")

        const name = document.createElement("td")
        name.textContent = combo.name
        tr.append(name)

        const amplifier = document.createElement("td")
        amplifier.textContent = "x" + combo.amplifier.toFixed(2)
        tr.append(amplifier)

        InfoCombo.append(tr)
      }
    }
  }

  // MARK: > Match
  /**
   * @return {Promise<{symbol: string;amplifier: number}[]>} count of comboLine
   */
  async Match() {
    /** @type {{ name:string, amplifier:number, pattern: [number,number][], base: [number,number] }[]} */
    const comboLines = []
    /** @type {{symbol: string;amplifier: number}[]} */
    const comboResult = []

    // 判定
    for (const comboGroup of this.comboList) {
      this.checkReel = structuredClone(this.reel)
      for (const combo of comboGroup) {
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 3; y++) {
            console.log(`Base:[${x},${y}], Pattern Name:"${combo.name}"`)
            if (this.match([x, y], combo.pattern)) {
              this.replace([x, y], combo.pattern)
              console.log("Match!!")
              comboLines.push({ name: combo.name, amplifier: combo.amplifier, pattern: combo.pattern, base: [x, y] })
            }
          }
        }
      }
    }

    // 発光
    comboLines.sort((a, b) => { return a.pattern.length - b.pattern.length })
    for (let i = 0; i < comboLines.length; i++) {
      const combo = comboLines[i]
      const comboCell = []
      for (const pos of combo.pattern) {
        comboCell.push(this.flashCell(combo.base[0] + pos[0], combo.base[1] + pos[1]))
      }
      if (i === comboLines.length - 1) {
        play("combo_last")
      } else {
        play("combo")
      }
      const symbol = this.reel[combo.base[0] + combo.pattern[0][0]][combo.base[1] + combo.pattern[0][1] + 3]
      this.setInformation(symbol, combo.name, combo.amplifier)
      comboResult.push({
        symbol: symbol,
        amplifier: combo.amplifier
      })
      await Promise.all(comboCell)
    }
    return comboResult
  }

  // MARK: > get
  /**
   * @param {number} x
   * @param {number} y
   */
  get(x, y) {
    if (x < 0 || this.checkReel.length <= x) return null
    if (y < 0 || this.checkReel[x].length <= y + 3) return null
    return this.checkReel[x][y + 3]
  }

  // MARK: > match
  /**
   * @param {[number,number]} base 
   * @param {[number,number][]} pattern 
   */
  match(base, pattern) {
    let symbol = ""
    let count = 0
    for (const pos of pattern) {
      const nowSymbol = this.get(base[0] + pos[0], base[1] + pos[1])
      // データなしはpass
      if (nowSymbol === null) break
      // 初期値未設定は代入
      if (symbol === "") symbol = nowSymbol
      // Symbol違いになったらキャンセル
      if (nowSymbol !== symbol) break
      count++
    }
    return pattern.length === count
  }

  // MARK: > replace
  /**
   * @param {[number,number]} base 
   * @param {[number,number][]} pattern 
   */
  replace(base, pattern) {
    for (const pos of pattern) {
      this.checkReel[base[0] + pos[0]][base[1] + pos[1] + 3] = null
    }
  }

  // MARK: > flashCell
  async flashCell(x, y) {
    /** @type {HTMLImageElement} */
    // @ts-expect-error
    const img = SlotReel.children[x + y * 5]
    return new Promise((resolve) => {
      img.style.animation = 'none';
      void img.offsetWidth; // リフロー強制
      img.style.animation = 'flash-border 0.6s ease-in-out';

      img.addEventListener('animationend', () => {
        img.style.animation = '';
        resolve();
      }, { once: true });
    })
  }

  /**
   * 
   * @param {string} symbol symbol name
   * @param {string} name combo name
   * @param {number} amplifier combo amplifier
   */
  setInformation(symbol, name, amplifier) {
    while (Information.children.length > 0) {
      Information.lastElementChild.remove()
    }

    const symbol_data = Symbols.GetData(symbol)
    const img = document.createElement("img")
    img.src = symbol_data.url
    Information.append(img)

    const text = document.createElement("span")
    text.textContent = `${name} +${(symbol_data.value.current * symbol_data.value.amplifier) * amplifier}`
    Information.append(text)

    const description = document.createElement("span")
    description.textContent = `(${symbol_data.value.current}*${symbol_data.value.amplifier}*${amplifier})`
    description.style.fontSize = "30%"
    Information.append(description)
  }
}

// MARK: ReelData
class ReelBase {
  // MARK: Reel
  // hidden x3, view x3
  /** @type {[string,string,string,string,string,string][]} */
  reel = [
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
  ]

  /** @type {{have:number,bet:number}} */
  coin = {
    have: 10,
    bet: 2
  }
  /** @type {number} */
  luck = 0
  /** @type {number} */
  try = 0

  // MARK: > constructor
  constructor() {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 6; j++) {
        this.reel[i][j] = Symbols.GetRandom()
      }
    }
  }

  Update() {
    /** @type {HTMLTableCellElement} */
    // @ts-expect-error
    const InfoValueHave = document.getElementById("info-value-have")
    InfoValueHave.textContent = this.coin.have.toString()
    /** @type {HTMLTableCellElement} */
    // @ts-expect-error
    const InfoValueBet = document.getElementById("info-value-bet")
    InfoValueBet.textContent = this.coin.bet.toString()
    /** @type {HTMLTableCellElement} */
    // @ts-expect-error
    const InfoValueLuck = document.getElementById("info-value-luck")
    InfoValueLuck.textContent = this.luck.toString()
    /** @type {HTMLTableCellElement} */
    // @ts-expect-error
    const InfoValueTry = document.getElementById("info-value-try")
    InfoValueTry.textContent = this.try.toString()
  }

  // MARK: > Shift
  Shift() {
    for (let i = 0; i < 5; i++) {
      for (let j = 5; j > 0; j--) {
        this.reel[i][j] = this.reel[i][j - 1]
      }
    }
    for (let i = 0; i < 5; i++) {
      this.reel[i][0] = Symbols.GetRandom()
    }
  }

  // MARK: > Place
  Place() {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        /** @type {HTMLImageElement} */
        // @ts-expect-error
        const img = SlotReel.children[i + j * 5]
        img.src = Symbols.GetData(this.reel[i][j + 3]).url
      }
    }
  }

  /**
   * @param {number} count Reel Count
   * @param {number} luck Last Reel Count
  */
  // MARK: > Pull
  async Pull(count, luck) {
    this.try++
    for (let i = 0; i < count; i++) {
      play("reel")
      // 最終結果
      if (count - i === 3) {
        // ランダムインデックス作成
        const indexList = Array.from({ length: 15 }, (_, i) => [Math.floor(i / 3), i % 3])
        // Luck依存にする
        for (let i = 0; i < indexList.length; i++) {
          const j = Math.floor(Math.random() * (i + 1))

          const t = indexList[i]
          indexList[i] = indexList[j]
          indexList[j] = t
        }

        const symbol = Symbols.GetRandom()
        for (let i = 0; i < luck; i++) {
          this.reel[indexList[i][0]][indexList[i][1]] = symbol
        }
      }
      this.Shift()
      this.Place()
      await sleep(100)
    }
  }
}

// MARK: Initialize
const Symbols = new ReelSymbols()
Symbols.Add("A", "./assets/coal.png", 7, 3)
Symbols.Add("B", "./assets/iron.png", 7, 3)
Symbols.Add("C", "./assets/lapis.png", 3, 7)
Symbols.Add("D", "./assets/redstone.png", 3, 7)
Symbols.Add("E", "./assets/gold.png", 3, 7)
Symbols.Add("F", "./assets/emerald.png", 1, 10)
Symbols.Add("G", "./assets/diamond.png", 1, 10)
Symbols.Update()
const Reel = new ReelBase()
Reel.Place()
Reel.Update()
const Combo = new ReelCombo()
Combo.Set(Reel)
Combo.Update()

// MARK: Slot Lever
SlotLever.addEventListener("click", async () => {
  if (isSpinning) return
  isSpinning = true
  SlotLeverButton.classList.add("pull")

  if (Reel.coin.have >= Reel.coin.bet) {
    play("pull")
    Symbols.Update()
    Combo.Update()
    Reel.coin.have -= Reel.coin.bet
    Reel.Update()
    await Reel.Pull(10, Reel.luck)
    Combo.Set(Reel)
    const comboResult = await Combo.Match()
    if (comboResult.length >= 3) {
      Reel.luck = 0
    } else {
      Reel.luck++
    }
    let amount = 0
    for (const combo of comboResult) {
      const symbol = Symbols.GetData(combo.symbol)
      amount += (symbol.value.current * symbol.value.amplifier) * combo.amplifier
    }
    Reel.coin.have += amount
    Reel.coin.bet = 2 + Math.floor(Reel.try / 2)
    Reel.Update()
  } else {
    play("pull_fail")
  }

  SlotLeverButton.classList.remove("pull")
  isSpinning = false
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))