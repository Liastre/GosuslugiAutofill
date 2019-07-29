(async () => {
    const src = chrome.extension.getURL('./popup.js');
    const contentScript = await import(src);
})();
