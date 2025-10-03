window.addEventListener("keydown", async function (e) {
  // 非公開ボタンがある && シフトを押した
  if (document.querySelector(".sc-2e1e8eba-1.hChvXu") && e.key == "Shift") {
    /** @type {HTMLButtonElement} */
    const upperButton = document.querySelector("button.sc-d663dab6-0.ikeQOo")
    // チェック開始
    upperButton.style.backgroundColor = "red"

    console.log("Pixiv Following Page!")
    const artistList = document.querySelector("div.sc-21f138d8-4.jvydlf").children
    const now = (new Date()).getTime()
    for (let i = 0; i < artistList.length; i++) {
      const artist = artistList[i]
      console.log(`Artist(${i}/${artistList.length})`, artist)
      /** @type {HTMLImageElement| undefined} */
      const art = artist.querySelector("img[class]")
      if (!art) continue

      // 	https://i.pximg.net/c/250x250_80_a2/???????????/img/YYYY/MM/DD/hh/mm/ss/title.jpg
      const timestamps = art.src.match(/\/img\/(.+?)\/(.+?)\/(.+?)\/(.+?)\/(.+?)\//)
      if (!timestamps) continue
      console.log(timestamps, `${timestamps[1]}-${timestamps[2]}-${timestamps[3]}T${timestamps[4]}:${timestamps[5]}:00`)
      const timestamp = new Date(`${timestamps[1]}-${timestamps[2]}-${timestamps[3]}T${timestamps[4]}:${timestamps[5]}:00`).getTime()
      if (now - timestamp > 1000 * 60 * 60 * 24 * 30) {// 1000[ms] * 60[min] * 60[hour] * 24[day] * 30[month]
        artist.setAttribute("style", "background-color: red;")
      } else {
        artist.setAttribute("style", "background-color: green;")
      }
    }

    // チェック終了
    upperButton.style.backgroundColor = "green"
  }
})