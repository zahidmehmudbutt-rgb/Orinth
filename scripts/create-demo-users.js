// Script to create demo users in Supabase
// Run with: node scripts/create-demo-users.js

const SUPABASE_URL = 'https://dbigqgtkfrnbjhhjjcbr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  throw new Error('Set VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY before running this script.');
}

const demoUsers = [
  { email: 'principal@demo.com', password: 'Demo123$', name: 'Dr. Ahmad Khan (Principal)' },
  { email: 'coordinator@demo.com', password: 'Demo123$', name: 'Ms. Fatima Malik (Coordinator)' },
  { email: 'classteacher@demo.com', password: 'Demo123$', name: 'Mr. Hassan Ali (Class Teacher)' },
  { email: 'teacher@demo.com', password: 'Demo123$', name: 'Mr. Usman Ahmed (Teacher)' },
  { email: 'student@demo.com', password: 'Demo123$', name: 'Ahmed Hassan (Student)' },
  { email: 'parent@demo.com', password: 'Demo123$', name: 'Mr. Hassan Senior (Parent)' },
];

async function createUser(email, password, name) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        data: { full_name: name }
      }),
    });

    const data = await response.json();

    if (response.ok && data.user) {
      console.log(`✅ Created: ${email}`);
      return { success: true, email };
    } else if (data.msg && data.msg.includes('already registered')) {
      console.log(`⏭️  Already exists: ${email}`);
      return { success: true, email, exists: true };
    } else {
      console.log(`❌ Failed: ${email} - ${data.msg || data.error || JSON.stringify(data)}`);
      return { success: false, email, error: data };
    }
  } catch (error) {
    console.log(`❌ Error: ${email} - ${error.message}`);
    return { success: false, email, error };
  }
}

async function main() {
  console.log('🚀 Creating demo users...\n');

  for (const user of demoUsers) {
    await createUser(user.email, user.password, user.name);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ Done!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to Supabase Dashboard → Authentication → Users');
  console.log('2. Confirm the email for each user (click the user → Confirm email)');
  console.log('3. Run the DEMO_DATA_SETUP.sql in SQL Editor');
}

main();
