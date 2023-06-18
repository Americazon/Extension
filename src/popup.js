chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.result) {

    let elem = document.getElementById("result");
  
    elem.textContent = JSON.stringify(message.result, undefined, 2);
  }
});