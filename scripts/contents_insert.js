function CheckVariable() {
  var original = [];
  var win = window.open();
  for (var i in win) {
    original.push(i);
  }
  win.close();

  for (var i in window) {
    if (!original.includes(i)) {
      console.table("Name:", i, "Value:", window[i])
    }
  }
}

async function CloudFlareDomain(name) {
  const domains = [
    ".ac", ".academy", ".accountant", ".accountants", ".actor", ".adult", ".agency", ".ai", ".airforce", ".apartments", ".app", ".army", ".associates", ".attorney", ".auction", ".audio", ".baby", ".band", ".bar", ".bargains", ".beer", ".bet", ".bid", ".bike", ".bingo", ".biz", ".black", ".blog", ".blue", ".boo", ".boston",
    ".boutique", ".broker", ".builders", ".business", ".cab", ".cafe", ".cam", ".camera", ".camp", ".capital", ".cards", ".care", ".careers", ".casa", ".cash", ".casino", ".catering", ".cc", ".center", ".ceo", ".chat", ".cheap", ".christmas", ".church", ".city", ".claims", ".cleaning", ".clinic", ".clothing", ".cloud", ".club", ".co", ".co.uk", ".coach", ".codes", ".coffee",
    ".college", ".com", ".com.ai", ".com.co", ".community", ".company", ".compare", ".computer", ".condos", ".construction", ".consulting", ".contact", ".contractors", ".cooking", ".cool", ".coupons", ".credit", ".creditcard", ".cricket", ".cruises", ".dad", ".dance", ".date", ".dating", ".day", ".dealer", ".deals", ".degree", ".delivery", ".democrat", ".dental", ".dentist", ".design", ".dev", ".diamonds", ".diet", ".digital", ".direct",
    ".directory", ".discount", ".doctor", ".dog", ".domains", ".download", ".education", ".email", ".energy", ".engineer", ".engineering", ".enterprises", ".equipment", ".esq", ".estate", ".events", ".exchange", ".expert", ".exposed", ".express", ".fail", ".faith", ".family", ".fan", ".fans", ".farm", ".fashion", ".feedback",
    ".finance", ".financial", ".fish", ".fishing", ".fit", ".fitness", ".flights", ".florist", ".flowers", ".fm", ".foo", ".football", ".forex", ".forsale", ".forum", ".foundation", ".fun", ".fund", ".furniture", ".futbol", ".fyi", ".gallery", ".game", ".games", ".garden", ".gifts", ".gives",
    ".glass", ".global", ".gmbh", ".gold", ".golf", ".graphics", ".gratis", ".green", ".gripe", ".group", ".guide", ".guitars", ".guru", ".haus", ".health", ".healthcare", ".help", ".hockey", ".holdings", ".holiday", ".horse", ".hospital", ".host", ".hosting", ".house", ".how",
    ".icu", ".immo", ".immobilien", ".inc", ".industries", ".info", ".ink", ".institute", ".insure", ".international", ".investments", ".io", ".irish", ".jetzt", ".jewelry", ".kaufen", ".kim", ".kitchen", ".land", ".lawyer", ".lease", ".legal", ".lgbt", ".life", ".lighting",
    ".limited", ".limo", ".link", ".live", ".loan", ".loans", ".lol", ".love", ".ltd", ".luxe", ".maison", ".management", ".market", ".marketing", ".markets", ".mba", ".me", ".me.uk", ".media", ".memorial", ".men", ".miami", ".mobi", ".moda", ".mom", ".money", ".monster", ".mortgage", ".mov", ".movie", ".navy", ".net", ".net.ai",
    ".net.co", ".net.uk", ".network", ".new", ".news", ".nexus", ".ngo", ".ninja", ".nom.co", ".observer", ".off.ai", ".ong", ".online", ".org", ".org.ai", ".org.uk", ".organic", ".page", ".partners", ".parts", ".party", ".pet", ".phd", ".photography", ".photos", ".pics", ".pictures", ".pink", ".pizza", ".place", ".plumbing", ".plus",
    ".porn", ".press", ".pro", ".productions", ".prof", ".promo", ".properties", ".protection", ".pub", ".racing", ".realty", ".recipes", ".red", ".rehab", ".reise", ".reisen", ".rent", ".rentals", ".repair", ".report", ".republican", ".rest", ".restaurant", ".review", ".reviews", ".rip", ".rocks", ".rodeo", ".rsvp", ".run", ".sale",
    ".salon", ".sarl", ".school", ".schule", ".science", ".security", ".select", ".services", ".sex", ".sh", ".shoes", ".shop", ".shopping", ".show", ".singles", ".site", ".ski", ".soccer", ".social", ".software", ".solar", ".solutions", ".soy", ".space", ".storage", ".store", ".stream", ".studio", ".style", ".supplies", ".supply", ".support", ".surf", ".surgery",
    ".systems", ".tax", ".taxi", ".team", ".tech", ".technology", ".tennis", ".theater", ".theatre", ".tienda", ".tips", ".tires", ".today", ".tools", ".tours", ".town", ".toys", ".trade", ".trading", ".training", ".travel", ".tv", ".uk", ".university", ".uno", ".us", ".vacations", ".ventures", ".vet", ".viajes", ".video", ".villas",
    ".vin", ".vip", ".vision", ".vodka", ".voyage", ".watch", ".webcam", ".website", ".wedding", ".wiki", ".win", ".wine", ".work", ".works", ".world", ".wtf", ".xyz", ".yoga", ".zone"
  ]
  let searchDomains = []
  domains.forEach((domain) => {
    searchDomains.push(name + domain)
  })
  let url = location.origin + "/api/v4/accounts" + location.pathname.replace("registrar/register", "registrar/domains/search")

  var prices = []
  console.log(`Start Search (${domains.length}domains)`)
  for (i = 0; i < searchDomains.length; i++) {
    let value = searchDomains[i]
    console.log(`Search: No.${i + 1}/${searchDomains.length}`)
    const result = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cross-site-security': 'dash' },
      body: JSON.stringify({ query: value })
    }).then(response => {
      return response.json()
    }).then(json => {
      return json.result
    })
    console.log(result.domains)
    result.domains.forEach(domain => {
      const index = searchDomains.findIndex((value) => value == domain.name)
      if (index != -1) {
        console.log(`Name: ${domain.name} Price: ${domain.price}`)
        prices.push({ name: domain.name, price: domain.price })
        searchDomains.splice(index, 1)
      }
    })

    await sleep(3000)
  }
  function compare(a, b) {
    var r = 0;
    if (a.price < b.price) { r = -1; }
    else if (a.price > b.price) { r = 1; }
    return r;
  }
  prices.sort(compare)
  console.log(prices)
  prices.forEach((value) => {
    console.log(`${value.name}: ${value.price}`)
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
