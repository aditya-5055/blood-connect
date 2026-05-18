# Responsive CSS Quick Reference

## 🎨 New Utility Classes

### Grid Utilities
```css
.grid-responsive    /* gap-3 sm:gap-4 md:gap-5 */
.grid-cols-auto     /* grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 */
.grid-cols-auto-2   /* grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 */
.grid-cols-auto-wide /* grid-cols-1 md:grid-cols-2 lg:grid-cols-3 */
```

### Spacing
```css
.container-responsive   /* px-4 sm:px-6 lg:px-8 */
.mx-auto-responsive     /* mx-auto max-w-7xl */
```

### Icon Sizes
```css
.icon-sm    /* w-5 h-5 sm:w-6 sm:h-6 */
.icon-md    /* w-8 h-8 sm:w-10 sm:h-10 */
.icon-lg    /* w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 */
```

### Text Sizing
```css
.text-responsive-sm     /* text-xs sm:text-sm md:text-base */
.text-responsive-md     /* text-sm sm:text-base md:text-lg */
.text-responsive-lg     /* text-base sm:text-lg md:text-2xl */
.text-responsive-xl     /* text-lg sm:text-xl md:text-3xl */
.heading-responsive-h3  /* text-xl sm:text-2xl md:text-3xl font-bold */
.heading-responsive-h2  /* text-2xl sm:text-3xl md:text-4xl font-bold */
```

### Cards
```css
.card-responsive    /* Responsive card with rounded corners and padding */
```

## 📱 Tailwind Breakpoints (Built-in)

```css
/* Mobile First - add these to base styles */
.my-class { color: blue; }           /* xs/mobile default */

/* Tablet and up */
.sm:my-class { color: green; }       /* 640px+ */

/* Small desktop and up */
.md:my-class { color: yellow; }      /* 768px+ */

/* Desktop and up */
.lg:my-class { color: red; }         /* 1024px+ */

/* Large desktop and up */
.xl:my-class { color: purple; }      /* 1280px+ */
```

## 🔥 Common Patterns

### Responsive Grid (2 columns on mobile, 4 on desktop)
```html
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
  <!-- Cards here -->
</div>
```

### Responsive Text
```html
<h1 class="text-2xl sm:text-3xl md:text-4xl font-bold">Title</h1>
<p class="text-sm sm:text-base md:text-lg">Description</p>
```

### Responsive Padding
```html
<div class="p-3 sm:p-4 md:p-6 lg:p-8">Content</div>
```

### Hide/Show by Screen Size
```html
<!-- Hide on mobile, show on tablet+ -->
<div class="hidden sm:flex">Desktop nav</div>

<!-- Show on mobile, hide on desktop -->
<div class="sm:hidden">Mobile nav</div>

<!-- Show only on large desktop -->
<div class="hidden xl:block">Premium content</div>
```

### Responsive Flex Direction
```html
<div class="flex flex-col sm:flex-row gap-4">
  <div>Will stack on mobile, row on desktop</div>
</div>
```

### Responsive Icon + Text
```html
<div class="flex items-center gap-2 sm:gap-3">
  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
  <span class="text-sm sm:text-base">Label</span>
</div>
```

## 🎯 Dashboard Card Pattern

```html
<div class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl 
            shadow-sm hover:shadow-md border border-gray-200 
            dark:border-gray-700 p-3 sm:p-4 md:p-5 
            transition-all">
  
  <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl 
              bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
    <Icon className="text-red-600 text-lg sm:text-xl" />
  </div>
  
  <p class="text-lg sm:text-xl md:text-2xl font-bold mt-2">
    {value}
  </p>
  
  <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
    {label}
  </p>
</div>
```

## 🧩 Stats Grid Pattern

```html
<!-- 2 columns on mobile, 4 on desktop -->
<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
  <!-- Stats cards -->
</div>
```

## 📊 Inventory Grid Pattern

```html
<!-- 2 on mobile, 4 on tablet, 8 on desktop -->
<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
  <!-- Blood group cards -->
</div>
```

## 🔄 Form Layout Pattern

```html
<div class="space-y-3 sm:space-y-4">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    <input class="w-full p-2 sm:p-3 border rounded-lg" />
    <input class="w-full p-2 sm:p-3 border rounded-lg" />
  </div>
  
  <button class="w-full px-4 sm:px-6 py-2 sm:py-3">
    Submit
  </button>
</div>
```

## 🎬 Animation Patterns

```html
<!-- Responsive transitions -->
<div class="transition-all duration-300">Content</div>

<!-- Hover states that work on touch -->
<button class="hover:shadow-lg active:scale-95 transition-all">
  Click me
</button>
```

## 📐 Sizing Reference

| Size | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| **Icon Small** | w-5 h-5 | w-5 h-5 | w-6 h-6 |
| **Icon Medium** | w-8 h-8 | w-10 h-10 | w-10 h-10 |
| **Icon Large** | w-12 h-12 | w-14 h-14 | w-16 h-16 |
| **Card Padding** | p-3 | p-4 | p-5 |
| **Grid Cols** | 1-2 | 2-3 | 3-4+ |
| **Gap** | gap-2 | gap-3 | gap-4 |

## 🚀 Performance Tips

1. **Use Tailwind's responsive utilities** - No extra CSS
2. **Avoid `@media` queries** - Use Tailwind breakpoints instead
3. **Test on real devices** - DevTools preview is different
4. **Check minimum touch targets** - 44px recommended
5. **Optimize images** - Use responsive image sizes

## 🐛 Common Issues & Fixes

```css
/* ❌ Problem: Grid not responsive */
.grid { grid-template-columns: repeat(4, 1fr); }

/* ✅ Solution: Use Tailwind */
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">

---

/* ❌ Problem: Text too small on mobile */
<p class="text-lg">Text</p>

/* ✅ Solution: Use responsive text */
<p class="text-sm sm:text-base md:text-lg">Text</p>

---

/* ❌ Problem: Fixed padding breaks on mobile */
<div class="px-8 py-6">Content</div>

/* ✅ Solution: Use responsive padding */
<div class="px-4 sm:px-6 md:px-8 py-3 sm:py-6">Content</div>
```

---

**Last Updated**: April 2026  
**For Questions**: See RESPONSIVE_DESIGN_GUIDE.md
