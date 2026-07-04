
/**
 * ClassEvent
 */

export class ClassEvent {
    constructor(object, day, time, classroom) {
        this._data = object;
        this._day = day;
        this._time = time;
        this._classroom = classroom;
        this.refresh();
    }
    isCourse() {
        return false;
    }
    isExam() {
        return false;
    }
    object() {
        return this._data;
    }
    name() {
        return "";
    }
    type() {
        return "";
    }
    teacher() {
        return "";
    }
    startTime() {
        return 0;
    }
    endTime() {
        return 0;
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
        return 0;
    }
    classtakingType() {
        return this.takingType();
    }
    isCurrent() {
        return this._isCurrent;
    }
    isNext() {
        return this._isNext;
    }
    isSpecial() {
        return false;
    }
    setAsCurrent() {
        return this._isCurrent = true;
    }
    setAsNext() {
        return this._isNext = true;
    }
    refresh() {
        this._isCurrent = false;
        this._isNext = false;
    }
}

/**
 * Course
 */

export class Course extends ClassEvent {
    constructor(object, day, time, classroom, takingType) {
        super(object, day, time, classroom);
        this._takingType = takingType;
    }
    isCourse() {
        return true;
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
    timetable() {
        return this.object().timetable;
    }
    takingType() {
        return this._takingType;
    }
    isOnEveryWeek() {
        return this._takingType === 0;
    }
    isOnOddWeek() {
        return this._takingType === 1;
    }
    isOnEvenWeek() {
        return this._takingType === 2;
    }
    isOnSingleWeek() {
        return this._takingType === 3;
    }
    isSpecial() {
        return this.isOnSingleWeek();
    }
};

/**
 * Exam
 */

export class Exam extends ClassEvent {
    constructor(object, day, time, classroom) {
        super(object, day, time, classroom);
        this._course = null;
    }
    isExam() {
        return true;
    }
    object() {
        return this._data;
    }
    setCourse(course) {
        this._course = course;
    }
    name() {
        const object = this._course ? this._course.object() : this.object();
        return this.object().name || object.name;
    }
    type() {
        const object = this._course ? this._course.object() : this.object();
        return object.type;
    }
    teacher() {
        const object = this._course ? this._course.object() : this.object();
        return object.teacher;
    }
    startTime() {
        return this.object().week;
    }
    endTime() {
        return this.startTime();
    }
    timetable() {
        return [this.object().timetable];
    }
};