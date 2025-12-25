import { createClient } from '@supabase/supabase-js';

// This script should be run once to assign admin role to easywealthmediahub@gmail.com
// You'll need to provide your Supabase URL and service role key

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.log('You can find the service role key in your Supabase dashboard under Project Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  }
});

async function updateAdminRole() {
  try {
    const userEmail = 'easywealthmediahub@gmail.com';
    
    console.log(`Looking for user with email: ${userEmail}`);
    
    // Find the user by email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      console.log('Make sure the user is already registered in your Supabase project');
      return;
    }

    if (!user) {
      console.error('User not found:', userEmail);
      console.log('Please make sure the user has already signed up to the platform');
      return;
    }

    console.log(`Found user with ID: ${user.id}`);
    
    // Check if admin role already exists for this user
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      console.log('Admin role already exists for this user');
      return;
    }

    // Insert admin role for the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      });

    if (roleError) {
      console.error('Error adding admin role:', roleError);
      return;
    }

    console.log('✅ Successfully added admin role to user:', userEmail);
    console.log('The user will now see the Admin Panel in the sidebar and navbar dropdown');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
console.log('Starting admin role update process...');
updateAdminRole();