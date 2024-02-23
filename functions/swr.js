const { EleventyServerless } = require('@11ty/eleventy')

const SWR_TTL = 60 * 1000 // Our static pages will be re-rendered every 60 seconds

const render = async (event) => {
  let elev = new EleventyServerless('cf-cache-page', {
    path: new URL(event.rawUrl).pathname,
    query: event.multiValueQueryStringParameters || event.queryStringParameters,
    functionsDir: './functions/',
  })

  try {
    let [page] = await elev.getOutput()

    // If you want some of the data cascade available in `page.data`, use `eleventyConfig.dataFilterSelectors`.
    // Read more: https://www.11ty.dev/docs/config/#data-filter-selectors

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
      body: page.content,
      ttl: page.data.ttl,
    }
  } catch (error) {
    // Only console log for matching serverless paths
    // (otherwise you’ll see a bunch of BrowserSync 404s for non-dynamic URLs during --serve)
    if (elev.isServerlessUrl(event.path)) {
      console.log('Serverless Error:', error)
    }

    return {
      statusCode: error.httpStatusCode || 500,
      body: JSON.stringify(
        {
          error: error.message,
        },
        null,
        2,
      ),
    }
  }
}


// This function renders a page and stores it to KV with additional metadata
const renderAndStorePage = async (context, key) => {
  try {
    // This part is framework-specific.
    // Your favourite framework will render the page
    // based on the request path
    const rendered = await render(context.request)
    if (rendered) {
      if (rendered.statusCode >= 200 && rendered.statusCode < 300) {
        context.waitUntil(
          context.env.__STATIC_CONTENT.put(key, rendered.body, {
            metadata: {
              createdAt: Date.now(),
            },
          }),
        )
      }

      return new Response(rendered.body, {
        status: rendered.statusCode,
        headers: rendered.headers,
      })
    }
  } catch (e) {
    return new Response('Error rendering route: ' + (e.message || e.toString()), {
      status: 500,
    })
  }

  return null
}

async function serve(path, context) {
  const key = path.replace(/^\/+/, '')

  // Try to serve a static asset from KV
  try {
    const result = await context.env.__STATIC_CONTENT.getWithMetadata(key)
    if (result && result.value) {
      if (
        // TODO: Determine if request is for a page
        (!result.metadata || Date.now() - result.metadata.createdAt >= SWR_TTL)
      ) {
        // https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil
        context.waitUntil(
          renderAndStorePage(context.request, context.env, context, key),
        )
      }
      return new Response(result.value)
    }
  } catch (err) {
    // ignore errors and fall back to app rendering
  }

  // Fall back to app rendering
  const response = await renderAndStorePage(context, key)
  return response || new Response('Not found', { status: 404 })
}

export async function onRequest(context) {
  const url = new URL(context.request.url)

  // Remove leading slashes
  const pathname = url.pathname
  return await serve(pathname, context)
}