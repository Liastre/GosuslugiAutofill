import Settings from "./settings.js"

async function main() {
    // update settings
    let switchAutofillSearch = document.querySelector("#switchAutofillSearch > input")
    let settings = await Settings.getInstance()
    switchAutofillSearch.checked = settings.autofillSearch
    switchAutofillSearch.addEventListener("change", (e) => {
        settings.autofillSearch = e.target.checked
    })

    // setup popup
    let manifestData = chrome.runtime.getManifest()
    let popupVersion = document.getElementById("app-version")
    if(manifestData) {
        popupVersion.innerHTML = 'v' + manifestData.version
    }

    document.querySelectorAll('.btn-tab').forEach((tab, index) => {
        tab.addEventListener('click', (e)=>{
            tab.previousElementSibling.checked = true
            window.location.href='#tab' + index
        })
    })
}

main()
