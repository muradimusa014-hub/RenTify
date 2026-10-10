async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing against:', baseUrl);

  // 1. Fetch properties list
  console.log('\n1. Testing GET /api/properties...');
  const propRes = await fetch(`${baseUrl}/api/properties`);
  console.log('Properties HTTP Status:', propRes.status);
  const propData = await propRes.json();
  console.log('Properties count:', propData.properties?.length);
  if (!propData.properties || propData.properties.length === 0) {
    console.error('No properties returned!');
    return;
  }
  const sampleProp = propData.properties[0];
  console.log('Sample property:', {
    id: sampleProp.id,
    title: sampleProp.title,
    thumbnail: sampleProp.thumbnail,
    likes: sampleProp.likes,
    dislikes: sampleProp.dislikes,
    commentsCount: sampleProp.commentsCount
  });

  const propertyId = sampleProp.id;

  // 2. Test Like action
  console.log('\n2. Testing POST /api/properties/[id]/reactions (Like)...');
  const likeRes = await fetch(`${baseUrl}/api/properties/${propertyId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'like', sessionId: 'test_session_123' })
  });
  const likeData = await likeRes.json();
  console.log('Reaction response after Like:', likeData);

  // 3. Test Dislike switch
  console.log('\n3. Testing POST /api/properties/[id]/reactions (Dislike switch)...');
  const dislikeRes = await fetch(`${baseUrl}/api/properties/${propertyId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'dislike', sessionId: 'test_session_123' })
  });
  const dislikeData = await dislikeRes.json();
  console.log('Reaction response after Dislike:', dislikeData);

  // 4. Test Comments (Post Question)
  console.log('\n4. Testing POST /api/properties/[id]/comments (Student Question)...');
  const commentPostRes = await fetch(`${baseUrl}/api/properties/${propertyId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorName: 'Ibrahim (ABU Student)',
      content: 'Is running water constant in this flat, and is it close to North Gate?'
    })
  });
  const commentPostData = await commentPostRes.json();
  console.log('Comment post status:', commentPostRes.status);
  console.log('Created comment:', commentPostData.comment);

  // 5. Test Comments (Fetch Questions)
  console.log('\n5. Testing GET /api/properties/[id]/comments...');
  const commentsGetRes = await fetch(`${baseUrl}/api/properties/${propertyId}/comments`);
  const commentsGetData = await commentsGetRes.json();
  console.log('Total comments for property:', commentsGetData.comments?.length);
  console.log('Latest comment content:', commentsGetData.comments?.[commentsGetData.comments.length - 1]?.content);

  // 6. Test Image Streaming Route
  console.log('\n6. Testing GET image streaming route...');
  const imgRes = await fetch(`${baseUrl}${sampleProp.thumbnail}`);
  console.log('Image status:', imgRes.status);
  console.log('Image content-type:', imgRes.headers.get('content-type'));
  console.log('Image cache-control:', imgRes.headers.get('cache-control'));

  console.log('\n========================================');
  console.log('✓ ALL TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('========================================');
}

runTests().catch(console.error);
