// Attached only to the default (S3/SPA) cache behavior, never to /api/* — so this
// can't interfere with real API responses. React Router routes like /collection
// don't exist as S3 objects; rather than relying on CloudFront's distribution-wide
// custom_error_response (which would also rewrite the API's own 404s into
// index.html, since that setting isn't scoped per-behavior), this rewrites the
// request itself before it ever reaches S3: anything that isn't a static file
// (no dot in the URI) is served index.html, and the SPA's router takes over.
function handler(event) {
  var request = event.request
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html'
  }
  return request
}
