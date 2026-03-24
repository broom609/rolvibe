import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SEED_EMAIL = 'seed@rolvibe.com'
const SEED_USERNAME = 'vibecoder_seed'

const apps = [
  {
    name: 'Excalidraw',
    slug: 'excalidraw',
    tagline: 'Virtual collaborative whiteboard for sketching hand-drawn like diagrams',
    description: 'Excalidraw is a whiteboard tool that lets you easily sketch diagrams that have a hand-drawn feel to them. Supports infinite canvas, collaboration, and export to PNG/SVG.',
    category: 'Design Tools',
    built_with: 'Cursor',
    app_url: 'https://excalidraw.com',
    pricing_type: 'free',
    try_count: 24300,
  },
  {
    name: 'tldraw',
    slug: 'tldraw-canvas',
    tagline: 'A tiny little drawing app with infinite canvas and real-time collaboration',
    description: 'tldraw is a collaborative digital whiteboard. It supports vectors, images, sticky notes, and more — all on an infinite canvas.',
    category: 'Design Tools',
    built_with: 'Bolt',
    app_url: 'https://www.tldraw.com',
    pricing_type: 'free',
    try_count: 18750,
  },
  {
    name: 'Squoosh',
    slug: 'squoosh',
    tagline: 'Compress and compare images with different codecs right in your browser',
    description: 'Squoosh is an image compression web app that reduces image sizes using best-in-class codecs. Compare quality and file size side by side before downloading.',
    category: 'Developer Tools',
    built_with: 'Claude',
    app_url: 'https://squoosh.app',
    pricing_type: 'free',
    try_count: 31200,
    is_featured: true,
  },
  {
    name: 'Carbon',
    slug: 'carbon-code',
    tagline: 'Create beautiful images of your source code to share anywhere',
    description: 'Carbon lets you create and share beautiful images of your source code. Choose from 100+ syntax themes, multiple languages, and dozens of export options.',
    category: 'Developer Tools',
    built_with: 'v0',
    app_url: 'https://carbon.now.sh',
    pricing_type: 'free',
    try_count: 45600,
    is_featured: true,
  },
  {
    name: 'JSON Crack',
    slug: 'json-crack',
    tagline: 'Visualize your JSON data as an interactive node graph',
    description: 'JSON Crack seamlessly visualizes your JSON, YAML, CSV, XML, and TOML data into interactive graphs. Explore complex data structures at a glance.',
    category: 'Data & Analytics',
    built_with: 'Lovable',
    app_url: 'https://jsoncrack.com',
    pricing_type: 'freemium',
    price_cents: 700,
    try_count: 12400,
  },
  {
    name: 'IT Tools',
    slug: 'it-tools',
    tagline: '40+ handy developer tools in one beautiful interface',
    description: 'IT Tools is a collection of useful tools for developers. Token generators, converters, encoders, formatters, and more — all offline-capable.',
    category: 'Developer Tools',
    built_with: 'Cursor',
    app_url: 'https://it-tools.tech',
    pricing_type: 'free',
    try_count: 28900,
    is_featured: true,
  },
  {
    name: 'Transform Tools',
    slug: 'transform-tools',
    tagline: 'Transform code between different formats with a single click',
    description: 'Transform is a polyglot web converter. Convert JSON to TypeScript, SVG to React, HTML to Markdown, and dozens of other transformations instantly.',
    category: 'Developer Tools',
    built_with: 'GPT-4',
    app_url: 'https://transform.tools',
    pricing_type: 'free',
    try_count: 9800,
  },
  {
    name: 'Coolors',
    slug: 'coolors-palette',
    tagline: 'Generate perfect color palettes in seconds by pressing the spacebar',
    description: 'Coolors is the super fast color palette generator. Create, save, and share perfect palettes in seconds. Hit spacebar to generate, lock colors you love, and explore millions of combinations.',
    category: 'Design Tools',
    built_with: 'Bolt',
    app_url: 'https://coolors.co/generate',
    pricing_type: 'freemium',
    price_cents: 300,
    try_count: 67200,
    is_featured: true,
  },
  {
    name: 'SVG Viewer',
    slug: 'svg-viewer',
    tagline: 'View, edit, and optimize SVG files right in your browser',
    description: 'SVGViewer is a browser-based SVG editor and optimizer. Paste or upload SVG code, preview it live, optimize it, and copy the result.',
    category: 'Design Tools',
    built_with: 'Windsurf',
    app_url: 'https://www.svgviewer.dev',
    pricing_type: 'free',
    try_count: 14300,
  },
  {
    name: 'Regex101',
    slug: 'regex101',
    tagline: 'Build, test and debug regular expressions with real-time explanations',
    description: 'Regex101 offers a full regex debugger with real-time explanations, error detection, and highlighting. Supports PCRE, Python, Go, and JavaScript flavors.',
    category: 'Developer Tools',
    built_with: 'Claude',
    app_url: 'https://regex101.com',
    pricing_type: 'free',
    try_count: 52100,
  },
  {
    name: 'Pomofocus',
    slug: 'pomofocus',
    tagline: 'A customizable Pomodoro timer to boost your focus and productivity',
    description: 'Pomofocus is a clean, customizable Pomodoro timer. Set your work and break intervals, track your sessions, and build better focus habits.',
    category: 'Productivity',
    built_with: 'Replit',
    app_url: 'https://pomofocus.io',
    pricing_type: 'free',
    try_count: 33500,
  },
  {
    name: 'CSS Grid Generator',
    slug: 'css-grid-generator',
    tagline: 'Visually build CSS grid layouts and copy the code instantly',
    description: 'CSS Grid Generator helps you design CSS grid layouts with a visual editor. Set rows, columns, and gaps, then copy the generated CSS and HTML with one click.',
    category: 'AI/Coding',
    built_with: 'v0',
    app_url: 'https://cssgrid-generator.netlify.app',
    pricing_type: 'free',
    try_count: 7600,
  },
  {
    name: 'CSS Gradient',
    slug: 'css-gradient',
    tagline: 'Create stunning CSS gradients with a beautiful visual editor',
    description: 'CSS Gradient is a free CSS gradient generator. Create linear, radial, and conic gradients with a visual editor and instantly copy the CSS code.',
    category: 'Design Tools',
    built_with: 'Lovable',
    app_url: 'https://cssgradient.io',
    pricing_type: 'free',
    try_count: 19400,
  },
  {
    name: 'Flexbox Froggy',
    slug: 'flexbox-froggy',
    tagline: 'Learn CSS Flexbox by helping Froggy and friends reach their lily pads',
    description: 'Flexbox Froggy is a fun game for learning CSS Flexbox. Write CSS code to move frogs to their lily pads through 24 progressively challenging levels.',
    category: 'Education',
    built_with: 'Cursor',
    app_url: 'https://flexboxfroggy.com',
    pricing_type: 'free',
    try_count: 41800,
  },
  {
    name: 'Grid Garden',
    slug: 'grid-garden',
    tagline: 'Water your carrot garden by learning CSS Grid in 28 levels',
    description: 'Grid Garden is a game where you write CSS grid code to grow your carrot garden. 28 levels teach you the full CSS Grid specification in a fun way.',
    category: 'Education',
    built_with: 'Bolt',
    app_url: 'https://cssgridgarden.com',
    pricing_type: 'free',
    try_count: 28700,
  },
  {
    name: 'Type Scale',
    slug: 'type-scale',
    tagline: 'Visual typography scale tool for designers and developers',
    description: 'Type Scale helps you create harmonious type hierarchies. Choose a base size, ratio, and font — get a ready-to-use CSS type scale with live preview.',
    category: 'Design Tools',
    built_with: 'GPT-4',
    app_url: 'https://typescale.com',
    pricing_type: 'free',
    try_count: 11200,
  },
  {
    name: 'Lofi Cafe',
    slug: 'lofi-cafe',
    tagline: 'Cozy lofi music streams for working, studying, and relaxing',
    description: 'Lofi Cafe is a virtual café with curated lofi hip-hop streams. Pick a scene — rainy day, cozy cabin, city window — and focus to ambient beats.',
    category: 'Music',
    built_with: 'Claude',
    app_url: 'https://lofi.cafe',
    pricing_type: 'free',
    try_count: 88400,
    is_featured: true,
  },
  {
    name: 'Calmly Writer',
    slug: 'calmly-writer',
    tagline: 'Minimal, distraction-free writing app with focus mode',
    description: 'Calmly Writer is a clean, distraction-free writing environment. Focus mode dims everything except the paragraph you\'re working on. Exports to PDF, DOCX, and HTML.',
    category: 'Writing',
    built_with: 'Windsurf',
    app_url: 'https://www.calmlywriter.com/online',
    pricing_type: 'freemium',
    price_cents: 900,
    try_count: 16700,
  },
  {
    name: 'MindMup',
    slug: 'mindmup',
    tagline: 'Fast, free mind mapping in the browser with real-time collaboration',
    description: 'MindMup is a zero-friction mind mapping tool. Create mind maps in your browser, collaborate in real-time, and export to Google Drive, PDF, or MindMup format.',
    category: 'Productivity',
    built_with: 'Replit',
    app_url: 'https://app.mindmup.com',
    pricing_type: 'freemium',
    price_cents: 500,
    try_count: 22300,
  },
  {
    name: 'Photopea',
    slug: 'photopea',
    tagline: 'Advanced image editor with Photoshop-level features, free in your browser',
    description: 'Photopea is a powerful online photo editor that supports PSD, XCF, Sketch, and hundreds of image formats. Edit professional designs without installing anything.',
    category: 'Design Tools',
    built_with: 'GPT-4',
    app_url: 'https://www.photopea.com',
    pricing_type: 'freemium',
    price_cents: 1000,
    try_count: 142000,
    is_featured: true,
  },
]

async function main() {
  console.log('🌱 Starting seed...\n')

  // Step 1: Create or find seed auth user
  console.log('Creating seed user...')
  let seedUserId: string

  const { data: listData } = await admin.auth.admin.listUsers()
  const existing = listData?.users?.find(u => u.email === SEED_EMAIL)

  if (existing) {
    seedUserId = existing.id
    console.log(`  Found existing seed user: ${seedUserId}`)
  } else {
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: SEED_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: 'Vibe Coder Seed' },
    })
    if (createError || !newUser?.user) {
      console.error('  Failed to create seed user:', createError?.message)
      process.exit(1)
    }
    seedUserId = newUser.user.id
    console.log(`  Created seed user: ${seedUserId}`)
  }

  // Step 2: Upsert seed profile
  console.log('Upserting seed profile...')
  const { error: profileError } = await admin.from('profiles').upsert({
    id: seedUserId,
    username: SEED_USERNAME,
    display_name: 'Vibe Coder',
    bio: 'Discovering the best vibe-coded apps on the internet.',
    role: 'creator',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('  Failed to upsert profile:', profileError.message)
    process.exit(1)
  }
  console.log('  Profile upserted\n')

  // Step 3: Insert apps
  console.log(`Inserting ${apps.length} apps...`)
  let successCount = 0
  let skipCount = 0

  for (const app of apps) {
    const thumbnail = `https://picsum.photos/seed/${app.slug}/800/450`

    const { error } = await admin.from('apps').upsert({
      creator_id: seedUserId,
      name: app.name,
      slug: app.slug,
      tagline: app.tagline,
      description: app.description,
      category: app.category,
      built_with: app.built_with,
      app_url: app.app_url,
      pricing_type: app.pricing_type,
      price_cents: app.price_cents ?? null,
      subscription_price_cents: null,
      thumbnail_url: thumbnail,
      status: 'active',
      is_featured: app.is_featured ?? false,
      try_count: app.try_count,
      favorite_count: Math.floor(app.try_count * 0.07),
      score: app.try_count + (app.is_featured ? 10000 : 0),
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'slug' })

    if (error) {
      console.log(`  ⚠  ${app.name}: ${error.message}`)
      skipCount++
    } else {
      console.log(`  ✓  ${app.name}`)
      successCount++
    }
  }

  console.log(`\n✅ Done! ${successCount} apps seeded, ${skipCount} skipped.`)
  console.log(`   Creator: @${SEED_USERNAME} (${seedUserId})`)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
