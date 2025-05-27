import express from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const generateSessionSecret = () =>
  [...Array(32)].map(() => Math.random().toString(36)[2]).join('');

const SESSION_SECRET = process.env.SESSION_SECRET || generateSessionSecret();

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

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

// ===== AUTH ROUTES =====
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/bigquery'],
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/');
  },
);

app.get('/auth/user', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.user });
});

app.get('/logout', (req, res, next) => {
  if (!req.session) return res.status(400).send('No session found');
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.send('Logged out');
  });
});

// ===== HELPER =====
const getBigQueryClient = (accessToken) => {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });
  return google.bigquery({ version: 'v2', auth });
};

// ===== GET PAGES =====
app.get('/pages', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  const bigquery = getBigQueryClient(req.user.accessToken);
  const projectId = 'pma-pmani-sg3-dev-mg';
  const query = 'SELECT * FROM `pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages`';

  try {
    const response = await bigquery.jobs.query({
      projectId,
      requestBody: { query, useLegacySql: false },
    });

    const rows = response.data.rows?.map(row => {
      const record = {};
      row.f.forEach((field, i) => {
        const key = response.data.schema.fields[i].name;
        record[key] = field.v;
      });
      return record;
    }) || [];

    res.json(rows);
  } catch (err) {
    console.error('BigQuery error:', err);
    res.status(500).json({ error: 'BigQuery query failed' });
  }
});

// ===== TABLE LIST =====
app.get('/api/bigquery/tables', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const bigquery = getBigQueryClient(req.user.accessToken);
    const { data } = await bigquery.tables.list({
      projectId: 'pma-pmani-sg3-dev-mg',
      datasetId: 'PAI_Ads_Mosaic',
    });
    const tables = data.tables?.map(t => t.tableReference?.tableId) || [];
    res.json({ tables });
  } catch (err) {
    console.error('BigQuery list error:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// ===== CREATE PAGE =====
app.post('/create', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  const { pageName, sourceTable, valueType } = req.body;
  const isNormalized = valueType === 'NORMALIZED';

  const projectId = 'pma-pmani-sg3-dev-mg';
  const fullTableName = `\`${sourceTable}\``;

  const bigquery = getBigQueryClient(req.user.accessToken);

  try {
    // 1. Get max ID
    const maxIdRes = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: `SELECT MAX(page_id) AS max_id FROM \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\``,
        useLegacySql: false,
      },
    });

    const maxId = parseInt(maxIdRes.data.rows?.[0]?.f?.[0]?.v || '0') || 0;
    const nextPageId = maxId + 1;

    // 2. Try different column variations
    const columns = {
      impressions: ['NORMALIZED_IMPRESSION', 'NORMALIZED_IMPRESSIONS', 'IMPRESSIONS'],
      spend: ['NORMALIZED_SPEND', 'NORMALIZED_SPENDS', 'SPEND'],
    };

    let impressionCol = 'IMPRESSIONS';
    let spendCol = 'SPEND';

    if (isNormalized) {
      for (const col of columns.impressions) {
        const testQuery = `SELECT COUNT(1) FROM ${fullTableName} WHERE ${col} IS NOT NULL`;
        try {
          await bigquery.jobs.query({
            projectId,
            requestBody: { query: testQuery, useLegacySql: false },
          });
          impressionCol = col;
          break;
        } catch {}
      }

      for (const col of columns.spend) {
        const testQuery = `SELECT COUNT(1) FROM ${fullTableName} WHERE ${col} IS NOT NULL`;
        try {
          await bigquery.jobs.query({
            projectId,
            requestBody: { query: testQuery, useLegacySql: false },
          });
          spendCol = col;
          break;
        } catch {}
      }
    }

    // 3. Select top ads
    const selectQuery = `
      SELECT BRAND, CREATIVE_URL_SUPPLIER, IMPRESSIONS, SPEND
      FROM (
        SELECT BRAND, CREATIVE_URL_SUPPLIER,COLLECTION_MONTH, IMPRESSIONS, SPEND,
          ROW_NUMBER() OVER (PARTITION BY BRAND ORDER BY IMPRESSIONS DESC) AS rn
        FROM (
          SELECT DISTINCT
            BRAND,
            CREATIVE_URL_SUPPLIER,
            FORMAT_DATE('%Y-%m', OCCURENCE_COLLECTIONDATE) AS COLLECTION_MONTH,
            ${impressionCol} AS IMPRESSIONS,
            ${spendCol} AS SPEND
          FROM ${fullTableName}
          WHERE CREATIVE_URL_SUPPLIER LIKE '%mp4'
        )
      )
      WHERE rn <= 15
    `;

    const selectRes = await bigquery.jobs.query({
      projectId,
      requestBody: { query: selectQuery, useLegacySql: false },
    });

    const fields = selectRes.data.schema?.fields;
    const adsList = selectRes.data.rows?.map(row => {
      const item = {};
      row.f.forEach((field, i) => {
        const name = fields[i].name.toLowerCase();
        item[name] = field.v;
      });
      return {
        brand: item['brand'],
        url: item['creative_url_supplier'],
        impression: Number(item['impressions']),
        spend: Number(item['spend']),
      };
    }) || [];

    const adsListJson = JSON.stringify(adsList);

    // 4. Insert page
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
          { name: 'adsList', parameterType: { type: 'STRING' }, parameterValue: { value: adsListJson } },
        ],
      },
    });

    res.json({ success: true, pageId: nextPageId, adsList });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Create operation failed' });
  }
});

// ===== GET PAGE BY ID =====
app.get('/pages/:id', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const projectId = 'pma-pmani-sg3-dev-mg';
  const bigquery = getBigQueryClient(req.user.accessToken);

  try {
    const response = await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: `
          SELECT * FROM \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
          WHERE page_id = @pageId LIMIT 1
        `,
        useLegacySql: false,
        parameterMode: 'named',
        queryParameters: [
          { name: 'pageId', parameterType: { type: 'INT64' }, parameterValue: { value: id } },
        ],
      },
    });

    const row = response.data.rows?.[0];
    const fields = response.data.schema?.fields;
    if (!row || !fields) return res.status(404).json({ error: 'Not found' });

    const result = {};
    row.f.forEach((field, i) => {
      result[fields[i].name] = field.v;
    });
    result.ads_list = result.ads_list ? JSON.parse(result.ads_list) : [];
    res.json(result);
  } catch (err) {
    console.error('Fetch page by ID failed:', err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// ===== DELETE PAGE =====
app.delete('/pages/:id', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const projectId = 'pma-pmani-sg3-dev-mg';
  const bigquery = getBigQueryClient(req.user.accessToken);

  try {
    // BigQuery doesn't support DELETE natively for managed tables,
    // so this is a workaround by running a DELETE DML statement if your table supports it.

    const deleteQuery = `
      DELETE FROM \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
      WHERE page_id = @pageId
    `;

    await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: deleteQuery,
        useLegacySql: false,
        parameterMode: 'named',
        queryParameters: [
          { name: 'pageId', parameterType: { type: 'INT64' }, parameterValue: { value: id } },
        ],
      },
    });

    res.json({ success: true, message: `Page with id ${id} deleted` });
  } catch (err) {
    console.error('Delete page error:', err);
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

// ===== EDIT PAGE =====
app.put('/pages/:id', async (req, res) => {
  if (!req.user?.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { pageName, sourceTable, adsList } = req.body;

  if (!pageName && !sourceTable && !adsList) {
    return res.status(400).json({ error: 'At least one field (pageName, sourceTable, adsList) must be provided' });
  }

  const projectId = 'pma-pmani-sg3-dev-mg';
  const bigquery = getBigQueryClient(req.user.accessToken);

  try {
    // Build SET clauses dynamically depending on which fields are provided
    const setClauses = [];
    const queryParams = [];

    if (pageName) {
      setClauses.push('page_name = @pageName');
      queryParams.push({ name: 'pageName', parameterType: { type: 'STRING' }, parameterValue: { value: pageName } });
    }
    if (sourceTable) {
      setClauses.push('source_table = @sourceTable');
      queryParams.push({ name: 'sourceTable', parameterType: { type: 'STRING' }, parameterValue: { value: sourceTable } });
    }
    if (adsList) {
      setClauses.push('ads_list = PARSE_JSON(@adsList)');
      queryParams.push({ name: 'adsList', parameterType: { type: 'STRING' }, parameterValue: { value: JSON.stringify(adsList) } });
    }

    // Always update updated_at
    setClauses.push('updated_at = CURRENT_TIMESTAMP()');

    const updateQuery = `
      UPDATE \`pma-pmani-sg3-dev-mg.PAI_Ads_Mosaic.embedded_pages\`
      SET ${setClauses.join(', ')}
      WHERE page_id = @pageId
    `;

    queryParams.push({ name: 'pageId', parameterType: { type: 'INT64' }, parameterValue: { value: id } });

    await bigquery.jobs.query({
      projectId,
      requestBody: {
        query: updateQuery,
        useLegacySql: false,
        parameterMode: 'named',
        queryParameters: queryParams,
      },
    });

    res.json({ success: true, message: `Page with id ${id} updated` });
  } catch (err) {
    console.error('Edit page error:', err);
    res.status(500).json({ error: 'Update operation failed' });
  }
});


// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
