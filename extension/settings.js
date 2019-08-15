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
        if (!data) {
            // default initialization
            this._settings = {}
            this._settings.autofillSearch = false
            return
        }

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
        return this._settings.autofillSearch
    }

    // private
    _updateSettingsEvent() {
        chrome.tabs.query({ 'active': true,'currentWindow':true }, (tab) => {
            chrome.tabs.sendMessage(tab[0].id, { action: Settings.EVENT, settings: this._settings})
        })
    }
}
