# Vercel Deployment Reminder

## ⚠️ IMPORTANT: Always Deploy to Vercel After Updates

Whenever you update any HTML files in this project, you MUST deploy to Vercel to keep the live site in sync.

---

## 📦 Files That Need Deployment:

### Main Resume & Dashboard:
- `resume.html` - Your main resume (linked from dashboard)
- `job-search-dashboard.html` - Homepage/landing page
- `network-explorer.html` - LinkedIn network visualization
- `ai-tools.html` - AI tools page
- `analyze-linkedin-data.html` - LinkedIn data analysis
- `linkedin-import-converter.html` - LinkedIn data import tool

### Related Data Files:
- `connections-data.js` - LinkedIn connections data
- `target-companies.js` - Target company data

---

## 🚀 Deployment Process:

### Step 1: Commit Changes
```bash
git add <files>
git commit -m "Update: <description>"
git push origin master
```

### Step 2: Deploy to Vercel Production
```bash
vercel --prod
```

**This triggers automatic deployment to:**
- Production URL: https://luis-job-search-k1aq2sdsn-luis-calderons-projects-9c5eea79.vercel.app
- Or your custom domain if configured

---

## 📋 Deployment Checklist:

When updating resume.html or other pages:
- [ ] Make the edits locally
- [ ] Test locally by opening HTML file in browser
- [ ] Commit changes with descriptive message
- [ ] Push to GitHub (`git push origin master`)
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Verify deployment at live URL
- [ ] Check that resume link works from dashboard

---

## 🔗 Current Deployment:

**Live Site:** Check dashboard at Vercel URL
**Dashboard Homepage:** `job-search-dashboard.html` (root `/`)
**Resume Link:** `./resume.html` (linked from dashboard)

---

## 📝 Recent Deployment (2025-12-05):

✅ Deployed resume.html with:
- Fixed SketchPop "30-person team" (not "artist network")
- Updated to "Consumer product leader since 2013"
- Added TurboTax, Ancestry, eBay prominence
- Added conversion metrics from Ancestry and eBay

**Commit:** `06da329`
**Deployment:** Production successful

---

## 💡 Why This Matters:

The job search dashboard is hosted on Vercel and accessible via web browser. If you update files locally but don't deploy, the live site will show outdated information to recruiters and hiring managers who visit your resume.

**Always remember: Local edits → Git push → Vercel deploy**
