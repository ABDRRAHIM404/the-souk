**Design & UX Analysis Document**

**1. Product Understanding**
The Souk is a culture-led marketplace that connects tourists with Moroccan cooperatives, starting with Souss-Massa. It is part ecommerce platform, part tourism discovery layer, part cooperative SaaS tool.

Target audiences:
- Tourists: want authentic products, cultural context, ethical buying, memorable regional discovery.
- Cooperative owners: need a simple storefront, product management, orders, profile storytelling, and credibility.
- Admins/partners: tourism offices, local organizations, incubators, and platform operators who need trust, quality, verification, and regional analytics.

Core value proposition:
The platform turns local cooperatives into discoverable digital storefronts while helping tourists buy with confidence and understand the cultural story behind each product.

Startup positioning:
“Shop and discover Morocco through verified local cooperatives.” The strongest positioning is not just marketplace. It is ethical tourism infrastructure.

Current product logic:
The current app is React/Vite, Express, MongoDB, not Next.js yet. If SEO and tourism discovery become core, a future Next.js migration or hybrid public frontend would make sense for destination/product/cooperative pages.

**2. Complete Page & Screen Mapping**
Current public pages:
- Home: brand story, search entry, featured products, featured cooperatives, trust signals, CTA to marketplace/signup.
- Marketplace: product discovery, filters, sort, grid/list layout, wishlist, add to cart.
- Product detail: product imagery, price, stock, cooperative story, reviews, cart/wishlist actions.
- Cooperative profile: cooperative identity, products, about, reviews, follow action.
- Login/signup: role-based onboarding for tourist vs cooperative owner.

Needed public/tourism pages:
- Experiences page: tours, workshops, tastings, artisan visits.
- Destination pages: Agadir, Tiznit, Taroudant, Tafraout, Taghazout, Taliouine.
- Culture guide pages: argan, saffron, pottery, carpets, Amazigh heritage.
- Search results page: unified search across products, cooperatives, destinations, experiences.
- Trust/verification page: explains cooperative verification, fair trade claims, payment/delivery.
- About/impact page: platform mission, regional economic impact, partner credibility.
- Help/FAQ: shipping, returns, cash on delivery, cooperative onboarding.

Current protected pages:
- Tourist dashboard: wishlist, reviews, settings.
- Coop dashboard: products, reviews, settings.
- Checkout: shipping info, order summary, cash on delivery.
- Cart drawer: lightweight purchase staging.

Needed dashboard/admin pages:
- Tourist orders page/tab: order history, status tracking, reorder.
- Coop orders page: incoming orders, status updates, customer info.
- Coop analytics: revenue, product views, conversion, stock alerts.
- Admin dashboard: users, coops, products, orders, reviews, verification queue.
- Admin content manager: destinations, homepage features, categories, region metadata.
- Admin moderation: reported products/reviews, certification review, fraud/risk flags.

Mobile needs:
Every page should prioritize one primary action. Marketplace filters become bottom sheet. Product CTAs become sticky bottom bar. Dashboards become tabbed stacked panels, not tables.

**3. User Flows**
Tourist journey:
Entry from homepage, search, destination page, marketplace, or shared product link. Tourist browses products/coops, filters by region/category, views story, adds to wishlist/cart, checks out, then tracks order/reviews product. Friction points: needing login before cart/wishlist, unclear delivery expectations, limited tourism content. Improve with guest cart, clearer trust badges, product story snippets, and order tracking.

Cooperative owner journey:
Signup as cooperative, create profile, add products, receive orders, update statuses, read reviews, improve storefront. Friction points: missing cooperative profile state was blocking product upload; now fixed. Future improvement: onboarding checklist, profile completeness score, image guidance, product quality tips.

Admin journey:
Review new cooperative applications, verify identity, moderate products, manage featured content, monitor orders and platform health. This does not exist yet but is important for investor-level credibility.

**4. Design System Strategy**
Visual identity:
Premium Moroccan craft meets modern SaaS. Keep terracotta, teal, gold, warm white, dark brown, but reduce overuse of warm beige blocks by adding neutral white, ink, soft green, clay, and occasional cobalt.

UI philosophy:
Public pages should feel editorial and immersive. Dashboards should feel efficient, quiet, and operational. Do not use the same decorative language everywhere.

Typography:
Use expressive serif for brand/editorial headings. Use a clean humanist sans for UI labels, forms, dashboards, and dense content. Tighten hierarchy: hero headings large, dashboard headings compact.

Spacing:
Use an 8px system. Public sections: 64-96px vertical rhythm desktop, 40-56px mobile. Dashboard: 16-24px rhythm, denser cards, clear tab structure.

Cards:
Product/cooperative cards should be consistent, image-first, with stable aspect ratios. Dashboard cards should be flatter, less shadow-heavy, and easier to scan.

Buttons:
Primary: terracotta filled. Secondary: white/outlined. Tertiary: text/icon. Destructive: red. Dashboard actions should use icons where obvious.

Motion:
Use subtle page reveals, hover lift for product cards, drawer slide, toast transitions. Avoid motion that makes dashboards feel slow.

Dark mode:
Not necessary first. If added, keep public pages warm-dark and dashboards neutral-dark. Do not simply invert colors.

**5. Component Architecture**
Core reusable components:
- App shell: navbar, footer, mobile nav, cart drawer.
- Discovery: search bar, category chips, region filters, sort menu, pagination, empty states.
- Commerce: product card, product image gallery, price block, stock badge, add-to-cart button, wishlist button.
- Cooperative: coop card, profile header, verification badge, impact stats, gallery, follow button.
- Tourism: destination card, experience card, itinerary card, map preview, cultural story block.
- Trust: review card, rating summary, certification badge, impact metric, partner logo strip.
- Dashboard: sidebar/tab nav, stat card, product table/list, order table, status chip, analytics chart card.
- Forms: field wrapper, file upload, image preview, modal, confirmation dialog, stepper.
- Feedback: toast, skeleton loader, error block, success state, onboarding checklist.
- Admin: data table, moderation queue item, verification panel, content editor module.

UX best practice:
Components should carry consistent states: loading, empty, error, disabled, success, mobile layout.

**6. Information Architecture**
Top navigation:
Home, Marketplace, Cooperatives, Experiences, Destinations, About/Impact. Auth area becomes Login/Join or Dashboard/Profile/Cart.

Marketplace taxonomy:
Products by category, region, cooperative, availability, certification, price, popularity.

Tourism taxonomy:
Regions -> cities -> experiences -> cooperative/product connections. This is where Next.js SEO would help: static/SSR pages for `/destinations/agadir`, `/culture/argan-oil`, `/coops/:slug`, `/products/:slug`.

Dashboard IA:
Tourist: Overview, Orders, Wishlist, Reviews, Settings.
Coop: Overview, Products, Orders, Reviews, Profile, Analytics, Settings.
Admin: Overview, Coops, Products, Orders, Users, Reviews, Content, Verification.

**7. Homepage Strategy**
Ideal order:
1. Immersive hero: “The Souk” as brand signal, real Moroccan cooperative/product imagery, search by product/region.
2. Trust strip: verified coops, cash on delivery, fair trade, regional focus.
3. Discovery paths: Shop products, meet cooperatives, explore experiences.
4. Featured products: high-quality product cards.
5. Featured cooperatives: faces/stories/regions.
6. Regional story: Souss-Massa map or city cards.
7. Impact section: artisans supported, cooperatives onboarded, orders delivered.
8. CTA split: tourist CTA and cooperative CTA.
9. Footer with trust/help/partner links.

Emotional impact:
The homepage should feel like entering a modern cultural marketplace, not a generic ecommerce landing page.

**8. Mobile UX Strategy**
Mobile priorities:
- Sticky bottom product CTA on product detail.
- Filter bottom sheet in marketplace.
- Cart drawer full-screen on small screens.
- Dashboard tabs as horizontal scroll or segmented control.
- Product/cooperative cards should show image, name, price/status, one action.
- Avoid wide tables; use stacked order/product cards.

Performance:
Compress images, lazy-load media, paginate aggressively, use skeleton states, avoid heavy homepage sections above the fold.

**9. Startup / Investor Presentation Quality**
For a hackathon:
Show end-to-end flow: tourist discovers product, buys, coop receives order.

For investors:
Show market logic: tourism + local commerce + cooperative SaaS. Add metrics surfaces, verification, regional expansion model.

For tourism organizations:
Emphasize cultural preservation, regional discovery, cooperative empowerment, trust, and measurable impact.

For cooperatives:
The UI must feel simple, not intimidating. Use plain language, progress checklists, guided product upload, and clear order workflow.

Professional trust signals:
Verified badges, partner section, transparent shipping/payment, review quality, cooperative stories, admin moderation, strong image quality.

**10. Missing Features & UX Gaps**
Missing major flows:
- Admin dashboard.
- Order tracking detail page.
- Coop order management UI if not fully exposed.
- Tourism experiences and booking flow.
- Destination/culture pages.
- Unified search.
- Guest cart.
- Returns/refunds/help flow.
- Verification application flow.
- Product image quality guidance.
- Notifications.
- Analytics for coops.
- Slug-based SEO URLs.
- Better product recommendations.
- Accessibility pass: focus states, keyboard drawer behavior, semantic buttons, alt text, contrast.
- Monetization: commission, featured listings, cooperative subscription tiers, tourism partner placements, promoted experiences.

Scalability risks:
Current inline styling and repeated card patterns will slow visual consistency. Move toward shared design tokens, reusable layout primitives, and consistent data shapes.

**11. Final Design Direction**
Design the platform as a premium cultural commerce SaaS: editorial discovery for tourists, operational clarity for cooperatives, and institutional trust for partners/admins.

The product should feel:
- Warm, human, and regionally specific.
- Clean enough for investors.
- Simple enough for cooperatives.
- Rich enough for tourists.
- Structured enough to scale into destinations, experiences, products, and admin operations.

Best next design move:
Create a full design blueprint for three pillars: public discovery, tourist commerce, and cooperative SaaS dashboard. Then redesign one flow end-to-end first: homepage -> marketplace -> product detail -> cart -> checkout.

---

**12. Sitemap & Page Hierarchy**

Legend:
- `[Current]` exists in the React/Vite app today.
- `[Planned]` should be designed for the full platform vision.
- `[Future/SEO]` is especially valuable if the public layer moves to Next.js or another SSR/SSG setup.
- `[Modal/Drawer]` is not a route, but is part of the navigational experience.

```text
/
├── Home [Current]
│   ├── Hero search
│   ├── Featured products
│   ├── Featured cooperatives
│   ├── Regional/cultural storytelling
│   ├── Trust and impact blocks
│   └── Tourist/cooperative CTA paths
│
├── Marketplace [Current]
│   └── /marketplace
│       ├── Product grid/list
│       ├── Category filters
│       ├── Region filters
│       ├── Sort controls
│       ├── Pagination
│       ├── Wishlist actions
│       └── Add-to-cart actions
│
├── Products
│   ├── /products/:id [Current]
│   │   ├── Product image gallery
│   │   ├── Product details
│   │   ├── Price, stock, fair-trade badge
│   │   ├── Add to cart
│   │   ├── Wishlist
│   │   ├── Cooperative preview
│   │   ├── Reviews
│   │   └── Related products [Planned]
│   ├── /products/:slug [Future/SEO]
│   ├── /products/category/:category [Future/SEO]
│   └── /products/region/:region [Future/SEO]
│
├── Cooperatives
│   ├── /coops/:id [Current]
│   │   ├── Cooperative profile header
│   │   ├── Verification/impact badges
│   │   ├── Products tab
│   │   ├── About/story tab
│   │   ├── Reviews tab
│   │   ├── Gallery/lightbox
│   │   └── Follow action
│   ├── /cooperatives [Planned]
│   │   ├── Cooperative directory
│   │   ├── Region filter
│   │   ├── Category filter
│   │   └── Verification filter
│   ├── /cooperatives/:slug [Future/SEO]
│   ├── /cooperatives/apply [Planned]
│   │   ├── Eligibility
│   │   ├── Cooperative profile setup
│   │   ├── Documents/verification upload
│   │   └── Submission confirmation
│   └── /cooperatives/verification [Planned]
│       ├── Verification requirements
│       ├── Fair-trade explanation
│       └── Trust policy
│
├── Tourism Discovery [Planned]
│   ├── /destinations [Planned]
│   │   ├── Regional overview
│   │   ├── City cards
│   │   ├── Map preview
│   │   └── Recommended products/experiences
│   ├── /destinations/:city [Future/SEO]
│   │   ├── City hero
│   │   ├── Cultural highlights
│   │   ├── Local cooperatives
│   │   ├── Local products
│   │   ├── Experiences/workshops
│   │   └── Travel tips
│   ├── /experiences [Planned]
│   │   ├── Experience listing
│   │   ├── Workshop/tour filters
│   │   ├── Date/availability filters
│   │   └── Region filters
│   ├── /experiences/:id [Planned]
│   │   ├── Experience details
│   │   ├── Host/cooperative info
│   │   ├── Availability
│   │   ├── Booking widget
│   │   ├── Reviews
│   │   └── Related products
│   └── /itineraries [Planned]
│       ├── Suggested routes
│       ├── Cultural themes
│       └── Shop/visit pairings
│
├── Culture & Content [Planned/Future SEO]
│   ├── /culture [Planned]
│   │   ├── Cultural guide index
│   │   ├── Craft categories
│   │   ├── Regional stories
│   │   └── Educational articles
│   ├── /culture/argan-oil [Future/SEO]
│   ├── /culture/amazigh-carpets [Future/SEO]
│   ├── /culture/saffron [Future/SEO]
│   ├── /culture/pottery [Future/SEO]
│   └── /journal/:slug [Future/SEO]
│
├── Search [Planned]
│   └── /search
│       ├── Unified results
│       ├── Products
│       ├── Cooperatives
│       ├── Destinations
│       ├── Experiences
│       └── Articles/culture
│
├── Cart & Checkout
│   ├── Cart drawer [Current, Modal/Drawer]
│   │   ├── Cart items
│   │   ├── Quantity controls
│   │   ├── Remove item
│   │   ├── Total
│   │   └── Checkout CTA
│   ├── /checkout [Current]
│   │   ├── Shipping address
│   │   ├── Order summary grouped by cooperative
│   │   ├── Cash on delivery
│   │   └── Place order
│   ├── /checkout/success/:orderId [Planned]
│   └── /orders/:id/track [Planned]
│
├── Authentication [Current]
│   ├── /login
│   │   ├── Email/password
│   │   ├── Redirect by role
│   │   └── Signup link
│   ├── /signup
│   │   ├── Tourist signup
│   │   ├── Cooperative owner signup
│   │   ├── Cooperative basics
│   │   └── Role-based redirect
│   ├── /forgot-password [Planned]
│   ├── /reset-password/:token [Planned]
│   └── /onboarding [Planned]
│       ├── Tourist preferences
│       ├── Cooperative profile checklist
│       └── First action guidance
│
├── Tourist Dashboard
│   ├── /dashboard [Current redirect]
│   └── /dashboard/tourist [Current]
│       ├── Overview [Planned]
│       │   ├── Recent orders
│       │   ├── Saved products
│       │   └── Recommended experiences
│       ├── Wishlist [Current]
│       ├── Reviews [Current]
│       ├── Orders [Planned]
│       │   ├── Order list
│       │   ├── Order status
│       │   ├── Reorder
│       │   └── Review purchased product
│       ├── Bookings [Planned]
│       ├── Saved cooperatives [Planned]
│       └── Settings [Current]
│           ├── Profile details
│           ├── Country
│           ├── Email/password
│           └── Notification preferences [Planned]
│
├── Cooperative Dashboard
│   ├── /dashboard/coop [Current]
│   │   ├── Overview [Planned]
│   │   │   ├── Sales summary
│   │   │   ├── Pending orders
│   │   │   ├── Product performance
│   │   │   └── Profile completeness
│   │   ├── Products [Current]
│   │   │   ├── Product table/list
│   │   │   ├── Add product modal
│   │   │   ├── Edit product modal
│   │   │   ├── Delete product modal
│   │   │   └── Stock states
│   │   ├── Orders [Planned/Partially backed by API]
│   │   │   ├── Incoming orders
│   │   │   ├── Customer shipping details
│   │   │   ├── Status updates
│   │   │   └── Fulfillment history
│   │   ├── Reviews [Current]
│   │   ├── Cooperative profile [Current in Settings]
│   │   │   ├── Name
│   │   │   ├── City/region
│   │   │   ├── Description
│   │   │   ├── Impact statement
│   │   │   ├── Artisan count
│   │   │   └── Founded year
│   │   ├── Analytics [Planned]
│   │   │   ├── Revenue
│   │   │   ├── Product views
│   │   │   ├── Conversion
│   │   │   ├── Stock alerts
│   │   │   └── Repeat customers
│   │   └── Settings [Current]
│   │       ├── Account profile
│   │       ├── Email/password
│   │       └── Notifications [Planned]
│   └── /dashboard/coop/onboarding [Planned]
│       ├── Create cooperative profile
│       ├── Upload first product
│       ├── Add images
│       ├── Set delivery/payment expectations
│       └── Submit for verification
│
├── Admin Platform [Planned]
│   ├── /admin
│   │   ├── Platform overview
│   │   ├── GMV/orders/users/coops metrics
│   │   └── Operational alerts
│   ├── /admin/users
│   │   ├── Tourist accounts
│   │   ├── Cooperative owners
│   │   └── Account status
│   ├── /admin/cooperatives
│   │   ├── Cooperative directory
│   │   ├── Verification status
│   │   ├── Profile quality
│   │   └── Suspend/approve actions
│   ├── /admin/cooperatives/:id
│   │   ├── Cooperative details
│   │   ├── Products
│   │   ├── Orders
│   │   ├── Reviews
│   │   └── Verification history
│   ├── /admin/products
│   │   ├── Product moderation
│   │   ├── Category assignment
│   │   ├── Image quality checks
│   │   └── Featured product controls
│   ├── /admin/orders
│   │   ├── Order list
│   │   ├── Status monitoring
│   │   └── Dispute flags
│   ├── /admin/reviews
│   │   ├── Review moderation
│   │   ├── Reported reviews
│   │   └── Abuse detection
│   ├── /admin/content
│   │   ├── Homepage modules
│   │   ├── Destination pages
│   │   ├── Culture articles
│   │   └── Featured collections
│   └── /admin/settings
│       ├── Categories
│       ├── Regions/cities
│       ├── Verification rules
│       ├── Commission settings
│       └── Platform roles
│
├── Trust, Support & Business Pages [Planned]
│   ├── /about
│   │   ├── Mission
│   │   ├── Regional focus
│   │   └── Team/partners
│   ├── /impact
│   │   ├── Artisan impact
│   │   ├── Cooperative growth
│   │   └── Regional metrics
│   ├── /trust
│   │   ├── Verification process
│   │   ├── Fair-trade standards
│   │   └── Buyer protection
│   ├── /help
│   │   ├── Buyer FAQ
│   │   ├── Cooperative FAQ
│   │   ├── Shipping and delivery
│   │   ├── Cash on delivery
│   │   └── Returns/refunds
│   ├── /contact
│   ├── /partners
│   │   ├── Tourism organizations
│   │   ├── NGOs/incubators
│   │   └── Local government
│   ├── /pricing [Planned SaaS/business]
│   │   ├── Cooperative free tier
│   │   ├── Featured listing tier
│   │   └── Partner/enterprise plan
│   ├── /privacy
│   ├── /terms
│   └── /cookies
│
└── System Routes & States
    ├── /404 [Planned]
    ├── /500 [Planned]
    ├── /maintenance [Planned]
    ├── Loading states
    ├── Empty states
    ├── Error states
    ├── Unauthorized/role mismatch redirects [Current]
    └── Expired session redirects [Current]
```

**Primary Navigation Recommendation**

```text
Desktop public nav
├── Marketplace
├── Cooperatives
├── Experiences
├── Destinations
├── About/Impact
└── Login / Join / Dashboard / Cart

Mobile public nav
├── Search
├── Marketplace
├── Experiences
├── Cooperatives
├── Destinations
├── Dashboard or Login
└── Cart
```

**Dashboard Navigation Recommendation**

```text
Tourist dashboard
├── Overview
├── Orders
├── Wishlist
├── Reviews
├── Bookings
└── Settings

Cooperative dashboard
├── Overview
├── Products
├── Orders
├── Reviews
├── Profile
├── Analytics
└── Settings

Admin dashboard
├── Overview
├── Users
├── Cooperatives
├── Products
├── Orders
├── Reviews
├── Content
├── Verification
└── Settings
```

**Implementation Priority**

```text
Phase 1 - Current product completion
├── Fix marketplace pagination UX
├── Add tourist orders UI
├── Add cooperative orders UI
├── Add order detail/tracking page
└── Improve empty/error/loading states

Phase 2 - Tourism discovery layer
├── Destinations index
├── Destination detail pages
├── Experiences index
├── Experience detail/booking flow
└── Culture guide pages

Phase 3 - SaaS/admin layer
├── Cooperative analytics
├── Admin dashboard
├── Verification queue
├── Content management
└── Monetization/pricing pages

Phase 4 - SEO and scale
├── Slug-based product/cooperative URLs
├── Next.js or SSR public layer
├── Structured metadata
├── Regional landing pages
└── Performance/image optimization
```
