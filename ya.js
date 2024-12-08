import http from 'k6/http';

//k6 run --out influxdb=http://localhost:8086/k6 ya.js //k6 - database name

export default function () {


}

export let options = {
    scenarios: {
        ya_scenario: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1m',
            preAllocatedVUs: 30,
            stages: [
                { duration: '5m', target: 60 },   
                { duration: '10m', target: 60 },  
                { duration: '5m', target: 72 },   
                { duration: '10m', target: 72 },  
            ],
        },

        www_scenario: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1m',
            preAllocatedVUs: 40,
            stages: [
                { duration: '5m', target: 120 },  
                { duration: '10m', target: 120 }, 
                { duration: '5m', target: 144 },  
                { duration: '10m', target: 144 },  
            ],
        },
    },
};

export function ya_scenario() {
    http.get('https://ya.ru');
}

export function www_scenario() {
    http.get('https://www.ru');
}