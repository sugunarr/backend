# PSRO Dashboard - Backend API

Express.js REST API for the Payment Support Operations (PSRO) Dashboard. Provides endpoints for overview summaries, ticket management, and error logging.

## Features

- **REST API** – Clean endpoints for dashboard data
- **Multi-Database Support** – MySQL and MSSQL compatibility
- **Connection Pooling** – Efficient database resource management
- **CORS Enabled** – Cross-origin requests supported
- **Error Handling** – Centralized error middleware
- **Health Checks** – Built-in monitoring endpoints

## Quick Start

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- MySQL 5.7+ or MSSQL Server

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dashboard
PORT=3000
NODE_ENV=development
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T10:30:45.123Z"
}
```

### Overview Summary
```
GET /api/overview/summary
```

### Tickets
```
GET /api/tickets
```

### Logs
```
GET /api/logs/errors/top
```

## Project Structure

```
backend/
├── server.js           # Main Express application
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .gitignore         # Git exclusions
├── README.md          # This file
├── LICENSE            # MIT License
└── src/
    ├── config/
    │   └── database.js        # Database connection pool
    ├── controllers/
    │   ├── overviewController.js
    │   ├── ticketsController.js
    │   └── logsController.js
    ├── routes/
    │   ├── overview.js
    │   ├── tickets.js
    │   └── logs.js
    ├── middleware/
    │   └── errorHandler.js
    └── utils/
        └── helpers.js
```

## Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `DB_TYPE` | string | `mysql` or `mssql` |
| `DB_HOST` | string | Database server hostname |
| `DB_PORT` | number | Database port |
| `DB_USER` | string | Database username |
| `DB_PASSWORD` | string | Database password |
| `DB_NAME` | string | Database name |
| `DB_POOL_MAX` | number | Max connections in pool (default: 10) |
| `PORT` | number | Server port (default: 3000) |
| `NODE_ENV` | string | `development` or `production` |

## Troubleshooting

### Database Connection Error
- Check database server is running
- Verify credentials in `.env`
- Test connection: `mysql -h $DB_HOST -u $DB_USER -p $DB_NAME`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -i :3000 | awk 'NR!=1 {print $2}' | xargs kill -9`

### CORS Errors
- CORS is enabled by default in `server.js`
- Check browser console for specific origin errors

## Development

### Format
```bash
npm run lint
```

### Test
```bash
npm test
```

## Deployment

See [deployment guide](../DEPLOYMENT_GUIDE.md) for production setup with PM2, Docker, or systemd.

## License

MIT License – see [LICENSE](./LICENSE) file.

## Support

For issues, create a GitHub issue or contact the development team.
