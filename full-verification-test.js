async function getActiveBaseUrl() {
  const ports = [3001, 3000];
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/api/properties`, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 200) {
        return `http://localhost:${port}`;
      }
    } catch (e) {
      // try next
    }
  }
  return 'http://localhost:3001';
}

async function runVerification() {
  const BASE_URL = await getActiveBaseUrl();
  console.log('===================================================');
  console.log(`  STARTING RENTIFY FULL SYSTEM VERIFICATION TEST  `);
  console.log(`  Target URL: ${BASE_URL}`);
  console.log('===================================================\n');

  let landlordCookie = '';
  let tenantCookie = '';
  let adminCookie = '';
  let createdPropertyId = '';
  let createdBookingId = '';

  try {
    // 1. SETUP / AUTH VERIFICATION
    console.log('1. Testing Admin Setup & Authentication...');
    const adminSetupRes = await fetch(`${BASE_URL}/api/admin/setup`, { method: 'POST' });
    const adminSetupData = await adminSetupRes.json();
    console.log('   Admin Setup Response:', adminSetupData.message || adminSetupData.error);

    // Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'muradimusa014@gmail.com', password: 'AdminPass123!' }),
    });
    if (!adminLoginRes.ok) {
      const err = await adminLoginRes.json();
      throw new Error(`Admin login failed: ${err.error}`);
    }
    const adminCookieHeader = adminLoginRes.headers.get('set-cookie');
    adminCookie = adminCookieHeader ? adminCookieHeader.split(';')[0] : '';
    console.log('   ✓ Admin Login Successful');

    // Landlord Register / Login
    console.log('\n2. Testing Landlord Registration & Login...');
    const landlordEmail = `landlord_${Date.now()}@rentify.com`;
    const landlordPass = 'landlord123!';
    const regLandlordRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: landlordEmail, password: landlordPass, role: 'landlord' }),
    });
    if (!regLandlordRes.ok) {
      const err = await regLandlordRes.json();
      throw new Error(`Landlord registration failed: ${err.error}`);
    }
    const landlordCookieHeader = regLandlordRes.headers.get('set-cookie');
    landlordCookie = landlordCookieHeader ? landlordCookieHeader.split(';')[0] : '';
    console.log(`   ✓ Landlord Registered & Logged In: ${landlordEmail}`);

    // Tenant Register / Login
    console.log('\n3. Testing Tenant Registration & Login...');
    const tenantEmail = `tenant_${Date.now()}@rentify.com`;
    const tenantPass = 'tenant123!';
    const regTenantRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: tenantEmail, password: tenantPass, role: 'tenant' }),
    });
    if (!regTenantRes.ok) {
      const err = await regTenantRes.json();
      throw new Error(`Tenant registration failed: ${err.error}`);
    }
    const tenantCookieHeader = regTenantRes.headers.get('set-cookie');
    tenantCookie = tenantCookieHeader ? tenantCookieHeader.split(';')[0] : '';
    console.log(`   ✓ Tenant Registered & Logged In: ${tenantEmail}`);

    // 4. LANDLORD PROPERTY CREATION
    console.log('\n4. Testing Landlord Property Listing Creation...');
    const propRes = await fetch(`${BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: landlordCookie,
      },
      body: JSON.stringify({
        title: 'Modern 2-Bedroom Apartment in Samaru',
        description: 'Spacious flat near ABU main campus with constant water and power supply.',
        price: 350000,
        location: 'Samaru',
        images: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      }),
    });
    const propData = await propRes.json();
    if (!propRes.ok) throw new Error(`Property creation failed: ${propData.error}`);
    createdPropertyId = propData.property.id;
    console.log(`   ✓ Property Created Successfully (ID: ${createdPropertyId})`);

    // 5. PUBLIC PROPERTY LISTINGS FETCH
    console.log('\n5. Testing Public Property Search & Filtering...');
    const fetchPropsRes = await fetch(`${BASE_URL}/api/properties?location=Samaru`);
    const fetchPropsData = await fetchPropsRes.json();
    console.log(`   ✓ Found ${fetchPropsData.properties.length} listings in Samaru`);

    // 6. TENANT BOOKING REQUEST
    console.log('\n6. Testing Tenant Booking Request...');
    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: tenantCookie,
      },
      body: JSON.stringify({ propertyId: createdPropertyId }),
    });
    const bookingData = await bookingRes.json();
    if (!bookingRes.ok) throw new Error(`Booking request failed: ${bookingData.error}`);
    createdBookingId = bookingData.booking.id;
    console.log(`   ✓ Booking Requested Successfully (Status: ${bookingData.booking.status})`);

    // 7. LANDLORD BOOKING MANAGEMENT (APPROVE REQUEST)
    console.log('\n7. Testing Landlord Accepting Booking...');
    const approveRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: landlordCookie,
      },
      body: JSON.stringify({ action: 'accept' }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(`Approve booking failed: ${approveData.error}`);
    console.log(`   ✓ Landlord Accepted Booking (New Status: ${approveData.booking.status})`);

    // 8. TENANT RECEIPT UPLOAD / PAYMENT SUBMISSION
    console.log('\n8. Testing Tenant Receipt Submission...');
    const receiptRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: tenantCookie,
      },
      body: JSON.stringify({ receiptImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c' }),
    });
    const receiptData = await receiptRes.json();
    if (!receiptRes.ok) throw new Error(`Receipt submission failed: ${receiptData.error}`);
    console.log(`   ✓ Tenant Receipt Uploaded (Status: ${receiptData.booking.status})`);

    // 9. LANDLORD PAYMENT CONFIRMATION
    console.log('\n9. Testing Landlord Payment Confirmation...');
    const confirmRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: landlordCookie,
      },
      body: JSON.stringify({ action: 'confirm_payment' }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) throw new Error(`Payment confirmation failed: ${confirmData.error}`);
    console.log(`   ✓ Payment Confirmed! Booking Status: ${confirmData.booking.status}`);

    // 10. ADMIN DASHBOARD & METRICS VERIFICATION
    console.log('\n10. Testing Admin Panel Endpoints & Metrics...');
    const adminMetricsRes = await fetch(`${BASE_URL}/api/admin`, {
      headers: { Cookie: adminCookie },
    });
    const adminMetricsData = await adminMetricsRes.json();
    if (!adminMetricsRes.ok) throw new Error(`Admin fetch failed: ${adminMetricsData.error}`);
    console.log(`   ✓ Admin Panel Functional:`);
    console.log(`     - Total Users: ${adminMetricsData.stats.totalUsers}`);
    console.log(`     - Total Properties: ${adminMetricsData.stats.totalProperties}`);
    console.log(`     - Total Bookings: ${adminMetricsData.stats.totalBookings}`);

    console.log('\n===================================================');
    console.log('  ALL RENTIFY SYSTEM VERIFICATION TESTS PASSED! 🎉 ');
    console.log('===================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runVerification();
