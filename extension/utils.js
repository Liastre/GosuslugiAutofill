/// @base types extension
/// @{
String.prototype.toCharArray = function() {
    return this.split('')
}

Array.prototype.toString = function() {
    return this.join('')
}
/// @}

export class LocalStorage {
    static get(storageName, completionCallback) {
        // @ts-ignore
        chrome.storage.local.get(storageName, (data)=>{
            if(data && data[storageName]) {
                completionCallback(data[storageName])
            } else {
                return null
            }
        })
    }

    static set(storageName, data, completionCallback) {
        let resData = {}
        resData[storageName] = data
        // @ts-ignore
        chrome.storage.local.set(resData, completionCallback)
    }
}

export class Utils {
    static embed(fn) {
        const script = document.createElement("script")
        script.text = `(${fn.toString()})();`
        document.documentElement.appendChild(script)
    }
    
    static similarity(str1, str2) {
        let distance = this._levenshtein(str1, str2)
        let comparedStringLength = str1.length
        return (comparedStringLength - distance)/comparedStringLength
    }
    
    static isSimilar(str1, str2, succesPercentage) {
        let distance = this._levenshtein(str1, str2)
        let comparedStringLength = str1.length
        let resultPercentage = (comparedStringLength - distance)/comparedStringLength
        
        if (resultPercentage < 0) {
            return false
        } else {
            return resultPercentage >= succesPercentage
        }
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    static async waitWhile(state, ms, timeout) {
        while (!state){
            await sleep(ms);
       }
    }

    static _min(d0, d1, d2, bx, ay) {
        return d0 < d1 || d2 < d1
            ? d0 > d2
                ? d2 + 1
                : d0 + 1
            : bx === ay
                ? d1
                : d1 + 1;
    }
    
    static _levenshtein(a, b) {
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
                d0 = this._min(dy, d0, d1, bx0, ay);
                d1 = this._min(d0, d1, d2, bx1, ay);
                d2 = this._min(d1, d2, d3, bx2, ay);
                dd = this._min(d2, d3, dd, bx3, ay);
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
                vector[y] = dd = this._min(dy, d0, dd, bx0, vector[y + 1]);
                d0 = dy;
            }
        }
    
        return dd;
    }
}