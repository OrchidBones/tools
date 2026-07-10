import { ClassEvent, Course, Exam } from "./ClassEvent.js";

/**
 * Global
 */

export default class Global {
    constructor(settings) {
        this._universalSettings = settings;
        this._startDate = new Date(this._universalSettings.semester_start_date+" 00:00:00");
        this._timetable = [{start: {h: 0,  m: 0}, end: {h: 0,  m: 0}}].concat(this._universalSettings.timetable);
        this.refreshCurrentDate();
    }
    currentDate() {
        return this._currentDate;
    }
    startDate() {
        return this._startDate;
    }
    timetable() {
        return this._timetable;
    }
    initializeClassEvents(courses, exams) {
        this.registerClassEvents(courses, exams);
        this.bindCoursesToExams();
        this.refreshCourses();
        this.refreshExams();
    }
    registerClassEvents(courses, exams) {
        this.registerClassEventsFromData(courses, exams);
        // this.registerClassEventsFromSetting(); // 这个放在 ClassSchedule()
    }
    registerClassEventsFromData(courses, exams) {
        courses.forEach(ce => {
            this.registerCourseFromData(ce);
        });
        exams.forEach(ce => {
            this.registerExamFromData(ce);
        });
    }
    registerClassEventsFromSetting() {
        const list = this._universalSettings.special_class_times;
        list.forEach(plan => {
            if(plan.action.toUpperCase() === 'ADD') { // try_add和remove写在ClassSchedule()
                if(plan.ori_date) {
                    // date
                    this.registerCourseByDateFromSetting(plan);
                } else {
                    // week/day
                    this.registerCourseByWeekDayFromSetting(plan);
                }
            }
        });
    }
    registerCourseFromData(course) {
        for(let i = 0; i < course.timetable.length; i++) {
            const timetable = course.timetable[i];
            const day = timetable.day;
            const time = timetable.time;
            const classroom = timetable.classroom;
            const classtakingType = timetable.classtakingType;
            const cc = course.clone();
            cc.ctt = classtakingType;
            cc.classroom = classroom;
            $CourseManager.register(new Course(cc, day, time, classroom, classtakingType));
        }
    }
    registerExamFromData(exam) {
        const timetable = exam.timetable;
        const day = timetable.day;
        const time = timetable.time;
        const classroom = timetable.classroom;
        const cc = exam.clone();
        cc.ctt = 0;
        cc.classroom = classroom;
        $ExamManager.register(new Exam(cc, day, time, classroom));
    }
    registerCourseByDateFromSetting(plan) {
        const course = $CourseManager.course(plan.class_name);
        if(!course) return null;
        const temp_date = new Date(plan.date+' 00:00:00');
        const weeknumber = $DateManager.getWeekNumberByDate(temp_date);
        const day = $DateManager.getCertainDay(temp_date);
        const time = plan.time;
        const classroom = plan.classroom || course.classroom();
        const classtakingType = 3; // class taken once only
        const cc = course.object().clone();
        cc.startTime = weeknumber, cc.endTime = weeknumber;
        cc.timetable = [{"classroom": classroom, "day": day, "time": time, "classtakingType": classtakingType}];
        cc.ctt = classtakingType;
        cc.classroom = classroom;
        const instance = new Course(cc, day, time, classroom, classtakingType);
        $CourseManager.register(instance);
        return instance;
    }
    registerCourseByWeekDayFromSetting(plan) {
        const course = $CourseManager.course(plan.class_name);
        if(!course) return null;
        const weeknumber = plan.week;
        const day = plan.day;
        const time = plan.time;
        const classroom = plan.classroom || course.classroom();
        const classtakingType = 3; // class taken once only
        const cc = course.object().clone();
        cc.startTime = weeknumber, cc.endTime = weeknumber;
        cc.timetable = [{"classroom": classroom, "day": day, "time": time, "classtakingType": classtakingType}];
        cc.ctt = classtakingType;
        cc.classroom = classroom;
        cc.week = weeknumber;
        const instance = new Course(cc, day, time, classroom, classtakingType);
        $CourseManager.register(instance);
        return instance;
    }
    bindCoursesToExams() {
        $ExamManager.allEvents().forEach(e => {
            if(e.object().course) {
                const c = $CourseManager.course(e.object().course);
                e.setCourse(c);
            }
        });
    }
    refreshCourses() {
        $CourseManager.refresh();
    }
    refreshExams() {
        $ExamManager.refresh();
    }
    refreshCurrentDate() {
        this._currentDate = new Date();
    }
};