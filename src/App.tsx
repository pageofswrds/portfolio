import { useState, type ReactNode } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { PostNode } from './components/PostNode'
import { StickyNote } from './components/StickyNote'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
// The interactive <CelestialBox /> ASCII star (and its lazy <StarExplorer />)
// are temporarily swapped out for a photo — see <IdentityPhoto /> below. Restore
// by re-importing CelestialBox/StarExplorer and reverting the identity-anchor JSX.
import { IdentityPhoto } from './components/IdentityPhoto'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'
import { ROOT_IDS, ROOTS, type RootId } from './content/categories'
import { placeSubgraph, type SubgraphLayout, type GraphEdge } from './layout/graph'

const FOCAL_X = 0
const FOCAL_Y = 0
const IMAGE_HEIGHT = 260
// Full card width — mirrors ProjectCard's FIXED_ASPECT_RATIO (16/10).
const CARD_WIDTH = (IMAGE_HEIGHT * 16) / 10

// Temporary identity photo standing in for the ASCII star explorer.
const IDENTITY_PHOTO_SRC =
  'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/images/trail-selfie.webp'

// Identity card geometry
const IDENTITY_ANCHOR_SIZE = 180
const IDENTITY_GAP = 32
const IDENTITY_NAME_FONT_SIZE = 64
const IDENTITY_TAGLINE_FONT_SIZE = 18

// Tabs sit inside the identity card group, in the slot where the old buttons lived.
// Sized to match the original button typography lockup: 40 tall, font-sans 14pt 500,
// rx=8, variable widths fitted to each label.
const TAB_ROW_OFFSET_X = -200
const TAB_ROW_OFFSET_Y = -IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 64

const TAB_HEIGHT = 40
const TAB_RX = 8
const TAB_GAP = 12
const TAB_FONT_SIZE = 14

const TAB_WIDTHS: Record<RootId, number> = {
  about: 90,
  product: 100,
  research: 110,
}

// About panel: body copy above, link row below.
const ABOUT_BODY_Y = 110
const ABOUT_BODY_WIDTH = 560
// Hugs the single paragraph (~3 lines × 16px × 1.6 ≈ 77) so the box adds no
// slack; the link row below derives from this (LINK_PANEL_Y).
const ABOUT_BODY_HEIGHT = 84
const ABOUT_BODY_FONT_SIZE = 16

const LINK_PANEL_Y = ABOUT_BODY_Y + ABOUT_BODY_HEIGHT + 32
const LINK_HEIGHT = 40
const LINK_RX = 8
const LINK_GAP = 12
const LINK_FONT_SIZE = 14
// Left edge for About/Research body content — aligned to the identity photo's
// left edge (like the Product grid), not the narrower name/tab column.
const CONTENT_LEFT_X = -(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200)

// Research panel: thesis copy + a row of static "research thread" nodes, sitting
// above the post funnel — mirrors the About panel's copy-above-items pattern.
const RESEARCH_PANEL_X = CONTENT_LEFT_X
const RESEARCH_PANEL_Y = ABOUT_BODY_Y
const RESEARCH_PANEL_WIDTH = ABOUT_BODY_WIDTH
// Generous fixed box: quote (~90) + copy (~270) + thread row (32) + gaps,
// clipped at this height. Subgraph tops below are kept clear of the panel bottom
// (RESEARCH_PANEL_Y + this).
const RESEARCH_PANEL_HEIGHT = 480
const RESEARCH_BODY_FONT_SIZE = ABOUT_BODY_FONT_SIZE

// Product is a 2-column card grid, filled left→right, top→down in member order.
// Left column's left edge aligns with the identity photo's left edge.
const PRODUCT_CARD_HEIGHT = IMAGE_HEIGHT + 44 // image + ProjectCard caption (TEXT_AREA_HEIGHT)
// Left column's left edge aligns with the identity photo's left edge.
const PRODUCT_COL0_X =
  -(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200) + CARD_WIDTH / 2
const PRODUCT_COL_GAP = 48
const PRODUCT_ROW_GAP = 40
const PRODUCT_ROW0_Y = 300 // first row's card center

// The post graph is two independent subgraphs — XR/interaction work, and the
// AI/consciousness work — each a date-threaded constellation, side by side.
const POST_NODE_BOX_WIDTH = 360 // bounding box; pills hug their text within it
const POST_NODE_BOX_HEIGHT = 92

// "Field Notes" (the misc takes) is hidden for now — flip to re-render it. Its
// membership/layout is still wired below so it returns with one toggle.
const SHOW_FIELD_NOTES = false

// Field-notes subgraph — a date-threaded serpentine. Membership is "every
// research post not claimed by the AI tree below", so calculated-risk and
// rapid-refactoring land here too.
const FIELD_NOTES_LAYOUT: SubgraphLayout = {
  centerX: -340,
  top: 700,
  rowStep: 118,
  amplitude: 78,
  phase: 1.3,
  phase0: 0.5,
}

// AI/consciousness subgraph — an authored tree (not date-derived):
//   pt.1 ─┬─ pt.2 ─┬─ entropy duality
//         │        ├─ the vessel shapes the decision
//         │        └─ the groove that passes for rigor
//         ├─ the cognitive lightcone
//         └─ diverse forms of intelligence
const PT1 = 'meaning-lives-in-between-the-gaps-of-language-pt1'
const PT2 = 'minimizing-entropy-in-intelligent-systems-pt2'

// pt.1 anchors the top-left; its two sprouts (lightcone, diverse) fan up-right,
// while pt.2 drops straight down and its three children fan out below it. The
// whole tree is centered under the page content (it's the only graph now).
const AI_NODES: Record<string, { x: number; y: number }> = {
  [PT1]: { x: -10, y: 700 },
  'diverse-forms-of-intelligence': { x: 510, y: 740 },
  'the-cognitive-lightcone': { x: 360, y: 880 },
  [PT2]: { x: 50, y: 940 },
  'entropy-duality': { x: -190, y: 1100 },
  'the-vessel-shapes-the-decision': { x: 70, y: 1150 },
  'the-groove-that-passes-for-rigor': { x: 380, y: 1120 },
}

const AI_ORDER = [
  PT1,
  PT2,
  'the-cognitive-lightcone',
  'diverse-forms-of-intelligence',
  'entropy-duality',
  'the-vessel-shapes-the-decision',
  'the-groove-that-passes-for-rigor',
]

const AI_EDGES: [string, string][] = [
  [PT1, PT2],
  [PT1, 'the-cognitive-lightcone'],
  [PT1, 'diverse-forms-of-intelligence'],
  [PT2, 'entropy-duality'],
  [PT2, 'the-vessel-shapes-the-decision'],
  [PT2, 'the-groove-that-passes-for-rigor'],
]

// Floaters — standalone posts placed as unconnected islands (no edges). Each is a
// finished argument that doesn't thread into the AI tree; it sits alone in the left
// margin, clear of the tree's span (which runs x −190..510). Add a slug→position here.
const FLOATERS: Record<string, { x: number; y: number }> = {
  'language-is-the-world-model': { x: -470, y: 760 },
}

interface ExternalLink {
  label: string
  href: string
  width: number
  icon: ReactNode
}

const ICON_SIZE = 16

const LinkedInIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const ResumeIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9-7h6v2H9v-2zm0 4h6v2H9v-2z" />
  </svg>
)

const StudioIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 775 811" fill="currentColor" aria-hidden="true">
    <path d="M352.304 159.097C358.618 143.914 376.046 136.724 391.229 143.038C392.916 143.739 393.731 144.048 395.346 144.701C396.807 145.291 398.661 146.062 400.801 147.136L401.473 147.474L402.129 147.845C408.296 151.343 414.889 156.149 420.316 160.236C431.609 167.716 449.174 180.34 458.691 190.121C458.586 190.013 458.851 190.286 459.96 191.267C461.031 192.215 462.171 193.196 463.876 194.682C467.06 197.458 471.246 201.156 475.721 205.56C484.526 214.223 495.436 226.545 503.26 242.199C507.643 250.97 523.772 276.523 524.183 307.937C524.307 317.391 525.268 334.315 519.692 352.725C514.849 368.716 504.016 391.885 493.39 408.075C483.893 422.545 473.564 437.558 464.561 450.627C451.13 470.124 432.413 495.527 422.822 507.169C415.168 516.461 395.442 538.049 362.034 566.123C346.228 579.405 334.164 589.361 325.849 596.112C321.703 599.478 318.421 602.102 316.042 603.965C314.868 604.885 313.801 605.707 312.907 606.373C312.473 606.697 311.935 607.092 311.369 607.486C311.347 607.502 309.541 608.805 307.268 609.941C292.561 617.295 274.676 611.332 267.322 596.624C260.518 583.016 265.114 566.689 277.489 558.499C277.864 558.217 278.465 557.757 279.331 557.08C281.327 555.517 284.309 553.134 288.315 549.881C296.305 543.395 308.102 533.662 323.724 520.534C354.647 494.549 371.749 475.512 376.861 469.306C384.901 459.546 402.526 435.713 415.523 416.845C424.569 403.714 434.53 389.23 443.607 375.4C451.298 363.683 459.609 345.672 462.701 335.462C465.062 327.667 464.799 320.87 464.639 308.717C464.454 294.549 457.793 284.425 449.994 268.822C446.298 261.426 440.462 254.408 433.957 248.007C430.778 244.879 427.666 242.115 424.745 239.568C422.496 237.608 418.578 234.285 416.014 231.65C411.19 226.692 397.831 216.717 386.756 209.43L385.944 208.897L385.17 208.311C380.097 204.477 376.268 201.758 373.614 200.151C373.472 200.091 373.288 200.013 373.048 199.916C372.3 199.614 370.366 198.855 368.364 198.022C353.181 191.708 345.991 174.28 352.304 159.097Z" />
    <path d="M257.355 253.64C287.729 252.206 307.633 252.7 322.179 253.987C336.202 255.227 346.41 257.463 350.874 258.154C359.754 259.529 368.893 262.092 376.751 264.458C385.497 267.091 391.993 269.256 399.281 271.305C417.202 276.344 437.845 285.781 455.097 293.713C474.638 302.697 490.747 315.056 508.601 329.191C539.537 353.684 550.685 372.611 560.33 385.182C570.557 398.512 580.259 415.894 587.827 429.646C597.551 447.314 607.661 466.568 619.193 489.333L621.855 494.597L622.156 495.278C631.306 515.914 642.044 539.376 645.017 546.965C645.706 548.592 646.595 550.399 648.041 553.292C655.395 567.999 649.433 585.884 634.726 593.238C620.018 600.592 602.133 594.63 594.779 579.923C593.435 577.234 591.562 573.516 589.922 569.567L589.721 569.083L589.536 568.591C587.862 564.123 578.547 543.819 568.034 520.124C555.885 496.059 545.508 476.257 535.657 458.357C527.734 443.959 520.111 430.588 513.085 421.43C501.175 405.907 495.307 394.619 471.637 375.879C453.51 361.527 442.483 353.453 430.222 347.816C411.886 339.386 395.705 332.157 383.162 328.631C375.428 326.456 366.179 323.464 359.582 321.477C352.097 319.223 346.294 317.703 341.76 317.001C332.633 315.587 328.547 314.332 316.932 313.304C305.839 312.323 288.759 311.772 260.162 313.122C251.835 313.515 235.448 313.411 214.948 313.449C193.79 313.488 166.66 313.662 135.065 314.547C122.669 314.894 115.827 315.178 112.06 315.367C110.201 315.46 109.079 315.53 108.39 315.576C108.138 315.592 107.628 315.627 107.335 315.645C107.126 315.658 106.14 315.723 105 315.723C88.5562 315.723 75.2256 302.393 75.2256 285.949C75.2257 269.905 87.9162 256.827 103.807 256.201C103.954 256.192 104.174 256.176 104.482 256.156C105.446 256.093 106.878 256.004 109.079 255.893C113.433 255.675 120.743 255.377 133.397 255.022C165.724 254.117 193.429 253.94 214.838 253.9C236.906 253.859 250.821 253.949 257.355 253.64Z" />
    <path d="M274.812 80.5007C284.105 78.8338 294.036 81.6019 301.2 88.8014C303.828 91.4426 309.613 97.638 311.238 107.686L311.622 110.066L311.619 112.476C311.611 118.857 309.99 124.413 307.946 128.846L306.79 131.352L305.194 133.603C302.226 137.787 294.965 146.304 282.126 149.84C279.298 150.62 274.94 151.566 269.824 151.397C264.547 151.223 256.691 149.766 249.504 143.878C249.247 143.667 246.954 141.856 244.772 139.518C242.456 137.037 238.909 132.599 236.841 126.115C235.853 123.018 231.244 107.709 242.688 93.9977L243.494 93.0495C244.538 91.8524 246.27 89.9885 248.49 88.1784C251.394 85.8096 257.378 81.6555 266.063 80.6979L267.087 80.5934C269.384 80.3784 271.025 80.3561 271.887 80.3561C272.874 80.3561 273.85 80.4068 274.812 80.5007Z" />
    <path d="M651.801 646.02C653.46 645.943 656.152 645.929 659.335 646.518C660.622 646.756 663.489 647.344 666.898 648.953C672.316 649.89 676.224 651.929 677.871 652.811C680.577 654.261 684.288 656.594 687.841 660L688.549 660.695L689.687 661.84L690.693 663.101C696.674 670.591 700.712 680.92 699.589 692.494C699.603 692.348 699.604 692.299 699.582 692.614C699.568 692.815 699.528 693.405 699.48 693.99C699.381 695.179 699.168 697.404 698.591 700.003C697.359 705.548 694.172 714.003 685.763 720.596C679.913 725.183 668.423 732.24 653.606 730.781C651.734 730.596 648.148 730.245 644.53 729.399C641.528 728.697 633.612 726.647 626.844 719.869C623.343 716.363 616.734 708.775 614.889 697.057C614.119 692.168 612.652 679.59 619.948 667.01L620.732 665.674C621.701 664.053 623.209 661.67 625.074 659.377C627.347 656.583 633.133 650.1 643.076 647.433L643.961 647.205C646.106 646.672 648.803 646.16 651.801 646.02Z" />
  </svg>
)

const BlueskyIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
)

const ThreadsIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
  </svg>
)

const XIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const CORE_DETAILS_LINKS: ExternalLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/schultzdavidg', width: 120, icon: LinkedInIcon },
  {
    label: 'Resume',
    href: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf',
    width: 100,
    icon: ResumeIcon,
  },
  {
    label: 'CV',
    href: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-CV.pdf',
    width: 80,
    icon: ResumeIcon,
  },
  { label: 'studiozojer.co', href: 'https://studiozojer.co', width: 140, icon: StudioIcon },
  { label: 'Bluesky', href: 'https://bsky.app/profile/pageofswrds.kairos.solar', width: 110, icon: BlueskyIcon },
  { label: 'Threads', href: 'https://www.threads.com/@l.ifelike', width: 110, icon: ThreadsIcon },
  { label: 'X', href: 'https://x.com/pageofswrds', width: 80, icon: XIcon },
]

const projectBySlug = new Map(projects.map((p) => [p.slug, p]))
const blogBySlug = new Map(blogPosts.map((b) => [b.slug, b]))

type Artifact =
  | { kind: 'project'; data: ProjectContent }
  | { kind: 'blog'; data: BlogContent }

function lookupArtifact(slug: string): Artifact | null {
  const proj = projectBySlug.get(slug)
  if (proj) return { kind: 'project', data: proj }
  const blog = blogBySlug.get(slug)
  if (blog) return { kind: 'blog', data: blog }
  return null
}

// Left edge of a tab within the tab-row local coordinate system.
function tabLocalX(id: RootId): number {
  let x = 0
  for (const rootId of ROOT_IDS) {
    if (rootId === id) return x
    x += TAB_WIDTHS[rootId] + TAB_GAP
  }
  return x
}

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeRoot, setActiveRoot] = useState<RootId>('product')

  // Product — a 2-column card grid in member order (left→right, top→down).
  const productGrid = (() => {
    if (activeRoot !== 'product') return null
    return ROOTS.product.members
      .map(lookupArtifact)
      .filter((a): a is Artifact => a !== null)
      .map((artifact, i) => ({
        artifact,
        x: PRODUCT_COL0_X + (i % 2) * (CARD_WIDTH + PRODUCT_COL_GAP),
        y: PRODUCT_ROW0_Y + Math.floor(i / 2) * (PRODUCT_CARD_HEIGHT + PRODUCT_ROW_GAP),
      }))
  })()

  // Research node graph — two date-threaded subgraphs of text-pill nodes.
  const researchGraph = (() => {
    if (activeRoot !== 'research') return null
    const members = ROOTS.research.members
      .map((slug) => blogBySlug.get(slug))
      .filter((b): b is BlogContent => b !== undefined)

    const aiSlugs = new Set(Object.keys(AI_NODES))

    // Field notes — every research post not claimed by the AI tree, as a date
    // serpentine. Hidden unless SHOW_FIELD_NOTES; still computed so the toggle
    // is all it takes to bring it back.
    const fieldNotes = placeSubgraph(
      members
        .filter((b) => !aiSlugs.has(b.slug))
        .map((b) => ({ slug: b.slug, date: b.date })),
      FIELD_NOTES_LAYOUT,
    )

    // AI — authored tree positions + edges.
    const aiPlacements = AI_ORDER.filter((slug) =>
      members.some((b) => b.slug === slug),
    ).map((slug) => ({ slug, x: AI_NODES[slug].x, y: AI_NODES[slug].y }))
    const aiEdges = AI_EDGES.map(([from, to]) => ({ from, to }))

    // Floaters — unconnected islands (no edges). Rendered only if the slug is a
    // member and has a real post behind it.
    const floaterPlacements = Object.entries(FLOATERS)
      .filter(([slug]) => members.some((b) => b.slug === slug))
      .map(([slug, pos]) => ({ slug, x: pos.x, y: pos.y }))

    const subgraphs = [
      ...(SHOW_FIELD_NOTES
        ? [{ placements: fieldNotes.placements, edges: fieldNotes.edges }]
        : []),
      { placements: aiPlacements, edges: aiEdges },
      { placements: floaterPlacements, edges: [] as GraphEdge[] },
    ]

    const placements = subgraphs.flatMap((g) => g.placements)
    const edges = subgraphs.flatMap((g) => g.edges)
    const posBySlug = new Map(placements.map((p) => [p.slug, p]))
    const postBySlug = new Map(members.map((b) => [b.slug, b]))

    return { placements, edges, posBySlug, postBySlug }
  })()

  const handleTabClick = (id: RootId) => {
    setActiveRoot(id)
  }

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* Identity zone — centered on focal point */}
        <g transform={`translate(${FOCAL_X}, ${FOCAL_Y})`}>
          <IdentityPhoto
            x={-(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200)}
            y={-IDENTITY_ANCHOR_SIZE / 2}
            size={IDENTITY_ANCHOR_SIZE}
            src={IDENTITY_PHOTO_SRC}
            alt="David Schultz"
          />

          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_NAME_FONT_SIZE}
            fontFamily="var(--font-display)"
            fontWeight="400"
          >
            david schultz
          </text>

          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 32}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_TAGLINE_FONT_SIZE}
            fontFamily="var(--font-sans)"
          >
            Building thinking models at studiozojer
          </text>

          {/* Tab row — inside the identity card, where the buttons used to live */}
          <g transform={`translate(${TAB_ROW_OFFSET_X}, ${TAB_ROW_OFFSET_Y})`}>
            {ROOT_IDS.map((id) => {
              const isActive = activeRoot === id
              const width = TAB_WIDTHS[id]
              const xLeft = tabLocalX(id)
              const label = ROOTS[id].label

              return (
                <g
                  key={id}
                  transform={`translate(${xLeft + width / 2}, ${TAB_HEIGHT / 2})`}
                  className={`root-node ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(id)}
                >
                  <g className="root-content">
                    <rect
                      className="root-bg"
                      x={-width / 2}
                      y={-TAB_HEIGHT / 2}
                      width={width}
                      height={TAB_HEIGHT}
                      rx={TAB_RX}
                    />
                    <text
                      className="root-label"
                      x={0}
                      y={5}
                      fontSize={TAB_FONT_SIZE}
                      fontFamily="var(--font-sans)"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                </g>
              )
            })}
          </g>
        </g>

        {/* About panel — body copy above the external links row */}
        {activeRoot === 'about' && (
          <foreignObject
            x={CONTENT_LEFT_X}
            y={ABOUT_BODY_Y}
            width={ABOUT_BODY_WIDTH}
            height={ABOUT_BODY_HEIGHT}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontFamily: 'var(--font-sans)',
                fontSize: `${ABOUT_BODY_FONT_SIZE}px`,
                lineHeight: 1.6,
                color: 'var(--tx-primary)',
              }}
            >
              <p style={{ margin: 0 }}>
                Hi, I'm an Interaction Designer from Seattle currently building
                Kairōs—a community tool designed for studying the stars. More
                broadly, I'm focused on building systems that treat the context
                window as a design surface.
              </p>
            </div>
          </foreignObject>
        )}

        {activeRoot === 'about' && (
          <g transform={`translate(${CONTENT_LEFT_X}, ${LINK_PANEL_Y})`}>
            {(() => {
              let xCursor = 0
              return CORE_DETAILS_LINKS.map((link) => {
                const centerX = xCursor + link.width / 2
                xCursor += link.width + LINK_GAP
                return (
                  <g
                    key={link.label}
                    transform={`translate(${centerX}, ${LINK_HEIGHT / 2})`}
                    className="root-node"
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <g className="root-content">
                        <rect
                          className="root-bg"
                          x={-link.width / 2}
                          y={-LINK_HEIGHT / 2}
                          width={link.width}
                          height={LINK_HEIGHT}
                          rx={LINK_RX}
                        />
                        <foreignObject
                          x={-link.width / 2}
                          y={-LINK_HEIGHT / 2}
                          width={link.width}
                          height={LINK_HEIGHT}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontFamily: 'var(--font-sans)',
                              fontSize: `${LINK_FONT_SIZE}px`,
                              fontWeight: 500,
                              color: 'var(--tx-primary)',
                            }}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </div>
                        </foreignObject>
                      </g>
                    </a>
                  </g>
                )
              })
            })()}
          </g>
        )}

        {/* Research panel — epigraph + thesis copy above the post graph */}
        {activeRoot === 'research' && (
          <foreignObject
            x={RESEARCH_PANEL_X}
            y={RESEARCH_PANEL_Y}
            width={RESEARCH_PANEL_WIDTH}
            height={RESEARCH_PANEL_HEIGHT}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <blockquote
                style={{
                  margin: '16px 0 0',
                  paddingLeft: '20px',
                  borderLeft: '2px solid var(--bd-hover)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    fontSize: '23px',
                    lineHeight: 1.3,
                    color: 'var(--tx-primary)',
                  }}
                >
                  “Intelligence is the ability to reach the same goal by
                  different means.”
                </p>
                <cite
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontStyle: 'normal',
                    fontSize: '15px',
                    letterSpacing: '0.04em',
                    color: 'var(--tx-tertiary)',
                  }}
                >
                  — William James
                </cite>
              </blockquote>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: `${RESEARCH_BODY_FONT_SIZE}px`,
                  lineHeight: 1.6,
                  color: 'var(--tx-primary)',
                }}
              >
                <p style={{ margin: 0 }}>
                  I've been studying metaphysics for some time, and I think it's
                  abundantly clear that{' '}
                  <strong style={{ fontWeight: 500 }}>
                    these LLMs are the real deal
                  </strong>
                  .
                </p>
                <p style={{ margin: 0 }}>
                  I see reality through the lens of Platonism; the idea that
                  truth is separate from the material world. Some use the word
                  holographic here, but for me, what it boils down to is that you
                  can find the same patterns appear across completely different
                  domains.
                </p>
                <p style={{ margin: 0 }}>
                  The thing about AI is that it's{' '}
                  <em style={{ fontStyle: 'italic' }}>really</em> good at
                  pattern-matching—and my work revolves around finding the
                  lowest entropy patterns to enable more advanced cognition.
                </p>
              </div>
            </div>
          </foreignObject>
        )}

        {/* A fleeting idea, tacked up to the right of the research copy */}
        {activeRoot === 'research' && (
          <StickyNote
            x={218}
            y={150}
            width={236}
            rotate={-4}
            heading="The idea"
            text="Every token in your chat history subtly influences model behaviour. I believe that if we can figure out ways to manipulate which tokens are and aren't loaded, we'll find a promising avenue to compete with the frontier models on low-power hardware."
          />
        )}

        {/* Research node graph — edges (behind), subgraph titles, then pills */}
        {researchGraph && (
          <>
            {researchGraph.edges.map((edge) => {
              const a = researchGraph.posBySlug.get(edge.from)
              const b = researchGraph.posBySlug.get(edge.to)
              if (!a || !b) return null
              // Quadratic curve that sags downward with the edge's horizontal
              // span — horizontal edges droop like a wire, vertical ones stay
              // near-straight.
              const cx = (a.x + b.x) / 2
              const cy = (a.y + b.y) / 2 + 0.15 * Math.abs(b.x - a.x)
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  className="graph-edge"
                  d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                />
              )
            })}

            {researchGraph.placements.map((p) => {
              const post = researchGraph.postBySlug.get(p.slug)
              if (!post) return null
              const meta = post.subtitle.includes('•')
                ? (post.subtitle.split('•').pop()?.trim() ?? '')
                : post.subtitle
              return (
                <PostNode
                  key={p.slug}
                  x={p.x}
                  y={p.y}
                  maxWidth={POST_NODE_BOX_WIDTH}
                  boxHeight={POST_NODE_BOX_HEIGHT}
                  title={post.title}
                  meta={meta}
                  onClick={() => setSelectedBlogPost(post)}
                />
              )
            })}
          </>
        )}

        {/* Product — 2-column card grid */}
        {productGrid &&
          productGrid.map(({ artifact, x, y }) => (
            <ProjectCard
              key={`product-${artifact.data.slug}`}
              x={x}
              y={y}
              imageHeight={IMAGE_HEIGHT}
              title={artifact.data.title}
              year={artifact.kind === 'project' ? artifact.data.year : ''}
              thumbnail={
                artifact.kind === 'project'
                  ? artifact.data.thumbnailSmall
                  : artifact.data.thumbnail
              }
              onClick={() => {
                if (artifact.kind === 'project') setSelectedProject(artifact.data)
                else setSelectedBlogPost(artifact.data)
              }}
              centered
            />
          ))}
      </Canvas>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <BlogModal
        post={selectedBlogPost}
        onClose={() => setSelectedBlogPost(null)}
      />
    </>
  )
}

export default App
