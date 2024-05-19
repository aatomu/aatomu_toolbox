// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))


// HTML element
const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")
const threshold = document.getElementById("threshold")
const thresholdValue = document.getElementById("thresholdValue")
const compressing = document.getElementById("compressing")
const decibelPercentage = document.getElementById("decibelPercentage")
const decibelValue = document.getElementById("decibelValue")
const bassEqualizer = document.getElementById("bassEqualizer")
const bassEqualizerValue = document.getElementById("bassEqualizerValue")
const middleEqualizer = document.getElementById("middleEqualizer")
const middleEqualizerValue = document.getElementById("middleEqualizerValue")
const trebleEqualizer = document.getElementById("trebleEqualizer")
const trebleEqualizerValue = document.getElementById("trebleEqualizerValue")

const graphArea = document.getElementById("graphArea")
const fftLine = document.getElementById("fftLine")
const waveLine = document.getElementById("waveLine")

let isBoosted = false
window.addEventListener("mousemove", async function () {
  if (isBoosted) {
    return
  }
  try {
    // Audio context
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
    const bassEqualizerNode = audioCtx.createBiquadFilter()
    bassEqualizerNode.type = "lowshelf"
    bassEqualizerNode.frequency.value = 500
    const middleEqualizerNode = audioCtx.createBiquadFilter()
    middleEqualizerNode.type = "peaking"
    middleEqualizerNode.frequency.value = 1000
    const trebleEqualizerNode = audioCtx.createBiquadFilter()
    trebleEqualizerNode.type = "peaking"
    trebleEqualizerNode.frequency.value = 2000

    // Media stream
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
    isBoosted = true

    function updateGraph() {
      // View area variable
      const areaHeight = graphArea.clientHeight
      const fftHeight = areaHeight / 255
      const waveHeight = areaHeight / 2
      const areaWidth = graphArea.clientWidth
      const stepWidth = areaWidth / analyzeBinLength

      // Frequency line
      for (let i = 0; i < 20; i++) {
        const frequency = (i + 1) * 1000
        document.getElementById(`frequencyTitle${i}`).innerHTML = `${frequency}Hz`
        document.getElementById(`frequencyBar${i}`).setAttribute("d", `M${(areaWidth / frequencyMax) * frequency},0 L${(areaWidth / frequencyMax) * frequency},${areaHeight}`)
      }

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

    setInterval(updateGraph, 50)
    updateTitle()
    setInterval(updateTitle, 5000)
    // Create gain setting
    amplifier.addEventListener("input", async function () {
      gainNode.gain.value = amplifier.value
      amplifierValue.innerText = `x${amplifier.value}`
    })
    amplifier.dispatchEvent(new Event("input"))
    // Create threshold setting
    threshold.addEventListener("input", async function () {
      compressorNode.threshold.setValueAtTime(threshold.value, audioCtx.currentTime)
      thresholdValue.innerText = `${threshold.value}[dB]`
    })
    threshold.dispatchEvent(new Event("input"))
    // Create equalizer gain
    bassEqualizer.addEventListener("input", async function () {
      bassEqualizerNode.gain.value = bassEqualizer.value
      bassEqualizerValue.innerText = `${bassEqualizer.value}[dB]`
    })
    bassEqualizer.dispatchEvent(new Event("input"))
    middleEqualizer.addEventListener("input", async function () {
      middleEqualizerNode.gain.value = middleEqualizer.value
      middleEqualizerValue.innerText = `${middleEqualizer.value}[dB]`
    })
    middleEqualizer.dispatchEvent(new Event("input"))
    trebleEqualizer.addEventListener("input", async function () {
      trebleEqualizerNode.gain.value = trebleEqualizer.value
      trebleEqualizerValue.innerText = `${trebleEqualizer.value}[dB]`
    })
    trebleEqualizer.dispatchEvent(new Event("input"))


    // Connect effects
    track.
      connect(gainNode).
      connect(bassEqualizerNode).
      connect(middleEqualizerNode).
      connect(trebleEqualizerNode).
      connect(compressorNode).
      connect(analyzerNode).
      connect(audioCtx.destination)
  } catch (e) {
    console.log("Capture Error:")
    console.log(e)
  }
})


async function updateTitle() {
  // Update title
  try {
    const tab = await chrome.tabs.get(tabID)
    console.log(tab)
    document.getElementById("title").innerText = `Boost: ${tab.title}`
    document.getElementById("inlineTitle").innerText = tab.title
  } catch (e) {
    console.log("Tab Get Error:")
    console.log(e)
    window.close()
  }
}