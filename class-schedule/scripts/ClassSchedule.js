/**
 * ClassSchedule
 */

export default class ClassSchedule {
    constructor(settings) {
        this._schedule = null;
        this._universalSettings = settings;
        this.initWeekNumber();
        this.refresh();
    }
    weekNumber() {
        return this._weekNumber;
    }
    maxWeekNumber() {
        return this.settings().max_week_number;
    }
    settings() {
        return this._universalSettings;
    }
    setWeekNumber(wn) {
        this._weekNumber = wn;
    }
    initWeekNumber(wn) {
        this.setWeekNumber($DateManager.getCurrentWeekNumber());
    }
    changeToWeek(wn) {
        this.setWeekNumber(wn);
        this.refresh();
    }
    initNextClassWeekDay() {
        this._nextClassWeekDay = 0;
    }
    initSpecialClassDayList() {
        this._specialClassDayList = [];
    }
    initHolidayList() {
        this._holidayList = [];
    }
    initLeftClassEventList() {
        this._leftClassEventList = [];
    }
    isWeekNumberValid(wn) {
        return wn.isBetween(1, this.maxWeekNumber());
    }
    isSemesterEnd() {
        return this.weekNumber() > this.maxWeekNumber();
    }
    hasNoClassEventLeftThisWeek() {
        return !this._nextClass;
    }
    isTodayOffClass() {
        return this.hasNoClassEventLeftThisWeek() || this._nextClass && this._nextClass.day() > $DateManager.getCurrentWeekDay();
    }
    needsExamReminderTip() {
        return $ExamManager.allEvents().length;
    }
    needsNextClassroomTooltip() {
        return !this.isTodayOffClass();
    }
    refreshClassEvents() {
        $Global.refreshCourses();
        $Global.refreshExams();
    }
    refreshSchedule() {
        this._schedule = this.assignSchedule(this.weekNumber());
        this.applySpecialClassEvents();
    }
    assignSchedule(wn) {
        const schedule = this.getEmptySchedule();
        const courses = $CourseManager.filterActiveAtWeek(wn);
        const exams = $ExamManager.filterByWeekNum(wn);
        const list = courses.concat(exams);
        list.forEach(ce => {
            const day = ce.day();
            const time = ce.time();
            schedule[day][time] = ce;
        });
        return schedule;
    }
    getEmptySchedule() {
        const data = [null];
        for(let i = 0; i < 7; i++) {
            const dayData = [null, null, null, null, null, null, null]; // dayData[0] should not be used in generating HTML
            data.push(dayData);
        }
        return data;
    }
    applySpecialClassEvents() {
        $Global.registerClassEventsFromSetting();
        this.performSpecialClassDaySetting();
        this.performSpecialClassTimeSetting();
        this.performHolidaySetting();
    }
    performSpecialClassDaySetting() {
        const list = this.settings().special_class_days;
        const schedule = this._schedule;
        list.forEach(plan => {
            let oriWeek, oriDay, tarWeek, tarDay;
            if(plan.ori_date) {
                const date = new Date(plan.ori_date+' 00:00:00');
                oriWeek = $DateManager.getWeekNumberByDate(date);
                oriDay = $DateManager.getCertainDay(date);
            } else {
                oriWeek = plan.ori_week;
                oriDay = plan.ori_day;
            }
            if(plan.tar_date) {
                const date = new Date(plan.tar_date+' 00:00:00');
                tarWeek = $DateManager.getWeekNumberByDate(date);
                tarDay = $DateManager.getCertainDay(date);
            } else {
                tarWeek = plan.tar_week;
                tarDay = plan.tar_day;
            }
            if(oriWeek === this.weekNumber()) {
                const daySchedule = schedule[oriDay];
                const tempSche = this.assignSchedule(tarWeek);
                const tempDaySchedule = tempSche[tarDay];
                for(let i = 1; i < daySchedule.length; i++) {
                    daySchedule[i] = tempDaySchedule[i];
                } 
            }
        });
    }
    performHolidaySetting() {
        const list = this.settings().holidays;
        const integritedList = [];
        list.forEach(plan => {
            let startDate, endDate;
            if(plan.startDate) {
                startDate = new Date(plan.startDate+' 00:00:00');
            } else {
                startDate = $DateManager.getWeekdayDateByWeekNumber(plan.startDay, plan.startWeek);
            }
            if(plan.endDate) {
                endDate = new Date(plan.endDate+' 00:00:00');
            } else {
                endDate = $DateManager.getWeekdayDateByWeekNumber(plan.endDay, plan.endWeek);
            }
            integritedList.push({startDate: startDate, endDate: endDate});
        });
        const schedule = this._schedule;
        for(let i = 1; i < schedule.length; i++) {
            const classList = schedule[i];
            const date = $DateManager.getWeekdayDateByWeekNumber(i, this.weekNumber());
            for(let j = 0; j < integritedList.length; j++) {
                const d = integritedList[j];
                if(date.getTime().isBetween(d.startDate.getTime(), d.endDate.getTime())) {
                    schedule[i] = classList.map(c => null);
                    const holidayList = this._holidayList;
                    if(!holidayList.includes(i)) holidayList.push(i);
                }
            }
        }
    }
    performSpecialClassTimeSetting() {
        const list = this.settings().special_class_times;
        list.forEach(plan => {
            switch(plan.action.toUpperCase()) {
                case "TRY_ADD":
                    this.performSpecialClassTime_TRY_ADD(plan);
                    break;
                case "REMOVE":
                    this.performSpecialClassTime_REMOVE(plan);
                    break;
            }
        })
    }
    performSpecialClassTime_TRY_ADD(plan) {
        let week, day;
        const temp_date = new Date(plan.date+' 00:00:00');
        const time = plan.time;
        const schedule = this._schedule;
        if(temp_date) {// date
            week = $DateManager.getWeekNumberByDate(temp_date);
            day = $DateManager.getCertainDay(temp_date);
            if(!schedule[day][time] && week === this.weekNumber()) {
                const courseInstance = $Global.registerCourseByDateFromSetting(plan);
                schedule[day][time] = courseInstance;
            }
        } else {// week day
            week = plan.week;
            day = plan.day;
            if(!schedule[day][time] && week === this.weekNumber()) {
                const courseInstance = $Global.registerCourseByWeekDayFromSetting(plan);
                if(courseInstance) schedule[day][time] = courseInstance;
            }
        }
    }
    performSpecialClassTime_REMOVE(plan) {
        let week, day;
        const temp_date = new Date(plan.date+' 00:00:00');
        const time = plan.time;
        const schedule = this._schedule;
        if(temp_date) {// date
            week = $DateManager.getWeekNumberByDate(temp_date);
            day = $DateManager.getCertainDay(temp_date);
        } else {// week day
            week = plan.week;
            day = plan.day;
        }
        if(week === this.weekNumber()) {
            schedule[day][time] = null;
        }
    }
    setCurrentClassEvent() {
        this._currentClass = null;
        const currentDate = $DateManager.currentDate();
        const schedule = this._schedule;
        const wd = $DateManager.getCurrentWeekDay();
        const wt = $DateManager.getClassTimeIndexByDate(currentDate);
        const ce = schedule[wd][wt];
        if(ce) {
            ce.setAsCurrent();
            this._currentClass = ce;
        }
    }
    setNextClassEvent() {
        this._nextClass = null;
        if(this._currentClass) return;
        const currentDate = $DateManager.currentDate();
        const week = $DateManager.getWeekNumberByDate(currentDate);
        if(week !== this.weekNumber()) return;
        const day = $DateManager.getCurrentWeekDay();
        const time = $DateManager.getClassTimeIndexByDate(currentDate);
        const schedule = this._schedule;
        for(let i = day; i < schedule.length; i++) {
            const daySchedule = schedule[i];
            for(let j = 1; j < daySchedule.length; j++) {
                const ce = daySchedule[j];
                if(ce && (i === day && j > time || i > day)) {
                    if(!this._nextClassWeekDay) {
                        ce.setAsNext();
                        this._nextClass = ce;
                        this._nextClassWeekDay = i;
                    }
                    this._leftClassEventList.push(ce);
                }
            }
        }
    }
    render() {
        this.renderSemesterEndTip();
        this.renderExamReminderTip();
        this.renderNextClassroomTip();
        this.renderScheduleTable();
        this.renderDailyScheduleTable();
        this.applyTommorrowClassList();
        this.updateWeekNumberNaviState();
        this.updateWeekNumberInputValue();
        this.updateWeekNumberSwitcherState();
        this.applyCssStylesAfterwards();
    }
    renderSemesterEndTip() {
        if(this.isSemesterEnd()) {
            $HtmlManager.renderSemesterEndTip();
        }
    }
    renderExamReminderTip() {
        if(this.needsExamReminderTip()) {
            const date = $DateManager.currentDate();
            const taken = $ExamManager.filterTakenAtDate(date, this.weekNumber());
            const exams = $ExamManager.allEvents().filter(e => {
                if(taken.includes(e)) return false;
                const d = $DateManager.getWeekdayDateByWeekNumber(e.day(), e.startTime());
                const dif = $DateManager.getDayDifferenceBetween(date, d);
                if(dif >= 0 && dif <= this.settings().exam_reminder_x_days_before) {
                    return true;
                }
                return false;
            });
            $HtmlManager.renderExamReminderTip(exams);
        }
    }
    renderNextClassroomTip() {
        if(this.needsNextClassroomTooltip()) {
            const nextClass = this._nextClass;
            const timeStr = $StringConvertor.convertClassStartTimeChar(nextClass.time());
            $HtmlManager.renderNextClassroomTooltip(nextClass, timeStr);
        }
    }
    renderScheduleTable() {
        $HtmlManager.renderScheduleTable(this._schedule, this.weekNumber(), this._specialClassDayList, this._holidayList);
    }
    renderDailyScheduleTable() {
        $HtmlManager.renderDailyScheduleTable(this._nextClassWeekDay, this._schedule, this.weekNumber());
    }
    applyTommorrowClassList() {
        const currentDay = $DateManager.getCurrentWeekDay();
        const nextClassDay = this._nextClassWeekDay;
        let timeTag, weekDay;
        if(!nextClassDay || nextClassDay - currentDay === 0) {// today
            const suffix = this.getSuffexForHolidays(currentDay) || this.getSuffexForSpecialClassDays(currentDay);
            timeTag = this.settings().terms.time_tag_today_text;
            weekDay = $StringConvertor.convertWeekDayChar(currentDay) + suffix;
        } else if(nextClassDay - currentDay === 1) {//tomorrow
            const suffix = this.getSuffexForHolidays(currentDay) || this.getSuffexForSpecialClassDays(nextClassDay);
            timeTag = this.settings().terms.time_tag_tommorrow_text;
            weekDay = $StringConvertor.convertWeekDayChar(nextClassDay) + suffix;
        } else if(nextClassDay - currentDay > 1) {
            const text = this.settings().terms.time_tag_x_days_later_text;
            timeTag = text.simpleFormat('day', nextClassDay - currentDay);
            weekDay = $StringConvertor.convertWeekDayChar(nextClassDay);
        }
        if(this.hasNoClassEventLeftThisWeek()) {
            const suffix = this.getSuffexForHolidays(currentDay) || this.getSuffexForSpecialClassDays(currentDay) || this.settings().terms.no_class_left_suffix_text;
            timeTag = this.settings().terms.time_tag_today_text;
            weekDay = $StringConvertor.convertWeekDayChar(currentDay) + suffix;
        }
        $HtmlManager.renderDailyTableHeader(timeTag, weekDay, this.weekNumber());
    }
    updateWeekNumberNaviState() {
        $HtmlManager.updateWeekNaviState(this.weekNumber());
    }
    updateWeekNumberInputValue() {
        $HtmlManager.updateWeekNumberInputValue(this.weekNumber());
    }
    updateWeekNumberSwitcherState() {
        $HtmlManager.updateWeekNumberSwitcherState(this.weekNumber());
    }
    applyCssStylesAfterwards() {
        $HtmlManager.applyCssStylesAfterwards();
    }
    getSuffexForSpecialClassDays(wd) {
        const specialClassDayList = this._specialClassDayList;
        return specialClassDayList.includes(wd) ? this.settings().terms.special_class_days_suffix_text : "";
    }
    getSuffexForHolidays(wd) {
        const holidayList = this._holidayList;
        return holidayList.includes(wd) ? this.settings().terms.holidays_suffix_text : "";
    }
    refresh() {
        this.initMembers();
        this.refreshClassEvents();
        this.refreshSchedule();
        this.setCurrentClassEvent();
        this.setNextClassEvent();
        this.render();
    }
    initMembers() {
        this.initNextClassWeekDay();
        this.initLeftClassEventList();
        this.initSpecialClassDayList();
        this.initHolidayList();
    }
}