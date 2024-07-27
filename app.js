const API_KEY = '14a8158ae462126eb6edf35e01f52090'; // Replace with your actual API key
const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
const THRESHOLD_TEMP = 35;
const ALERTS = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData();
    setInterval(fetchWeatherData, 300000); // Fetch data every 5 minutes
});

async function fetchWeatherData() {
    const weatherData = [];
    for (let city of CITIES) {
        const data = await getWeatherData(city);
        if (data) {
            const parsedData = parseWeatherData(data);
            weatherData.push({ city, ...parsedData });
            checkAlert(city, parsedData.temp);
        }
    }
    updateWeatherTable(weatherData);
    calculateDailySummary(weatherData);
}

async function getWeatherData(city) {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error(`Error fetching data for ${city}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Network error: ${error}`);
    }
    return null;
}

function parseWeatherData(data) {
    const tempCelsius = kelvinToCelsius(data.main.temp);
    const feelsLikeCelsius = kelvinToCelsius(data.main.feels_like);
    const timestamp = new Date(data.dt * 1000).toLocaleString();
    return {
        main: data.weather[0].main,
        temp: tempCelsius,
        feels_like: feelsLikeCelsius,
        timestamp: timestamp
    };
}

function kelvinToCelsius(tempKelvin) {
    return (tempKelvin - 273.15).toFixed(2);
}

function updateWeatherTable(weatherData) {
    const tableBody = document.querySelector('#weather-table tbody');
    tableBody.innerHTML = '';
    weatherData.forEach(data => {
        const row = `
            <tr>
                <td>${data.city}</td>
                <td>${data.main}</td>
                <td>${data.temp}</td>
                <td>${data.feels_like}</td>
                <td>${data.timestamp}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function checkAlert(city, temp) {
    if (temp > THRESHOLD_TEMP) {
        const alert = `Alert: Temperature in ${city} has exceeded ${THRESHOLD_TEMP}°C.`;
        if (!ALERTS.includes(alert)) {
            ALERTS.push(alert);
            updateAlerts();
        }
    }
}

function updateAlerts() {
    const alertsDiv = document.getElementById('alerts');
    alertsDiv.innerHTML = ALERTS.join('<br>');
}

function calculateDailySummary(weatherData) {
    const summaryData = {};
    weatherData.forEach(data => {
        const date = new Date().toLocaleDateString();
        if (!summaryData[data.city]) {
            summaryData[data.city] = {
                date: date,
                temps: [],
                conditions: []
            };
        }
        summaryData[data.city].temps.push(parseFloat(data.temp));
        summaryData[data.city].conditions.push(data.main);
    });

    const tableBody = document.querySelector('#summary-table tbody');
    tableBody.innerHTML = '';
    for (let city in summaryData) {
        const temps = summaryData[city].temps;
        const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2);
        const maxTemp = Math.max(...temps).toFixed(2);
        const minTemp = Math.min(...temps).toFixed(2);
        const dominantCondition = getDominantCondition(summaryData[city].conditions);

        const row = `
            <tr>
                <td>${city}</td>
                <td>${summaryData[city].date}</td>
                <td>${avgTemp}</td>
                <td>${maxTemp}</td>
                <td>${minTemp}</td>
                <td>${dominantCondition}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    }
}

function getDominantCondition(conditions) {
    return conditions.sort((a, b) =>
        conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    ).pop();
}
