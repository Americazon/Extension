import xpath from 'xpath'
import { DOMParser } from '@xmldom/xmldom';

// FOR INTERNATIONAL SUPPORT OF DIFFERENT AMAZON URLs
let currURL = ''
const URL_REGEX = /https:\/\/.*amazon(?:\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl\.co\.jp|\.in|\.com\.au|\.com\.mx|\.br|\.cn|\.com\.tr|\.ae|\.sa|\.sg)\/(?:s|b|gp).*/
const DOMAIN_COUNTRY_REGEX = /(\.com\.tr|\.com\.mx|\.com\.au|\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl|\.co\.jp|\.in|\.br|\.cn|\.ae|\.sa|\.sg)/
const ADD_PRODUCTS_FETCH_URL = "https://us-central1-americazon-extension.cloudfunctions.net/addProducts"

// XPATHs
const COO_XPATH = "//*[contains(text(), 'Country of Origin') or contains(text(), 'Country/Region of origin')]//following-sibling::*"
const PRODUCTNAME_XPATH = "//*[@id='productTitle']"
const IMAGE_XPATH = "//*[@id='landingImage']"
const MANUFACTURER_XPATH = "//*[not(contains(text(), 'Recommended')) and not(contains(text(), 'recommended')) and not(contains(text(), 'discontinued')) and not(contains(text(), 'Discontinued')) and contains(text(), 'Manufacturer')]//following-sibling::*"
// const DEPARTMENT_XPATH = "//select[@aria-describedby='searchDropdownDescription']/option[@selected='selected']"

// define XPATH Parser
const dom_parser = new DOMParser({
  errorHandler: {
    warning: function (w) {},
    error: function (e) {},
    fatalError: function (e) { console.error(e) },
}})

// filter HTML to be just the string from scraping
const filterHTML = (str) => str.replace(/\n|&lrm;|[^\x00-\x7F]/g, "").trim();

const parseHTML = (html) => {
    const doc = dom_parser.parseFromString(html, "text/html");
    
    const select = (xpath_str) => 
        filterHTML(xpath.select1(xpath_str, doc)?.firstChild?.data || '');

    const selectAttribute = (xpath_str) => 
        filterHTML(xpath.select1(xpath_str, doc)?.attributes[1]?.nodeValue || '');

    return {
        productName: select(PRODUCTNAME_XPATH),
        countryOfOrigin: select(COO_XPATH),
        productImage: selectAttribute(IMAGE_XPATH),
        manufacturer: select(MANUFACTURER_XPATH)
    };
};

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
  const productCOO = productsHTML.map(parseHTML)
  console.log(`parse time: ${Date.now() - product_start}`)

  // create the result 
  const result = {}
  for (let i = 0; i < asins.length; i++) {
    productCOO[i]["ASIN"] = asins[i]
    result[asins[i]] = productCOO[i] || {}
  }

  // fetch for the add products
  fetch(ADD_PRODUCTS_FETCH_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Accept': '*/*'
    },
    body: JSON.stringify(Object.values(result))
  })

  // send response back to the content script
  return result;

}

// listener to fetch products from content script when message received
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.asins)
      fetchASIN(request.asins).then(res => sendResponse(res))
    return true;
  }
);

// executes content script whenever tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  const { status, active, url } = tab

  if (URL_REGEX.test(url) && 
    changeInfo.status === 'complete' && 
    status === 'complete' && 
    active /* && currURL != url */)
  {
    currURL = url
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-bundle.js"]
    })
  }
});