import utils from "./utils";

const URL_REGEX = /https:\/\/.*amazon(?:\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl\.co\.jp|\.in|\.com\.au|\.com\.mx|\.br|\.cn|\.com\.tr|\.ae|\.sa|\.sg)\/(?:s|b|gp).*/

// FOR INTERNATIONAL SUPPORT OF DIFFERENT AMAZON URLs
const DOMAIN_COUNTRY_REGEX = /(\.com\.tr|\.com\.mx|\.com\.au|\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl|\.co\.jp|\.in|\.br|\.cn|\.ae|\.sa|\.sg)/

var currURL = ''

const fetchASIN = async (asins) => {

  if (!asins.length) return;

  // get country url for international support
  const [ countryURL ] = (new URL(currURL).hostname).match(DOMAIN_COUNTRY_REGEX)

  // get the asin URLs
  const asinURLS = asins.map(asin => {
    const fetchURL = new URL(`https://www.amazon${countryURL}/dp/${asin}`);
    // TODO: add search query params 
    return fetchURL.toString();
  })

  console.log('timing product fetch...')
  const parse_start = Date.now();
  // resolve them to text
  const productsHTML = await Promise.all(
    (await Promise.all(asinURLS.map((url) => fetch(url))))
      .filter(res => res.ok)
      .map((res) => res.text()))
  console.log(`product fetch time: ${Date.now() - parse_start}`)

  console.log('timing parse...')
  const product_start = Date.now()
  // parse productsHTML pages to get necessary data ie: COO
  const productCOO = productsHTML.map(utils.parseHTML)
  console.log(`parse time: ${Date.now() - product_start}`)

  // create the result 
  const result = {}
  for (let i = 0; i < asins.length; i++) {
    productCOO[i]["ASIN"] = asins[i]
    result[asins[i]] = productCOO[i] || {}
  }

  // send response back to the content script
  return result;

}

// listener to fetch products from content script when message received
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(currURL)
    if (request.asins)
      fetchASIN(request.asins).then(res => sendResponse(res))
    return true;
  }
);

// executes content script whenever tab is updated
chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {

    const { status, active, url } = tab

    if (URL_REGEX.test(url) && 
      changeInfo.status === 'complete' && 
      status === 'complete' && 
      active)
    {
      currURL = url
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-bundle.js"]
      })
    }
  }
);

// adds products 
chrome.tabs.onRemoved.addListener(
  function(tabId, removedInfo) {

    console.log(removedInfo)

    if (URL_REGEX.test(currURL))
    {
      console.log("closing...")
      chrome.scripting.executeScript({
        files: ["addProducts-bundle.js"]
      })
    }
})
