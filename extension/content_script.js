//@ts-check
import { FormAutofillerBase } from "./form_autofiller_base.js"
import { Utils, LocalStorage } from "./utils.js"

function runEmbedded() {
    // replace for open
    let open = window.XMLHttpRequest.prototype.open
    let openReplacement = function (method, url, async, user, password) {  
        var event = new CustomEvent("angularjs_xhr_open", {
            detail: {
                method: method,
                url: url
            }
        })
        window.dispatchEvent(event)
        this._url = url
        return open.apply(this, arguments)
    }
    window.XMLHttpRequest.prototype.open = openReplacement


    let onReadyStateChangeReplacement = function () {  
        if(this.readyState != XMLHttpRequest.DONE)
            return

        var event = new CustomEvent("angularjs_xhr_done", {
            detail: {
                status: this.status,
                url: this.responseURL
            }
        })
        window.dispatchEvent(event)
        
        if (this._onreadystatechange) {
            return this._onreadystatechange.apply(this, arguments)
        }
    }

    let send = window.XMLHttpRequest.prototype.send
    let sendReplacement = function(data) {  
        if (this.onreadystatechange) {
          this._onreadystatechange = this.onreadystatechange
        }
        
        var event = new CustomEvent("angularjs_xhr_send", {
            detail: {
                data: data
            }
        })
        window.dispatchEvent(event)
        
        this.onreadystatechange = onReadyStateChangeReplacement
        return send.apply(this, arguments)
    }
    window.XMLHttpRequest.prototype.send = sendReplacement
}

class RegisterOfListsOfWorksAndServices extends FormAutofillerBase {
    constructor() {
        super()
    }

    // adding

    // planing

    // fixation
}

class RegisterOfWorksAndServices extends FormAutofillerBase {
    constructor() {
        super()

        // setup requests
        // each request contains API url and complete flag
        this._xhrOnRegionChanged = new Map([
        ])
        this._xhrOnRegionSelected = new Map([
            ["/homemanagement/api/rest/services/houses/fias/settlements", false],
            ["/homemanagement/api/rest/services/houses/fias/inner-city-areas", false],
            ["/homemanagement/api/rest/services/houses/fias/planning-structure-elements", false],
            ["/homemanagement/api/rest/services/houses/fias/additional-areas", false],
            ["/homemanagement/api/rest/services/houses/fias/additional-area-streets", false],
            ["/homemanagement/api/rest/services/houses/fias/streets", false],
            ["/homemanagement/api/rest/services/houses/fias/house/numbers/full", false]
        ])

        this._xhrOnCityChanged = new Map([
            ["/homemanagement/api/rest/services/houses/fias/cities", false]
        ])
        this._xhrOnCitySelected = new Map([
            ["/homemanagement/api/rest/services/houses/fias/settlements", false],
            ["/homemanagement/api/rest/services/houses/fias/inner-city-areas", false],
            ["/homemanagement/api/rest/services/houses/fias/planning-structure-elements", false],
            ["/homemanagement/api/rest/services/houses/fias/additional-areas", false],
            ["/homemanagement/api/rest/services/houses/fias/additional-area-streets", false],
            ["/homemanagement/api/rest/services/houses/fias/streets", false],
            ["/homemanagement/api/rest/services/houses/fias/house/numbers/full", false]
        ])

        this._xhrOnStreetChanged = new Map([
            ["/homemanagement/api/rest/services/houses/fias/streets", false]
        ])
        this._xhrOnStreetSelected = new Map([
            ["/homemanagement/api/rest/services/houses/fias/additional-areas", false],
            ["/homemanagement/api/rest/services/houses/fias/additional-area-streets", false],
            ["/homemanagement/api/rest/services/houses/fias/house/numbers/full", false]
        ])

        this._xhrOnHouseChanged = new Map([
            ["/homemanagement/api/rest/services/houses/fias/house/numbers/full", false]
        ])
        this._xhrOnHouseSelected = new Map([
            ["/workplanning/api/rest/services/find/house/by/fias", false],
            ["/workplanning/api/rest/services/search/reportingperiods", false]
        ])

        this._xhrOnFormSearch = new Map([
            ["/workplanning/api/rest/services/search/fixedworks", false],
            ["/workplanning/api/rest/services/search/providers/notactual", false]
        ])
    }

    fill(completedWork) {
        if (!this._autofillSearch) {
            if (!this._isValidForm(completedWork))
                return
                
            let tableSelector = "#efHcsprfFrForm table.table.table-entity"
            this._fillServicesTable(tableSelector, completedWork.services)
        } else {
            let regionSelector = 'div[id^="s2id_region"] > .select2-choice'
            this._selectDropdownElementWithSearchAsync(regionSelector, completedWork.area, this._xhrOnRegionChanged, this._xhrOnRegionSelected)
            .then(() => {
                console.log("region chosen")
                let citySelector = 'div[id^="s2id_city"] > .select2-choice'
                return this._selectDropdownElementWithSearchAsync(citySelector, completedWork.city, this._xhrOnCityChanged, this._xhrOnCitySelected)
            })
            .then(() => {
                console.log("city chosen")
                let streetSelector = 'div[id^="s2id_street"] > .select2-choice'
                return this._selectDropdownElementWithSearchAsync(streetSelector, completedWork.street, this._xhrOnStreetChanged, this._xhrOnStreetSelected)
            })
            .then(() => {
                console.log("street chosen")
                let houseSelector = 'label[for="house"]+div > div.select2-container > .select2-choice'
                return this._selectDropdownElementWithSearchAsync(houseSelector, completedWork.house, this._xhrOnHouseChanged, this._xhrOnHouseSelected)
            })
            .then(() => {
                console.log("house chosen")
                let dateSelector = '.form-horizontal .select2-container.form-control.form-base__form-control.ng-untouched.ng-isolate-scope > .select2-choice'
                return this._selectDropdownElementAsync(dateSelector, completedWork.date)
            })
            .then((success) => {
                if (!success) {
                    alert("В выпадающем списке не найдено требуемое поле, выберите вручную")
                    return
                }

                console.log("period chosen")
                let searchBtnSelector = ".form-horizontal div.col-xs-8.text-right.ng-scope > button.btn.btn-prime"
                return this._submitFormSearch(searchBtnSelector, this._xhrOnFormSearch)
            })
            .then(() => {
                console.log("search submitted")
                let tableSelector = "#efHcsprfFrForm table.table.table-entity"
                this._fillServicesTable(tableSelector, completedWork.services)
            })
        }
    }

    _fillServicesTable(selector, services) {
        let servicesTable = document.querySelectorAll(selector)[0]
        let sercicesRows = servicesTable.querySelectorAll('tbody.scrollable-grid__body tr > td.scrollable-grid__col_fixed')
        for (let service of services) {
            // search service in item list
            for (let item of sercicesRows) {
                if (!Utils.isSimilar(item.innerText, service.name, 0.58))
                    continue
                
                let inputs = item.nextElementSibling.querySelectorAll('input.form-control')
                inputs[2].value = service.count
                inputs[2].dispatchEvent(new Event("input"))
                inputs[3].value = service.cost
                inputs[3].dispatchEvent(new Event("input"))
            }
        }
    }

    /**
     * Check selected completed work with form filling
     * @param {object} completedServiceObject 
     */
    _isValidForm(completedServiceObject) {
        let alertMessage = "Вводимые данные не совпадают, проверьте:"
        let isValid = true

        let chosenStreet = this._searchFormStreet()
        if (!chosenStreet || !chosenStreet.innerText.toLowerCase().includes(completedServiceObject.street.toLowerCase())) {
            alertMessage += " улицу,"
            isValid = false
        }

        let chosenHouse = this._searchFormHouse()
        if (!chosenHouse || !chosenHouse.innerText.includes(completedServiceObject.house)) {
            alertMessage += " номер здания,"
            isValid = false
        }

        let chosenPeriod = this._searchFormPeriod()
        if (!chosenPeriod || !chosenPeriod.innerText.includes(completedServiceObject.date)) {
            alertMessage += " период,"
            isValid = false
        }

        if (!isValid) {
            let tmpCharArray = alertMessage.toCharArray()
            tmpCharArray[alertMessage.length-1] = '.'
            alertMessage = tmpCharArray.toString()
            alertMessage += " Хотите продолжить?"
            isValid = confirm(alertMessage)
        }

        return isValid
    }

    /**
     * Forms search
     */
    /// @{
    _searchFormStreet() {
        return document.querySelectorAll('div[id^="s2id_street"] > a.select2-choice > .select2-chosen')[0]
    }

    _searchFormHouse() {
        return this._searchFormByLabelText("номер здания")
    }

    _searchFormPeriod() {
        return this._searchFormByLabelText("период")
    }
    /// @}
}

class AutoFillPanel {
    constructor() {
        // private properties
        this._completedServicesData = []
        this._completedServicesList = undefined
        this._storageName = "guafStoredData"
        this._panel = this._buildSidePanel()

        //
        LocalStorage.get(this._storageName, (data) => {
            this._registerOfWorksAndServices = new RegisterOfWorksAndServices();
            this._updateCompletedServices(data)
        })
    }

    get panelElement() {
        return this._panel
    }

    unload() {
        LocalStorage.set(this._storageName, this._completedServicesData, function() {
            console.log("object stored")
        })
    }

    _buildSidePanel() {
        // main panel
        let panel = document.createElement('div')
        panel.classList.add("guaf-hidden")
        panel.id = "gosuslugi-autofill"

        // completed services list
        let completedServicesListWrap = document.createElement('div')
        completedServicesListWrap.classList.add("guaf-completed-services")
        this._completedServicesList = document.createElement('div')
        completedServicesListWrap.appendChild(this._completedServicesList)
        panel.appendChild(completedServicesListWrap)

        // side panel
        let sidePanel = document.createElement('div')
        sidePanel.classList.add("guaf-sidepanel")
        // - hide button
        let hideBtn = document.createElement('div')
        hideBtn.classList.add("guaf-sidepanel--btn", "guaf-sidepanel--btn-hide")
        hideBtn.setAttribute("title", "Скрыть")
        hideBtn.addEventListener("click", () => {
            this._panel.classList.toggle("guaf-hidden")
        })
        let hideBtnImage = document.createElement('img')
        // @ts-ignore
        hideBtnImage.src = chrome.runtime.getURL("images/arrow.png")
        hideBtn.appendChild(hideBtnImage)
        sidePanel.appendChild(hideBtn)
        // - remove all button
        let removeAllBtn = document.createElement('div')
        removeAllBtn.classList.add("guaf-sidepanel--btn")
        removeAllBtn.setAttribute("title", "Удалить все записи")
        let removeAllBtnImage = document.createElement('img')
        // @ts-ignore
        removeAllBtnImage.src = chrome.runtime.getURL("images/trashcan-all.png")
        removeAllBtn.appendChild(removeAllBtnImage)
        removeAllBtn.addEventListener("click", () => {
            this._completedServicesData.length = 0
            let completedServicesList = this._completedServicesList
            while (completedServicesList.firstChild) {
                completedServicesList.removeChild(completedServicesList.firstChild)
            }
        })
        sidePanel.appendChild(removeAllBtn)
        // - remove used button
        let removeUsedBtn = document.createElement('div')
        removeUsedBtn.classList.add("guaf-sidepanel--btn")
        removeUsedBtn.setAttribute("title", "Удалить использованные записи")
        let removeUsedBtnImage = document.createElement('img')
        // @ts-ignore
        removeUsedBtnImage.src = chrome.runtime.getURL("images/trashcan-used.png")
        removeUsedBtn.appendChild(removeUsedBtnImage)
        removeUsedBtn.addEventListener("click", () => {
            // clear data
            let i = this._completedServicesData.length
            while (i--) {
                if (this._completedServicesData[i].used === true) { 
                    this._completedServicesData.splice(i, 1)
                } 
            }

            // remove elements from DOM
            let completedServicesList = this._completedServicesList.children
            i = completedServicesList.length
            while (i--) {
                if (completedServicesList[i].classList.contains("used")) {
                    this._completedServicesList.removeChild(completedServicesList[i])
                }
            }
        })
        sidePanel.appendChild(removeUsedBtn)
        // - add files button
        let addFilesBtn = document.createElement('div')
        addFilesBtn.classList.add("guaf-sidepanel--btn")
        addFilesBtn.setAttribute("title", "Загрузить файлы с данными")
        let addFilesBtnInput = document.createElement('input')
        addFilesBtnInput.setAttribute("type", "file")
        addFilesBtnInput.setAttribute("title", "Загрузить файлы с данными")
        addFilesBtnInput.setAttribute("multiple", "")
        addFilesBtnInput.addEventListener("change", (e) => {
            for(let file of e.target.files) {
                this._parseFile(file)
            }
        })
        addFilesBtn.appendChild(addFilesBtnInput)
        let addFilesBtnImage = document.createElement('img')
        // @ts-ignore
        addFilesBtnImage.src = chrome.runtime.getURL("images/plus.png")
        addFilesBtn.appendChild(addFilesBtnImage)
        sidePanel.appendChild(addFilesBtn)

        panel.appendChild(sidePanel)

        return panel
    }

    _parseFile(file) {
        // check file type
        let textType = /text.*/
        if (!file.type.match(textType)) {
            alert("File not supported!")
            return
        }

        // build reader
        let reader = new FileReader()
        reader.onload = (e) => {
            try {
                let resultObject = JSON.parse(e.target.result)
                this._updateCompletedServices(resultObject.completed_work)
            } catch (error) {
                alert('Ошибка ' + error.name + ":" + error.message + "\n" + error.stack)
            }

            // reset value
            this.value = null
        }
        reader.readAsText(file)
    }

    _updateCompletedServices(completedServices) {
        if (completedServices == null || !Array.isArray(completedServices) || completedServices.length === 0 )
            return

        let currentCompletedServicesSize = this._completedServicesData.length
        this._completedServicesData.push(...completedServices)
        for (let i=currentCompletedServicesSize, len=currentCompletedServicesSize+completedServices.length; i<len; ++i) {
            let completeService = this._completedServicesData[i]

            // format data
            completeService.street = completeService.street.trim()
            completeService.house = completeService.house.trim()
            completeService.date = completeService.date.trim()
            if (completeService.streetType)
                completeService.streetType = completeService.streetType.trim().toLowerCase()

            let listItem = this._buildCompletedServicesListItem(completeService)
            this._completedServicesList.appendChild(listItem)
        }
    }

    _buildCompletedServicesListItem(completedServiceObject) {
        // build list item
        let listItem = document.createElement('div')
        listItem.classList.add("guaf-completed-services--item")

        // list item name
        let listItemName = document.createElement('p')
        if(completedServiceObject.streetType)
            listItemName.innerText += completedServiceObject.streetType
        listItemName.innerText += " " + completedServiceObject.street
        listItemName.innerText += ", " + completedServiceObject.house
        listItemName.innerText += " от " + completedServiceObject.date
        listItemName.addEventListener("click", ()=>{     
            this._registerOfWorksAndServices.fill(completedServiceObject)
            completedServiceObject.used = true
            listItem.classList.add("used")
        })
        listItem.appendChild(listItemName)

        // remove button
        let listItemRemoveBtn = document.createElement('span')
        listItemRemoveBtn.classList.add("guaf-completed-services--item--remove-btn")
        let image = document.createElement('img')
        // @ts-ignore
        image.src = chrome.runtime.getURL("images/trashcan.png")
        listItemRemoveBtn.appendChild(image)
        listItemRemoveBtn.addEventListener("click", ()=>{
            let index = this._completedServicesData.indexOf(completedServiceObject)
            if (index > -1) {
                this._completedServicesData.splice(index, 1)
            }
            listItem.remove()
        })
        listItem.appendChild(listItemRemoveBtn)

        // apply properties
        if (completedServiceObject.used === true) {
            listItem.classList.add("used")
        }

        return listItem
    }
}

function main() {
    var autoFillPanel = new AutoFillPanel()
    document.body.appendChild(autoFillPanel.panelElement)

    // subscriptions
    window.addEventListener("angularjs_xhr_done", e => {
        if (e.detail.status !== 200)
        return

        console.log(e.detail.url)
    })

    if (document.readyState == "complete") {
        Utils.embed(runEmbedded)
    } else {
        window.addEventListener('load', loadEvent => { 
            Utils.embed(runEmbedded)
        })
    }

    window.addEventListener('beforeunload', e => {
        autoFillPanel.unload()
    })
}

main()