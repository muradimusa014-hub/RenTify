const urls = ['http://localhost:3000/','http://localhost:3000/landlord','http://localhost:3000/listings','http://localhost:3000/api/auth/me','http://localhost:3000/api/bookings','http://localhost:3000/api/properties'];

(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'manual' });
      console.log(`${url} -> ${res.status}`);
    } catch (error) {
      console.error(`${url} -> ERROR: ${error.message}`);
    }
  }
})();
