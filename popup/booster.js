// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain()
const analyzerNode = audioCtx.createAnalyser()
analyzerNode.smoothingTimeConstant = 0.5
analyzerNode.fftSize = 1024
analyzerNode.maxDecibels = 0
analyzerNode.minDecibels = -50
const analyzeBinLength = analyzerNode.frequencyBinCount
const fftBin = new Uint8Array(analyzeBinLength)
const waveBin = new Float32Array(analyzeBinLength)

// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))
document.getElementById("title").innerText = `Boost: ${searchParams.get("title")}`
document.getElementById("inlineTitle").innerText = `${searchParams.get("title")}`

let isBoosted = false

// HTML element
const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")
const decibelPercentage = document.getElementById("decibelPercentage")
const decibelValue = document.getElementById("decibelValue")

const graphArea = document.getElementById("graphArea")
const fftLine = document.getElementById("fftLine")
const waveLine = document.getElementById("waveLine")

amplifier.addEventListener("input", async function () {
  if (!isBoosted) {
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabID })

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    })

    const track = audioCtx.createMediaStreamSource(media)
    track.connect(gainNode).connect(analyzerNode).connect(audioCtx.destination)
    isBoosted = true

    setInterval(analyze, 50)
  }
  gainNode.gain.value = amplifier.value
  amplifierValue.innerText = `x${amplifier.value}`
})

function analyze() {
  // View area variable
  const areaHeight = graphArea.clientHeight
  const fftHeight = areaHeight / 255
  const waveHeight = areaHeight / 2
  const areaWidth = graphArea.clientWidth
  const stepWidth = areaWidth / analyzeBinLength

  // FFT
  analyzerNode.getByteFrequencyData(fftBin)
  // FFT view
  let fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
  for (let i = 1; i < analyzeBinLength; i++) {
    fftLiner += `L${i * stepWidth},${areaHeight - fftBin[i] * fftHeight} `
  }
  fftLine.setAttribute("d", fftLiner)

  // Wave
  analyzerNode.getFloatTimeDomainData(waveBin)
  // Wave view
  let waveLiner = `M0,${(areaHeight * 0.5) - waveBin[0] * waveHeight} `
  for (let i = 1; i < analyzeBinLength; i++) {
    waveLiner += `L${i * stepWidth},${(areaHeight * 0.5) - waveBin[i] * waveHeight} `
  }
  waveLine.setAttribute("d", waveLiner)

  // Wave variable
  // peek = 0~1
  const peek = waveBin.reduce((max, sample) => {
    const current = Math.abs(sample)
    if (max < current) {
      return current
    }
    return max
  })

  const decibelPercentageValue = peek * 100
  decibelPercentage.value = decibelPercentageValue
  const decibelRange = analyzerNode.maxDecibels - analyzerNode.minDecibels
  decibelValue.innerText = `${Math.floor((peek * decibelRange + analyzerNode.minDecibels) * 10) / 10}[dB]`
  if (decibelPercentageValue > 100) {
    decibelValue.style.color = "DarkRed"
  } else if (decibelPercentageValue > 90) {
    decibelValue.style.color = "Red"
  } else if (decibelPercentageValue > 60) {
    decibelValue.style.color = "DarkOrange"
  } else {
    decibelValue.style.color = "Green"
  }

}