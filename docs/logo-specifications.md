# AfriConnect Exchange - Logo File Specifications

## Required Logo Files

Your designer needs to create the following logo files and place them in `/public/images/`:

### 1. **logo-full-color.jpg** (Primary Logo)
- **Dimensions**: 400px × 120px (or higher resolution maintaining 10:3 ratio)
- **Format**: JPG or PNG (PNG preferred for transparency)
- **Background**: Transparent or white
- **DPI**: 300 for print, 72+ for web

**Elements to include:**
- Stylized globe centered on Africa (left side)
- Interconnected nodes on the globe symbolizing digital exchange
- Circular arrow with gradient: Green (#34A853) → Blue (#0072CE) → Orange (#F4B400)
- Traditional African patterns embedded within the globe
- Text: "AFRICONNECT" in bold black (#000000) uppercase - Montserrat Bold, 18-24px
- Text: "EXCHANGE" in Diaspora Orange (#F4B400) uppercase - Montserrat Bold, 12-16px
- Letter spacing: 0.5px for AFRICONNECT, 1px for EXCHANGE

---

### 2. **logo-icon.jpg** (Icon/Compact Version)
- **Dimensions**: 128px × 128px (square)
- **Format**: JPG or PNG
- **Background**: Transparent

**Elements to include:**
- Stylized globe with Africa at center
- Simplified interconnected nodes
- Circular arrow with gradient
- NO TEXT (icon only)

---

### 3. **logo-white.jpg** (Monochrome - Dark Background)
- **Dimensions**: 400px × 120px
- **Format**: PNG with transparency
- **Color**: All white (#FFFFFF)
- **Use case**: Dark backgrounds (footer, dark mode)

---

### 4. **logo-black.jpg** (Monochrome - Light Background)
- **Dimensions**: 400px × 120px
- **Format**: PNG with transparency
- **Color**: All black (#000000)
- **Use case**: Light/neutral backgrounds

---

## Favicon & App Icons

Place these in `/public/`:

### **favicon.ico**
- 32×32px, 16×16px multi-resolution ICO file
- Icon version of logo (globe + arrow only)

### App Icons (PNG)
- **apple-touch-icon.png**: 180×180px
- **android-chrome-192x192.png**: 192×192px
- **android-chrome-512x512.png**: 512×512px

---

## Brand Color Palette (For Designer Reference)

| Color Name       | HEX     | Usage                          |
|------------------|---------|--------------------------------|
| Primary Black    | #000000 | Logo text, headings            |
| Diaspora Orange  | #F4B400 | Accent, "EXCHANGE" text        |
| Progress Blue    | #0072CE | Links, UI accents, nodes       |
| Growth Green     | #34A853 | Success states, gradient start |
| Deep Indigo      | #2C2A4A | Africa shape, patterns         |
| Warm Clay        | #D96C06 | Cultural highlights            |
| Neutral White    | #FFFFFF | Backgrounds                    |

**Gradient for circular arrow:**
- Start: #34A853 (Growth Green)
- Middle: #0072CE (Progress Blue)
- End: #F4B400 (Diaspora Orange)

---

## Typography

- **Primary Font**: Montserrat (Google Fonts)
  - AFRICONNECT: Bold (700 weight)
  - EXCHANGE: Bold (700 weight)
- **Fallback**: Arial, Helvetica, sans-serif

---

## Design Principles

1. **Clear Space**: Maintain 20px minimum padding around logo
2. **Minimum Size**: Logo must be legible at 100px width
3. **No Distortion**: Do not stretch, skew, or rotate the logo
4. **No Recoloring**: Use only provided color variants
5. **Cultural Relevance**: African patterns should be subtle and respectful
6. **Scalability**: Logo must work at all sizes (16px favicon to billboard)

---

## File Naming Convention

```
/public/images/
  ├── logo-full-color.png      (Primary)
  ├── logo-icon.png             (Icon/Square)
  ├── logo-white.png            (Dark BG)
  ├── logo-black.png            (Light BG)
/public/
  ├── favicon.ico
  ├── apple-touch-icon.png
  ├── android-chrome-192x192.png
  ├── android-chrome-512x512.png
```

---

## Accessibility Requirements

- All logo images must have descriptive alt text (handled in component)
- Minimum contrast ratio: 4.5:1 for text
- Logo must be recognizable in grayscale

---

## Next Steps for Developer

Once the designer provides the logo files:

1. Place files in `/public/images/` directory
2. Update `next.config.ts` if needed for image optimization
3. Test logo component across all breakpoints (mobile, tablet, desktop)
4. Verify logo appears correctly in navbar, footer, and login screens
5. Add favicons to HTML head via `layout.tsx`

---

## Contact

For questions about logo implementation, refer to:
- Brand Guide: `/docs/blueprint.md`
- Component: `/src/components/logo.tsx`
