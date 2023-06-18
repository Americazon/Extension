chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.result) {

    let elem = document.getElementById("result");
  
    elem.innerText = JSON.stringify(message.result, undefined, 2);
  }
});