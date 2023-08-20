import xpath from 'xpath'
import { DOMParser } from '@xmldom/xmldom';

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



export default {
  parseHTML 
}