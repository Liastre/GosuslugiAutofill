import { LocalStorage } from "./utils.js"

let instance = null;

export default class Settings {
    static get EVENT() {
        return "guaf_settings_updated"
    }

    static get STORAGE() {
        return "guafSettings"
    }

    static async getInstance() {
        if (instance)
            return instance

        let storagePromise = new Promise(resolve => {
            LocalStorage.get(Settings.STORAGE, (data) => {
                instance = new Settings(data)
                resolve()
            })
        })

        await storagePromise
        return instance
    }

    constructor(data) {
        if (!data)
            return

        this._settings = data

        window.addEventListener('beforeunload', (e) => {
            autoFillPanel.unload()
        })
    }

    set autofillSearch(autofillSearch) {
        this._settings.autofillSearch = autofillSearch
        LocalStorage.set(Settings.STORAGE, this._settings)
        this._updateSettingsEvent()
    }

    get autofillSearch() {
        let autofillSearch = this._settings.autofillSearch;
        return (autofillSearch != null) ? autofillSearch : false;
    }

    // private
    _updateSettingsEvent() {
        chrome.tabs.query({ 'active': true,'currentWindow':true }, (tab) => {
            chrome.tabs.sendMessage(tab[0].id, { action: Settings.EVENT, settings: this._settings})
        })
    }
}
