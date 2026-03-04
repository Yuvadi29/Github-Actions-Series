// ============================================================
// auto-blog-writer.js
// Save as: scripts/auto-blog-writer.js
//
// What this script does:
//   1. Reads your topic file (title + bullet points)
//   2. Sends it to Gemini AI with a detailed prompt
//   3. Gemini writes a full, high-quality blog post
//   4. Saves the post to posts/
//   5. Publishes it to Hashnode
// ============================================================

const https = require('https')
const fs = require('fs')
const path = require('path')

// ── Config ────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const HASHNODE_API_KEY = process.env.HASHNODE_API_KEY
const HASHNODE_PUBLICATION_TOKEN = process.env.HASHNODE_PUBLICATION_TOKEN
const TOPIC_FILE = process.env.TOPIC_FILE

const POSTS_DIR = path.join(process.cwd(), 'posts')
const PUBLISHED_LOG = path.join(process.cwd(), '.published.json')

// ── Validate environment ──────────────────────────────────────
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set')
  process.exit(1)
}
if (!HASHNODE_API_KEY) {
  console.error('❌ HASHNODE_API_KEY not set (optional for local testing)')
}
if (!HASHNODE_PUBLICATION_TOKEN) {
  console.error(
    '⚠️  HASHNODE_PUBLICATION_TOKEN not set (publication will be skipped)'
  )
}
if (!TOPIC_FILE) {
  console.error('❌ TOPIC_FILE not set')
  process.exit(1)
}
// TOPIC_FILE might be relative or absolute; try both
const topicPathAttempts = [
  TOPIC_FILE,
  path.join(process.cwd(), TOPIC_FILE),
  path.join(process.cwd(), 'topics', TOPIC_FILE)
]
let resolvedTopicFile = null
for (const attempt of topicPathAttempts) {
  if (fs.existsSync(attempt)) {
    resolvedTopicFile = attempt
    break
  }
}
if (!resolvedTopicFile) {
  console.error(`❌ Topic file not found at: ${TOPIC_FILE}`)
  console.error(`   Tried:`, topicPathAttempts)
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────

/** Make an HTTPS POST request */
function post (hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      },
      res => {
        let result = ''
        res.on('data', chunk => (result += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(result))
          } catch (e) {
            reject(new Error(`Could not parse response: ${result}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

/** Parse frontmatter from a markdown file */
function parseFrontmatter (content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content.trim() }

  const meta = {}
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) return
    const key = line.slice(0, colonIndex).trim()
    let val = line
      .slice(colonIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '')

    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
    }
    if (val === 'true') val = true
    if (val === 'false') val = false
    meta[key] = val
  })

  return { meta, body: match[2].trim() }
}

/** Turn filename into a URL-friendly slug */
function toSlug (filename) {
  return path
    .basename(filename, '.md')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Step 1: Read the topic file ───────────────────────────────
function readTopicFile () {
  console.log(`\n📖 Reading topic file: ${resolvedTopicFile}`)
  const content = fs.readFileSync(resolvedTopicFile, 'utf8')
  const { meta, body } = parseFrontmatter(content)

  if (!meta.title) {
    throw new Error('Topic file must have a "title" in the frontmatter')
  }

  console.log(`   Title    : ${meta.title}`)
  console.log(`   Audience : ${meta.audience || 'developers'}`)
  console.log(`   Tags     : ${(meta.tags || []).join(', ')}`)
  console.log(
    `   Bullets  :\n${body
      .split('\n')
      .map(l => '     ' + l)
      .join('\n')}`
  )

  return { meta, bullets: body }
}

// ── Step 2: Call Claude to write the blog post ────────────────
async function writePostWithAI (meta, bullets) {
  console.log('\n🤖 Sending to GEMINI AI...')
  console.log('   This usually takes 20-40 seconds...')

  const prompt = `You are an expert technical blogger writing for Coding Adda, a programming education channel.

Write a complete, high-quality blog post based on the following:

TITLE: ${meta.title}
TARGET AUDIENCE: ${meta.audience || 'beginner to intermediate developers'}
TAGS: ${(meta.tags || []).join(', ')}

OUTLINE (expand each bullet point into a full section):
${bullets}

WRITING INSTRUCTIONS:
- Write in a friendly, conversational tone — like explaining to a friend
- Use simple language. Avoid unnecessary jargon.
- Start with a strong hook — a relatable problem or surprising fact
- Each section should have a clear heading (use ## for sections)
- Include practical code examples where relevant (use proper code blocks)
- Use analogies to explain complex concepts simply
- End with a clear summary and 1-2 actionable next steps for the reader
- Aim for 1200-1800 words — detailed enough to be useful, short enough to read fully
- Do NOT include the title at the top (Hashnode adds it automatically)
- Do NOT include a generic "conclusion" heading — make the ending feel natural

FORMAT: Return ONLY the blog post in markdown. No preamble, no "here is your post", just the content.`

  const response = await post(
    'generativelanguage.googleapis.com',
    `/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
    {},
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }
  )

  if (response.error) {
    throw new Error(`Gemini API error: ${response.error.message}`)
  }

  const content = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    console.error('Gemini response:', JSON.stringify(response, null, 2))
    throw new Error('Gemini returned an empty response')
  }

  console.log(`   ✅ Gemini wrote ${content.split(' ').length} words`)
  return content
}

// ── Step 3: Save the generated post to posts/ folder ─────────
function savePost (meta, content, slug) {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }

  const tags = (meta.tags || []).map(t => `"${t}"`).join(', ')
  const filename = `${slug}.md`
  const filepath = path.join(POSTS_DIR, filename)

  const fileContent = `---
title: "${meta.title}"
tags: [${tags}]
generated: true
generatedAt: "${new Date().toISOString()}"
publish: true
---

${content}
`

  fs.writeFileSync(filepath, fileContent, 'utf8')
  console.log(`\n💾 Saved to: posts/${filename}`)
  return filename
}

// ── Step 4: Publish to Hashnode ───────────────────────────────
async function publishToHashnode (meta, content) {
  console.log('\n🚀 Publishing to Hashnode...')

  const mutation = `
    mutation CreateDraft($input: CreateDraftInput!) {
      createDraft(input: $input) {
        draft {
          id
          title
          slug
          contentMarkdown
        }
      }
    }
  `

  const response = await post(
    'gql.hashnode.com',
    '/',
    { Authorization: `${HASHNODE_API_KEY}` },
    {
      query: mutation,
      variables: {
        input: {
          title: meta.title,
          contentMarkdown: content,
          publicationId: HASHNODE_PUB_ID,
          tags: (meta.tags || []).map(name => ({
            name: name.toLowerCase()
          }))
        }
      }
    }
  )

  if (response.errors) {
    throw new Error(`Hashnode error: ${response.errors[0].message}`)
  }

  if (!response.data?.createDraft?.draft) {
    throw new Error('Hashnode returned unexpected response format')
  }

  const draft = response.data.createDraft.draft
  console.log(`   ✅ Draft created: ${draft.title}`)
  return {
    id: draft.id,
    title: draft.title,
    slug: draft.slug,
    url: `https://hashnode.com/@${meta.hashnode_username || 'user'}/draft/${
      draft.id
    }`
  }
}

// ── Step 5: Update the published log ─────────────────────────
function updateLog (topicFile, postFilename, hashnodePost) {
  let log = {}
  if (fs.existsSync(PUBLISHED_LOG)) {
    log = JSON.parse(fs.readFileSync(PUBLISHED_LOG, 'utf8'))
  }

  log[topicFile] = {
    postFile: postFilename,
    hashnodeId: hashnodePost.id,
    url: hashnodePost.url,
    publishedAt: hashnodePost.publishedAt
  }

  fs.writeFileSync(PUBLISHED_LOG, JSON.stringify(log, null, 2), 'utf8')
  console.log(`\n📋 Log updated: .published.json`)
}

// ── Main ──────────────────────────────────────────────────────
async function main () {
  console.log('=====================================')
  console.log('  🖊️  Auto Blog Writer — Coding Adda')
  console.log('=====================================')

  // Check if this topic was already published
  const log = fs.existsSync(PUBLISHED_LOG)
    ? JSON.parse(fs.readFileSync(PUBLISHED_LOG, 'utf8'))
    : {}

  if (log[resolvedTopicFile]) {
    console.log(`\n⏭️  Already published: ${resolvedTopicFile}`)
    console.log(`   URL: ${log[resolvedTopicFile].url}`)
    console.log('   Delete its entry from .published.json to re-publish.')
    return
  }

  // Run the pipeline
  const { meta, bullets } = readTopicFile()
  const slug = toSlug(TOPIC_FILE)
  const blogContent = await writePostWithAI(meta, bullets)
  const postFilename = savePost(meta, blogContent, slug)

  let hashnodePost
  if (
    meta.publish !== false &&
    HASHNODE_API_KEY &&
    HASHNODE_PUBLICATION_TOKEN
  ) {
    hashnodePost = await publishToHashnode(meta, blogContent)
    updateLog(resolvedTopicFile, postFilename, hashnodePost)
  } else if (meta.publish === false) {
    console.log(
      '\n⏭️  Skipping Hashnode publish (publish: false in frontmatter)'
    )
  } else {
    console.log('\n⚠️  Skipping Hashnode publish (missing API credentials)')
  }

  // Write GitHub Actions step summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = `## ✅ Blog Post Published!

| | |
|---|---|
| **Title** | ${meta.title} |
| **File** | \`posts/${postFilename}\` |
| **Words** | ~${blogContent.split(' ').length} |
${
  hashnodePost
    ? `| **Hashnode URL** | [Read it here](${hashnodePost.url}) |`
    : ''
}
| **Published at** | ${new Date().toUTCString()} |
`
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  }

  console.log('\n=====================================')
  console.log('  ✅ All done!')
  if (hashnodePost) {
    console.log(`  🔗 Live at: ${hashnodePost.url}`)
  }
  console.log('=====================================\n')
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message)
  process.exit(1)
})
