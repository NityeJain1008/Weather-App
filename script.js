const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const apiKey = window.apiKey;

searchButton.addEventListener("click", () => {
    if(cityInput.value.trim() != ""){
        // updateWeatherInfo();
        cityInput.value = "";
        cityInput.blur();
    }
});

cityInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter" && cityInput.value.trim() != ""){
        // updateWeatherInfo();
        cityInput.value = "";
        cityInput.blur();
    }
});

function getFetchData(){

}

function updateWeatherInfo(city){
    const weatherData = getFetchData() ; 
}