/// helpers
/// @{
function embed(fn) {
    const script = document.createElement("script")
    script.text = `(${fn.toString()})();`
    document.documentElement.appendChild(script)
}

String.prototype.toCharArray = function() {
    return this.split('')
}

Array.prototype.toString = function() {
    return this.join('')
}

function _min(d0, d1, d2, bx, ay) {
    return d0 < d1 || d2 < d1
        ? d0 > d2
            ? d2 + 1
            : d0 + 1
        : bx === ay
            ? d1
            : d1 + 1;
}

function levenshtein(a, b) {
    if (a === b) {
        return 0;
    }

    if (a.length > b.length) {
        var tmp = a;
        a = b;
        b = tmp;
    }

    var la = a.length;
    var lb = b.length;

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
        la--;
        lb--;
    }

    var offset = 0;

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
        offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb < 3) {
        return lb;
    }

    var x = 0;
    var y;
    var d0;
    var d1;
    var d2;
    var d3;
    var dd;
    var dy;
    var ay;
    var bx0;
    var bx1;
    var bx2;
    var bx3;

    var vector = [];

    for (y = 0; y < la; y++) {
        vector.push(y + 1);
        vector.push(a.charCodeAt(offset + y));
    }

    var len = vector.length - 1;

    for (; x < lb - 3;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        bx1 = b.charCodeAt(offset + (d1 = x + 1));
        bx2 = b.charCodeAt(offset + (d2 = x + 2));
        bx3 = b.charCodeAt(offset + (d3 = x + 3));
        dd = (x += 4);
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            ay = vector[y + 1];
            d0 = _min(dy, d0, d1, bx0, ay);
            d1 = _min(d0, d1, d2, bx1, ay);
            d2 = _min(d1, d2, d3, bx2, ay);
            dd = _min(d2, d3, dd, bx3, ay);
            vector[y] = dd;
            d3 = d2;
            d2 = d1;
            d1 = d0;
            d0 = dy;
        }
    }

    for (; x < lb;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        dd = ++x;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
            d0 = dy;
        }
    }

    return dd;
}

function similarity(str1, str2) {
    let distance = levenshtein(str1, str2)
    let comparedStringLength = str1.length
    return (comparedStringLength - distance)/comparedStringLength
}

function isSimilar(str1, str2, succesPercentage) {
    let distance = levenshtein(str1, str2)
    let comparedStringLength = str1.length
    let resultPercentage = (comparedStringLength - distance)/comparedStringLength
    
    if (resultPercentage < 0) {
        return false
    } else {
        return resultPercentage >= succesPercentage
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

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
/// @}

class AutoFillPanel {
    constructor() {
        this.xnrDone = undefined

        // private properties
        this._completedServicesData = []
        this._completedServicesList = undefined
        this._storageName = "guafStoredData"
        this._panel = this._buildSidePanel()

        // setup requests
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
        ])
    }

    get panelElement() {
        return this._panel
    }

    onload() {
        chrome.storage.local.get(this._storageName, (data) => {
            if(data && data[this._storageName]) {
                //let storedData = data[this._storageName]
                this._updateCompletedServices(data[this._storageName])
            }
        })
    }

    unload() {
        let data = {}
        data[this._storageName] = this._completedServicesData
        chrome.storage.local.set(data, function() {
            console.log("object stored")
        })
    }

    _fillCompletedWork(completedWork) {
        this._fillServicesTable("#efHcsprfFrForm table.table.table-entity", completedWork.services)

        /*this._fillDropdownField("#s2id_region > .select2-choice", completedWork.area, this._xhrOnRegionChanged)
        .then(() => {
            console.log("region chosen")
            return this._fillDropdownField("#s2id_city > .select2-choice", completedWork.city, this._xhrOnCityChanged)
        })
        .then(() => {
            console.log("city chosen")
            return this._fillDropdownField("#s2id_street > .select2-choice", completedWork.street, this._xhrOnStreetChanged)
        })
        .then(() => {
            console.log("street chosen")
            return this._fillDropdownField('label[for="house"]+div > div.select2-container > .select2-choice', completedWork.house, this._xhrOnHouseChanged)
        })
        .then(() => {
            console.log("house chosen")
        })*/
    }

    _fillServicesTable(selector, services) {
        let servicesTable = document.querySelectorAll(selector)[0]
        let sercicesRows = servicesTable.querySelectorAll('tbody.scrollable-grid__body tr > td.scrollable-grid__col_fixed')
        for (let service of services) {
            // search service in item list
            for (let item of sercicesRows) {
                if (!isSimilar(item.innerText, service.name, 0.58))
                    continue
                
                let inputs = item.nextElementSibling.querySelectorAll('input.form-control')
                inputs[2].value = service.count
                inputs[2].dispatchEvent(new Event("input"))
                inputs[3].value = service.cost
                inputs[3].dispatchEvent(new Event("input"))
            }
        }
    }

    async _selectDropdownElementAsync(selector, dataToSearch, requestsOnChange, requestsOnSelect) {
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

        // select element
        let dropdownMenu = document.querySelectorAll(selector)[0]
        let parentContainer = dropdownMenu.parentElement
        // wait till container locked
        while(parentContainer.classList.contains("select2-container-disabled")) {
            await sleep(1)
        }
        dropdownMenu.dispatchEvent(new Event("mousedown"))

        // set current callback for xnr
        this._setXnrDone(requestsOnChange)

        // insert data
        let searchInput = document.activeElement
        searchInput.value = dataToSearch
        searchInput.dispatchEvent(new Event("input"))
        await Promise.all(onChangePromises)

        // select data
        await sleep(1)
        this._resetXnrDone(requestsOnSelect)
        searchInput.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 13}))
        await Promise.all(onSelectPromises)
        this._resetXnrDone()
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
        hideBtnImage.src = chrome.runtime.getURL("images/arrow.png")
        hideBtn.appendChild(hideBtnImage)
        sidePanel.appendChild(hideBtn)
        // - remove all button
        let removeAllBtn = document.createElement('div')
        removeAllBtn.classList.add("guaf-sidepanel--btn")
        removeAllBtn.setAttribute("title", "Удалить все записи")
        let removeAllBtnImage = document.createElement('img')
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
        addFilesBtnImage.src = chrome.runtime.getURL("images/plus.png")
        addFilesBtn.appendChild(addFilesBtnImage)
        addFilesBtn.addEventListener("click", () => {

        })
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
            if (!this._isValidForm(completedServiceObject))
                return
                
            this._fillCompletedWork(completedServiceObject)
            completedServiceObject.used = true
            listItem.classList.add("used")
        })
        listItem.appendChild(listItemName)

        // remove button
        let listItemRemoveBtn = document.createElement('span')
        listItemRemoveBtn.classList.add("guaf-completed-services--item--remove-btn")
        let image = document.createElement('img')
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

    _setXnrDone(requestsMap) {
        this.xnrDone = function(url) {
            let aElement = document.createElement('a')
            aElement.href = url

            if (requestsMap.has(aElement.pathname)) {
                requestsMap.get(aElement.pathname)()
                //requestsMap.set(aElement.pathname,true)
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

    _isRequestsComplete(requestsMap) {
        for(let value of requestsMap.values()) {
            if (value === true)
                continue
            
            return false
        }

        return true
    }

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

    // forms search
    _searchFormStreet() {
        let target = null
        let streetChosen = document.getElementById("s2id_street")
        if(!streetChosen)
            return target

        target = streetChosen.querySelectorAll("a.select2-choice > .select2-chosen")[0]
        return target
    }

    _searchFormHouse() {
        return this._searchFormByLabelText("номер здания")
    }

    _searchFormPeriod() {
        return this._searchFormByLabelText("период")
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
}

function main() {
    var autoFillPanel = new AutoFillPanel()
    autoFillPanel.onload()
    document.body.appendChild(autoFillPanel.panelElement)

    // subscriptions
    window.addEventListener('load', loadEvent => {
        let window = loadEvent.currentTarget
        window.addEventListener("angularjs_xhr_done", function(e) {
            if (e.detail.status !== 200)
                return

            console.log(e.detail.url)
            if (autoFillPanel.xnrDone != null) {
                autoFillPanel.xnrDone(e.detail.url)
            }
        })
    
        embed(runEmbedded)
    })

    window.addEventListener('beforeunload', function(e) {
        autoFillPanel.unload()
    })
}

main()