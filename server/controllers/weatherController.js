const formatWeatherTime = (timestamp, timezoneOffset = 0) => {
  if (!timestamp) {
    return null;
  }

  const date = new Date((timestamp + timezoneOffset) * 1000);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getUserWeather = async (req, res) => {
  try {
    const city = req.user.city?.trim();
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!city) {
      return res.status(400).json({
        message: 'User city is required to get weather'
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        message: 'OPENWEATHER_API_KEY is not configured'
      });
    }

    const params = new URLSearchParams({
      q: city,
      appid: apiKey,
      units: 'metric'
    });

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({
        message: weatherData.message || 'Failed to get weather'
      });
    }

    const timezoneOffset = weatherData.timezone ?? 0;

    return res.json({
      city,
      temperature: weatherData.main?.temp ?? null,
      feelsLike: weatherData.main?.feels_like ?? null,
      humidity: weatherData.main?.humidity ?? null,
      windSpeed: weatherData.wind?.speed ?? null,
      description: weatherData.weather?.[0]?.description ?? null,
      icon: weatherData.weather?.[0]?.icon ?? null,
      pressure: weatherData.main?.pressure ?? null,
      visibility: weatherData.visibility ? weatherData.visibility / 1000 : null,
      clouds: weatherData.clouds?.all ?? null,
      windGust: weatherData.wind?.gust ?? null,
      sunrise: formatWeatherTime(weatherData.sys?.sunrise, timezoneOffset),
      sunset: formatWeatherTime(weatherData.sys?.sunset, timezoneOffset)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get weather',
      error: error.message
    });
  }
};
