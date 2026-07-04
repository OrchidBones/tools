/**
 * StringConvertor
 */

export default class StringConvertor {
    constructor(settings) {
        this._universalSettings = settings;
    }
    convertWeekDayChar(wd) {
        const arr = [null].concat(this._universalSettings.terms.weekday_suffix_texts);
        return this._universalSettings.terms.weekday_prefix_text+arr[wd];
    }
    convertClassStartTimeChar(timeIndex) {
        const start = $Global.timetable()[timeIndex].start;
        const temp_str = this._universalSettings.terms.time_format;
        return temp_str.replace('hh', $FormatManager.formatTimeNumString(start.h)).replace('mm', $FormatManager.formatTimeNumString(start.m));
    }
    convertYMDString_private(date) { // for comparison
        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' 00:00:00';
    }
    convertCssColorText(source, opacity) {
        if(source.includes('rgba')) { // rgba
            return source;
        } else if(source.includes('rgb')) { // rgb
            source = source.replace(')', '').replace(';', '');
            const realOpacity = opacity / 100;
            source += ', '+realOpacity+')';
            return source;
        } else if(source.includes('#')) { // hex color
            const realOpacityText = (opacity / 100 * 255).toString(16);
            return source+realOpacityText;
        } else { // bootstrap theme
            return 'rgba(var(--bs-'+source+'-rgb), .'+String(opacity)+')';
        }
    }
    convertClassTakingType_private(ctt) {
        switch(ctt) {
            case 0:
                return 0;
            case 1:
                return 1;
            case 2:
                return 2;
        }
        switch(String(ctt).toLowerCase()) {
            case 'every_week':
                return 0;
            case 'odd_week':
                return 1;
            case 'even_week':
                return 2;
            default:
                return 0;
        }
    }
}