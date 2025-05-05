import express from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { BigQuery } from '@google-cloud/bigquery';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Generate a random session secret if not provided
const generateSessionSecret = () =>
  [...Array(32)].map(() => Math.random().toString(36)[2]).join('');

const SESSION_SECRET = process.env.SESSION_SECRET || generateSessionSecret();

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parser (optional if you use POST in future)
app.use(express.json());

// Session middleware — placed BEFORE routes
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3001/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

// Auth routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/bigquery']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/');
  }
);

app.get('/auth/user', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.user });
});

// Logout route — now works correctly
app.get('/logout', (req, res, next) => {
  if (!req.session) return res.status(400).send('No session found');

  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.send('Logged out');
  });
});

// Protected BigQuery route
app.get('/pages', async (req, res) => {
  if (!req.user?.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: req.user.accessToken });

    const bigquery = google.bigquery({ version: 'v2', auth });

    const projectId = 'pma-pmani-sg3-dev-mg';
    const query = 'SELECT * FROM `pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages`';

    const response = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query,
        useLegacySql: false
      }
    });

    const rows = response.data.rows?.map(row => {
      const record = {};
      row.f.forEach((field, i) => {
        const fieldName = response.data.schema.fields[i].name;
        record[fieldName] = field.v;
      });
      return record;
    }) || [];

    res.json(rows);
  } catch (err) {
    console.error('BigQuery error:', err);
    res.status(500).json({ error: 'BigQuery query failed' });
  }
});

// Express route to list all tables in your dataset
app.get('/api/bigquery/tables', async (req, res) => {
  if (!req.user?.accessToken) {
    console.log("failed to get table list");
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: req.user.accessToken });

    const bigquery = google.bigquery({ version: 'v2', auth });

    const datasetId = 'PAI_Ads_Mosaic';
    const projectId = 'pma-pmani-sg3-dev-mg';

    const { data } = await bigquery.tables.list({ projectId, datasetId });
    const tables = data.tables?.map(t => t.tableReference?.tableId) || [];

    res.json({ tables });
  } catch (err) {
    console.error('BigQuery table fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.post('/create', async (req, res) => {
  if (!req.user?.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { pageName, sourceTable, valueType } = req.body;
  const isNormalized = valueType === 'NORMALIZED';

  const projectId = 'pma-pmani-sg3-dev-mg';
  const fullTableName = `\`${sourceTable}\``;

  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: req.user.accessToken });
  const bigquery = google.bigquery({ version: 'v2', auth });

  try {
    // 1. Get max page_id
    const maxIdResponse = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: `
          SELECT MAX(page_id) AS max_id
          FROM \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
        `,
        useLegacySql: false,
      },
    });

    const maxId =
      parseInt(maxIdResponse.data.rows?.[0]?.f?.[0]?.v || '0', 10) || 0;
    const nextPageId = maxId + 1;

    // 2. Query to get top 15 ads
    const selectQuery = `
  SELECT 
    BRAND,
    CREATIVE_URL_SUPPLIER,
    IMPRESSIONS,
    SPEND
  FROM (
    SELECT 
      BRAND,
      CREATIVE_URL_SUPPLIER,
      IMPRESSIONS,
      SPEND,
      ROW_NUMBER() OVER (
        PARTITION BY BRAND 
        ORDER BY IMPRESSIONS DESC
      ) AS rn
    FROM (
      SELECT DISTINCT
        BRAND,
        CREATIVE_URL_SUPPLIER,
        ${isNormalized ? 'NORMALIZED_IMPRESSION' : 'IMPRESSIONS'} AS IMPRESSIONS,
        ${isNormalized ? 'NORMALIZED_SPEND' : 'SPEND'} AS SPEND
      FROM ${fullTableName}
      WHERE CREATIVE_URL_SUPPLIER LIKE '%mp4'
    )
  )
  WHERE rn <= 15
`;

    const selectResponse = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: selectQuery,
        useLegacySql: false,
      },
    });

    const schemaFields = selectResponse.data.schema.fields;
    const adsList = selectResponse.data.rows?.map(row => {
      const obj = {};
      row.f.forEach((field, i) => {
        const col = schemaFields[i].name;
        obj[col.toLowerCase()] = field.v;
      });
      return {
        brand: obj['brand'],
        url: obj['creative_url_supplier'],
        impression: Number(obj['impressions']),
        spend: Number(obj['spend']),
      };
    }) || [];

    const adsListLiteral = JSON.stringify(adsList);

    // 3. Insert new page
    const insertQuery = `
      INSERT INTO \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
      (page_id, page_name, source_table, created_at, updated_at, ads_list)
      VALUES (
        @pageId,
        @pageName,
        @sourceTable,
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP(),
        PARSE_JSON(@adsList)
      )
    `;

    await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: insertQuery,
        useLegacySql: false,
        parameterMode: 'named',
        queryParameters: [
          { name: 'pageId', parameterType: { type: 'INT64' }, parameterValue: { value: nextPageId.toString() } },
          { name: 'pageName', parameterType: { type: 'STRING' }, parameterValue: { value: pageName } },
          { name: 'sourceTable', parameterType: { type: 'STRING' }, parameterValue: { value: sourceTable } },
          { name: 'adsList', parameterType: { type: 'STRING' }, parameterValue: { value: adsListLiteral } },
        ],
      },
    });

    res.json({ success: true, pageId: nextPageId, adsList });
  } catch (err) {
    console.error('BigQuery insert error:', err);
    res.status(500).json({ error: 'Failed to run query or insert data' });
  }
});

app.get('/pages/:id', async (req, res) => {
  if (!req.user?.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const projectId = 'pma-pmani-sg3-dev-mg';

  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: req.user.accessToken });

  const bigquery = google.bigquery({ version: 'v2', auth });

  try {
    const response = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: `
          SELECT *
          FROM \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
          WHERE page_id = @pageId
          LIMIT 1
        `,
        useLegacySql: false,
        parameterMode: 'named',
        queryParameters: [
          { name: 'pageId', parameterType: { type: 'INT64' }, parameterValue: { value: id } },
        ],
      },
    });

    const row = response.data.rows?.[0];
    const schemaFields = response.data.schema?.fields;

    if (!row || !schemaFields) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const data = {};
    row.f.forEach((field, i) => {
      const key = schemaFields[i].name;
      data[key] = field.v;
    });

    data.ads_list = data.ads_list ? JSON.parse(data.ads_list) : [];

    res.json(data);
  } catch (err) {
    console.error('Error fetching page by ID:', err);
    res.status(500).json({ error: 'Failed to fetch page data' });
  }
});




// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
