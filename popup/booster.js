const audioCtx = new AudioContext()
const gainNode = audioCtx.createGain()

const url = new URL(window.location.href)
const searchParams = new URLSearchParams(url.searchParams)
const tabID = parseInt(searchParams.get("id"))
document.getElementById("title").innerText = `Boost: ${searchParams.get("title")}`
document.getElementById("inline_title").innerText = `${searchParams.get("title")}`

let isBoosted = false

const amplifier = document.getElementById("amplifier")
const amplifierValue = document.getElementById("amplifierValue")

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
    track.connect(gainNode).connect(audioCtx.destination)
    isBoosted = true
  }
  gainNode.gain.value = amplifier.value
  amplifierValue.innerText = `x${amplifier.value}`
})