// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))


// HTML element
const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")
const threshold = document.getElementById("threshold")
const thresholdValue = document.getElementById("thresholdValue")
const inputPercentage = document.getElementById("inputPercentage")
const currentPercentage = document.getElementById("currentPercentage")
const currentValue = document.getElementById("currentValue")
const compressionValue = document.getElementById("compressionValue")
const bassEqualizer = document.getElementById("bassEqualizer")
const bassEqualizerValue = document.getElementById("bassEqualizerValue")
const middleEqualizer = document.getElementById("middleEqualizer")
const middleEqualizerValue = document.getElementById("middleEqualizerValue")
const trebleEqualizer = document.getElementById("trebleEqualizer")
const trebleEqualizerValue = document.getElementById("trebleEqualizerValue")

const graphArea = document.getElementById("graphArea")
const fftLineInput = document.getElementById("fftLineInput")
const fftLineCurrent = document.getElementById("fftLineCurrent")
const waveLineInput = document.getElementById("waveLineInput")
const waveLineCurrent = document.getElementById("waveLineCurrent")

const preview = document.getElementById("preview")

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
    const analyzerNodeInput = audioCtx.createAnalyser()
    analyzerNodeInput.smoothingTimeConstant = 0.25
    analyzerNodeInput.fftSize = 1024
    analyzerNodeInput.maxDecibels = 0
    analyzerNodeInput.minDecibels = -100
    const compressorNode = audioCtx.createDynamicsCompressor()
    compressorNode.knee.setValueAtTime(10, audioCtx.currentTime) // Threshold to Ratio smoothing width[dB]
    compressorNode.ratio.setValueAtTime(15, audioCtx.currentTime)
    compressorNode.attack.setValueAtTime(0, audioCtx.currentTime)
    compressorNode.release.setValueAtTime(0.5, audioCtx.currentTime)
    const bassEqualizerNode = audioCtx.createBiquadFilter()
    bassEqualizerNode.type = "lowshelf"
    bassEqualizerNode.frequency.value = 500
    const middleEqualizerNode = audioCtx.createBiquadFilter()
    middleEqualizerNode.type = "peaking"
    middleEqualizerNode.frequency.value = 1000
    const trebleEqualizerNode = audioCtx.createBiquadFilter()
    trebleEqualizerNode.type = "highshelf"
    trebleEqualizerNode.frequency.value = 2000
    const analyzerNodeCurrent = audioCtx.createAnalyser()
    analyzerNodeCurrent.smoothingTimeConstant = 0.25
    analyzerNodeCurrent.fftSize = 1024
    analyzerNodeCurrent.maxDecibels = 0
    analyzerNodeCurrent.minDecibels = -100

    const fftFrequencyMax = 8000
    const fftBinLength = Math.round(analyzerNodeInput.frequencyBinCount * fftFrequencyMax / frequencyMax)
    const fftBin = new Uint8Array(fftBinLength)
    const waveBinLength = analyzerNodeInput.frequencyBinCount
    const waveBin = new Float32Array(waveBinLength)

    // Media stream
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabID })
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      }
    })
    const track = audioCtx.createMediaStreamSource(media)
    isBoosted = true
    preview.srcObject = media

    function updateGraph() {
      // View area variable
      const areaHeight = graphArea.clientHeight
      const fftHeight = areaHeight / 255
      const waveHeight = areaHeight / 2
      const areaWidth = graphArea.clientWidth
      const fftStepWidth = areaWidth / fftBinLength
      const waveStepWidth = areaWidth / waveBinLength

      // Frequency Info Line
      for (let i = 0; i < 20; i++) {
        const frequency = 500 * i
        // const frequency = 10 * Math.pow(2,i)
        document.getElementById(`frequencyTitle${i}`).innerHTML = `${frequency}Hz`
        document.getElementById(`frequencyBar${i}`).setAttribute("d", `M${(areaWidth / fftFrequencyMax) * frequency},0 L${(areaWidth / fftFrequencyMax) * frequency},${areaHeight}`)
        // document.getElementById(`frequencyBar${i}`).setAttribute("d", `M${Math.log10(frequency) * fftWidth},0 L${Math.log10(frequency) * fftWidth},${areaHeight}`)
      }

      // Input FFT
      analyzerNodeInput.getByteFrequencyData(fftBin)
      let fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
      for (let i = 1; i < fftBinLength; i++) {
        fftLiner += `L${i * fftStepWidth},${areaHeight - fftBin[i] * fftHeight} `
      }
      fftLineInput.setAttribute("d", fftLiner)
      // Current FFT
      analyzerNodeCurrent.getByteFrequencyData(fftBin)
      fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
      for (let i = 1; i < fftBinLength; i++) {
        fftLiner += `L${i * fftStepWidth},${areaHeight - fftBin[i] * fftHeight} `
      }
      fftLineCurrent.setAttribute("d", fftLiner)

      // Input Wave
      analyzerNodeInput.getFloatTimeDomainData(waveBin)
      let waveLiner = `M0,${(areaHeight * 0.5) - waveBin[0] * waveHeight} `
      for (let i = 1; i < waveBinLength; i++) {
        waveLiner += `L${i * waveStepWidth},${(areaHeight * 0.5) - waveBin[i] * waveHeight} `
      }
      waveLineInput.setAttribute("d", waveLiner)
      // Input Volume by RMS(RootMeanSquare)
      const inputRMS = Math.sqrt(waveBin.reduce((sum, sample) => {
        sum += sample * sample
        return sum
      }) / waveBin.length)
      const inputDecibel = inputRMS > 0 ? 20 * Math.log10(inputRMS) : analyzerNodeInput.minDecibels
      // Current Wave
      analyzerNodeCurrent.getFloatTimeDomainData(waveBin)
      waveLiner = `M0,${(areaHeight * 0.5) - waveBin[0] * waveHeight} `
      for (let i = 1; i < waveBinLength; i++) {
        waveLiner += `L${i * waveStepWidth},${(areaHeight * 0.5) - waveBin[i] * waveHeight} `
      }
      waveLineCurrent.setAttribute("d", waveLiner)
      // Current Volume by RMS(RootMeanSquare)
      const currentRMS = Math.sqrt(waveBin.reduce((sum, sample) => {
        sum += sample * sample
        return sum
      }) / waveBin.length)
      const currentDecibel = currentRMS > 0 ? 20 * Math.log10(currentRMS) : analyzerNodeCurrent.minDecibels

      function decibelToLinearPercent(db, floorDb = -100) {
        const clampedDb = Math.max(floorDb, db) // 最小値を -100dB に制限
        const linear = Math.pow(10, clampedDb / 20) // 音圧比（0〜1）
        return linear * 100                        // パーセント（0〜100）
      }
      const decibelRange = analyzerNodeInput.maxDecibels - analyzerNodeInput.minDecibels
      // const inputVolumePercentage = ((inputDecibel - analyzerNodeInput.minDecibels) / decibelRange) * 100
      const currentVolumePercentage = ((currentDecibel - analyzerNodeCurrent.minDecibels) / decibelRange) * 100
      inputPercentage.style.width = `${Math.min(100, decibelToLinearPercent(inputDecibel))}%`
      currentPercentage.style.width = `${Math.min(100, decibelToLinearPercent(currentDecibel))}%`
      currentValue.innerText = `${currentDecibel.toFixed(2)}[dB]`
      compressionValue.innerText = `(${compressorNode.reduction.toFixed(2)}[dB])`
      if (currentVolumePercentage >= 100) {
        currentValue.style.color = "DarkRed"
      } else if (currentVolumePercentage > 95) {
        currentValue.style.color = "Red"
      } else if (currentVolumePercentage > 90) {
        currentValue.style.color = "Yellow"
      } else {
        currentValue.style.color = ""
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
      connect(analyzerNodeInput).
      connect(bassEqualizerNode).
      connect(middleEqualizerNode).
      connect(trebleEqualizerNode).
      connect(compressorNode).
      connect(analyzerNodeCurrent).
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