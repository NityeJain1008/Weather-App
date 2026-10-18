const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");

const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");
const weatherInfoSection = document.querySelector(".weather-info");

const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const airQualityValueTxt = document.querySelector(
    ".weather-condition-container .condition-item:nth-child(2) .condition-info h5:last-child"
);
const weatherSummaryImg = document.querySelector(".weather-summary-img");
const currentDateTxt = document.querySelector(".current-date-txt");

const forecastContainer = document.querySelector(".forecast-items-container");

const apiKey = window.apiKey;

searchButton.addEventListener("click", () => {
    if(cityInput.value.trim() != ""){
        updateWeatherInfo(cityInput.value);
        cityInput.value = "";
        cityInput.blur();
    }
});

cityInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && cityInput.value.trim() != ""){
        updateWeatherInfo(cityInput.value);
        cityInput.value = "";
        cityInput.blur();
    }
});

async function getFetchData(endPoint, city){
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);

    return response.json();
}

function getWeatherIcon(id){
    if(id == 800){
        return "clear.svg";
    }else if(id >= 200 && id <= 232){
        return "storm.svg";
    }else if(id >= 600 && id <= 622){
        return "snow.svg";
    }else if(id >= 701 && id <= 781){
        return "haze.svg";
    }else if(id >= 801 && id <= 804){
        return "clouds.svg";
    }else if((id >= 500 && id <= 531) || (id >= 300 && id <= 321)){
        return "rain.svg";
    }
}

function getCurrentDate(){
    const currentDate = new Date();
    const options = { weekday: "long", month: "long", day: "numeric" };
    return currentDate.toLocaleDateString('en-IN', options);
}

async function updateWeatherInfo(city){
    const weatherData = await getFetchData("weather", city); 

    if(weatherData.cod != "200"){
        showDisplaySection(notFoundSection);
        return;
    }
    
    showDisplaySection(weatherInfoSection);

    // console.log(weatherData);

    const{
        name : country,
        main : {temp, humidity},
        weather : [{id, main}],
        wind : {speed}
    } = weatherData;

    countryTxt.textContent = country;
    tempTxt.textContent = `${temp}°C`; 
    conditionTxt.textContent = main ;
    humidityValueTxt.textContent = humidity + "%";
    windValueTxt.textContent = `${speed}m/s`;

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    airQualityValueTxt.textContent = "Loading...";

    await Promise.all([
        updateForecastInfo(city),
        updateAirQualityInfo(weatherData.coord)
    ]);
}

async function updateAirQualityInfo({lat, lon}){
    try{
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        if(!response.ok){
            throw new Error(`Air quality request failed with status ${response.status}`);
        }

        const airQualityData = await response.json();
        const components = airQualityData.list?.[0]?.components;
        if(!components){
            throw new Error("Air quality response did not contain pollutant concentrations");
        }

        const aqi = calculateIndiaAqi(components);
        if(aqi === null){
            throw new Error("Air quality response did not contain usable pollutant concentrations");
        }

        const category = aqi <= 50 ? "Good"
            : aqi <= 100 ? "Satisfactory"
            : aqi <= 200 ? "Moderate"
            : aqi <= 300 ? "Poor"
            : aqi <= 400 ? "Very Poor"
            : "Severe";
        airQualityValueTxt.textContent = `${aqi} · ${category}`;
    }catch(error){
        console.error("Unable to load air quality data:", error);
        airQualityValueTxt.textContent = "Unavailable";
    }
}

function calculateIndiaAqi(components){
    const breakpoints = {
        pm2_5: [[0, 30, 0, 50], [31, 60, 51, 100], [61, 90, 101, 200], [91, 120, 201, 300], [121, 250, 301, 400], [251, 500, 401, 500]],
        pm10: [[0, 50, 0, 50], [51, 100, 51, 100], [101, 250, 101, 200], [251, 350, 201, 300], [351, 430, 301, 400], [431, 600, 401, 500]],
        no2: [[0, 40, 0, 50], [41, 80, 51, 100], [81, 180, 101, 200], [181, 280, 201, 300], [281, 400, 301, 400], [401, 1000, 401, 500]],
        o3: [[0, 50, 0, 50], [51, 100, 51, 100], [101, 168, 101, 200], [169, 208, 201, 300], [209, 748, 301, 400], [749, 1000, 401, 500]],
        so2: [[0, 40, 0, 50], [41, 80, 51, 100], [81, 380, 101, 200], [381, 800, 201, 300], [801, 1600, 301, 400], [1601, 2000, 401, 500]],
        nh3: [[0, 200, 0, 50], [201, 400, 51, 100], [401, 800, 101, 200], [801, 1200, 201, 300], [1201, 1800, 301, 400], [1801, 3000, 401, 500]],
        co: [[0, 1, 0, 50], [1.1, 2, 51, 100], [2.1, 10, 101, 200], [10.1, 17, 201, 300], [17.1, 34, 301, 400], [34.1, 50, 401, 500]]
    };
    const subIndices = Object.entries(breakpoints).flatMap(([pollutant, ranges]) => {
        const rawValue = components[pollutant];
        if(!Number.isFinite(rawValue) || rawValue < 0){
            return [];
        }

        const concentration = pollutant === "co"
            ? Math.round(rawValue / 1000 * 10) / 10
            : Math.floor(rawValue);
        const range = ranges.find(([low, high]) => concentration >= low && concentration <= high);
        if(!range){
            return concentration > ranges[ranges.length - 1][1] ? [500] : [];
        }

        const [concentrationLow, concentrationHigh, indexLow, indexHigh] = range;
        const subIndex = (indexHigh - indexLow) / (concentrationHigh - concentrationLow)
            * (concentration - concentrationLow) + indexLow;
        return [Math.round(subIndex)];
    });

    return subIndices.length ? Math.max(...subIndices) : null;
}

async function updateForecastInfo(city){
    const forecastData = await getFetchData("forecast", city);

    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split("T")[0];
    console.log(todayDate);

    forecastContainer.innerHTML = "";
    
    forecastData.list.forEach((forecastWeather) => {
        if(forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)){
            // console.log(forecastWeather); 
            updateForecastItem(forecastWeather);
        }
    })
}

function updateForecastItem(weatherData){
    console.log(weatherData);
    const{
        dt_txt : date, 
        weather : [{id}],
        main : {temp}
    } = weatherData

    const dateTaken = new Date(date) ; 
    const dateOption = {
        day : '2-digit',
        month : 'short' 
    }
    const dateResult = dateTaken.toLocaleDateString('en-IN', dateOption)

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" alt="" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `

    forecastContainer.insertAdjacentHTML("beforeend", forecastItem);
}

function showDisplaySection(section){
    notFoundSection.style.display = "none";
    searchCitySection.style.display = "none";
    weatherInfoSection.style.display = "none";

    section.style.display = "flex";
}

// updateWeatherInfo("New Delhi");