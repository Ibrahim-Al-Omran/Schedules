# Free Services to Keep Your Vercel App Warm

## Option 1: UptimeRobot (Recommended - Free)
1. Sign up at uptimerobot.com
2. Add HTTP monitor: https://schedules-ashen.vercel.app/api/health
3. Set interval: 5 minutes
4. This will ping your app every 5 minutes to prevent cold starts

## Option 2: Better Uptime
1. Sign up at betteruptime.com
2. Create heartbeat monitor
3. URL: https://schedules-ashen.vercel.app/api/health
4. Interval: 5 minutes

## Option 3: GitHub Actions (Free with your repo)
Add this to .github/workflows/keepalive.yml:

```yaml
name: Keep Vercel App Warm
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping app
        run: curl -f https://schedules-ashen.vercel.app/api/health
```

## Option 4: Vercel Cron (Paid Plans Only)
If you upgrade to Vercel Pro, you can use Vercel Cron:
- Add cron job in vercel.json
- Runs every 5 minutes automatically

## Recommendation:
Use UptimeRobot (free) + the /api/health endpoint we just created.
This will keep your functions warm and provide uptime monitoring.
