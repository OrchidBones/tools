/**
 * DateManager
 */

export default class DateManager {
    constructor(settings) {
        this._universalSettings = settings;
    }
    currentDate() {
        return $Global.currentDate();
    }
    startDate() {
        return $Global.startDate();
    }
    timetable() {
        return $Global.timetable();
    }
    getCurrentWeekNumber() {
        return this.getWeekNumberByDate(this.currentDate());
    }
    getCurrentWeekDay() {
        return this.getCertainDay(this.currentDate());
    }
    getDayDifferenceBetween(startDate, endDate) {
        return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    getHourDifferenceBetween(startDate, endDate, isRemnant) {
        const hours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        return isRemnant ? hours - this.getDayDifferenceBetween(startDate, endDate) * 24 : hours;
    }
    getMinuteDifferenceBetween(startDate, endDate, isRemnant) {
        const minutes = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // 不计算秒，所以用 Math.ceil 向上取整
        return isRemnant ? minutes - this.getHourDifferenceBetween(startDate, endDate) * 60 : minutes;
    }
    getCertainDay(date) {
        return date.getDay() === 0 ? 7 : date.getDay();
    }
    getWeekNumberByDate(date) {
        const curDate = date;
        const startDate = this.startDate();
        const dayDif = this.getDayDifferenceBetween(startDate, curDate);
        return Math.ceil(dayDif / 7);
    }
    getWeekdayDateByWeekNumber(wd, wn) {
        const startDate = this.startDate();
        const date = new Date();
        date.setTime(startDate.getTime()+(1000 * 60 * 60 * 24 * (7 * (wn - 1) + wd)));
        return date;
    }
    getClassTimeIndexByDate(date) {
        let timeIndex = 0;
        for(let i = 0; i < this.timetable().length; i++) {
            const timetable = this.timetable()[i];
            const nextIndex = Math.min(i+1, 6);
            const nextTimetable = this.timetable()[i+1];
            let startHours, endHours, nextStartHours, startMinutes, endMinutes, nextStartMinutes;
            if(i === 0) {
                startHours = 0, startMinutes = 0;
                endHours = 0, endMinutes = 0;
                nextStartHours = nextTimetable.start.h, nextStartMinutes = nextTimetable.start.m;
            } else if(nextIndex !== i) {
                startHours = timetable.start.h, startMinutes = timetable.start.m;
                endHours = timetable.end.h, endMinutes = timetable.end.m;
                nextStartHours = nextTimetable.start.h, nextStartMinutes = nextTimetable.start.m;
            } else {
                startHours = timetable.end.h, startMinutes = timetable.end.m;
                endHours = timetable.end.h, endMinutes = timetable.end.m;
                nextStartHours = 23, nextStartMinutes = 59;
            }
            const startDate = new Date(date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+$FormatManager.padZero(startHours, 2)+':'+$FormatManager.padZero(startMinutes, 2)+':00');
            const endDate = new Date(date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+$FormatManager.padZero(endHours, 2)+':'+$FormatManager.padZero(endMinutes, 2)+':00');
            const nextStartDate = new Date(date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+$FormatManager.padZero(nextStartHours, 2)+':'+$FormatManager.padZero(nextStartMinutes, 2)+':00');
            if(date.getTime().isBetween(startDate.getTime(), endDate.getTime())) {
                timeIndex = i;
                break;
            }
            if(date.getTime().isBetween(endDate.getTime(), nextStartDate.getTime())) {
                timeIndex = i + 0.5;
                break;
            }
        }
        timeIndex = timeIndex || -1;
        return timeIndex;
    }
}