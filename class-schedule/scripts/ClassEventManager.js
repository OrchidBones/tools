/**
 * ClassEventManager
 */

class ClassEventManager {
    constructor(settings) {
        this._data = [];
        this._universalSettings = settings;
    }
    allEvents() {
        return this._data;
    }
    integritedAll() {  // ClassEvent.object()
        const temp_arr = [];
        const temp_arr_names = [];
        for(let i = 0; i < this._data.length; i++) {
            const elem = this._data[i];
            if(!temp_arr_names.includes(elem.name())) {
                temp_arr_names.push(elem.name());
                temp_arr.push(elem.object());
            }
        }
        return temp_arr;
    }
    register(classEvent) {
        this._data.push(classEvent);
    }
    filterBy(code, data) {
        switch(code.toUpperCase()) {
            case "WEEKNUMBER":
            case "WEEK":
            case "WEEKNUM":
                return this.filterByWeekNum(data);
            case "TEACHER":
                return this.filterByTeacher(data);
            case "TYPE":
                return this.filterByType(data);
        }
        return [];
    }
    filterByWeekNum(wn) {
        return this.allEvents().filter(c => (c.startWeek() <= wn && c.endWeek() >= wn));
    }
    filterByTeacher(teacher) {
        return this.allEvents().filter(c => c.teacher() === teacher); // Array
    }
    filterByType(type) {
        return this.allEvents().filter(c => c.type() === type); // Array
    }
    findCurrent() {
        return this.allEvents().find(c => c.isCurrent());
    }
    findNext() {
        return this.allEvents().find(c => c.isNext());
    }
    refresh() {
        this._data = this._data.filter(c => !c.isTemp());
        this._data.forEach(e => {e.refresh()});
    }
}

/**
 * CourseManager
 */

export class CourseManager extends ClassEventManager {
    constructor() {
        super();
    }
    course(name) {
        return this._data.find(c => (c.name() === name && !c.isSpecial() && !c.isTemp()));
    }
    filterActiveAtWeek(wn) {
        return this.filterByWeekNum(wn).filter(
            c => (c.isOnEveryWeek() || (c.isOnSingleWeek() && c.startWeek() === wn) || wn%2===1&&c.isOnOddWeek() || wn%2===0&&c.isOnEvenWeek())
        );
    }
    filterActiveWeeklyAtDate(date) {
        const wn = $DateManager.getWeekNumberByDate(date);
        return this.filterActiveAtWeek(wn);
    }
    filterActiveDailyAtDate(date) {
        const wn = $DateManager.getWeekNumberByDate(date);
        const day = $DateManager.getCertainDay(date);
        return this.filterActiveAtWeek(wn).filter(c => c.day() === day);
    }
    filterTakenAtDate(date, weeknumber) {
        const wn = $DateManager.getWeekNumberByDate(date);
        const wd = $DateManager.getCertainDay(date);
        const wtn = date.getHours()*60+date.getMinutes(); // timeNum (hours + minutes)
        return this.allEvents().filter(c => {
            const day = c.day();
            const time = c.time();  // time === class time index
            const timetable = $DateManager.timetable()[time];
            const tn = timetable.end.h*60+timetable.end.m;
            return weeknumber < wn || (weeknumber === wn && ((wd > day) || (wd === day && wtn > tn)));
        });
    }
    filterFromData() {
        return this.allEvents().filter(e => e.isFromData());
    };
};

/**
 * ExamManager
 */

export class ExamManager extends ClassEventManager {
    constructor() {
        super();
    }
    exam(name) {
        return this._data.find(e => ((e.name() === name || e.course().object().name === name)&&!e.isTemp()));
    }
    filterByWeekNum(wn) {
        return this._data.filter(e => e.startWeek() === wn);
    }
    filterTakenAtDate(date/**, weeknumber(废弃) */) {
        const wn = $DateManager.getWeekNumberByDate(date);
        const wd = $DateManager.getCertainDay(date);
        const wtn = date.getHours()*60+date.getMinutes(); // timeNum (hours + minutes)
        return this.allEvents().filter(c => {
            const day = c.day();
            const time = c.time();  // time === class time index
            const timetable = $DateManager.timetable()[time];
            const tn = timetable.end.h*60+timetable.end.m;
            return c.startWeek() < wn || (c.startWeek() === wn && ((wd > day) || (wd === day && wtn > tn)));
        });
    }
}