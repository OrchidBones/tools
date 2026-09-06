/**
 * ClassSchedule_Integrated
 * mainly used before semester starts, so html control for semester preparation is available here
 */

export default class ClassSchedule_Integrated {
    constructor(settings) {
        this._universalSettings = settings;
        this._mode = '';
        this._schedule = null;
        this.refresh();
    }
    settings() {
        return this._universalSettings;
    }
    mode() {
        return this._mode;
    }
    initMode() {
        this._mode = 'course';
    }
    setMode(value) {
        this._mode = value;
    }
    isForCourses() {
        return this._mode === 'course';
    }
    isForExams() {
        return this._mode === 'exam';
    }
    // when current week number is smaller than 1, 
    // render class schedule on day 1 for the first week after the semester starts.
    needsSemesterStartControl() {
        return $DateManager.getCurrentWeekNumber() < 1;
    }
    refresh() {
        this.initMode();
        this.refreshClassEvents();
        this.refreshSchedule();
        this.render();
    }
    refreshClassEvents() {
        $Global.refreshCourses();
        $Global.refreshExams();
    }
    refreshSchedule() {
        this._schedule = this.assignSchedule();
    }
    assignSchedule() {
        const schedule = this.getEmptySchedule();
        if(this.isForCourses()) {
            this.assignScheduleForCourses(schedule);
        } else if(this.isForExams()) {
            this.assignScheduleForExams(schedule); // BETA Experimental
        }
        return schedule;
    }
    getEmptySchedule() {
        const data = [null];
        for(let i = 0; i < 7; i++) {
            const dayData = [null]; // dayData[0] should not be used in generating HTML
            for(let j = 0; j < this.settings().timetable.length; j++) {
                dayData.push([]);
            }
            data.push(dayData);
        }
        return data;
    }
    assignScheduleForCourses(schedule) {
        const courses = $CourseManager.filterFromData();
        courses.forEach(course => {
            const day = course.day();
            const time = course.time();
            schedule[day][time].push(course);
        });
    }
    assignScheduleForExams(schedule) {
        const exams = $ExamManager.allEvents();
        exams.forEach(exam => {
            const day = exam.day();
            const time = exam.time();
            schedule[day][time].push(exam);
        });
    }
    render() {
        this.renderSemesterStartTip();
        this.renderWeeklyScheduleTable();
        this.renderDailyScheduleTable();
        this.applyCssStylesAfterwards();
    }
    renderWeeklyScheduleTable() {
        $HtmlManager.hideTipBars();
        $HtmlManager.hideWeekNavigation();
        $HtmlManager.renderWeeklyScheduleTable_Integrated(this._schedule);
    }
    renderDailyScheduleTable() {
        if(this.needsSemesterStartControl()) {
            $HtmlManager.hideDailyScheduleTable();
        }
    }
    renderSemesterStartTip() {
        if(this.needsSemesterStartControl()) {
            $HtmlManager.renderSemesterStartTip();
        }
    }
    applyCssStylesAfterwards() {
        $HtmlManager.applyCssStylesAfterwards();
    }
}