# How to Find Database Values in Render

## Step 1: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** button
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name**: `pet-sitting-db` (or any name you prefer)
   - **Region**: `Oregon (US West)` (same as your web service)
   - **PostgreSQL Version**: Latest (or default)
   - **Instance Type**: `Free` (for testing)
4. Click **"Create Database"**
5. Wait 1-2 minutes for database to be created

## Step 2: Find Database Connection Details

After your database is created, click on it to open the database dashboard.

### Method 1: Using Internal Database URL (Easiest)

Look for a section called **"Internal Database URL"** or **"Connection String"**:

```
postgresql://username:password@hostname:5432/database_name
```

This URL contains all the information you need!

**Example:**
```
postgresql://petsitconnect_user:abc123xyz@dpg-abc123-a.oregon-postgres.render.com:5432/petsitconnect_abc123
```

From this URL, extract:
- **Username**: `petsitconnect_user`
- **Password**: `abc123xyz`
- **Host**: `dpg-abc123-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database**: `petsitconnect_abc123`

### Method 2: Individual Values from Dashboard

Look for these sections in your database dashboard:

1. **"Connections" tab** - Shows connection details
2. **"Info" section** - Shows database information
3. **"Settings" tab** - May show connection details

You'll see fields like:

```
Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: petsitconnect_xxxx
User: petsitconnect_user
Password: (click "Show" to reveal)
```

## Step 3: Map to Environment Variables

Once you have the values, add them to your web service environment variables:

| Environment Variable | Value from Render |
|---------------------|-------------------|
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | The hostname (e.g., `dpg-xxxxx-a.oregon-postgres.render.com`) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | The database name (e.g., `petsitconnect_xxxx`) |
| `DB_USERNAME` | The username (e.g., `petsitconnect_user`) |
| `DB_PASSWORD` | The password (click "Show" to reveal it) |

## Visual Guide

Your Render database dashboard will look something like this:

```
┌─────────────────────────────────────────┐
│  pet-sitting-db                         │
├─────────────────────────────────────────┤
│  Info        Connections    Settings     │
├─────────────────────────────────────────┤
│                                           │
│  Internal Database URL:                  │
│  postgresql://user:pass@host:5432/db    │
│                                           │
│  Or individual values:                   │
│  • Host: dpg-xxxxx-a.oregon-...         │
│  • Port: 5432                           │
│  • Database: petsitconnect_xxxx         │
│  • User: petsitconnect_user             │
│  • Password: [Show]                     │
│                                           │
└─────────────────────────────────────────┘
```

## Important Notes

1. **Internal vs External**: Use the **Internal Database URL** or **Internal connection** values - these are for services within Render (faster, free).

2. **Password**: The password is only shown once when the database is created. If you forgot it, you'll need to reset it in the database settings.

3. **Same Region**: Make sure your database and web service are in the **same region** (Oregon) for best performance.

4. **Free Tier**: Free PostgreSQL databases have limitations but are fine for testing.

## Quick Example

If your Internal Database URL is:
```
postgresql://petsit_user:MyPass123@dpg-abc123def456-a.oregon-postgres.render.com:5432/petsit_abc123
```

Then your environment variables should be:
- `DB_CONNECTION` = `pgsql`
- `DB_HOST` = `dpg-abc123def456-a.oregon-postgres.render.com`
- `DB_PORT` = `5432`
- `DB_DATABASE` = `petsit_abc123`
- `DB_USERNAME` = `petsit_user`
- `DB_PASSWORD` = `MyPass123`

## Troubleshooting

**Can't find the connection details?**
- Look for tabs: "Info", "Connections", "Settings"
- Check if there's a "Show" button next to password
- Try refreshing the page

**Don't have a database yet?**
- Create one first: New + → PostgreSQL
- Wait for it to finish creating (1-2 minutes)
- Then check the connection details

