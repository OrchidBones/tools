/**
 * FormatManager
 */

export default class FormatManager {
    constructor(settings) {
        this._universalSettings = settings;
    }
    regularFormat(string, key, value) { // strict
        const target = '${'+key+'}';
        return string.replace(target, value);
    }
    formatTimeNumString(timeText) {
        return this.padZero(timeText, 2);
    }
    formatClassParamString(sourceStr, course) {
        const re = /\${[a-zA-Z_]+}/gi;
        let t = sourceStr;
        let tta = t.match(re);
        if(tta) {
            for(const result of tta) {
                let tt = result;
                tt = tt.replace('${','').replace('}','');
                let finalText = tt;
                if(course) {
                    try {
                        finalText = eval('cource.'+tt+'()');
                    } catch(e1) {
                        try {
                            finalText = course.object()[tt];
                        } catch(e2) {
                            console.error(e2);
                        }
                    }
                }
                t = t.replace(result, finalText);
            }
        }
        return t;
    }
    padZero(number, length, isPadAfterText) {
        let string = String(number);
        while(string.length < length) {
            if(!isPadAfterText) {
                string = '0' + number;
            } else {
                string += '0';
            }
        }
        return string;
    }
}