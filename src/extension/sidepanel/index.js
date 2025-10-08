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
Symbols.Add("G", "./assets/diamond.png", 1, 10)

// MARK: ReelData
class Reel {
  // hidden x3, view x3
  reel = [
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
  ]
  constructor() {
    Symbols.Update()
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 6; j++) {
        this.reel[i][j] = Symbols.GetRandom()
      }
    }
  }

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
   * 
   * @param {number} count Reel Count
   */
  async Pull(count) {
    for (let i = 0; i < count; i++) {
      // Luck依存にする
      if (count - i === 3 && Math.random() < 0.1) {
        const symbol = Symbols.GetRandom()
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 3; y++) {
            this.reel[x][y] = symbol
          }
        }
      }
      this.Shift()
      this.Place()
      await sleep(100)
    }
  }
}
const ReelData = new Reel()
ReelData.Place()

// MARK: Slot Lever
SlotLever.addEventListener("click", async () => {
  if (isSpinning) return
  isSpinning = true
  SlotLeverButton.classList.add("pull")

  await ReelData.Pull(10)

  SlotLeverButton.classList.remove("pull")
  isSpinning = false
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))