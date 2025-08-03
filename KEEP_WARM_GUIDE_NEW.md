# Free Services to Keep Your Vercel App Warm (Updated)

## Quick Setup (Recommended)

### Option 1: UptimeRobot (Free + Most Reliable)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add HTTP monitor: `https://schedules-ashen.vercel.app/api/warmup-all`
3. Set interval: **5 minutes** (critical for serverless)
4. This will ping multiple endpoints to keep functions warm

### Option 2: Better Uptime
1. Sign up at [betteruptime.com](https://betteruptime.com)
2. Create heartbeat monitor
3. URL: `https://schedules-ashen.vercel.app/api/warmup-all`
4. Interval: **5 minutes**

## Advanced Setup Options

### Option 3: GitHub Actions (Free with your repo)
Add this to `.github/workflows/keepalive.yml`:
```yaml
name: Keep Vercel App Warm
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch: # Allow manual triggers

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Warm up all endpoints
        run: |
          curl -f https://schedules-ashen.vercel.app/api/warmup-all
          curl -f https://schedules-ashen.vercel.app/api/health-edge
          curl -f https://schedules-ashen.vercel.app/api/health
```

### Option 4: Vercel Cron (Paid Plans Only)
If you upgrade to Vercel Pro, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/warmup-all",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Performance Monitoring Endpoints

Your app now has multiple health check endpoints optimized for different purposes:

- **`/api/health-edge`** - Instant response using Edge Runtime (fastest)
- **`/api/health`** - Database health check with connection pooling
- **`/api/warmup`** - Database warmup with performance metrics
- **`/api/warmup-all`** - Comprehensive warmup of all critical endpoints

## Expected Performance Improvements

After implementing keep-warm monitoring:

- **Cold starts**: Reduced from 3-8 seconds to 200-800ms
- **Login/API calls**: Consistently fast (< 1 second)
- **Dashboard loading**: Faster due to cached responses
- **Google Calendar sync**: More responsive due to warmed connections

## Monitoring Tips

1. **Check UptimeRobot logs** to ensure pings are successful
2. **Monitor response times** - should be < 1 second when warm
3. **Test during off-peak hours** to verify warmup is working
4. **Use multiple monitors** for redundancy (free tier allows 50 monitors)

## Cost Considerations

- **UptimeRobot Free**: 50 monitors, 5-minute intervals ✅
- **Vercel Hobby**: No additional cost for keep-warm requests
- **Vercel Pro**: Better cold start performance + cron functions
- **Database (Supabase)**: Connection pooling reduces database load

## Troubleshooting

If you still experience slow responses:

1. Check if warmup endpoints return 200 status
2. Verify database connection pooling is working (`/api/health`)
3. Monitor for any errors in Vercel function logs
4. Consider upgrading to Vercel Pro for better baseline performance
