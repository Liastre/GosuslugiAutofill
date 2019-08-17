(async () => {
    const src = chrome.extension.getURL('./content.js');
    const contentScript = await import(src);
})();