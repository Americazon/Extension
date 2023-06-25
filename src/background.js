import xpath from 'xpath'
import { DOMParser } from '@xmldom/xmldom';

// FOR INTERNATIONAL SUPPORT OF DIFFERENT AMAZON URLs
let currURL = ''
const URL_REGEX = /https:\/\/.*amazon(?:\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl\.co\.jp|\.in|\.com\.au|\.com\.mx|\.br|\.cn|\.com\.tr|\.ae|\.sa|\.sg)\/(?:s|b|gp).*/
const DOMAIN_COUNTRY_REGEX = /(\.com\.tr|\.com\.mx|\.com\.au|\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl|\.co\.jp|\.in|\.br|\.cn|\.ae|\.sa|\.sg)/

// XPATHs
const COO_XPATH = "//*[contains(text(), 'Country of Origin') or contains(text(), 'Country/Region of origin')]//following-sibling::*"
const PRODUCTNAME_XPATH = "//*[@id='productTitle']"
const IMAGE_XPATH = "//*[@id='landingImage']"
const MANUFACTURER_XPATH = "//*[not(contains(text(), 'Recommended')) and not(contains(text(), 'recommended')) and not(contains(text(), 'discontinued')) and not(contains(text(), 'Discontinued')) and contains(text(), 'Manufacturer')]//following-sibling::*"
const DEPARTMENT_XPATH = "//*[contains(text(), 'Department') or contains(text(), 'department')]//following-sibling::*"

// define XPATH Parser
const dom_parser = new DOMParser({
  locator: {},
  errorHandler: {
    warning: function (w) {},
    error: function (e) {},
    fatalError: function (e) { console.error(e) },
}})

// filter HTML to be just the string from scraping
const filterHTML = (str) => str.replace('\n', '').replace('&lrm;', '').trim()

// parse a product page
const parseHTML = (html) => ({ 
    productname: filterHTML(xpath.select1(PRODUCTNAME_XPATH, dom_parser.parseFromString(html, "text/html"))?.firstChild?.data || ''),
    countryoforigin: filterHTML(xpath.select1(COO_XPATH, dom_parser.parseFromString(html, "text/html"))?.firstChild?.data || ''),
    productImage: filterHTML(xpath.select1(IMAGE_XPATH, dom_parser.parseFromString(html, "text/html"))?.attributes[1]?.nodeValue || ''),
    department: filterHTML(xpath.select1(DEPARTMENT_XPATH, dom_parser.parseFromString(html, "text/html"))?.firstChild?.data ||  ''),
    manufacturer: filterHTML(xpath.select1(MANUFACTURER_XPATH, dom_parser.parseFromString(html, "text/html"))?.firstChild?.data ||  '')
})

const fetchASIN = async (asins) => {

  if (!asins.length) return;

  // get country url for international support
  const [ countryURL ] = (new URL(currURL).hostname).match(DOMAIN_COUNTRY_REGEX)

  // get the asin URLs
  const asinURLS = asins.map(asin => `https://www.amazon${countryURL}/dp/${asin}`)

  // resolve them to text
  const productsHTML = await Promise.all(
    (await Promise.all(asinURLS.map((url) => fetch(url))))
      .filter(res => res.ok)
      .map((res) => res.text()))
  
  // parse productsHTML pages to get necessary data ie: COO
  const productCOO = productsHTML.map(parseHTML)

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
    if (request.asins) fetchASIN(request.asins).then(res => sendResponse(res))
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