export const ASIN_REGEX = /^(?:\d{10}|[A-Z]{10}|[\dA-Z]{10})$/

function addAffiliateDisclosure(productElement)
{
  let infoIcon = document.createElement('i');
  infoIcon.id = "id-affiliate-disclosure"
  infoIcon.style.fontSize = "12px"
  infoIcon.style.paddingLeft = "4px"
  infoIcon.style.position = "float:right"
  infoIcon.innerText = "\u24D8"

  let affiliateTextHeader = document.createElement('h3')
  affiliateTextHeader.innerText = "As an Amazon Associate I earn from qualifying purchases."
  affiliateTextHeader.style.color = "black"
  affiliateTextHeader.style.fontSize = "12px"
  affiliateTextHeader.style.visibility = "hidden"

  let affiliateDisclosureDiv = document.createElement('div')
  affiliateDisclosureDiv.appendChild(affiliateTextHeader);
  affiliateDisclosureDiv.style.visibility = "hidden"
  affiliateDisclosureDiv.style.width = "120px"
  affiliateDisclosureDiv.style.position = "absolute"
  affiliateDisclosureDiv.style.zIndex = "9999"

  infoIcon.addEventListener('mouseenter', (e) => {
    e.stopPropagation()
    affiliateDisclosureDiv.style.visibility = "visible"
    affiliateTextHeader.style.visibility = "visible"
  })

  infoIcon.addEventListener('mouseleave', (e) => {
    e.stopPropagation()
    affiliateDisclosureDiv.style.visibility = "hidden"
    affiliateTextHeader.style.visibility = "hidden"
  })
  
  infoIcon.appendChild(affiliateDisclosureDiv);

  productElement.appendChild(infoIcon);
}

async function addToPage(asins, result={}) {
  // add COO to the UI
  for (let i = 0; i < asins.length; i++) {
    let productElem = document.querySelector(`[data-asin='${asins[i]}']`)
    if (productElem) {
      let COOTextElem = document.createElement('div');
      let resultCOO = `${result[asins[i]]?.countryOfOrigin || "Unknown"}`
      COOTextElem.textContent = `Country of Origin: ${resultCOO}`

      COOTextElem.style.color = "black"
      COOTextElem.style.padding = "2px"
      COOTextElem.style.borderRadius = "5px"
      COOTextElem.style.background = "#febd69"
      COOTextElem.style.borderWidth = "5px"
      COOTextElem.style.borderColor = "grey"
      COOTextElem.style.maxWidth = "90%"
      COOTextElem.style.marginLeft = "5px"

      productElem.style.marginBottom = "50px"

      productElem.style.height = "90%"

      // append the COOText to the productElem
      productElem.appendChild(COOTextElem)

      // add affiliate links
      let links = productElem.querySelectorAll("a[href]")
      links.forEach(link => {
        let url = new URL(link.href);
        if (resultCOO != "Unknown") {
          url.searchParams.set('tag', 'americazon0b-20');
        }
        link.href = url.href;
      });

      // create affiliate disclosure if a country of origin was provided
      if (resultCOO !== "Unknown") {
        addAffiliateDisclosure(COOTextElem);
      }

    }
  }
}

async function createLoadingElem() {
  let loadingDivWrapper = document.createElement('div')
  loadingDivWrapper.id = "americazon-loading-icon-wrapper"
  loadingDivWrapper.textContent = "Loading..."

  loadingDivWrapper.style.position = "fixed"
  loadingDivWrapper.style.top = "0"
  loadingDivWrapper.style.right = "0"
  loadingDivWrapper.style.backgroundColor = "#fefefe"
  loadingDivWrapper.style.margin = "15% auto"
  loadingDivWrapper.style.padding = "20px"
  loadingDivWrapper.style.width = "100%"
  loadingDivWrapper.style.maxWidth = "100px"
  loadingDivWrapper.style.border = "2px solid #888"
  loadingDivWrapper.style.borderRadius = "8px"
  loadingDivWrapper.style.boxShadow = "0 4px 8px 0 rgba(0,0,0,0.2)"
  loadingDivWrapper.style.fontFamily = 'Arial, sans-serif'

  let img = document.createElement('img')

  img.src = chrome.runtime.getURL("/America128.png")
  img.alt = "Pic"

  loadingDivWrapper.appendChild(img)

  return loadingDivWrapper;
}

async function getCOO() {

  // get all asins from the page
  const asins = [
    ...new Set(Array.from(document.querySelectorAll("[data-asin]"))
    .map(asin => asin.attributes[0])
    .map(asinData => asinData?.value || "")
    .filter(asinFilt => ASIN_REGEX.test(asinFilt)))
  ]

  console.log('fetching products...')

  // create the loading div
  let loadingDiv = await createLoadingElem()
  document.firstElementChild.append(loadingDiv)
  
  // show cached products first
  let cacheResult = {}
  const asinCache = asins.filter(asin => {
    const cacheRes = sessionStorage.getItem(asin)
    
    if (cacheRes !== null) {
      cacheResult[asin] = JSON.parse(cacheRes)
      return true
    }
    
    return false
  })
  addToPage(asinCache, cacheResult)

  // fetch non cached products
  const asinFetch = asins.filter(asin => sessionStorage.getItem(asin) === null)
  const fetchResult = await chrome.runtime.sendMessage({ asins: asinFetch })

  // add to page of fetched results
  addToPage(asinFetch, fetchResult)

  // send result to the popup UI
  // chrome.runtime.sendMessage({ result: { ...fetchResult, ...cacheResult }})

  // remove loading div
  loadingDiv.remove();

  console.log('product fetching done...')

  // persist to local cache and background fetch event
  if (fetchResult) {
    Object.entries(fetchResult).forEach(
      ([asin, product]) => sessionStorage.setItem(asin, JSON.stringify(product))
    )
  }

}


setTimeout(function() {
  if (document.readyState === "complete") getCOO();
}, 2000)