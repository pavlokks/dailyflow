export const getLatestNews = async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: 'NEWS_API_KEY невизначений',
      });
    }

    const params = new URLSearchParams({
      country: 'us',
      pageSize: '6',
      apiKey,
    });

    const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?${params.toString()}`);
    const newsData = await newsResponse.json();

    if (!newsResponse.ok) {
      return res.status(newsResponse.status).json({
        message: newsData.message || 'Отримання новин неуспішне',
      });
    }

    const articles = newsData.articles.map((article) => ({
      title: article.title,
      source: article.source?.name || 'Невідомий ресурс',
      url: article.url,
      image: article.urlToImage,
    }));

    return res.json(articles);
  } catch (error) {
    return res.status(500).json({
      message: 'Отримання новин неуспішне',
      error: error.message,
    });
  }
};
