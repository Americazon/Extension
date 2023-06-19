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

      titeElem.innerText = productData?.productName || ""
      cooElem.innerText = productData?.COO || ""
      imageElem.src = productData?.productImage || ""
      
      // create title
      itemDiv.appendChild(titeElem)
      itemDiv.appendChild(cooElem)
      itemDiv.appendChild(imageElem)

      // append list item
      listDiv.appendChild(itemDiv)
    })

    elem.appendChild(listDiv);
  
  }
});