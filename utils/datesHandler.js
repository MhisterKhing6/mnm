import moment from "moment";

const addDays = (days)  => {
    const newDate = new Date();
    newDate.setDate(new Date().getDate() + days);
    return newDate;
}

const fallsInWeek = (date) => {
    const currentDate = moment() //get current date
    const startOfWeek = currentDate.clone().startOf("week") //get start of week date
    const endWeek = currentDate.clone().endOf("week") //get end of week date
    return moment(date).isBetween(startOfWeek, endWeek, null, '[]') //check if date between date
}

const dateOfDay = (day) => {
    const today = moment()
    const dayDate = today.day(day).format()
    return new Date(dayDate)
}

export { addDays, dateOfDay };

