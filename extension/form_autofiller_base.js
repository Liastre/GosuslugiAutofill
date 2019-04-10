import { Utils } from "./utils.js"

export class FormAutofillerBase {
    constructor() {
        this._xnrDone = undefined
        
        window.addEventListener("angularjs_xhr_done", (e) => {
            if(this._xnrDone)
                this._xnrDone(e.detail)
        })
    }

    async _selectDropdownElementWithSearchAsync(selector, textToSearch, requestsOnChange, requestsOnSelect) {
        // select element
        let dropdownMenu = document.querySelector(selector)
        let parentContainer = dropdownMenu.parentElement
        if (!dropdownMenu.classList.contains("select2-default")) {
            let dropdownMenuChosen = dropdownMenu.querySelector("span.select2-chosen")
            let isSameSelected = dropdownMenuChosen.innerText.includes(textToSearch)
            if (isSameSelected) return
        }
        
        // promises arrays
        let onChangePromises = []
        for (let key of requestsOnChange.keys()) {
            onChangePromises.push(new Promise(resolve => {
                requestsOnChange.set(key, resolve)
            }))
        }
        let onSelectPromises = []
        for (let key of requestsOnSelect.keys()) {
            onSelectPromises.push(new Promise(resolve => {
                requestsOnSelect.set(key, resolve)
            }))
        }

        // wait till container locked
        while(parentContainer.classList.contains("select2-container-disabled")) {
            await Utils.sleep(1)
        }
        dropdownMenu.dispatchEvent(new Event("mousedown"))

        // set current callback for xnr
        this._setXnrDone(requestsOnChange)

        // insert data
        let searchInput = document.activeElement
        searchInput.value = textToSearch
        searchInput.dispatchEvent(new Event("input"))
        await Promise.all(onChangePromises)

        // select data
        await Utils.sleep(1)
        this._resetXnrDone(requestsOnSelect)
        searchInput.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 13}))
        await Promise.all(onSelectPromises)
        this._resetXnrDone()
    }

    async _selectDropdownElementAsync(selector, textToSearch, requestsOnSelect) {
        // select element
        let dropdownMenu = document.querySelectorAll(selector)[0]
        let parentContainer = dropdownMenu.parentElement
        if (!dropdownMenu.classList.contains("select2-default")) {
            let dropdownMenuChosen = dropdownMenu.querySelector("span.select2-chosen")
            let isSameSelected = dropdownMenuChosen.innerText.includes(textToSearch)
            if (isSameSelected) return
        }

        // wait till container locked
        while(parentContainer.classList.contains("select2-container-disabled")) {
            await Utils.sleep(1)
        }

        // promises arrays
        let onSelectPromises = []
        if (requestsOnSelect) {
            for (let key of requestsOnSelect.keys()) {
                onSelectPromises.push(new Promise(resolve => {
                    requestsOnSelect.set(key, resolve)
                }))
            }
        }

        dropdownMenu.dispatchEvent(new Event("mousedown"))

        // set current callback for xnr
        this._setXnrDone(requestsOnSelect)
        await Promise.all(onSelectPromises)
        this._resetXnrDone()

        // select dropdown element
        let inputEl = document.activeElement
        let dropdownList = inputEl.parentElement.nextElementSibling
        while(dropdownList.querySelector(".select2-no-results")) {
            dropdownMenu.dispatchEvent(new Event("mousedown"))
            await Utils.sleep(1)
            dropdownMenu.dispatchEvent(new Event("mousedown"))
        }
        let selectedEl = dropdownList.querySelector(".select2-highlighted")
        selectedEl.classList.remove("select2-highlighted")
        let xpath = "//div[contains(text(),'" + textToSearch + "')]/.."
        selectedEl = document.evaluate(xpath, dropdownList, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if(!selectedEl) {
            // TODO: mark invalid field, add separate method
            alert("В выпадающем списке не найдено требуемое поле, выберите вручную")
            return
        }
        selectedEl.classList.add("select2-highlighted")
        inputEl.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 13}))
    }

    async _submitFormSearch(selector, requestsOnSubmit) {
        let searchBtn = document.querySelector(selector)
        while(searchBtn.disabled) {
            await Utils.sleep(1)
        }

        // promises arrays
        let onSubmitPromises = []
        if (requestsOnSubmit) {
            for (let key of requestsOnSubmit.keys()) {
                onSubmitPromises.push(new Promise(resolve => {
                    requestsOnSubmit.set(key, resolve)
                }))
            }
        }

        this._setXnrDone(requestsOnSubmit)
        searchBtn.click()
        await Promise.all(onSubmitPromises)
        this._resetXnrDone()
    }

    _searchFormByLabelText(labelText) {
        let labels = document.querySelectorAll("div.form-group > label.control-label")
        let targetLabel = null
        for (let label of labels) {
            if (!label.innerText.toLowerCase().includes(labelText))
                continue

            targetLabel = label
        }

        if (!targetLabel)
            return

        let target = targetLabel.nextElementSibling.querySelectorAll(".select2-chosen")[0]
        return target
    }
  
    _setXnrDone(requestsMap) {
        if (!requestsMap) return;

        this._xnrDone = function(response) {
            if (response.status !== 200)
                return

            // parse url via a element to get pathname
            let aElement = document.createElement('a')
            aElement.href = response.url

            if (requestsMap.has(aElement.pathname)) {
                requestsMap.get(aElement.pathname)()
            }
        }
    }

    _resetXnrDone(requestsMap) {
        if (requestsMap) {
            this._setXnrDone(requestsMap)
        } else {
            this.xnrDone = undefined
        }
    }
}