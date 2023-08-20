import { ASIN_REGEX } from "./content";

const ADD_PRODUCTS_FETCH_URL = "https://us-central1-americazon-extension.cloudfunctions.net/addProducts"

function saveProducts() {
  const asin = sessionStorage.filter(item => ASIN_REGEX.test(item))

  console.log(asin)

  // fetch for the add products
  // fetch(ADD_PRODUCTS_FETCH_URL, {
  //   method: 'POST',
  //   mode: 'no-cors',
  //   headers: {
  //     'Access-Control-Allow-Origin': '*',
  //     'Content-Type': 'application/json',
  //     'Accept': '*/*'
  //   },
  //   body: JSON.stringify(Object.values(result))
  // })
}

saveProducts();