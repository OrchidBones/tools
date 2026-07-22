import DateManager from "./DateManager.js";
import Global from "./Global.js";
import { ClassEventManager, CourseManager, ExamManager } from "./ClassEventManager.js";
import StringConvertor from "./StringConvertor.js";
import FormatManager from "./FormatManager.js";
import HtmlManager from "./HtmlManager.js";
import ClassSchedule from "./ClassSchedule.js";

Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
};

Date.prototype.clone = function() {
    return new Date(this.getTime());
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

String.prototype.simpleFormat = function(key, value) {
    const target = '${'+key+'}';
    return this.replace(target, value);
};

$(document).ready(()=>{

$.getJSON('settings.json', (settings)=>{

    /**
     * <Start>
     */

    window.$ClassSchedule = null;
    window.$DateManager = new DateManager(settings);
    window.$StringConvertor = new StringConvertor(settings);
    window.$FormatManager = new FormatManager(settings);
    window.$CourseManager = new CourseManager(settings);
    window.$ExamManager = new ExamManager(settings);
    window.$HtmlManager = new HtmlManager(settings);
    window.$Global = new Global(settings);
    $HtmlManager.applyLayoutSettings();
    const weeknumber = $DateManager.getCurrentWeekNumber();

    $.getJSON('data_course.json', (courseData)=>{
    $.getJSON('data_exam.json', (examData)=>{
        $Global.initializeClassEvents(courseData, examData);
        const schedule = new ClassSchedule(settings);
        window.$ClassSchedule = schedule;

        /**
         * 周次查询
         */
        $('#weeknumber').focus(()=>{
            $('#weeknumber').val('');
        });
        $('#weeknumber').blur(()=>{
            const wn = +$('#weeknumber').val();
            if(!wn) {
                const weeknum = $ClassSchedule.weekNumber();
                if(weeknum.isBetween(0, $ClassSchedule.maxWeekNumber())) {
                    $('#weeknumber').val(weeknum);
                } else {
                    $('#weeknumber').val('');
                    return;
                }
            }
            if(wn && schedule.isWeekNumberValid(wn)) {
                schedule.changeToWeek(wn);
            }
        });

        /**
         * 周数页首导航
         */
        $('.btn-nav-prev').click(()=>{
            for(let w = $ClassSchedule.weekNumber()-1; w > 0; w--) {
                if($ClassSchedule.isWeekNumberValid(w)) {
                    $ClassSchedule.changeToWeek(w);
                    break;
                }
            }
        });
        $('.btn-nav-next').click(()=>{
            const w = $ClassSchedule.weekNumber()+1;
            if($ClassSchedule.isWeekNumberValid(w)) {
                $ClassSchedule.changeToWeek(w);
            }
        });
    });
    });
});
});