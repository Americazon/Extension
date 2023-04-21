import xpath from 'xpath'
import { DOMParser } from '@xmldom/xmldom';
// import * as wasmJsBg from '../wasm_bindgen_example/pkg/wasm_bindgen_example_bg';
// import * as wasmJs from '../wasm_bindgen_example/pkg/wasm_bindgen_example';
import * as wasm from '../wasm_bindgen_example/pkg/wasm_bindgen_example.wasm';

let currURL = ''

const fetchASIN = async (asins) => {
  console.log(wasm)

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

  // get the asin URLs
  const asinURLS = asins.map(asin => `https://www.amazon.com/dp/${asin}`)

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
  if (/https:\/\/.*amazon.com\/(?:s|b|gp).*/.test(url) && changeInfo.status === 'complete' && status === 'complete' && active && currURL != url) {
    currURL = url;
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-bundle.js"]
    })
  }
});