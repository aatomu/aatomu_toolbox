// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const frequencyMax = audioCtx.sampleRate / 2
const gainNode = audioCtx.createGain()
const compressorNode = audioCtx.createDynamicsCompressor()
compressorNode.knee.setValueAtTime(10, audioCtx.currentTime) // Threshold to Ratio smoothing width[dB]
compressorNode.ratio.setValueAtTime(15, audioCtx.currentTime)
compressorNode.attack.setValueAtTime(0, audioCtx.currentTime)
compressorNode.release.setValueAtTime(0.5, audioCtx.currentTime)
const analyzerNode = audioCtx.createAnalyser()
analyzerNode.smoothingTimeConstant = 0.25
analyzerNode.fftSize = 1024
analyzerNode.maxDecibels = 0
analyzerNode.minDecibels = -100
const analyzeBinLength = analyzerNode.frequencyBinCount
const fftBin = new Uint8Array(analyzeBinLength)
const waveBin = new Float32Array(analyzeBinLength)

// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))

let isBoosted = false

// HTML element
const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")
const threshold = document.getElementById("threshold")
const thresholdValue = document.getElementById("thresholdValue")
const compressing = document.getElementById("compressing")
const decibelPercentage = document.getElementById("decibelPercentage")
const decibelValue = document.getElementById("decibelValue")

const graphArea = document.getElementById("graphArea")
const fftLine = document.getElementById("fftLine")
const waveLine = document.getElementById("waveLine")

window.addEventListener("mousemove", async function () {
  if (isBoosted) {
    return
  }
  try {
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
    track.connect(gainNode).connect(compressorNode).connect(analyzerNode).connect(audioCtx.destination)
    isBoosted = true

    setInterval(analyze, 50)
    updateTitle()
    setInterval(updateTitle, 5000)
  } catch (e) {
    console.log("Capture Error:")
    console.log(e)
  }
})

amplifier.addEventListener("input", async function () {
  gainNode.gain.value = amplifier.value
  amplifierValue.innerText = `x${amplifier.value}`
})
amplifier.dispatchEvent(new Event("input"))

threshold.addEventListener("input", async function () {
  compressorNode.threshold.setValueAtTime(threshold.value, audioCtx.currentTime)
  thresholdValue.innerText = `${threshold.value}[dB]`
})
threshold.dispatchEvent(new Event("input"))

function analyze() {
  // View area variable
  const areaHeight = graphArea.clientHeight
  const fftHeight = areaHeight / 255
  const waveHeight = areaHeight / 2
  const areaWidth = graphArea.clientWidth
  const fftStepWidth = areaWidth / (Math.log(frequencyMax) - Math.log(0.0001))
  const stepWidth = areaWidth / analyzeBinLength

  // Frequency line
  for (let i = 0; i < 10; i++) {
    const frequency = (i + 1) * 1000
    document.getElementById(`frequencyTitle${i}`).innerHTML = `${frequency}Hz`
    document.getElementById(`frequencyBar${i}`).setAttribute("d", `M${(areaWidth / frequencyMax) * frequency},0 L${(areaWidth / frequencyMax) * frequency},${areaHeight}`)
  }

  // FFT
  analyzerNode.getByteFrequencyData(fftBin)
  // FFT view
  let fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
  for (let i = 1; i < analyzeBinLength; i++) {
    const frequency = (frequencyMax / analyzeBinLength) * i
    fftLiner += `L${(Math.log(frequency) - Math.log(0.0001)) * fftStepWidth},${areaHeight - fftBin[i] * fftHeight} `
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
  // peek = 0~inf
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
  decibelValue.innerText = `${Math.round((peek * decibelRange + analyzerNode.minDecibels) * 100) / 100}[dB]`
  compressing.innerText = `${Math.round(compressorNode.reduction * 100) / 100}[dB] compressed`
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

async function updateTitle() {
  // Update title
  const tab = await chrome.tabs.get(tabID)
  console.log(tab)
  document.getElementById("title").innerText = `Boost: ${tab.title}`
  document.getElementById("inlineTitle").innerText = tab.title
}