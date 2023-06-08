import xpath from 'xpath'
import { DOMParser } from '@xmldom/xmldom';

let currURL = ''
const URL_REGEX = /https:\/\/.*amazon(?:\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl\.co\.jp|\.in|\.com\.au|\.com\.mx|\.br|\.cn|\.com\.tr|\.ae|\.sa|\.sg)\/(?:s|b|gp).*/
const DOMAIN_COUNTRY_REGEX = /(\.com\.tr|\.com\.mx|\.com\.au|\.com|\.ca|\.co\.uk|\.de|\.fr|\.it|\.es|\.nl|\.co\.jp|\.in|\.br|\.cn|\.ae|\.sa|\.sg)/

const fetchASIN = async (asins) => {

  if (!asins.length) return;

  const COO_XPATH = "//*[contains(text(), 'Country of Origin') or contains(text(), 'Country/Region of origin')]//following-sibling::*"
  const filterCOO = (str) => str.replace('\n', '').replace('&lrm;', '').trim()
  const dom_parser = new DOMParser({
    locator: {},
    errorHandler: {
      warning: function (w) {},
      error: function (e) {},
      fatalError: function (e) { console.error(e) },
  }})
  const parseCOO = (html) => filterCOO(xpath.select1(COO_XPATH, dom_parser.parseFromString(html, "text/html"))?.firstChild?.data || '')

  const [ countryURL ] = (new URL(currURL).hostname).match(DOMAIN_COUNTRY_REGEX)

  // get the asin URLs
  const asinURLS = asins.map(asin => `https://www.amazon${countryURL}/dp/${asin}`)

  // resolve them to text
  const productsHTML = await Promise.all(
    (await Promise.all(asinURLS.map((url) => fetch(url))))
      .filter(res => res.ok)
      .map((res) => res.text()))
  
  // parse productsHTML pages to get necessary data ie: COO
  const productCOO = productsHTML.map(parseCOO)

  // create the result 
  const result = {}
  for (let i = 0; i < asins.length; i++) {
    result[asins[i]] = productCOO[i] || ""
  }

  // send response back to the content script
  return result;

}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.asins) fetchASIN(request.asins).then(res => sendResponse(res))
    return true;
  }
);

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