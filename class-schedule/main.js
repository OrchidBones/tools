Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
};

$(document).ready(()=>{

    class ClassSchedule {
        constructor(data) {
            this._source = data;
            this._maxWeekNumber = 20;
        }
        isWeekNumberValid(wn) {
            return typeof(wn)==='number' && wn > 0 && wn <= this._maxWeekNumber;
        }
        isClassOn(wn, c) {
            return wn >= c.startTime && wn <= c.endTime && (c.ctt===0 || wn%2===1&&c.ctt===1 || wn%2===0&&c.ctt===2);
        }
        getAllClasses() {
            const names = [];
            scheduleData.forEach((c)=>{
                names.push(c.name);
            });
            return names;
        }
        getClassTimetable(course) {
            const timetable = {num: 0, day: [], time: [], ctt: []};
            course.timetable.forEach((tt)=>{
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
                const timetable = this.getClassTimetable(c);
                for(let i = 1; i <= timetable.num; i++) {
                    const cc = c.clone();
                    cc.ctt = timetable.ctt[i-1];
                    schedule[timetable.day[i-1]][timetable.time[i-1]] = cc;
                }
            });
            return schedule;
        }
        makeTableHeadHTML() {
            let html = '<thead><tr>';
            let suffix = '</tr></thead>'
            html += '<th>时间</th>' + '<th>星期一</th>' + '<th>星期二</th>' + '<th>星期三</th>' + '<th>星期四</th>' + '<th>星期五</th>' + '<th>星期六</th>' + '<th>星期日</th>';
            html += suffix;
            return html;
        }
        makeTableBodyHTML(wn) {
            let html = '<tbody>';
            const suffix = '</tbody>';
            const schedule = this.assignSchedule();
            for(let i = 1; i <= 6; i++) {
                let text1 = '<tr>';
                const t = String(i*2-1) + '-' + String(i*2);
                text1 += '<td>'+t+'节</td>'
                for(let j = 1; j <= 7; j++) {
                    let text2 = '<td>'
                    const c = schedule[j][i];
                    if(c && this.isClassOn(wn, c)) {
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
            t += c.name + ' ['+c.type+']' + '<br>';
            t += c.teacher + '<br>';
            t += c.classroom;
            return t;
        }
        generateTableHTML(wn) {
            let html = '';
            const prefix = '<table class="table table-bordered table-responsive">';
            const suffix = '</table>';
            html += prefix;
            html += this.makeTableHeadHTML();
            html += this.makeTableBodyHTML(wn);
            html += suffix;
            console.log(html)
            return html;
        }
    };

    $.getJSON('data.json', (scheduleData)=>{
        const schedule = new ClassSchedule(scheduleData);
        $('#weeknumber').blur(()=>{
            const wn = +$('#weeknumber').val();
            if(schedule.isWeekNumberValid(wn)) {
                const html = schedule.generateTableHTML(wn);
                $('div.table-area').empty();
                $('div.table-area').append(html);
            }
        });
    });
});