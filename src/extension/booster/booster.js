// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))


// HTML element
/** @type {HTMLInputElement} */
// @ts-expect-error
const amplifier = document.getElementById("amplifier")
/** @type {HTMLSpanElement} */
const amplifierValue = document.getElementById("amplifierValue")
/** @type {HTMLInputElement} */
// @ts-expect-error
const threshold = document.getElementById("threshold")
/** @type {HTMLSpanElement} */
const thresholdValue = document.getElementById("thresholdValue")
/** @type {HTMLSpanElement} */
const volumeInput = document.getElementById("volumeInput")
/** @type {HTMLSpanElement} */
const volumeOutput = document.getElementById("volumeOutput")
/** @type {HTMLDivElement} */
// @ts-expect-error
const volumeInputGraph = document.getElementById("volumeInputGraph")
/** @type {HTMLDivElement} */
// @ts-expect-error
const volumeOutputGraph = document.getElementById("volumeOutputGraph")
/** @type {HTMLInputElement} */
// @ts-expect-error
const bassEqualizer = document.getElementById("bassEqualizer")
/** @type {HTMLSpanElement} */
const bassEqualizerValue = document.getElementById("bassEqualizerValue")
/** @type {HTMLInputElement} */
// @ts-expect-error
const middleEqualizer = document.getElementById("middleEqualizer")
/** @type {HTMLSpanElement} */
const middleEqualizerValue = document.getElementById("middleEqualizerValue")
/** @type {HTMLInputElement} */
// @ts-expect-error
const trebleEqualizer = document.getElementById("trebleEqualizer")
/** @type {HTMLSpanElement} */
const trebleEqualizerValue = document.getElementById("trebleEqualizerValue")

/** @type {SVGElement} */
// @ts-expect-error
const graphArea = document.getElementById("graphArea")
/** @type {SVGPathElement} */
// @ts-expect-error
const fftLineInput = document.getElementById("fftLineInput")
/** @type {SVGPathElement} */
// @ts-expect-error
const fftLineOutput = document.getElementById("fftLineOutput")
/** @type {SVGPathElement} */
// @ts-expect-error
const waveLineInput = document.getElementById("waveLineInput")
/** @type {SVGPathElement} */
// @ts-expect-error
const waveLineOutput = document.getElementById("waveLineOutput")

/** @type {HTMLVideoElement} */
// @ts-expect-error
const preview = document.getElementById("preview")

let isBoosted = false
// MARK: onMouseMove
window.addEventListener("mousemove", async function () {
  if (isBoosted) {
    return
  }
  try {
    // MARK: create AudioCtx()
    const audioCtx = new AudioContext();
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
    compressorNode.attack.setValueAtTime(0.005, audioCtx.currentTime)
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
    const analyzerNodeOutput = audioCtx.createAnalyser()
    analyzerNodeOutput.smoothingTimeConstant = 0.25
    analyzerNodeOutput.fftSize = 1024
    analyzerNodeOutput.maxDecibels = 0
    analyzerNodeOutput.minDecibels = -100

    //MARK: > FFT config
    const fftFrequencyMax = 8000
    const fftBinLength = Math.round(analyzerNodeInput.frequencyBinCount * fftFrequencyMax / frequencyMax)
    const fftBin = new Uint8Array(fftBinLength)
    const waveBinLength = analyzerNodeInput.frequencyBinCount
    const waveBin = new Float32Array(waveBinLength)

    // MARK: Media stream
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabID })

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: {
        // @ts-expect-error
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      }
    })
    const track = audioCtx.createMediaStreamSource(media)
    preview.srcObject = media
    isBoosted = true

    // MARK: > updateGraph
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
        document.getElementById(`frequencyTitle${i}`).innerHTML = `${frequency}Hz`
        document.getElementById(`frequencyBar${i}`).setAttribute("d", `M${(areaWidth / fftFrequencyMax) * frequency},0 L${(areaWidth / fftFrequencyMax) * frequency},${areaHeight}`)
      }

      // MARK: > Input: frequency
      analyzerNodeInput.getByteFrequencyData(fftBin)
      let fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
      for (let i = 1; i < fftBinLength; i++) {
        fftLiner += `L${i * fftStepWidth},${areaHeight - fftBin[i] * fftHeight} `
      }
      fftLineInput.setAttribute("d", fftLiner)
      // MARK: > Output: frequency
      analyzerNodeOutput.getByteFrequencyData(fftBin)
      fftLiner = `M0,${areaHeight - fftBin[0] * fftHeight} `
      for (let i = 1; i < fftBinLength; i++) {
        fftLiner += `L${i * fftStepWidth},${areaHeight - fftBin[i] * fftHeight} `
      }
      fftLineOutput.setAttribute("d", fftLiner)

      // MARK: > Input: wave
      analyzerNodeInput.getFloatTimeDomainData(waveBin)
      let waveLiner = `M0,${(areaHeight * 0.5) - waveBin[0] * waveHeight} `
      for (let i = 1; i < waveBinLength; i++) {
        waveLiner += `L${i * waveStepWidth},${(areaHeight * 0.5) - waveBin[i] * waveHeight} `
      }
      waveLineInput.setAttribute("d", waveLiner)
      // MARK: > Input: volume(RMS)
      const inputRMS = Math.sqrt(waveBin.reduce((sum, sample) => {
        sum += sample * sample
        return sum
      }) / waveBin.length)
      const inputDecibel = inputRMS > 0 ? 20 * Math.log10(inputRMS) : analyzerNodeInput.minDecibels
      // MARK: > Output: wave
      analyzerNodeOutput.getFloatTimeDomainData(waveBin)
      waveLiner = `M0,${(areaHeight * 0.5) - waveBin[0] * waveHeight} `
      for (let i = 1; i < waveBinLength; i++) {
        waveLiner += `L${i * waveStepWidth},${(areaHeight * 0.5) - waveBin[i] * waveHeight} `
      }
      waveLineOutput.setAttribute("d", waveLiner)
      // MARK: > Output: volume(RMS)
      const outputRMS = Math.sqrt(waveBin.reduce((sum, sample) => {
        sum += sample * sample
        return sum
      }) / waveBin.length)
      const outputDecibel = outputRMS > 0 ? 20 * Math.log10(outputRMS) : analyzerNodeOutput.minDecibels

      // 対数[dB]を直線[体感音量]
      function dbToPerceivedLoudnessRatio(db) {
        // 基準 dB を 0 dBFS (デジタル最大音量)
        const baseDb = 0
        const dbDifference = db - baseDb;
        // ラウドネス比 = 2 ^ (dB差 / 10)
        // 例えば、-10 dB の場合: 2 ^ (-10 / 10) = 2 ^ (-1) = 0.5 (半分の音量に聞こえる)
        const ratio = Math.pow(2, dbDifference / 10);

        return ratio; // 0.0 から 1.0 の間の値
      }

      // MARK: View volume
      // > graph
      const volumeInputRatio = dbToPerceivedLoudnessRatio(inputDecibel)
      volumeInputGraph.style.width = `${Math.min(volumeInputRatio, 1.00) * 100}%`
      const volumeOutputRatio = dbToPerceivedLoudnessRatio(outputDecibel)
      volumeOutputGraph.style.width = `${Math.min(volumeOutputRatio, 1.00) * 100}%`
      // > text
      volumeOutput.innerText = `${outputDecibel.toFixed(2)}[dB]`
      volumeInput.innerText = `(${inputDecibel.toFixed(2)}[dB])`
      // >> coloring
      if (volumeOutputRatio >= 1) {
        volumeOutput.style.color = "DarkRed"
      } else if (volumeOutputRatio > 0.95) {
        volumeOutput.style.color = "Red"
      } else if (volumeOutputRatio > 0.90) {
        volumeOutput.style.color = "Yellow"
      } else {
        volumeOutput.style.color = ""
      }

      requestAnimationFrame(updateGraph)
    }

    updateGraph()
    updateTitle()
    setInterval(updateTitle, 5000)
    // MARK: > Create gain setting
    amplifier.addEventListener("input", async function () {
      gainNode.gain.value = parseFloat(amplifier.value)
      amplifierValue.innerText = `x${amplifier.value}`
    })
    amplifier.dispatchEvent(new Event("input"))
    // MARK: > Create threshold setting
    threshold.addEventListener("input", async function () {
      compressorNode.threshold.setValueAtTime(parseFloat(threshold.value), audioCtx.currentTime)
      thresholdValue.innerText = `${threshold.value}[dB]`
    })
    threshold.dispatchEvent(new Event("input"))
    // MARK: > Create equalizer gain
    bassEqualizer.addEventListener("input", async function () {
      bassEqualizerNode.gain.value = parseFloat(bassEqualizer.value)
      bassEqualizerValue.innerText = `${bassEqualizer.value}[dB]`
    })
    bassEqualizer.dispatchEvent(new Event("input"))
    middleEqualizer.addEventListener("input", async function () {
      middleEqualizerNode.gain.value = parseFloat(middleEqualizer.value)
      middleEqualizerValue.innerText = `${middleEqualizer.value}[dB]`
    })
    middleEqualizer.dispatchEvent(new Event("input"))
    trebleEqualizer.addEventListener("input", async function () {
      trebleEqualizerNode.gain.value = parseFloat(trebleEqualizer.value)
      trebleEqualizerValue.innerText = `${trebleEqualizer.value}[dB]`
    })
    trebleEqualizer.dispatchEvent(new Event("input"))


    // MARK: > Connect effects
    track.
      connect(gainNode).
      connect(analyzerNodeInput).
      connect(compressorNode).
      connect(bassEqualizerNode).
      connect(middleEqualizerNode).
      connect(trebleEqualizerNode).
      connect(analyzerNodeOutput).
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