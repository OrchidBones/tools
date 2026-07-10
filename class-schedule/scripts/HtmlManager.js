/**
 * HtmlManager
 */

export default class HtmlManager {
    constructor(settings) {
        this._universalSettings = settings;
    }
    settings() {
        return this._universalSettings;
    }
    applyLayoutSettings() {
        this.applySettingsForTitle();
        this.applySettingsForInput();
        this.applySettingsForPrevNextWeek();
        this.applySettingsForTips();
        this.applySettingsForOutputAreaTitle();
        this.applySettingsForTable();
    }
    applySettingsForTitle() {
        $('h1 strong').html(this.settings().terms.class_schedule_title_text);
    }
    applySettingsForInput() {
        $('form span.input-group-text').html(this.settings().terms.weeknumber_customization_text);
    }
    applySettingsForPrevNextWeek() {
        $('.btn-nav-prev span').html(this.settings().terms.prev_week_text);
        $('.btn-nav-next span').html(this.settings().terms.next_week_text);
    }
    applySettingsForTips() {
        $('.next-tip .next-text').html(this.settings().terms.next_class_text);
        $('.current-tip .current-text').html(this.settings().terms.current_class_text);
    }
    applySettingsForOutputAreaTitle() {
        $('.output-area .class-schedule-general-text').html(this.settings().terms.class_schedule_output_area_title_text);
        $('.whole-schedule h5 .weeknumber-ordinal-numeral-text').html(this.settings().terms.weekday_ordinal_numeral_text.replace('${weeknumber}', '<span class="week-number"></span>'));
    }
    applySettingsForTable() {
        const currentColor = this.settings().layout.tableitem_mark.current_class_color;
        const nextColor = this.settings().layout.tableitem_mark.next_class_color;
        const borderOpacity = this.settings().layout.tableitem_mark.special_class_border_opacity_100;
        const backgroundOpacity = this.settings().layout.tableitem_mark.special_class_background_opacity_100;
        const diff = borderOpacity - backgroundOpacity;
        $('.next-block').css({
            "background-color": $StringConvertor.convertCssColorText(nextColor, borderOpacity),
            "border-color": $StringConvertor.convertCssColorText(nextColor, Math.min(borderOpacity+diff, 100))
        });
        $('.current-block').css({
            "background-color": $StringConvertor.convertCssColorText(currentColor, borderOpacity),
            "border-color": $StringConvertor.convertCssColorText(currentColor, Math.min(borderOpacity+diff, 100))
        });
    }
    renderExamReminderTip(exams) {
        if(exams.length === 0) return;
        const date = $DateManager.currentDate();
        const style = this.settings().layout.alert.exam_reminder_bootstrap_theme;
        $('.next-exam-area').empty();
        let html = `<div class="next-classroom-detection alert alert-${style}">`;
        html += `<i class="fa fa-exclamation-circle"></i><span class="next-exam-intro-text">${this.settings().terms.alert_exam_reminder_intro_text.simpleFormat('daydiff', this.settings().exam_reminder_x_days_before)}</span>`;
        exams.forEach(e => {
            const d = $DateManager.getWeekdayDateByWeekNumber(e.day(), e.startTime());
            const timetable = $DateManager.timetable()[e.time()];
            d.setTime(d.getTime()+1000*60*60*timetable.start.h+1000*60*timetable.start.m);
            const dayDif = $DateManager.getDayDifferenceBetween(date, d);
            const hourDif = $DateManager.getHourDifferenceBetween(date, d, true);
            const minuteDif = $DateManager.getMinuteDifferenceBetween(date, d, true);
            const countdown = this.settings().terms.alert_exam_reminder_countdown_text.simpleFormat('day', dayDif).simpleFormat('hour', hourDif).simpleFormat('minute', minuteDif);
            html += `<br><span class="next-exam-body-text">${this.settings().terms.alert_exam_reminder_body_entry_text.simpleFormat('countdown', '<span class="next-exam-countdown" id="next-exam-countdown-'+e.name()+'">'+countdown+'</span>').simpleFormat('name', e.name())}</span>`;
        });
        html += `<br><span class="next-exam-suffix-text">${this.settings().terms.alert_exam_reminder_suffix_text}</span>`;
        html += '</div>';
        $('.next-exam-area').html(html);
    }
    renderNextClassroomTooltip(nextClass, timeStr) {
        const classroom = nextClass.classroom();
        const terms = this.getNextClassroomTerm(nextClass);
        const style = this.getNextClassroomBootstrapTheme(nextClass);
        $('.next-classroom-area').empty();
        $('.next-classroom-area').append(`
            <div class="next-classroom-detection alert alert-${style}">
                <i class="fa fa-arrow-right"></i>
                ${terms
                    .simpleFormat('classroom', '<span class="next-classroom-text"><strong>'+classroom+'</strong></span>')
                    .simpleFormat('time', '<span class="next-classroom-time-text">'+timeStr+'</span>')
                    .simpleFormat('name', '<span class="next-class-name-text">'+nextClass.name()+'</span>')}
            </div>`);
    }
    getNextClassroomTerm(nextClass) {
        if(nextClass.isCourse()) {
            return this.settings().terms.alert_next_classroom_detection_text;
        }
        if(nextClass.isExam()) {
            return this.settings().terms.alert_next_classroom_exam_detection_text;
        }
        return this.settings().terms.alert_next_classroom_detection_text;
    }
    getNextClassroomBootstrapTheme(nextClass) {
        if(nextClass.isCourse()) {
            return this.settings().layout.alert.next_classroom_bootstrap_theme;
        }
        if(nextClass.isExam()) {
            return this.settings().layout.alert.next_classroom_exam_bootstrap_theme;
        }
        return this.settings().layout.alert.next_classroom_bootstrap_theme;
    }
    updateWeekNaviState(wn) {
        $('#weekSwitcher .week-display').html(this.settings().terms.weekday_ordinal_numeral_text.simpleFormat('weeknumber', wn));
    }
    updateWeekNumberInputValue(wn) {
        $('#weeknumber').val(wn);
    }
    updateWeekNumberSwitcherState(wn, mwn) {
        const prev = $('.btn-nav-prev'), next = $('.btn-nav-next');
        prev.attr('disabled', false);
        next.attr('disabled', false);
        if(wn === 1) {
            prev.attr('disabled', true);
        }
        if(wn === mwn) {
            next.attr('disabled', true);
        }
    }
    applyCssStylesAfterwards() {
        const currentColor = this.settings().layout.tableitem_mark.current_class_color;
        const nextColor = this.settings().layout.tableitem_mark.next_class_color;
        const borderOpacity = this.settings().layout.tableitem_mark.special_class_border_opacity_100;
        const backgroundOpacity = this.settings().layout.tableitem_mark.special_class_background_opacity_100;
        $('td.curClass').css({
            "border-color": $StringConvertor.convertCssColorText(currentColor, borderOpacity),
            "background-color": $StringConvertor.convertCssColorText(currentColor, backgroundOpacity)
        });
        $('td.nextClass').css({
            "border-color": $StringConvertor.convertCssColorText(nextColor, borderOpacity),
            "background-color": $StringConvertor.convertCssColorText(nextColor, backgroundOpacity)
        });
    }
    renderDailyTableHeader(timeTag, weekDay) {
        if(!$('.today-schedule .time-tag').html() && !$('.today-schedule .week-day').html()) {
            $('.today-schedule .time-tag').html(timeTag);
            $('.today-schedule .week-day').html(weekDay);
        }
    }
    renderScheduleTable(schedule, wn, spl, hl) {
        const html = this.generateWeeklyTableHTML(schedule, wn, spl, hl);
        $('.whole-schedule span.week-number').html('<strong>'+wn+'</strong>');
        $('.current-week-tag').empty();
        if(wn === $DateManager.getCurrentWeekNumber()) {
            $('.current-week-tag').html('（本周课表）');
        }
        $('.whole-schedule div.table-area').empty();
        $('.whole-schedule div.table-area').append(html);
    }
    renderDailyScheduleTable(nextClassWeekDay, schedule, wn) {
        const html = this.generateDailyTableHTML(nextClassWeekDay, schedule, wn);
        if(!$('.today-schedule div.table-area').html()) {
            $('.today-schedule div.table-area').append(html);
        }
    }
    generateDailyTableHTML(nextClassWeekDay, schedule, wn) {
        let html = '';
        const prefix = '<table class="table table-bordered table-responsive">';
        const suffix = '</table>';
        html += prefix;
        html += this.makeDailyTableHTML(nextClassWeekDay, schedule, wn);
        html += suffix;
        return html;
    }
    generateWeeklyTableHTML(schedule, wn, spl, hl) {
        let html = '';
        const prefix = '<table class="table table-bordered table-responsive main-schedule">';
        const suffix = '</table>';
        html += prefix;
        html += this.makeWeeklyTableHeadHTML(wn, spl, hl);
        html += this.makeWeeklyTableBodyHTML(schedule, wn);
        html += suffix;
        return html;
    }
    makeDailyTableHTML(nextClassWeekDay, schedule, wn) {
        let html = '';
        const nextClassDay = nextClassWeekDay;
        const wd = !nextClassDay ? $DateManager.getCurrentWeekDay() : nextClassDay;
        const daySche = schedule[wd];
        const takenCourses = $CourseManager.filterTakenAtDate($DateManager.currentDate(), wn);
        const takenExams = $ExamManager.filterTakenAtDate($DateManager.currentDate(), wn);
        const takenEvents = takenCourses.concat(takenExams);
        for(let i = 1; i < daySche.length; i++) {
            let text = '<tr>';
            const t = String(i*2-1) + '-' + String(i*2);
            const tt = this.settings().terms.class_quantifier_text;
            text += '<td>'+tt.simpleFormat('classnumber', t)+'</td>';
            let text2 = '';
            const c = daySche[i];
            const day = wd, time = i;
            if(c && c.isCurrent()) {
                text2 += '<td id="class-'+day+'-'+time+'" class="curClass';
            } else if(c && c.isNext()) {
                text2 += '<td id="class-'+day+'-'+time+'" class="nextClass';
            } else {
                text2 += '<td id="class-'+day+'-'+time+'" class="';
            }
            if(takenEvents.includes(c)) {
                text2 += ' class-taken';
            }
            text2 += '">';
            text += text2;
            if(c) {
                text += this.makeTableItemText(c, wn);
            } else {
                text += ' ';
            }
            text += '</td></tr>'
            html += text;
        }
        html += '</tbody>';
        return html;
    }
    makeWeeklyTableHeadHTML(wn, spl, hl) {
        const format = this.settings().terms.table_head_date_format;
        let html = `<thead><tr>
            <th>${this.settings().terms.time_text}</th>
            <th>${$StringConvertor.convertWeekDayChar(1)}${this.getSuffexForHolidays(1, hl) || this.getSuffexForSpecialClassDays(1, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(1, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(2)}${this.getSuffexForHolidays(2, hl) || this.getSuffexForSpecialClassDays(2, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(2, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(3)}${this.getSuffexForHolidays(3, hl) || this.getSuffexForSpecialClassDays(3, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(3, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(4)}${this.getSuffexForHolidays(4, hl) || this.getSuffexForSpecialClassDays(4, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(4, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(5)}${this.getSuffexForHolidays(5, hl) || this.getSuffexForSpecialClassDays(5, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(5, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(6)}${this.getSuffexForHolidays(6, hl) || this.getSuffexForSpecialClassDays(6, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(6, wn)).format(format)}</span></th>
            <th>${$StringConvertor.convertWeekDayChar(7)}${this.getSuffexForHolidays(7, hl) || this.getSuffexForSpecialClassDays(7, spl)}<br><span style="font-weight: normal;">${dayjs($DateManager.getWeekdayDateByWeekNumber(7, wn)).format(format)}</span></th>
        </tr></thead>`;
        return html;
    }
    makeWeeklyTableBodyHTML(schedule, wn) {
        let html = '<tbody>';
        const suffix = '</tbody>';
        const takenCourses = $CourseManager.filterTakenAtDate($DateManager.currentDate(), wn);
        const takenExams = $ExamManager.filterTakenAtDate($DateManager.currentDate(), wn);
        const takenEvents = takenCourses.concat(takenExams);
        for(let i = 1; i <= this.settings().max_classes_per_day; i++) {
            let text1 = '<tr>';
            const t = String(i*2-1) + '-' + String(i*2);
            const tt = this.settings().terms.class_quantifier_text;
            text1 += '<td>'+tt.simpleFormat('classnumber', t)+'</td>';
            for(let j = 1; j <= 7; j++) {
                const day = j;
                const time = i;
                const c = schedule[day][time];
                let text2 = '';
                if(c && c.isCurrent()) {
                    text2 += '<td id="class-'+day+'-'+time+'" class="curClass';
                } else if(c && c.isNext()) {
                    text2 += '<td id="class-'+day+'-'+time+'" class="nextClass';
                } else {
                    text2 += '<td id="class-'+day+'-'+time+'" class="';
                }
                if(takenEvents.includes(c)) {
                    text2 += ' class-taken';
                }
                text2 += '">';
                if(c) {
                    text2 += this.makeTableItemText(c, wn);
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
    makeTableItemText(c, wn) {
        let t = '';
        this.settings().class_table_item_template.forEach((raw)=>{
            const raw1 = $FormatManager.formatClassParamString(raw, c).simpleFormat('weeknumber', wn);
            t += raw1 + '<br>';
        });
        return t;
    }
    getSuffexForSpecialClassDays(wd, specialClassDayList) {
        return specialClassDayList.includes(wd) ? this.settings().terms.special_class_days_suffix_text : "";
    }
    getSuffexForHolidays(wd, holidayList) {
        return holidayList.includes(wd) ? this.settings().terms.holidays_suffix_text : "";
    }
}