chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.result) {

    const data = Object.values(message.result)

    let elem = document.getElementById("result")
    let listDiv = document.createElement("div")

    data.forEach(productData => {

      const { productname, countryoforigin, productImage } = productData

      let itemDiv = document.createElement("div")

      let titeElem = document.createElement("h1")
      let cooElem = document.createElement("h3")
      let imageElem = document.createElement("img")

      imageElem.style.borderColor = "black"
      imageElem.style.borderWidth = "2px"

      let productTitle = productname || ""
      productTitle = productTitle.length > 50 ? `${productTitle.substring(0, 50).trim()}...` : productTitle

      titeElem.innerText = productTitle || ""
      cooElem.innerText = `Country of Origin: ${countryoforigin || "Unknown"}`
      imageElem.src = productImage || ""
      imageElem.width = 50
      imageElem.height = 50
      
      // create title
      itemDiv.appendChild(imageElem)
      itemDiv.appendChild(titeElem)
      itemDiv.appendChild(cooElem)



      itemDiv.style.marginBottom = "50px"
      itemDiv.style.border = "3px solid black"
      itemDiv.style.borderRadius = "8px"
      itemDiv.style.padding = "5px"

      // append list item
      listDiv.appendChild(itemDiv)
    })

    elem.appendChild(listDiv);
  
  }
});