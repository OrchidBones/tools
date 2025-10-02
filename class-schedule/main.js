Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
};

Date.prototype.clone = function() {
    return new Date(this.getTime());
};

Number.prototype.isBetween = function(num1, num2) {
    if(num1!==undefined&&num2!==undefined) {
        let n1 = num1, n2 = num2;
        if(num1>num2) {
            n1 = num2;
            n2 = num1;
        }
        return this >= n1 && this <= n2;
    }
};

$(document).ready(()=>{

    $.getJSON('settings.json', (settings)=>{

        class Common {
            constructor() {
                this._startDate = new Date(settings.semester_start_date);
                this._timetable = [{start: {h: 0,  m: 0}, end: {h: 0,  m: 0}}].concat(settings.timetable);
            }
            timetable() {
                return this._timetable;
            }
            getCurrentWeekNumber() {
                return this.getWeekNumberByDate(new Date());
            }
            getCertainDay(date) {
                return date.getDay() === 0 ? 7 : date.getDay();
            }
            getWeekNumberByDate(date) {
                const curDate = date;
                const startDate = this._startDate;
                const curStamp = curDate.getTime();
                const startStamp = startDate.getTime();
                const timeDif = curStamp - startStamp;
                const dayDif = Math.floor(timeDif / (1000 * 60 * 60 * 24));
                return Math.ceil(dayDif / 7);
            }
            convertWeekDayChar(wd) {
                const arr = [null].concat(settings.terms.weekday_suffix_texts);
                return settings.terms.weekday_prefix_text+arr[wd];
            }
            convertClassStartTimeChar(timeIndex) {
                const start = this._timetable[timeIndex].start;
                const temp_str = settings.terms.time_format;
                return temp_str.replace('hh', start.h).replace('mm', start.m);
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
            applyLayoutSettings() {
                this.applySettingsForTitle();
                this.applySettingsForAlerts();
                this.applySettingsForInput();
                this.applySettingsForTips();
                this.applySettingsForOutputAreaTitle();
                this.applySettingsForTable();
            }
            applySettingsForTitle() {
                $('h1 strong').html(settings.terms.class_schedule_title_text);
            }
            applySettingsForAlerts() {
                $('.week-auto-detection .week-detection-text').html(settings.terms.alert_weeknumber_detection_text.replace('${weeknumber}', '<span class="week-n"></span>'));
                $('.week-auto-detection').addClass('alert-'+settings.layout.alert.weeknumber_bootstrap_theme);
            }
            applySettingsForInput() {
                $('form span.input-group-text').html(settings.terms.weeknumber_customization_text);
            }
            applySettingsForTips() {
                $('.next-tip .next-text').html(settings.terms.next_class_text);
                $('.current-tip .current-text').html(settings.terms.current_class_text);
            }
            applySettingsForOutputAreaTitle() {
                $('.output-area .class-schedule-general-text').html(settings.terms.class_schedule_output_area_title_text);
                $('.whole-schedule h5 .weeknumber-ordinal-numeral-text').html(settings.terms.weekday_ordinal_numeral_text.replace('${weeknumber}', '<span class="week-number"></span>'));
            }
            applySettingsForTable() {
                const currentColor = settings.layout.tableitem_mark.current_class_color;
                const nextColor = settings.layout.tableitem_mark.next_class_color;
                const borderOpacity = settings.layout.tableitem_mark.special_class_border_opacity_100;
                const backgroundOpacity = settings.layout.tableitem_mark.special_class_background_opacity_100;
                const diff = borderOpacity - backgroundOpacity;
                $('.next-block').css({
                    "background-color": this.convertCssColorText(nextColor, borderOpacity),
                    "border-color": this.convertCssColorText(nextColor, Math.min(borderOpacity+diff, 100))
                });
                $('.current-block').css({
                    "background-color": this.convertCssColorText(currentColor, borderOpacity),
                    "border-color": this.convertCssColorText(currentColor, Math.min(borderOpacity+diff, 100))
                });
            }
        };
        
        class Course {
            constructor(object, day, time, classroom, takingType) {
                this._data = object;
                this._day = day;
                this._time = time;
                this._classroom = classroom;
                this._takingType = takingType;
            }
            object() {
                return this._data;
            }
            name() {
                return this.object().name;
            }
            type() {
                return this.object().type;
            }
            teacher() {
                return this.object().teacher;
            }
            startTime() {
                return this.object().startTime;
            }
            endTime() {
                return this.object().endTime;
            }
            timetable() {
                return this.object().timetable;
            }
            day() {
                return this._day;
            }
            time() {
                return this._time;
            }
            classroom() {
                return this._classroom;
            }
            takingType() {
                return this._takingType;
            }
            classtakingType() {
                return this.takingType();
            }
        };

        class ClassSchedule {
            constructor(data) {
                this._source = data;
                this._weekNumber = $Utils.getCurrentWeekNumber();
                this._maxWeekNumber = settings.max_week_number;
                this._currentClass = null;
                this._nextClass = null;
                this._isTodayOffClass = false;
                this._schedule = null;
                this.refreshCurrentDateObject();
                this.refreshSchedule();
            }
            setWeekNumber(wn) {
                this._weekNumber = wn;
            }
            weekNumber() {
                return this._weekNumber;
            }
            isWeekNumberValid(wn) {
                return typeof(wn)==='number' && wn > 0 && wn <= this._maxWeekNumber;
            }
            isClassAvailable(c, wn) { // c: object from json
                return c && wn >= c.startTime && wn <= c.endTime;
            }
            isClassOn(c, wn) { // c: object from json
                return this.isClassAvailable(c, wn) && (c.ctt===0 || wn%2===1&&c.ctt===1 || wn%2===0&&c.ctt===2);
            }
            isClassTaken(timeIndex, day) {
                const date = this._currentDate;
                const time = $Utils.timetable()[timeIndex];
                const curDay = this.getRealCurrentDay();
                const nwn = $Utils.getWeekNumberByDate(date);
                const wn = this._weekNumber;
                if(wn > nwn) return false;
                return nwn > wn || (curDay > day || (curDay === day && (date.getHours()*60+date.getMinutes()) > (time.end.h*60+time.end.m)));
            }
            isCurrentClassTime(c) {
                return this._currentClass && this._currentClass === c;
            }
            isNextClassTime(c) {
                return this._nextClass && this._nextClass === c;
            }
            isWeekDaySpecialClassDay(day, wn) { // or isWeekDaySpecialClassDay(date)
                if(arguments.length < 2) {
                    return !!this.getSpecialClassDayByDt(day);
                }
                return !!this.getSpecialClassDayByWn(day, wn);
            }
            hasClass(day, wn) {
                const temp_schedule = this.assignSchedule(wn);
                const classes = temp_schedule[day];
                return !!classes.length;
            }
            formatClassParamString(sourceStr, course) {
                const result = Common.prototype.formatClassParamString.call(this, sourceStr, course);
                if(result.includes('${weeknumber}')) {
                    return result.replace('${weeknumber}', this._weekNumber);
                }
                return result;
            }
            getDateByWeekDay(day, wn) {
                const date = this._currentDate;
                const rwn = $Utils.getWeekNumberByDate(date);
                const cur_day = $Utils.getCertainDay(date);
                const diff = day - cur_day + (wn - rwn) * 7;
                const newDate = date.clone();
                newDate.setTime(newDate.getTime()+diff*(1000*60*60*24));
                return newDate;
            }
            getSpecialClassDayByWn(day, wn) {
                for(let i = 0; i < settings.special_class_days.length; i++){
                    const sc = settings.special_class_days[i];
                    if(typeof(sc)==="object"&&sc.ori_day===day&&sc.ori_week===wn) {
                        return sc;
                    }
                }
                return null;
            }
            getSpecialClassDayByDt(date) { // 
                for(let i = 0; i < settings.special_class_days.length; i++){
                    const sc = settings.special_class_days[i];
                    if(typeof(sc)==="object"&&sc.ori_date) {
                        const temp_date = new Date(sc.ori_date+' 00:00:00');
                        if(date.getTime()===temp_date.getTime()) {
                            return sc;
                        }
                    }
                }
                return null;
            }
            refreshCurrentDateObject() {
                this._currentDate = new Date();
            }
            refreshCurrentClass() {
                this._currentClass = null;
                const day = this.getRealCurrentDay();
                const schedule = this._schedule;
                const classList = schedule[day];
                const date = this._currentDate;
                const that = this;
                classList.forEach((c, i)=>{
                    if(c) {
                        const data = $Utils.timetable()[i];
                        if((date.getHours()*60+date.getMinutes()).isBetween((data.start.h*60+data.start.m), (data.end.h*60+data.end.m))) {
                            that._currentClass = c;
                        }
                    }
                });
                if(this._currentClass) {
                    const date = this._currentDate;
                    const nwn = $Utils.getWeekNumberByDate(date);
                    const wn = this._weekNumber;
                    if (wn>nwn||wn<nwn) {
                        this._currentClass = null;
                    }
                }
            }
            refreshNextClass() {
                this._nextClass = null;
                this._isTodayOffClass = false;
                const day = this.getRealCurrentDay();
                const schedule = this._schedule;
                const classList = schedule[day];
                const date = this._currentDate;
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const currentClass = this._currentClass;
                const duration = hours*60+minutes;
                const list = $Utils.timetable();
                if(!currentClass) {
                    const lastValidIndex = this.__findLastValidObjectIndex(classList);
                    const firstClassIndex = this.__findFirstValidObjectIndex(classList);
                    if(firstClassIndex>-1&&duration.isBetween(list[0].end.h*60+list[0].end.m, list[firstClassIndex].start.h*60+list[firstClassIndex].start.m)) {
                        // 今日第一节课前
                        if(classList[firstClassIndex]) {
                            this._nextClass = classList[firstClassIndex];
                        }
                    } else if(lastValidIndex===-1||(lastValidIndex>-1&&duration.isBetween(list[lastValidIndex].end.h*60+list[lastValidIndex].end.m, 24*60))) {
                        // 今日课程结束 / 今日无课
                        const tomorrowClassList = schedule[day+1];
                        if(tomorrowClassList) {
                            const firstClassIndexT = this.__findFirstValidObjectIndex(tomorrowClassList);
                            if(firstClassIndexT>-1 && tomorrowClassList[firstClassIndexT]) {
                                this._nextClass = tomorrowClassList[firstClassIndexT];
                            }
                        }
                        this._isTodayOffClass = true;
                    } else {
                        for(let i = 1; i < classList.length; i++) {
                            const prevData = list[i];
                            if(classList[i]) {
                                const nextIndex = this.__findNextValidObjectIndex(classList, i);
                                const nextData = list[nextIndex === -1 ? classList.length : nextIndex];
                                if(nextData && duration.isBetween(prevData.end.h*60+prevData.end.m, nextData.start.h*60+nextData.start.m)) {
                                    this._nextClass = classList[nextIndex];
                                }
                            }
                        }
                    }
                    if(this._nextClass) {
                        const date = this._currentDate;
                        const nwn = $Utils.getWeekNumberByDate(date);
                        const wn = this._weekNumber;
                        if (wn>nwn||wn<nwn) {
                            this._nextClass = null;
                        }
                    }
                }
            }
            __findNextValidObjectIndex(array, index) {
                for(let i = index+1; i < array.length; i++) {
                    if(!!array[i]) return i;
                }
                return -1;
            }
            __findFirstValidObjectIndex(array) {
                let index = -1;
                for(let i = 0; i < array.length; i++) {
                    if(!!array[i]) {
                        index = i;
                        break;
                    }
                }
                return index;
            }
            __findLastValidObjectIndex(array) {
                let index = -1;
                for(let i = 0; i < array.length; i++) {
                    if(!!array[i]) index = i;
                }
                return index;
            }
            getAllClasses() {
                const names = [];
                this._source.forEach((c)=>{
                    names.push(c.name());
                });
                return names;
            }
            getRealCurrentDay() {
                return $Utils.getCertainDay(this._currentDate);
            }
            getClassTimetable(course) {
                const timetable = {num: 0, classroom: [], day: [], time: [], ctt: []};
                course.timetable.forEach((tt)=>{
                    timetable.classroom.push(tt.classroom);
                    timetable.num++;
                    timetable.day.push(tt.day);
                    timetable.time.push(tt.time);
                    timetable.ctt.push(this.convertClassTakingType_private(tt.classtakingType));   // classtakingType
                });
                return timetable;
            }
            getEmptySchedule() {
                const data = [null];
                for(let i = 0; i < 7; i++) {
                    const dayData = [null, null, null, null, null, null, null]; // dayData[0] should not be used in generating HTML
                    data.push(dayData);
                }
                return data;
            }
            assignSchedule(wn) {
                const schedule = this.getEmptySchedule();
                this._source.forEach((c)=>{
                    if(this.isClassAvailable(c, wn)) {
                        const timetable = this.getClassTimetable(c);
                        for(let i = 1; i <= timetable.num; i++) {
                            const day = timetable.day[i-1];
                            const time = timetable.time[i-1];
                            const classroom = timetable.classroom[i-1];
                            const ctt = timetable.ctt[i-1];
                            const cc = c.clone()
                            cc.ctt = ctt;   // classtakingType
                            cc.classroom = classroom;
                            if(this.isClassOn(cc, wn)) {
                                schedule[day][time] = new Course(cc, day, time, classroom, ctt);
                            }
                        }
                    }
                });
                return schedule;
            }
            rearrangeSchedule(wn) {
                this.rearrangeScheduleForSpecialClassDay(wn);
                this.rearrangeScheduleForHolidays(wn);
            }
            rearrangeScheduleForSpecialClassDay(wn) {
                const schedule = this._schedule;
                for(let i = 0; i <= 7; i++) {
                    const SpecialClassDay = this.getSpecialClassDayByWn(i, wn) || this.getSpecialClassDayByDt(new Date($Utils.convertYMDString_private(this.getDateByWeekDay(i, wn))));
                    if(!!SpecialClassDay) {
                        if(SpecialClassDay.tar_day) {
                            const tar_day = SpecialClassDay.tar_day;
                            const temp_schedule = this.assignSchedule(SpecialClassDay.tar_week);
                            const day = i;
                            for(let j = 1; j <= settings.max_classes_per_day; j++) {
                                const tar_class = temp_schedule[tar_day][j];
                                schedule[day][j] = tar_class;
                            }
                        } else if(SpecialClassDay.tar_date) {
                            const tar_date = new Date(SpecialClassDay.tar_date+' 00:00:00');
                            const tar_day = $Utils.getCertainDay(tar_date);
                            const nwn = $Utils.getWeekNumberByDate(tar_date);
                            const temp_schedule = this.assignSchedule(nwn);
                            const day = i;
                            for(let j = 1; j <= settings.max_classes_per_day; j++) {
                                const tar_class = temp_schedule[tar_day][j];
                                schedule[day][j] = tar_class;
                            }
                        }
                    }
                }
            }
            rearrangeScheduleForHolidays(wn) {
                const schedule = this._schedule;
                for(let i = 1; i <= 7; i++) {
                    const st = schedule[i];
                    if(this.isWeekDayHoliday(i, wn)) {
                        schedule[i] = st.map(course => null);
                    }
                }
            }
            isWeekDayHoliday(day, wn) {
                const day_date = this.getDateByWeekDay(day, wn);
                for(let h = 0; h < settings.holidays.length; h++) {
                    const holiday = settings.holidays[h];
                    const startDate = new Date(holiday.startDate+' 00:00:00');
                    const endDate = new Date(holiday.endDate+' 23:59:59');
                    if(day_date.getTime().isBetween(startDate.getTime(), endDate.getTime())) {
                        return true;
                    }
                }
                return false;
            }
            refreshSchedule() {
                const wn = this._weekNumber;
                this._schedule = this.assignSchedule(wn);
                this.rearrangeSchedule(wn);
            }
            makeWeeklyTableHeadHTML() {
                let html = '<thead><tr>';
                let suffix = '</tr></thead>'
                html += '<th>'+settings.terms.time_text+'</th>' + '<th>'+$Utils.convertWeekDayChar(1)+'</th>' + '<th>'+$Utils.convertWeekDayChar(2)+'</th>' + '<th>'+$Utils.convertWeekDayChar(3)+'</th>' + '<th>'+$Utils.convertWeekDayChar(4)+'</th>' + '<th>'+$Utils.convertWeekDayChar(5)+'</th>' + '<th>'+$Utils.convertWeekDayChar(6)+'</th>' + '<th>'+$Utils.convertWeekDayChar(7)+'</th>';
                html += suffix;
                return html;
            }
            makeWeeklyTableBodyHTML() {
                let html = '<tbody>';
                const suffix = '</tbody>';
                const schedule = this._schedule;
                for(let i = 1; i <= settings.max_classes_per_day; i++) {
                    let text1 = '<tr>';
                    const t = String(i*2-1) + '-' + String(i*2);
                    const tt = settings.terms.class_quantifier_text;
                    text1 += '<td>'+tt.replace('${classnumber}', t)+'</td>';
                    for(let j = 1; j <= 7; j++) {
                        const day = j;
                        const time = i;
                        const c = schedule[day][time];
                        let text2 = '';
                        if(c && this.isCurrentClassTime(c)) {
                            text2 += '<td id="class-'+day+'-'+time+'" class="curClass';
                        } else if(c && this.isNextClassTime(c)) {
                            text2 += '<td id="class-'+day+'-'+time+'" class="nextClass';
                        } else {
                            text2 += '<td id="class-'+day+'-'+time+'" class="';
                        }
                        if(this.isClassTaken(i, j)) {
                            text2 += ' class-taken';
                        }
                        text2 += '">';
                        if(c) {
                            text2 += this.makeTableItemText(c);
                        } else {
                            text2 += ' ';
                        }
                        text2 += '</td>';
                        text1 += text2;
                    }
                    text1 += '</tr>';
                    html += text1;
                }
                html += suffix;
                return html;
            }
            makeDailyTableHTML() {
                let html = '';
                const schedule = this._schedule;
                const wd = this.getRealCurrentDay();
                const nwd = Math.min(wd+1, 7);
                let daySche = schedule[wd];
                if(this._isTodayOffClass && this._nextClass) daySche = schedule[nwd];
                const d = this._isTodayOffClass && this._nextClass ? nwd : wd;
                for(let i = 1; i <= settings.max_classes_per_day; i++) {
                    let text = '<tr>';
                    const t = String(i*2-1) + '-' + String(i*2);
                    const tt = settings.terms.class_quantifier_text;
                    text += '<td>'+tt.replace('${classnumber}', t)+'</td>';
                    let text2 = '';
                    const c = daySche[i];
                    const day = wd;
                    const time = i;
                    if(c && this.isCurrentClassTime(c)) {
                        text2 += '<td id="class-'+day+'-'+time+'" class="curClass';
                    } else if(c && this.isNextClassTime(c)) {
                        text2 += '<td id="class-'+day+'-'+time+'" class="nextClass';
                    } else {
                        text2 += '<td id="class-'+day+'-'+time+'" class="';
                    }
                    if(this.isClassTaken(i, d)) {
                        text2 += ' class-taken';
                    }
                    text2 += '">';
                    text += text2;
                    if(c) {
                        text += this.makeTableItemText(c);
                    } else {
                        text += ' ';
                    }
                    text += '</td></tr>'
                    html += text;
                }
                html += '</tbody>';
                return html;
            }
            makeTableItemText(c) {
                let t = '';
                settings.class_table_item_template.forEach((raw)=>{
                    const raw1 = this.formatClassParamString(raw, c);
                    t += raw1 + '<br>';
                });
                return t;
            }
            generateWeeklyTableHTML() {
                let html = '';
                const prefix = '<table class="table table-bordered table-responsive">';
                const suffix = '</table>';
                html += prefix;
                html += this.makeWeeklyTableHeadHTML();
                html += this.makeWeeklyTableBodyHTML();
                html += suffix;
                return html;
            }
            generateDailyTableHTML() {
                let html = '';
                const prefix = '<table class="table table-bordered table-responsive">';
                const suffix = '</table>';
                html += prefix;
                html += this.makeDailyTableHTML();
                html += suffix;
                return html;
            }
            applyRefreshTableHTML() {
                this.refreshCurrentDateObject();
                this.refreshSchedule();
                this.refreshCurrentClass();
                this.refreshNextClass();
                this.applyTommorrowClassList();
                this.applyNextClassroomTip();
                this.appendTableElements();
                this.applyCssStylesAfterwards();
            }
            applyTommorrowClassList() {
                if(this.needsTommorowFirstClass()) {
                    const realDayNum = Math.min(this.getRealCurrentDay()+1, 7);
                    const realCurDay = $Utils.convertWeekDayChar(realDayNum);
                    const suffix = this.getSuffixForSpecialClassDay(realDayNum, this._weekNumber) || this.getSuffixForHoliday(realCurDay, this._weekNumber);
                    $('.today-schedule .time-tag').html(settings.terms.time_tag_tommorrow_text);
                    $('.today-schedule .week-day').html(realCurDay+suffix);
                } else {
                    const realDayNum = this.getRealCurrentDay();
                    const realCurDay = $Utils.convertWeekDayChar(realDayNum);
                    const suffix = this.getSuffixForSpecialClassDay(realDayNum, this._weekNumber) || this.getSuffixForHoliday(realDayNum, this._weekNumber);
                    $('.today-schedule .time-tag').html(settings.terms.time_tag_today_text);
                    $('.today-schedule .week-day').html(realCurDay+suffix);
                }
            }
            needsTommorowFirstClass() {
                return this._isTodayOffClass && this._nextClass;
            }
            applyNextClassroomTip() {
                if(this.needsNextClassroomTip()) {
                    const nextClass = this._nextClass;
                    const timeStr = $Utils.convertClassStartTimeChar(nextClass.time());
                    const classroom = nextClass.classroom();
                    $('.next-classroom-area').empty();
                    $('.next-classroom-area').append('<div class="next-classroom-detection alert alert-'+settings.layout.alert.next_classroom_bootstrap_theme+'"><i class="fa fa-arrow-right"></i> '+settings.terms.alert_next_classroom_detection_text.replace('${classroom}','<span class="next-classroom-text"><strong>'+classroom+'</strong></span>').replace('${time}', '<span class="next-classroom-time-text">'+timeStr+'</span>')+'</div>');
                }
            }
            needsNextClassroomTip() {
                return !this._isTodayOffClass && this._nextClass;
            }
            appendTableElements() {
                const html1 = this.generateDailyTableHTML();
                const html2 = this.generateWeeklyTableHTML();
                $('.whole-schedule span.week-number').html('<strong>'+this.weekNumber()+'</strong>');
                $('.today-schedule div.table-area').empty();
                $('.today-schedule div.table-area').append(html1);
                $('.whole-schedule div.table-area').empty();
                $('.whole-schedule div.table-area').append(html2);
            }
            applyCssStylesAfterwards() {
                const currentColor = settings.layout.tableitem_mark.current_class_color;
                const nextColor = settings.layout.tableitem_mark.next_class_color;
                const borderOpacity = settings.layout.tableitem_mark.special_class_border_opacity_100;
                const backgroundOpacity = settings.layout.tableitem_mark.special_class_background_opacity_100;
                $('td.curClass').css({
                    "border-color": $Utils.convertCssColorText(currentColor, borderOpacity),
                    "background-color": $Utils.convertCssColorText(currentColor, backgroundOpacity)
                });
                $('td.nextClass').css({
                    "border-color": $Utils.convertCssColorText(nextColor, borderOpacity),
                    "background-color": $Utils.convertCssColorText(nextColor, backgroundOpacity)
                });
            }
            getSuffixForSpecialClassDay(rdn, wn) {
                if(this.isWeekDaySpecialClassDay(rdn, wn)) {
                    return settings.terms.special_class_days_suffix_text;
                }
                return '';
            }
            getSuffixForHoliday(day, wn) {
                if(this.isWeekDayHoliday(day, wn)) {
                    return settings.terms.holidays_suffix_text;
                }
                return '';
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
        };

        window.$Utils = new Common();
        window.$ClassSchedule = null;
        $Utils.applyLayoutSettings();
        const weeknumber = $Utils.getCurrentWeekNumber();
        $('.week-auto-detection span.week-n').html('<strong>'+weeknumber+'</strong>');
        $.getJSON('data.json', (scheduleData)=>{
            const schedule = new ClassSchedule(scheduleData);
            schedule.applyRefreshTableHTML();
            $('#weeknumber').blur(()=>{
                const wn = +$('#weeknumber').val();
                if(!wn) {
                    schedule.setWeekNumber(weeknumber);
                    schedule.applyRefreshTableHTML();
                } else if(schedule.isWeekNumberValid(wn)) {
                    schedule.setWeekNumber(wn);
                    schedule.applyRefreshTableHTML();
                }
            });
            window.$ClassSchedule = schedule;
        });
    });
});