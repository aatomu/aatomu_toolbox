// MARK: Const
const SlotLever = document.getElementById("slot-lever")
const SlotLeverButton = document.getElementById("slot-lever-button")
const SlotReel = document.getElementById("slot-reel")
const InfoSymbol = document.getElementById("info-symbol")

// MARK: Vars
let isSpinning


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

const Symbols = new ReelSymbol()
Symbols.Add("A", "./assets/coal.png", 7, 3)
Symbols.Add("B", "./assets/iron.png", 7, 3)
Symbols.Add("C", "./assets/lapis.png", 3, 7)
Symbols.Add("D", "./assets/redstone.png", 3, 7)
Symbols.Add("E", "./assets/gold.png", 3, 7)
Symbols.Add("F", "./assets/emerald.png", 1, 10)
Symbols.Add("G", "./assets/diamond.png", 0, 10)

// MARK: ReelData
class Reel {
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
  /** @type {[string,string,string,string,string,string][]} */
  checkReel = []
  /** @type {ComboLine[][]} */
  // 長い順にすること!
  // 重複除外を1d
  // 2dはパターンセット
  comboList = [
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

  // MARK: > constructor
  constructor() {
    Symbols.Update()
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 6; j++) {
        this.reel[i][j] = Symbols.GetRandom()
      }
    }
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
    console.log(JSON.stringify(this.reel))
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
    for (let i = 0; i < count; i++) {
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

        const symbol = "G"
        for (let i = 0; i < luck; i++) {
          this.reel[indexList[i][0]][indexList[i][1]] = symbol
        }
      }
      this.Shift()
      this.Place()
      await sleep(100)
    }
    await this.Match()
  }

  // MARK: > Match
  async Match() {
    const comboLines = []
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
              console.log(JSON.stringify(this.checkReel))
              comboLines.push({ name: combo.name, amplifier: combo.amplifier, pattern: combo.pattern, base: [x, y] })
            }
          }
        }
      }
    }

    // 発光
    comboLines.sort((a, b) => { return a.pattern.length - b.pattern.length })
    for (const combo of comboLines) {
      const comboCell = []
      for (const pos of combo.pattern) {
        comboCell.push(this.flashCell(combo.base[0] + pos[0], combo.base[1] + pos[1]))
      }
      await Promise.all(comboCell)
    }
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


}
const ReelData = new Reel()
ReelData.Place()

// MARK: Slot Lever
SlotLever.addEventListener("click", async () => {
  if (isSpinning) return
  isSpinning = true
  SlotLeverButton.classList.add("pull")

  await ReelData.Pull(10, Math.floor(Math.random() * 15))

  SlotLeverButton.classList.remove("pull")
  isSpinning = false
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))