import { LocalStorage } from "./utils.js"

export class Settings {
    static get EVENT() {
        return "guaf_settings_updated"
    }

    constructor() {
        this._storageName = "guafSettings"
        this._settings = {}

        window.addEventListener('beforeunload', (e) => {
            autoFillPanel.unload()
        })
        LocalStorage.get(this._storageName, (data) => {
            if (!data)
                return

            this._settings = data
        })
    }

    set autofillSearch(autofillSearch) {
        this._settings.autofillSearch = autofillSearch
        LocalStorage.set(this._storageName, this._settings)
        this._updateSettingsEvent()
    }

    // private
    _updateSettingsEvent() {
        chrome.tabs.query({ 'active': true,'currentWindow':true }, function(tab){
            chrome.tabs.sendMessage(tab[0].id, { action: Settings.EVENT })
        })
    }
}