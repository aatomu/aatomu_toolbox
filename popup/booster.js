// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain()
const analyzerNode = audioCtx.createAnalyser()
analyzerNode.fftSize = 1024
const analyzeBinLength = analyzerNode.frequencyBinCount
const analyzeBin = new Uint8Array(analyzeBinLength)

// Audio information(by URL)
const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))
document.getElementById("title").innerText = `Boost: ${searchParams.get("title")}`
document.getElementById("inline_title").innerText = `${searchParams.get("title")}`

let isBoosted = false

// HTML element
const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")
const volumeArea = document.getElementById("volumeArea")
const volumeLine = document.getElementById("volumeLine")

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

    setInterval(analyze,10)
  }
  gainNode.gain.value = amplifier.value
  amplifierValue.innerText = `x${amplifier.value}`
})

function analyze() {
  analyzerNode.getByteFrequencyData(analyzeBin)

  const areaHeight = volumeArea.clientHeight
  const stepHeight = areaHeight / 255
  const areaWidth = volumeArea.clientWidth
  const stepWidth = areaWidth / analyzeBinLength

  let line = `M0,${areaHeight - analyzeBin[0] * stepHeight} `
  for (let i = 1; i < analyzeBinLength; i++) {
    line += `L${i * stepWidth},${areaHeight - analyzeBin[i] * stepHeight} `
  }
  volumeLine.setAttribute("d",line)
}