chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  console.log("FROM POPUP: " + JSON.stringify(request.data, undefined, 2));
  
  let elem = document.createElement('div')

  elem.textContent = JSON.stringify(request.data, undefined, 2);

  document.firstElementChild.appendChild(elem)
});