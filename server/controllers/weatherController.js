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

    return res.json({
      city,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get weather',
      error: error.message
    });
  }
};
