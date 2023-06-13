chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  document.getElementById("your-element-id").textContent = request.data;
});