import Settings from "./settings.js"

async function main() {
    let switchAutofillSearch = document.querySelector("#switchAutofillSearch > input")

    // update settings
    let settings = await Settings.getInstance()
    switchAutofillSearch.checked = settings.autofillSearch

    switchAutofillSearch.addEventListener("change", (e) => {
        settings.autofillSearch = e.target.checked
    })
}

main()
