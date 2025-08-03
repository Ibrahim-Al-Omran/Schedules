# RECOMMENDED: Use Transaction Pooler for Vercel Serverless
# Add this to your Vercel environment variables
# Replace your current DATABASE_URL with the Transaction Pooler URL from Supabase

# In Supabase Dashboard > Settings > Database > Connection Pooling
# Use the "Transaction" mode URL (port 6543)
# It should look like: postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Steps:
# 1. Go to Supabase Dashboard
# 2. Settings > Database 
# 3. Find "Connection pooling" section
# 4. Copy the "Transaction" mode URL (NOT Session mode)
# 5. Update your Vercel environment variable

# Example Transaction Pooler URL:
# DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Why Transaction Pooler?
# - Perfect for serverless functions (Vercel)
# - Each API call = one transaction = immediate connection return
# - Much faster than Session pooler for short-lived requests
# - Higher concurrency and lower latency
