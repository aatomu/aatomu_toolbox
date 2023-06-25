function CheckVariable() {
  var original = [];
  var win = window.open();
  for(var i in win){
    original.push(i);
  }
  win.close();

  for(var i in window){
    if(!original.includes(i)){
      console.table("Name:", i,"Value:",window[i])
    }
  }
}

async function CloudFlareDomain(name) {
  const domains = [
    ".academy", ".accountant", ".accountants", ".actor", ".agency", ".apartments",
    ".associates", ".attorney", ".auction", ".band", ".bar", ".bargains", ".beer",
    ".bet", ".bid", ".bike", ".bingo", ".biz", ".black", ".blog", ".blue", ".boston",
    ".boutique", ".broker", ".builders", ".business", ".cab", ".cafe", ".cam", ".camera",
    ".camp", ".capital", ".cards", ".care", ".careers", ".casa", ".cash", ".casino", ".catering",
    ".cc", ".center", ".ceo", ".chat", ".cheap", ".church", ".city", ".claims", ".cleaning",
    ".clinic", ".clothing", ".cloud", ".club", ".co", ".co.uk", ".coach", ".codes",
    ".coffee", ".college", ".com", ".com.co", ".community", ".company", ".compare",
    ".computer", ".condos", ".construction", ".consulting", ".contact", ".contractors",
    ".cooking", ".cool", ".coupons", ".credit", ".creditcard", ".cricket", ".cruises",
    ".dance", ".date", ".dating", ".deals", ".degree", ".delivery", ".democrat",
    ".dental", ".dentist", ".design", ".diamonds", ".digital", ".direct", ".directory",
    ".discount", ".doctor", ".dog", ".domains", ".download", ".education", ".email",
    ".energy", ".engineer", ".engineering", ".enterprises", ".equipment", ".estate",
    ".events", ".exchange", ".expert", ".exposed", ".express", ".fail", ".faith",
    ".family", ".fans", ".farm", ".fashion", ".finance", ".financial",
    ".fish", ".fishing", ".fit", ".fitness", ".flights", ".florist", ".fm",
    ".football", ".forex", ".forsale", ".foundation", ".fun", ".fund", ".furniture",
    ".futbol", ".fyi", ".gallery", ".games", ".garden", ".gifts", ".gives", ".glass",
    ".gmbh", ".gold", ".golf", ".graphics", ".gratis", ".green", ".gripe", ".group",
    ".guide", ".guru", ".haus", ".health", ".healthcare", ".hockey", ".holdings",
    ".holiday", ".horse", ".hospital", ".host", ".house", ".immo", ".immobilien",
    ".industries", ".info", ".ink", ".institute", ".insure", ".international",
    ".investments", ".io", ".irish", ".jetzt", ".jewelry", ".kaufen", ".kim",
    ".kitchen", ".land", ".lawyer", ".lease", ".legal", ".lgbt", ".life",
    ".lighting", ".limited", ".limo", ".live", ".loan", ".loans", ".love",
    ".ltd", ".luxe", ".maison", ".management", ".market", ".marketing",
    ".markets", ".mba", ".me", ".me.uk", ".media", ".memorial",
    ".men", ".miami", ".mobi", ".moda", ".money", ".mortgage",
    ".movie", ".net", ".net.co", ".net.uk", ".network",
    ".news", ".ninja", ".nom.co", ".observer", ".online",
    ".org", ".org.uk", ".partners", ".parts", ".party",
    ".pet", ".photography", ".photos", ".pictures", ".pink", ".pizza",
    ".place", ".plumbing", ".plus", ".press", ".pro", ".productions", ".promo",
    ".properties", ".pub", ".racing", ".radio.fm", ".realty", ".recipes",
    ".red", ".rehab", ".reise", ".reisen", ".rent", ".rentals", ".repair", ".report",
    ".republican", ".rest", ".restaurant", ".review", ".reviews", ".rip", ".rocks",
    ".rodeo", ".run", ".sale", ".salon", ".sarl", ".school", ".schule", ".science",
    ".security", ".select", ".services", ".shoes", ".shopping", ".show", ".singles",
    ".site", ".soccer", ".social", ".software", ".solar", ".solutions", ".space",
    ".storage", ".store", ".stream", ".studio", ".style", ".supplies", ".supply",
    ".support", ".surf", ".surgery", ".systems", ".tax", ".taxi", ".team", ".tech",
    ".technology", ".tennis", ".theater", ".theatre", ".tienda", ".tips", ".tires",
    ".today", ".tools", ".tours", ".town", ".toys", ".trade", ".trading", ".training",
    ".tv", ".uk", ".university", ".us", ".vacations", ".ventures", ".vet", ".viajes",
    ".video", ".villas", ".vin", ".vip", ".vision", ".vodka", ".voyage", ".watch",
    ".webcam", ".website", ".wedding", ".wiki", ".win", ".wine", ".work", ".works",
    ".world", ".wtf", ".xyz", ".yoga", ".zone",
  ]
  let url = location.origin + "/api/v4/accounts" + location.pathname.replace("domains/register", "registrar/domains/search")
  var prices = []
  console.log(`Start Search (${domains.length}domains)`)
  for (i =0;i<domains.length;i++) {
    let value = domains[i]
    console.log(`Seach: No.${i+1}/${domains.length} ${name}${value}`)
    const result = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cross-site-security': 'dash' },
      body: JSON.stringify({ query: name + value })
    }).then(response => {
      return response.json()
    }).then(json => {
      return json.result
    })
    prices.push({ name: result.domains[0].name, price: result.domains[0].price + result.domains[0].icann_fee, icann: result.domains[0].icann_fee })
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