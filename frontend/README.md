# The Souk - Frontend Progress Log (updated)

## Project
Full-stack fair-trade marketplace connecting tourists with Berber/Amazigh cooperatives in Souss-Massa, Morocco.

## Tech Stack
- **Frontend:** React 18 + TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Axios, React Hook Form + Zod, React Hot Toast
- **Backend:** Node.js + Express + TypeScript, MongoDB + Mongoose, JWT auth

---

## Completed Files

### Config & Setup
| File | Status |
|------|--------|
| `postcss.config.js` | Done |
| `tailwind.config.js` | Done |
| `src/index.css` | Done - Tailwind v4 `@import`, design tokens, utility classes |
| `vite.config.ts` | Done - `@/` alias, proxy `/api` -> `http://localhost:5000` |
| `tsconfig.app.json` | Done - added `baseUrl`, `paths`, `ignoreDeprecations: "6.0"` |

### Types & Services
| File | Status |
|------|--------|
| `src/types/index.ts` | Done - add `cooperativeId?: string` and `wishlist?: string[]` to User type manually |
| `src/services/api.ts` | Done - Axios instance, Bearer token interceptor, auto-refresh on 401 |
| `src/services/authService.ts` | Done - register, login, logout, me, refresh. NO `updateMe` - use `api.patch("/auth/me", payload)` directly |
| `src/services/productService.ts` | Done |
| `src/services/coopService.ts` | Done - `update()` accepts `UpdateCoopPayload` |

### Auth
| File | Status |
|------|--------|
| `src/context/AuthContext.ts` | Done |
| `src/context/AuthProvider.tsx` | Done - login, logout, refreshAuth, silent refresh every 14min |
| `src/hooks/useAuth.ts` | Done |
| `src/hooks/useWishlist.ts` | Done - derives `Set<string>` of wishlisted product IDs from AuthContext user; no extra fetch |

### Routing
| File | Status |
|------|--------|
| `src/App.tsx` | Done - React Router v7, ProtectedRoute, CoopRoute, GuestRoute, DashboardRedirect |

### Components
| File | Status |
|------|--------|
| `src/components/Navbar.tsx` | Done |
| `src/components/Footer.tsx` | Done |
| `src/components/FadeSection.tsx` | Done - IntersectionObserver fade-in with delay support |
| `src/components/ProductCard.tsx` | Done - see details below |

### Pages
| File | Status |
|------|--------|
| `src/pages/LoginPage.tsx` | Done |
| `src/pages/SignupPage.tsx` | Done |
| `src/pages/HomePage.tsx` | Done |
| `src/pages/MarketplacePage.tsx` | Done - updated this session (see below) |
| `src/pages/ProductDetailPage.tsx` | Done - wishlist heart wired, ESLint fixes applied |
| `src/pages/CoopProfilePage.tsx` | Done - inline ProductCard removed, wishlist wired, TS + Tailwind fixes applied |
| `src/pages/dashboard/TouristDashboard.tsx` | Done |
| `src/pages/dashboard/CoopDashboard.tsx` | Done - Tailwind v4 canonical classes fixed |

### Backend
| File | Status |
|------|--------|
| `src/models/User.ts` | Done - `cooperativeId` field added to schema + IUser interface |
| `src/controllers/authController.ts` | Done - `buildUserPayload` helper, `cooperativeId` in all responses |
| `src/controllers/userController.ts` | Done - `getMyReviews`, `addToWishlist`, `removeFromWishlist` |
| `src/routes/userRoutes.ts` | Done - all `/api/users/...` routes behind `protect` middleware |
| `src/index.ts` | Done - `userRoutes` mounted at `/api/users` |

---

## Work Completed This Session

### `src/components/ProductCard.tsx` (new)
- Two layouts: `grid` (default, 4:3 image) and `list` (horizontal thumbnail) - switched via `layout` prop
- **`HeartButton`** - self-contained wishlist toggle:
  - Optimistic update, rolls back on API error with toast
  - Tourists: toggles wishlist. Unauthenticated: prompts sign-in toast. Coop owners: button hidden
  - Calls `productService.addToWishlist(id)` / `removeFromWishlist(id)`
  - `e.preventDefault()` + `e.stopPropagation()` so heart click does not navigate
- Handles both `fairTradeCertified` and `isFairTrade` aliases
- Handles cooperative as raw string ID or populated `{ name }` object
- Stock indicator: "Only N left" for `<=5`, "Out of stock" for `0`
- Amazigh diamond SVG placeholder when no image

### `src/hooks/useWishlist.ts` (new)
- Reads `user.wishlist[]` from AuthContext - no extra fetch
- Returns `{ wishlistSet: Set<string> }` for O(1) `has()` lookups
- Returns empty Set for non-tourists and unauthenticated users

### `src/pages/MarketplacePage.tsx` (updated)
- Removed inline `ProductCard` function
- Removed `Link` from `react-router-dom` import
- Added `import ProductCard from "@/components/ProductCard"`
- Added `import { useWishlist } from "@/hooks/useWishlist"`
- Added `layout` state (`"grid" | "list"`, default `"grid"`)
- Added grid/list toggle button in filter bar
- Passes `layout={layout}` and `initialWishlisted={wishlistSet.has(p._id)}` to every `<ProductCard>`
- Grid container switches between CSS grid and flex-col based on layout

### `src/models/User.ts` (updated)
- Added `cooperativeId?: mongoose.Types.ObjectId` to `IUser` interface
- Added `cooperativeId` field to `UserSchema` with `ref: "Cooperative"`, default `null`
- No migration needed - existing docs get `null` automatically

### `src/controllers/authController.ts` (updated)
- Added `import mongoose` and `import { IUser }` from User model
- Added `buildUserPayload(user: IUser)` helper - single source of truth for user response shape
- Always includes: `_id, name, email, role, avatar, country, cooperativeId, wishlist`
- If `cooperativeId` missing but role is `coop_owner`: falls back to `Cooperative.findOne({ owner })` and backfills the field
- `register`: saves `coop._id` onto user doc after cooperative creation
- `login`, `getMe` both now call `buildUserPayload`

### `src/pages/dashboard/CoopDashboard.tsx` (updated)
- Tailwind v4 class cleanup to canonical forms (`rounded-xl`, `bg-linear-to-br`, `shrink-0`, etc.)

### `src/controllers/userController.ts` (new)
- `getMyReviews` - `Review.find({ reviewer })` populated with `product` (name, images, price, category), sorted newest first
- `addToWishlist` - `$addToSet` (idempotent, no duplicates)
- `removeFromWishlist` - `$pull`

### `src/routes/userRoutes.ts` (new)
- `router.use(protect)` locks all routes in one line
- Mounts: `GET /me/reviews`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`

### `src/pages/CoopProfilePage.tsx` (updated)
- Removed inline `ProductCard` (including broken `product.price.amount` reference)
- Added `import ProductCard` + `import { useWishlist }`
- Passes `initialWishlisted={wishlistSet.has(product._id)}`
- Fixed `||` + `??` mixed operator issue on `productCount`
- Fixed `review.userName` -> `reviewer.name`
- Tailwind v4 class cleanup

### `src/pages/ProductDetailPage.tsx` (updated)
- Added wishlist heart button in hero action area (tourist-only)
- Pattern: `wishlistOverride ?? wishlistSet.has(id)` (no `useEffect` sync needed)
- Fixed broken `useEffect` scope and TypeScript narrowing

---

## Service Signatures (critical - do not assume)

```ts
// productService
getAll(filters: ProductFilters): Promise<PaginatedResponse<Product>>
getById(id: string): Promise<Product>
create(payload: FormData): Promise<Product>
update(id: string, payload: Partial<Product>): Promise<Product>
remove(id: string): Promise<void>
uploadImages(id: string, formData: FormData): Promise<Product>
getReviews(id: string): Promise<Review[]>
createReview(id: string, payload): Promise<Review>
addToWishlist(productId: string): Promise<void>
removeFromWishlist(productId: string): Promise<void>

// coopService
getAll(): Promise<PaginatedResponse<Cooperative>>
getById(id: string): Promise<Cooperative>
create(payload: Partial<Cooperative>): Promise<Cooperative>
update(id: string, payload: UpdateCoopPayload): Promise<Cooperative>
follow(id: string): Promise<ApiResponse<{ followed: boolean }>>

// authService
// NO updateMe - use api.patch("/auth/me", payload) directly
```

---

## Remaining Work

### Nice to have
- [ ] Pagination ellipsis for large page counts in MarketplacePage

### Backend/Product Stability TODO (from latest audit)
- [x] Make order creation + stock updates transactional in `orderController.createOrder` to prevent overselling on concurrent checkouts
- [x] Fix products filter composition so `cooperative` + `region` can work together without one overwriting the other
- [x] Fix cooperative schema defaults:
  - `owner` now required
  - `category` now defaults to `"other"`
- [x] Normalize login email like register (trim/lowercase) before lookup
- [x] Remove registration debug logs from auth controller in production
- [x] Clean encoding/mojibake artifacts in backend/frontend user-facing strings and comments
- [x] Align populated cooperative fields with schema shape (avoid selecting non-existent `logo`, flat `city`, `region` unless derived)

### Backend Hardening Completed (latest session)
- `src/controllers/orderController.ts`:
  - Wrapped order creation in a MongoDB session transaction
  - Added atomic stock decrement guards (`stock >= quantity`) to prevent overselling races
  - Added graceful stock-conflict response when quantities become unavailable at write-time
- `src/controllers/authController.ts`:
  - Removed registration debug logs
  - Normalized login email (`trim().toLowerCase()`) and validated required credentials
- `src/controllers/productController.ts`:
  - Fixed cooperative+region filter behavior so both can apply without override bugs
- `src/controllers/coopController.ts`:
  - Added serialized cooperative payloads with derived `city`, `region`, `isCertified`, and `followersCount`
  - Mapped flat `city`/`region` update payloads into the schema-backed `location` object
- `src/controllers/productController.ts` and `src/controllers/orderController.ts`:
  - Updated cooperative populate selections to schema-backed fields only: `name`, `location`, `category`, `verified`, `coverImage`
- `src/models/Cooperative.ts`:
  - `owner` set to required `ObjectId` reference
  - `category` default corrected to `"other"` (valid enum)
- Validation:
  - Backend TypeScript build passes (`npm.cmd run build`)
  - Frontend production build passes (`npm.cmd run build`)
  - Frontend lint passes (`npm.cmd run lint`)
  - Encoding scan found no stored mojibake in `backend/src`, `frontend/src`, or this README

### Product Upload Fix
- `src/pages/CoopDashboard.tsx`:
  - Fixed product category options to match backend `Product` enum: `argan`, `carpets`, `saffron`, `pottery`, `food`, `leather`, `other`
  - Removed frontend-only category values that caused product save validation failures (`weaving`, `jewellery`, `woodwork`, `cosmetics`)
  - Added backend error-message extraction so product save failures show a useful toast instead of only "Could not save product"
- Validation:
  - Frontend lint passes (`npm.cmd run lint`)
  - Frontend production build passes (`npm.cmd run build`)
  - Backend TypeScript build passes (`npm.cmd run build`)

### Cooperative Profile Link Fix
- `src/models/Cooperative.ts`:
  - Added persisted profile fields used by the dashboard: `impactStatement`, `artisanCount`, and `foundedYear`
- `src/controllers/coopController.ts`:
  - `POST /api/coops` now links the created cooperative back to the owner via `User.cooperativeId`
  - If a cooperative already exists for the owner, the route reuses it and backfills `cooperativeId`
- `src/pages/CoopDashboard.tsx`:
  - Cooperative settings now create a cooperative profile when the logged-in coop owner has no `cooperativeId`
  - After create/update, auth refresh runs so the session receives the new `cooperativeId`
  - Add Product now sends the user to Settings with a clear toast until a cooperative profile exists
- Validation:
  - Backend TypeScript build passes (`npm.cmd run build`)
  - Frontend lint passes (`npm.cmd run lint`)
  - Frontend production build passes (`npm.cmd run build`)

---

## Backend API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `PATCH /api/auth/me`
- `GET /api/products?category=&region=&cooperative=&sort=&page=&limit=`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/images`
- `GET /api/products/:id/reviews`
- `POST /api/products/:id/reviews`
- `GET /api/coops`
- `GET /api/coops/:id`
- `PUT /api/coops/:id`
- `POST /api/coops/:id/follow`
- `GET /api/users/me/reviews`
- `POST /api/users/wishlist/:productId`
- `DELETE /api/users/wishlist/:productId`
- Backend port: `5000` | Frontend port: `5173`
