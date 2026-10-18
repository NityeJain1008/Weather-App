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

    await updateForecastInfo(city);
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