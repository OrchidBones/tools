Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
};

$(document).ready(()=>{

    class Common {
        constructor() {
            this._startDate = new Date("2025-08-31");
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
            this._schedule = null;
            this.refreshSchedule();
        }
        setWeekNumber(wn) {
            this._weekNumber = wn;
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
        getAllClasses() {
            const names = [];
            this._source.forEach((c)=>{
                names.push(c.name);
            });
            return names;
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
                        schedule[timetable.day[i-1]][timetable.time[i-1]] = cc;
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
                    let text2 = '<td>'
                    const c = schedule[j][i];
                    if(c && this.isClassOn(c)) {
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
            const wd = $Utils.getCurrentDay() === 0 ? 7 : $Utils.getCurrentDay();
            const daySche = schedule[wd];
            for(let i = 1; i <= 6; i++) {
                let text = '<tr>';
                const t = String(i*2-1) + '-' + String(i*2);
                text += '<td>'+t+'节</td>'
                text += '<td>';
                const c = daySche[i];
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
            console.log(html)
            return html;
        }
    };

    const $Utils = new Common();

    const weeknumber = $Utils.getCurrentWeekNumber();
    $('.week-auto-detection span').html('<strong>'+weeknumber+'</strong>');
    $('.today-schedule span').text($Utils.convertWeekDayChar($Utils.getCurrentDay()));

    $.getJSON('data.json', (scheduleData)=>{

        const schedule = new ClassSchedule(scheduleData);

        const html1 = schedule.generateDailyTableHTML(weeknumber);
        const html2 = schedule.generateWeeklyTableHTML(weeknumber);
        $('.today-schedule div.table-area').append(html1);
        $('.whole-schedule div.table-area').append(html2);

        $('#weeknumber').blur(()=>{
            const wn = +$('#weeknumber').val();
            if(!wn) {
                schedule.setWeekNumber($Utils.getCurrentWeekNumber());
                const html = schedule.generateWeeklyTableHTML(weeknumber);
                $('.whole-schedule div.table-area').empty();
                $('.whole-schedule div.table-area').append(html);
            } else if(schedule.isWeekNumberValid(wn)) {
                schedule.setWeekNumber(wn);
                const html = schedule.generateWeeklyTableHTML(wn);
                $('.whole-schedule div.table-area').empty();
                $('.whole-schedule div.table-area').append(html);
            }
        });

    });
});