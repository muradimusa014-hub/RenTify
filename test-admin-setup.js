async function main() {
  try {
    console.log('Fetching admin setup...');
    const res = await fetch('http://localhost:3001/api/admin/setup', { method: 'POST' });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main();
