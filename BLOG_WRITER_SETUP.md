# 🖊️ Auto Blog Writer — Complete Setup Guide

This GitHub Actions workflow automatically writes full blog posts from your topic ideas using **Google Gemini API** and publishes them to **Hashnode**.

## How It Works

1. **You write**: Create a simple topic file with bullet points in `topics/`
2. **AI writes**: Gemini expands your bullets into a full, professional blog post
3. **Auto-publish**: The workflow publishes to Hashnode and commits the generated post to your repo
4. **Done**: Your blog post is live and saved

```
topics/my-topic.md         (your outline)
        ↓
   Gemini AI               (expands to full post)
        ↓
 Hashnode API              (publishes)
        ↓
posts/my-topic.md          (saved to repo)
```

---

## Prerequisites

### 1. **Google Gemini API Key**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API Key** → **Create API key in new project**
3. Copy the API key

### 2. **Hashnode Account & Publication ID**
1. If you don't have a Hashnode blog, create one at [hashnode.com](https://hashnode.com)
2. Go to your blog settings → **Developer**
3. Find your **Publication ID** (format: `pub-xxxxxxxxxxxxx`)
4. Generate an **API key** for write access

### 3. **GitHub Repository Setup**

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these three secrets:

| Secret Name | Value | Where to Get |
|---|---|---|
| `GEMINI_API_KEY` | Your Gemini API key | https://aistudio.google.com/ |
| `HASHNODE_API_KEY` | Your Hashnode API key | hashnode.com → Settings → Developer |
| `HASHNODE_PUBLICATION_ID` | Your publication ID | hashnode.com/@yourname/settings |

---

## Usage

### Create a Topic File

Create a new file in the `topics/` folder with **YAML frontmatter** + **bullet points**:

**File**: `topics/my-awesome-article.md`

```markdown
---
title: "Why Every Developer Should Learn Docker in 2025"
tags: ["docker", "devops", "containers"]
audience: "beginner developers"
publish: true
---

- Docker solves the "works on my machine" problem
- Difference between containers and virtual machines
- Essential Docker commands every dev should know
- How to create a Dockerfile from scratch
- Docker Compose for multi-container apps
- Best practices for production Docker deployment
```

### Trigger the Workflow

#### Option 1: Auto-trigger (Push to main)
```bash
git add topics/my-awesome-article.md
git commit -m "Add topic for Docker guide"
git push origin main
```
The workflow triggers automatically and generates + publishes your post.

#### Option 2: Manual trigger (GitHub UI)
1. Go to **Actions** → **Auto Blog Writer**
2. Click **Run workflow**
3. Enter the topic file path: `topics/my-awesome-article.md`
4. Click **Run workflow**

---

## Frontmatter Explained

```yaml
title: "Your Blog Post Title"           # Required: The heading
tags: ["tag1", "tag2", "tag3"]          # Optional: Blog tags (max 3-4 recommended)
audience: "beginner developers"         # Optional: Target audience (helps AI tailor content)
publish: true                           # Default: false. Set to true to publish to Hashnode
```

- **publish: false** → Generates post and saves to `posts/` but doesn't publish to Hashnode (good for drafts!)
- **publish: true** → Full publish to Hashnode + saves locally

---

## What Happens

### Step-by-step Workflow

1. **Detect change** — Workflow detects new file in `topics/`
2. **Read topic file** — Parses YAML frontmatter and bullet points
3. **Call Gemini** — Sends to Google Gemini with a detailed writing prompt
4. **Generate post** — Gemini writes a full, SEO-friendly blog post (~1200-1800 words)
5. **Publish** — If `publish: true`, publishes to Hashnode
6. **Commit** — Saves generated post to `posts/` and commits to repo
7. **Log** — Updates `.published.json` with metadata

### Example Output

After running, you'll see:

- ✅ **New file**: `posts/my-topic.md` — Full blog post
- ✅ **Updated**: `.published.json` — Track of all published posts
- ✅ **Live**: Your blog post on Hashnode (if `publish: true`)
- ✅ **GitHub**: Automatic commit with the generated post

---

## Example Topic Files

### Example 1: Node.js Beginners Guide

```markdown
---
title: "Getting Started with Node.js: A Beginner's Roadmap"
tags: ["nodejs", "javascript", "beginner"]
audience: "beginners with JavaScript knowledge"
publish: true
---

- What is Node.js and why is it useful
- Difference between client-side and server-side JavaScript
- Installing Node.js and npm on your machine
- Creating and running your first Node.js script
- Understanding the Node Package Manager (npm)
- Popular npm packages for beginners
- Building a simple HTTP server
- Debugging and common beginner mistakes
```

### Example 2: React Performance Tips

```markdown
---
title: "5 Critical React Performance Optimizations You're Probably Missing"
tags: ["react", "performance", "javascript"]
audience: "intermediate React developers"
publish: true
---

- Why React performance matters (real-world impact metrics)
- The render cycle and React's reconciliation algorithm  
- useMemo: When and why to memoize computations
- useCallback: Preventing unnecessary function re-creations
- Code splitting with dynamic imports
- Profiling React apps with DevTools
- Common performance pitfalls and debugging
```

---

## Customizing the Prompt (Advanced)

The Gemini prompt is hard-coded in `scripts/auto-blog-writer.js`. To customize the writing style:

1. Open `scripts/auto-blog-writer.js`
2. Find the `prompt` variable (around line 80)
3. Modify the styling instructions:
   - Change "conversational tone" to "technical deep-dive"
   - Adjust word count targets
   - Add specific formatting preferences
4. Commit and test

---

## Troubleshooting

### ❌ "GEMINI_API_KEY not set"
- Add the `GEMINI_API_KEY` secret to GitHub Settings → Secrets

### ❌ "Hashnode error: Unauthorized"
- Check that `HASHNODE_API_KEY` is correct and hasn't expired
- Ensure `HASHNODE_PUBLICATION_ID` matches your blog

### ❌ "Topic file not found"
- Make sure file is in `topics/` (not `topic/`)
- Check the filename in the workflow run logs

### ❌ "Gemini returned empty response"
- Check your API quota at https://aistudio.google.com/
- Try a simpler topic with fewer bullets
- Wait a few minutes and retry

### ✅ "Published but not visible on Hashnode"
- Check `.published.json` for the post URL
- Sometimes takes 5-10 seconds to appear live
- Verify `HASHNODE_PUBLICATION_ID` is correct

---

## Tips & Best Practices

### Writing Better Bullet Points

❌ **Too vague**:
- React is cool
- Components are good
- State management

✅ **Better**:
- What is React and why companies use it today
- Understanding functional components vs class components
- Managing state with useState and useContext
- Common state management mistakes

### Controlling Output Quality

- **More bullets** → More comprehensive post
- **Detailed bullets** → Better AI understanding → Better output
- **Include numbers/stats** → Makes content more credible
- **Mention specific tools** → AI includes real examples

### Tags Guidelines

- Use 2-5 tags (not too many)
- Use common tags (easier discovery)
- Examples: `react`, `nodejs`, `devops`, `docker`, `web3`, etc.

---

## File Structure

```
your-repo/
├── .github/
│   └── workflows/
│       └── blog-writer.yml           ← The automation workflow
├── scripts/
│   ├── auto-blog-writer.js           ← The magic script
│   └── generate-readme.js
├── topics/                           ← 📝 You write here
│   ├── example-docker-guide.md
│   └── my-nodejs-article.md
├── posts/                            ← 📄 Generated posts are saved here
│   ├── docker-guide.md
│   └── nodejs-article.md
└── .published.json                   ← 📋 Log of all published posts
```

---

## Quick Start

1. Add secrets to GitHub (3 minutes)
2. Create `topics/my-first-post.md` (5 minutes)
3. Push to main
4. Wait for workflow to complete (1-2 minutes)
5. Check [hashnode.com/@yourname](https://hashnode.com) for your new post! ✨

---

## FAQ

**Q: Can I edit published posts?**
A: Yes! Edit `posts/my-post.md` and manually update on Hashnode, or delete `.published.json` entry and re-run.

**Q: What if I don't want to publish to Hashnode?**
A: Set `publish: false` in frontmatter. Post gets generated + saved locally but not published.

**Q: Can I use this with a different AI service?**
A: Sure! Modify `auto-blog-writer.js` to call Claude, ChatGPT, etc. (just update the API calls)

**Q: How long does it take?**
A: Usually 30-60 seconds for Gemini to write, 10-20 seconds to publish.

**Q: What if Gemini writes poor content?**
A: The output is only as good as your prompts. Better bullet points = better posts. Edit `.js` prompt for style tweaks.

---

## Support

- 🐛 **Bug?** Check GitHub Issues
- 💬 **Feature request?** Open a discussion
- 🎓 **Need help?** See examples in `topics/example-*.md`

Happy blogging! ✨📝

