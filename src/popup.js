chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.result) {

    const data = Object.values(message.result)

    let elem = document.getElementById("result")
    let listDiv = document.createElement("div")

    data.forEach(productData => {

      let itemDiv = document.createElement("div")

      let titeElem = document.createElement("h1")
      let cooElem = document.createElement("h3")
      let imageElem = document.createElement("img")

      let productTitle = productData?.productName || ""
      productTitle = productTitle.length > 50 ? `${productTitle.substring(0, 50).trim()}...` : productTitle

      titeElem.innerText = productTitle || ""
      cooElem.innerText = `COO: ${productData?.COO || ""}`
      imageElem.src = productData?.productImage || ""
      
      // create title
      itemDiv.appendChild(titeElem)
      itemDiv.appendChild(cooElem)
      itemDiv.appendChild(imageElem)

      // append list item
      listDiv.appendChild(itemDiv)
      listDiv.style.border = "2px"
      listDiv.style.borderColor = "black"
    })

    elem.appendChild(listDiv);
  
  }
});