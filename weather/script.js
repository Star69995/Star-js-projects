const API_KEY = "11fdec72b370a338684eda60b62c161a";
const form = document.getElementById('weather-form');
const resultsContainer = document.getElementById('weather-results');
const errorContainer = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading-indicator');

// יצירת משתנים גלובליים לאלמנטים
const cityNameElement = document.getElementById('city-name');
const temperatureElement = document.getElementById('temperature');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const weatherDescriptionElement = document.getElementById('weather-description');
const clothingRecommendationElement = document.getElementById('clothing-recommendation');
const hourlyForecastElement = document.getElementById('hourly-forecast');
const dailyForecastElement = document.getElementById('daily-forecast');


function saveCityToLocalStorage(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem('weatherHistory', JSON.stringify(history));
    }
}

// פונקציה להצגת מזג האוויר
async function displayWeather(data, city) {
    cityNameElement.textContent = city || 'המיקום הנוכחי';
    temperatureElement.textContent = data.main && data.main.temp ? Math.round(data.main.temp) : 'לא זמין';
    feelsLikeElement.textContent = data.main && data.main.feels_like ? Math.round(data.main.feels_like) : 'לא זמין';
    humidityElement.textContent = data.main && data.main.humidity !== undefined ? data.main.humidity : 'לא זמין';
    windSpeedElement.textContent = data.wind && data.wind.speed !== undefined ? data.wind.speed : 'לא זמין';
    weatherDescriptionElement.textContent = data.weather && data.weather[0] ? data.weather[0].description : 'לא זמין';

    const clothingRecommendation = getClothingRecommendation(data.main && data.main.temp ? data.main.temp : null);
    clothingRecommendationElement.textContent = clothingRecommendation || 'לא זמין';

    resultsContainer.classList.remove('hidden');

    console.log(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=he`);
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=he`);

    const forecastData = await response.json();

    // הצגת תחזית שעתית (הפונקציה תטען בנפרד)
    await display3HourForecast(forecastData);

    // הצגת תחזית יומית (הפונקציה תטען בנפרד)
    await displayDailyForecast(forecastData);

    
}

// פונקציה ליצירת תחזית יומית
function generateDailyForecastHTML(dailyData) {
    if (!dailyData) return ''; // אם אין נתונים יומיים

    return dailyData.slice(1, 5).map(day => `
        <div>
            <p>${new Date(day.dt * 1000).toLocaleDateString('he-IL')}</p>
            <p>מינימום: ${day.temp && day.temp.min ? Math.round(day.temp.min) : 'לא זמין'}°C</p>
            <p>מקסימום: ${day.temp && day.temp.max ? Math.round(day.temp.max) : 'לא זמין'}°C</p>
        </div>
    `).join('');
}

// Adjusted function to display 3-hourly forecast
async function display3HourForecast(data) {
    if (!data || !data.list) {
        hourlyForecastElement.innerHTML = 'נתונים שעתיים לא זמינים';
        return;
    }

    const hourly = generateHourlyForecastHTML(data.list);
    hourlyForecastElement.innerHTML = hourly;
}

// Adjusted function to generate HTML for hourly forecast
function generateHourlyForecastHTML(hourlyData) {
    return hourlyData.slice(0, 12).map(entry => `
        <div>
            <p>${new Date(entry.dt * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
            <p>${entry.main && entry.main.temp ? Math.round(entry.main.temp) : 'לא זמין'}°C</p>
            <p>${entry.weather && entry.weather[0] ? entry.weather[0].description : 'לא זמין'}</p>
        </div>
    `).join('');
}

// Adjusted function to display daily forecast
async function displayDailyForecast(data) {
    if (!data || !data.list) {
        dailyForecastElement.innerHTML = 'נתונים יומיים לא זמינים';
        return;
    }

    const daily = generateDailyForecastHTML(data.list);
    dailyForecastElement.innerHTML = daily;
}

// Adjusted function to generate HTML for daily forecast
function generateDailyForecastHTML(dailyData) {
    return dailyData.filter((entry, index) => index % 8 === 0).map(day => `
        <div>
            <p>${new Date(day.dt * 1000).toLocaleDateString('he-IL')}</p>
            <p>מינימום: ${day.main && day.main.temp_min ? Math.round(day.main.temp_min) : 'לא זמין'}°C</p>
            <p>מקסימום: ${day.main && day.main.temp_max ? Math.round(day.main.temp_max) : 'לא זמין'}°C</p>
        </div>
    `).join('');
}



function getClothingRecommendation(temp) {
    if (temp < 10) return 'לבש מעיל חם וכובע.';
    if (temp < 20) return 'לבש סוודר או ג\'קט קל.';
    if (temp < 30) return 'לבש חולצה קצרה ומכנסיים קלים.';
    return 'לבש בגדים קלים ושתה הרבה מים.';
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = document.getElementById('city-input').value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});



async function getWeatherByCity(city) {
    console.log("מזג האוויר עבור:", city);
	try {
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=${city}&lang=he&units=metric&appid=${API_KEY}`
		);
		const data = await response.json();

		// בדוק אם יש שגיאה בתשובה
		if (data.cod !== 200) {
			throw new Error(data.message);
		}

		// הצג נתוני מזג האוויר
		console.log("נתוני מזג האוויר:", data);
		displayWeather(data, city);
	} catch (error) {
		console.error("שגיאה בזיהוי המזג האוויר:", error.message);
		errorContainer.textContent = "שגיאה בקבלת נתוני מזג האוויר.";
		errorContainer.classList.remove("hidden");
	}
}

async function getCityName(lat, lon) {
    try {
        // קריאה ל-API לזיהוי שם העיר
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
            // החזרת שם העיר בעברית אם קיים
            return data[0].local_names?.he || data[0].name;
        } else {
            throw new Error("עיר לא נמצאה.");
        }
    } catch (error) {
        console.error("שגיאה בזיהוי העיר:", error.message);
        return null;
    }
}
async function getCurrentLocation() {
    if (navigator.geolocation) {
        // אם המכשיר תומך ב-GPS, נשיג את המיקום
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            // קרא לפונקציה שמביאה את שם העיר מהקואורדינטות
            const city = await getCityName(latitude, longitude);

            // אם קיבלנו את שם העיר, נשלח אותו לפונקציה שמביאה את מזג האוויר
            if (city) {
                await getWeatherByCity(city);
            } else {
                console.error("לא ניתן לזהות את העיר.");
                errorContainer.textContent = "לא ניתן לזהות את העיר.";
                errorContainer.classList.remove('hidden');
            }
        }, (error) => {
            console.error("שגיאה בזיהוי המיקום:", error.message);
            errorContainer.textContent = "לא ניתן לזהות את המיקום הנוכחי.";
            errorContainer.classList.remove('hidden');
        });
    } else {
        console.error("המכשיר לא תומך בזיהוי מיקום.");
        errorContainer.textContent = "המכשיר לא תומך בזיהוי מיקום.";
        errorContainer.classList.remove('hidden');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        getCurrentLocation();
    }
});