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

    class Common {
        constructor() {
            this._startDate = new Date("2025-08-31");
            this._timetable = [
                {order: 0, start: {h: 0,  m: 0},  end: {h: 0, m: 0}},
                {order: 1, start: {h: 8,  m: 0},  end: {h: 9, m: 49}},
                {order: 2, start: {h: 10, m: 10}, end: {h: 11, m: 59}},
                {order: 3, start: {h: 14, m: 30}, end: {h: 16, m: 19}},
                {order: 4, start: {h: 16, m: 30}, end: {h: 18, m: 19}},
                {order: 5, start: {h: 19, m: 30}, end: {h: 21, m: 19}},
                {order: 6, start: {h: 21, m: 30}, end: {h: 23, m: 19}}
            ]
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
            return new Date().getDay();
        }
        getCurrentHours() {
            return new Date().getHours();
        }
        getCurrentMinutes() {
            return new Date().getMinutes();
        }
        convertWeekDayChar(wd) {
            const arr = ['日','一','二','三','四','五','六'];
            return '星期'+arr[wd];
        }
    };

    class ClassSchedule {
        constructor(data) {
            this._source = data;
            this._weekNumber = $Utils.getCurrentWeekNumber();
            this._maxWeekNumber = 20;
            this._currentClass = null;
            this._nextClass = null;
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
        isWeekNumberValid() {
            const wn = this._weekNumber;
            return typeof(wn)==='number' && wn > 0 && wn <= this._maxWeekNumber;
        }
        isClassAvailable(c) {
            const wn = this._weekNumber;
            return c && wn >= c.startTime && wn <= c.endTime;
        }
        isClassOn(c) {
            const wn = this._weekNumber;
            return this.isClassAvailable(c) && (c.ctt===0 || wn%2===1&&c.ctt===1 || wn%2===0&&c.ctt===2);
        }
        isCurrentClassTime(c) {
            return this._currentClass && this._currentClass === c;
        }
        isNextClassTime(c) {
            return this._nextClass && this._nextClass === c;
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
                if(c && this.isClassOn(c)) {
                    const data = $Utils.timetable()[i];
                    if((date.getHours()*60+date.getMinutes()).isBetween((data.start.h*60+data.start.m), (data.end.h*60+data.end.m))) {
                        that._currentClass = c;
                    }
                }
            });
        }
        refreshNextClass() {
            this._nextClass = null;
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
                    if(classList[1]) {
                        this._nextClass = classList[1];
                    }
                } else if(duration>(list[lastValidIndex].end.h*60+list[lastValidIndex].end.m)&&duration<(24*60)) {
                    const tomorrowClassList = schedule[day+1];
                    if(tomorrowClassList && tomorrowClassList[1]) {
                        this._nextClass = tomorrowClassList[1];
                    }
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
                names.push(c.name);
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
                timetable.ctt.push(tt.classtakingType);
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
        assignSchedule() {
            const schedule = this.getEmptySchedule();
            this._source.forEach((c)=>{
                if(this.isClassAvailable(c)) {
                    const timetable = this.getClassTimetable(c);
                    for(let i = 1; i <= timetable.num; i++) {
                        const cc = c.clone();
                        cc.classroom = timetable.classroom[i-1];
                        cc.ctt = timetable.ctt[i-1];
                        if(this.isClassOn(cc)) {
                            schedule[timetable.day[i-1]][timetable.time[i-1]] = cc;
                        }
                    }
                }
            });
            return schedule;
        }
        refreshSchedule() {
            this._schedule = this.assignSchedule();
        }
        makeWeeklyTableHeadHTML() {
            let html = '<thead><tr>';
            let suffix = '</tr></thead>'
            html += '<th>时间</th>' + '<th>星期一</th>' + '<th>星期二</th>' + '<th>星期三</th>' + '<th>星期四</th>' + '<th>星期五</th>' + '<th>星期六</th>' + '<th>星期日</th>';
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
                text1 += '<td>'+t+'节</td>'
                for(let j = 1; j <= 7; j++) {
                    const day = j;
                    const time = i;
                    const c = schedule[day][time];
                    let text2 = '<td class="class-'+day+'-'+time+'">';
                    if(c && this.isCurrentClassTime(c)) {
                        text2 = '<td class="class-'+day+'-'+time+' curClass">'
                    } else if(c && this.isNextClassTime(c)) {
                        text2 = '<td class="class-'+day+'-'+time+' nextClass">'
                    }
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
            t += '<b>' + c.name + '</b> ['+c.type+']' + '<br>';
            t += c.teacher + '<br>';
            t += c.classroom;
            return t;
        }
        makeDailyTableHTML() {
            let html = '';
            const schedule = this._schedule;
            const wd = this.getRealCurrentDay();
            const daySche = schedule[wd];
            for(let i = 1; i <= 6; i++) {
                let text = '<tr>';
                const t = String(i*2-1) + '-' + String(i*2);
                text += '<td>'+t+'节</td>'
                let text2 = '<td>'
                const c = daySche[i];
                const day = wd;
                const time = i;
                if(c && this.isCurrentClassTime(c)) {
                    text2 = '<td class="class-'+day+'-'+time+' curClass">'
                } else if(c && this.isNextClassTime(c)) {
                    text2 = '<td class="class-'+day+'-'+time+' nextClass">'
                }
                text += text2;
                if(c && this.isClassOn(c)) {
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
            $('.today-schedule span').text($Utils.convertWeekDayChar(this.getRealCurrentDay()));
            $('.whole-schedule span').text(this.weekNumber());
            this.refreshCurrentDateObject();
            this.refreshSchedule();
            this.refreshCurrentClass();
            this.refreshNextClass();
            const html1 = this.generateDailyTableHTML();
            const html2 = this.generateWeeklyTableHTML();
            $('.today-schedule div.table-area').empty();
            $('.today-schedule div.table-area').append(html1);
            $('.whole-schedule div.table-area').empty();
            $('.whole-schedule div.table-area').append(html2);
        }
    };

    const $Utils = new Common();

    const weeknumber = $Utils.getCurrentWeekNumber();
    $('.week-auto-detection span').html('<strong>'+weeknumber+'</strong>');

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
    });

});
