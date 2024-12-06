import http from 'k6/http';
import { check } from 'k6'
import { group } from 'k6';


// k6 run tickets.js --http-debug="full"

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const baseUrl = 'http://webtours.load-test.ru';
const port = ':1090';
const path = '/cgi-bin';
const username = 'John';
const password = '12345';
let departureCityIndex = getRandomInt(1, 5);
let arrivalCityIndex = getRandomInt(6, 10);
let flightIndex = getRandomInt(0, 4);
let departureCity;
let arrivalCity;
let userSessionValue;
let flightChose;

export const options = {
    vus: 1,
    duration: '1s',
}

let headers = {
    headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Content-type': 'application/x-www-form-urlencoded',
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    }
}

export function statusCodeShouldBe(response, code) {
    return check(response, {
        [`status should be  ${code}`]: (r) => r.status === code,
    });
}

export function responseShouldHaveText(response, text) {
    return check(response, {
        [`page should have text ${text}`]: (r) => r.body.includes(text),
    });
}

export default function () {
    getMain();
    toNavigate();
    logInStep1();
    logInStep3();
    goToSearch();
    getFlightsMenu();
    goToReservation();
    createReservation();
    setFlight();
    setPayments();
}

export function getMain() {
    group('getMain', () => {
        let res = http.get(baseUrl + port + path + '/welcome.pl');
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Web Tours')
    })
}

export function toNavigate() {
    group('toNavigate', () => {
        let res = http.get(baseUrl + port + path + '/nav.pl?in=home');
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Web Tours Navigation Bar')

        userSessionValue = res.html().find('input[name=userSession]').first().attr('value')
    })
}

export function logInStep1() {
    group('logInStep1', () => {

        const payload = {
            username: username,
            password: password,
            userSession: userSessionValue,
        }

        let res = http.post(baseUrl + port + path + '/login.pl', payload, headers);
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'User password was correct')
    })
}

export function logInStep2() {
    group('logInStep2', () => {
        let res = http.get(baseUrl + port + path + '/nav.pl?page=menu&in=home');
        statusCodeShouldBe(res, 200)
    })
}

export function logInStep3() {
    group('logInStep3', () => {
        let res = http.get(baseUrl + port + path + '/login.pl?intro=true');
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Welcome to Web Tours')
    })
}

export function goToSearch() {
    group('goToSearch', () => {
        let res = http.get(baseUrl + port + path + '/welcome.pl?page=search');
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'User has returned to the search page')
    })
}

export function getFlightsMenu() {
    group('getFlightsMenu', () => {
        let res = http.get(baseUrl + port + path + '/nav.pl?page=menu&in=flights');
        statusCodeShouldBe(res, 200)
    })
}

export function goToReservation() {
    group('goToReservation', () => {
        let res = http.get(baseUrl + port + path + '/reservations.pl?page=welcome');
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Flight Selections')

        departureCity = res.html()
            .find(`select[name="depart"] option:nth-child(${departureCityIndex})`)
            .attr('value');

        arrivalCity = res.html()
            .find(`select[name="depart"] option:nth-child(${arrivalCityIndex})`)
            .attr('value');
    })
}

export function createReservation() {
    group('createReservation ', () => {

        const payload = {
            "depart": `${departureCity}`,
            "departDate": "12/05/2024",
            "arrive": `${arrivalCity}`,
            "returnDate": "12/06/2024",
            "numPassengers": "1",
            "seatPref": "None",
            "seatType": "Coach",
            "findFlights.x": "23",
            "findFlights.y": "4",
            ".cgifields": "roundtrip",
            ".cgifields": "seatType",
            ".cgifields": "seatPref",
        }

        let res = http.post(baseUrl + port + path + '/reservations.pl', payload, headers);
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Flight Selections')

        let flights = res.html().find('[name=outboundFlight]');
        let values = [];
        flights.each((i, el) => {
            values.push(el.getAttribute('value'));
        });

        flightChose = values[flightIndex];
    })
}

export function setFlight() {
    group('setFlight', () => {

        const payload = {
            "outboundFlight": `${flightChose}`,
            "numPassengers": "1",
            "advanceDiscount": "0",
            "seatType": "Coach",
            "findFlights.x": "23",
            "findFlights.y": "4",
        }

        let res = http.post(baseUrl + port + path + '/reservations.pl', payload);
        statusCodeShouldBe(res, 200)
    })
}

export function setPayments() {
    group('setPayments', () => {

        const payload = {
            "firstName": `${username}`,
            "lastName": "Snow",
            "address1": "Pushkina",
            "address2": "John Snow",
            "creditCard": "112233445566",
            "expDate": "02/25",
            "numPassengers": "1",
            "seatType": "Coach",
            "seatPref": "None",
            "outboundFlight": `${flightChose}`,
            "advanceDiscount": "0",
            "JSFormSubmit": "off",
            "buyFlights.x": "34",
            "buyFlights.y": "4",
            ".cgifields": "saveCC",
        }

        let res = http.post(baseUrl + port + path + '/reservations.pl', payload);
        statusCodeShouldBe(res, 200)
        responseShouldHaveText(res, 'Thank you for booking through Web Tours')
    })
}

