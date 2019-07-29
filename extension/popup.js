import { Settings } from "./settings.js"

function main() {
    var settings = new Settings()

    let switchAutofillSearch = document.querySelector("#switchAutofillSearch > input")
    switchAutofillSearch.addEventListener("change", (e) => {
        settings.autofillSearch = e.target.checked
    })
}

main()
