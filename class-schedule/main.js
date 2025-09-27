Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
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
                this._timetable = settings.timetable;
            }
            timetable() {
                return this._timetable;
            }
            getCurrentWeekNumber() {
                const curDate = new Date();
                const startDate = this._startDate;
                const curStamp = curDate.getTime();
                const startStamp = startDate.getTime();
                const timeDif = curStamp - startStamp;
                const dayDif = Math.floor(timeDif / (1000 * 60 * 60 * 24));
                return Math.ceil(dayDif / 7);
            }
            getCurrentDay() {
                const date = new Date();
                return date.getDay() === 0 ? 7 : date.getDay();
            }
            getCurrentHours() {
                return new Date().getHours();
            }
            getCurrentMinutes() {
                return new Date().getMinutes();
            }
            convertWeekDayChar(wd) {
                const arr = [null].concat(settings.terms.weekday_suffix_texts);
                return settings.terms.weekday_prefix_text+arr[wd];
            }
            applyLayoutSettings() {
                this.applySettingsForTitle();
                this.applySettingsForAlerts();
                this.applySettingsForInput();
                this.applySettingsForTips();
                this.applySettingsForOutputAreaTitle();
            }
            applySettingsForTitle() {
                $('h1 strong').html(settings.terms.class_schedule_title_text);
            }
            applySettingsForAlerts() {
                $('.week-auto-detection .week-detection-text').html(settings.terms.alert_weeknumber_detection_text.replace('${weeknumber}', '<span class="week-n"></span>'));
                $('.week-auto-detection').addClass('alert-'+settings.layout.alerts.weeknumber_bootstrap_theme);
                // settings.layout.alerts.next_classroom_bootstrap_theme 在生成时自动应用
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
            isClassTaken(index, dayIndex) {
                const date = this._currentDate;
                const time = $Utils.timetable()[index];
                const curDay = this.getRealCurrentDay();
                return curDay > dayIndex || (curDay === dayIndex && (date.getHours()*60+date.getMinutes()) > (time.end.h*60+time.end.m));
            }
            isCurrentClassTime(c) {
                return this._currentClass && this._currentClass === c;
            }
            isNextClassTime(c) {
                return this._nextClass && this._nextClass === c;
            }
            isDayDaysOff(day, wn) { // 是否调休
                return !!this.getDayDaysOffData(day, wn);
            }
            hasClass(day, wn) {
                const temp_schedule = this.assignSchedule(wn);
                const classes = temp_schedule[day];
                return !!classes.length;
            }
            getDayDaysOffData(day, wn) {
                for(let i = 0; i < settings.daysOff.length; i++){
                    const sc = settings.daysOff[i];
                    if(typeof(sc)==="object"&&sc.ori_day===day&&sc.ori_week===wn) {
                        return sc;
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
                    if(duration>(list[0].end.h*60+list[0].end.m)&&duration<((list[1].start.h*60+list[1].start.m))) {
                        // 今日第一节课前
                        if(classList[1]) {
                            this._nextClass = classList[1];
                        }
                    } else if(lastValidIndex===-1||(lastValidIndex>-1&&(duration>(list[lastValidIndex].end.h*60+list[lastValidIndex].end.m))&&(duration<(24*60)))) {
                        // 今日课程结束 / 今日无课
                        const tomorrowClassList = schedule[day+1];
                        if(tomorrowClassList && tomorrowClassList[1]) {
                            this._nextClass = tomorrowClassList[1];
                        }
                        this._isTodayOffClass = true;
                    } else {
                        for(let i = 1; i < classList.length; i++) {
                            const prevData = list[i];
                            if(classList[i]) {
                                const nextIndex = this.__findNextValidObjectIndex(classList, i);
                                const nextData = list[nextIndex === -1 ? classList.length : nextIndex];
                                if(nextData && (duration>(prevData.end.h*60+prevData.end.m) && (duration<(nextData.start.h*60+nextData.start.m)))) {
                                    this._nextClass = classList[nextIndex];
                                }
                            }
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
                const date = this._currentDate;
                return date.getDay() === 0 ? 7 : date.getDay();
            }
            getClassTimetable(course) {
                const timetable = {num: 0, classroom: [], day: [], time: [], ctt: []};
                course.timetable.forEach((tt)=>{
                    timetable.classroom.push(tt.classroom);
                    timetable.num++;
                    timetable.day.push(tt.day);
                    timetable.time.push(tt.time);
                    timetable.ctt.push(tt.classtakingType);   // classtakingType
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
                this.rearrangeScheduleForDaysOff(wn);
            }
            rearrangeScheduleForDaysOff(wn) {
                const schedule = this._schedule;
                for(let i = 0; i <= 7; i++) {
                    const dayDaysOff = this.getDayDaysOffData(i, wn);
                    if(!!dayDaysOff) {
                        const tar_day = dayDaysOff.tar_day;
                        const temp_schedule = this.assignSchedule(dayDaysOff.tar_week);
                        const day = i;
                        for(let j = 1; j <= schedule.length; j++) {
                            const tar_class = temp_schedule[tar_day][j];
                            schedule[day][j] = tar_class;
                        }
                    }
                }
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
                for(let i = 1; i <= 6; i++) {
                    let text1 = '<tr>';
                    const t = String(i*2-1) + '-' + String(i*2);
                    text1 += '<td>'+t+settings.terms.class_quantifier_text+'</td>'
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
            makeTableItemText(c) {
                let t = '';
                const re = /\${[a-z_]+}/g;
                const parse_depth = settings.class_table_item_template.config.parse_depth;
                settings.class_table_item_template.content.forEach((raw)=>{
                    let raw1 = raw;
                    let raw2 = raw;
                    if(typeof(raw)==='string') {
                        for(let i = 0; i < parse_depth; i++) {
                            let tta = re.exec(raw2);
                            if(tta) {
                                let tt = tta[0];
                                let o_tt = tt;
                                tt = tt.replace('${','').replace('}','');
                                let finalText = tt;
                                try {
                                    finalText = eval('c.'+tt+'()');
                                } catch(e1) {
                                    try {
                                        finalText = c.object()[tt];
                                    } catch(e2) {
                                        console.error(e2);
                                    }
                                }
                                raw1 = raw1.replace(o_tt, finalText);
                                raw2 = raw2.replace(o_tt, '');
                            } else {
                                continue;
                            }
                        }
                        t += raw1 + '<br>';
                    }
                });
                return t;
            }
            makeDailyTableHTML() {
                let html = '';
                const schedule = this._schedule;
                const wd = this.getRealCurrentDay();
                const nwd = Math.min(wd+1, 7);
                let daySche = schedule[wd];
                if(this._isTodayOffClass && this._nextClass) daySche = schedule[nwd];
                const d = this._isTodayOffClass && this._nextClass ? nwd : wd;
                const wn = this._weekNumber;
                for(let i = 1; i <= 6; i++) {
                    let text = '<tr>';
                    const t = String(i*2-1) + '-' + String(i*2);
                    text += '<td>'+t+settings.terms.class_quantifier_text+'</td>'
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
                if(!this._isTodayOffClass && this._nextClass) {
                    const classroom = this._nextClass.classroom();
                    $('.next-classroom-area').empty();
                    $('.next-classroom-area').append('<div class="next-classroom-detection alert alert-'+settings.layout.alerts.next_classroom_bootstrap_theme+'"><i class="fa fa-arrow-right"></i> '+settings.terms.alert_next_classroom_detection_text.replace('${classroom}','<span class="next-classroom-text"><strong>'+classroom+'</strong></span>')+'</div>');
                }
                const html1 = this.generateDailyTableHTML();
                const html2 = this.generateWeeklyTableHTML();
                $('.whole-schedule span.week-number').html('<strong>'+this.weekNumber()+'</strong>');
                $('.today-schedule div.table-area').empty();
                $('.today-schedule div.table-area').append(html1);
                $('.whole-schedule div.table-area').empty();
                $('.whole-schedule div.table-area').append(html2);
            }
            applyTommorrowClassList() {
                if(this.needsTommorowFirstClass()) {
                    const realDayNum = Math.min(this.getRealCurrentDay()+1, 7);
                    const realCurDay = $Utils.convertWeekDayChar(realDayNum);
                    const suffix = this.getSuffixForDaysOff(realDayNum, this._weekNumber);
                    $('.today-schedule .time-tag').html(settings.terms.time_tag_tommorrow_text);
                    $('.today-schedule .week-day').html(realCurDay+suffix);
                } else {
                    const realDayNum = this.getRealCurrentDay();
                    const realCurDay = $Utils.convertWeekDayChar(realDayNum);
                    const suffix = this.getSuffixForDaysOff(realDayNum, this._weekNumber);
                    $('.today-schedule .time-tag').html(settings.terms.time_tag_today_text);
                    $('.today-schedule .week-day').html(realCurDay+suffix);
                }
            }
            needsTommorowFirstClass() {
                return this._isTodayOffClass && this._nextClass;
            }
            getSuffixForDaysOff(rdn, wn) {
                if(this.isDayDaysOff(rdn, wn)) {
                    return settings.terms.days_off_suffix_text;
                }
                return '';
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
                    schedule.setWeekNumber($Utils.getCurrentWeekNumber());
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