const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Facebook OAuth credentials
const APP_ID = 'YOUR_APP_ID';
const APP_SECRET = 'YOUR_APP_SECRET';
const REDIRECT_URI = 'http://localhost:3000/auth/facebook/callback';

app.get('/auth/facebook', (req, res) => {
  const authUrl = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_read_engagement,pages_read_user_content,pages_manage_engagement,pages_manage_posts`;
  res.redirect(authUrl);
});

app.get('/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No code found');
  }

  try {
    const tokenResponse = await axios.get(`https://graph.facebook.com/v13.0/oauth/access_token`, {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch user profile
    const userProfileResponse = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'id,name,picture',
        access_token: accessToken,
      },
    });

    // Fetch pages managed by the user
    const pagesResponse = await axios.get(`https://graph.facebook.com/me/accounts`, {
      params: {
        access_token: accessToken,
      },
    });

    res.json({
      profile: userProfileResponse.data,
      pages: pagesResponse.data.data,
      accessToken: accessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/page-insights', async (req, res) => {
  const { pageId, accessToken, since, until } = req.query;

  try {
    const insightsResponse = await axios.get(`https://graph.facebook.com/${pageId}/insights`, {
      params: {
        metric: 'page_fans,page_engaged_users,page_impressions,page_reactions',
        since: since,
        until: until,
        period: 'total_over_range',
        access_token: accessToken,
      },
    });

    res.json(insightsResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
