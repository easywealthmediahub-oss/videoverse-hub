# Admin Setup Instructions

## Assigning Admin Role to a User

To assign admin role to a specific user (e.g., easywealthmediahub@gmail.com), follow these steps:

### Prerequisites
1. You need your Supabase Service Role Key. This can be found in your Supabase dashboard under:
   - Project Settings
   - API
   - Service Role Key

2. Make sure you have the Supabase URL (this should already be in your `.env` file as `VITE_SUPABASE_URL`)

### Steps

1. Create a `.env` file in the root directory (if not already present) with:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Run the admin role assignment script:
   ```bash
   npm run update-admin-role
   ```

### Alternative: Direct Database Query

If you prefer to run the query directly in the Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following query (replace 'USER_ID_HERE' with the actual user ID):

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_ID_HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

To get the user ID, you can run:
```sql
SELECT id FROM auth.users WHERE email = 'easywealthmediahub@gmail.com';
```

### Verification

After assigning the role, the user will see:
- A "Studio" link in the sidebar and navbar dropdown (for all authenticated users)
- An "Admin Panel" link in the sidebar and navbar dropdown (only for admin users)

## Environment Variables

Make sure these environment variables are set in your `.env` file:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin script)