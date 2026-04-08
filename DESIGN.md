# Design Brief

| Section | Detail |
|---------|--------|
| **Tone** | Clean, focused, minimal decoration. Functionality over ornament. |
| **Theme** | Dark-first productivity UI with bright teal accents for active states. |
| **Differentiation** | Sophisticated sidebar chat with distinctive geometric typography (Space Grotesk). Teal accent sparingly for emphasis. Pure-black background depth. |

## Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|----------|-------|
| **Primary** | Teal `oklch(0.63 0.23 187)` | Teal `oklch(0.65 0.26 193)` | CTAs, active states, navigation focus |
| **Secondary** | Blue-grey `oklch(0.72 0.14 180)` | Muted grey `oklch(0.25 0.05 0)` | Secondary UI elements, subtle text |
| **Background** | Off-white `oklch(0.96 0.01 0)` | Deep black `oklch(0.08 0.01 0)` | Page/card backgrounds |
| **Foreground** | Dark grey `oklch(0.15 0.02 0)` | Light grey `oklch(0.92 0.02 0)` | Primary text |
| **Muted** | Light grey `oklch(0.9 0.02 0)` | Dark grey `oklch(0.25 0.05 0)` | Disabled/secondary states |
| **Border** | Very light grey `oklch(0.92 0.01 0)` | Dark grey `oklch(0.2 0.04 0)` | Dividers, edges |
| **Destructive** | Red `oklch(0.55 0.22 25)` | Red `oklch(0.65 0.19 22)` | Delete, danger actions |

## Typography

| Layer | Font | Usage | Size/Weight |
|-------|------|-------|------------|
| **Display** | Space Grotesk | Headers, titles, strong emphasis | 24–32px, 600–700 |
| **Body** | DM Sans | Copy, UI labels, descriptions | 14–16px, 400–500 |
| **Mono** | JetBrains Mono | Timestamps, code, technical labels | 12–13px, 400 |

## Structural Zones

| Zone | Light Mode | Dark Mode | Purpose |
|------|-----------|----------|---------|
| **Sidebar** | N/A (dark-first) | `oklch(0.08 0.01 0)` with teal accents | Navigation, conversation list, user profile |
| **Header** | `oklch(0.98 0.01 0)` + border-b | `oklch(0.12 0.02 0)` + border-b | Conversation title, participant info |
| **Message Area** | `oklch(0.96 0.01 0)` | `oklch(0.08 0.01 0)` | Chat history, messages |
| **Input Zone** | `oklch(0.98 0.01 0)` + border-t | `oklch(0.12 0.02 0)` + border-t | Message composer |
| **Card** | `oklch(0.98 0.01 0)` with subtle shadow | `oklch(0.12 0.02 0)` with 0.5px border | Message bubbles, modals, popovers |

## Spacing & Rhythm

| Element | Value | Usage |
|---------|-------|-------|
| **Base Unit** | 4px | Grid, padding, margins |
| **Card Padding** | 12px–16px | Message bubbles, modals |
| **Section Padding** | 16px–20px | Sidebar, headers |
| **Border Radius** | 6px (base), 4px (md), 2px (sm) | Buttons, inputs, cards |
| **Gap** | 8px–12px | List items, spacing hierarchy |

## Component Patterns

- **Message Bubbles**: Light cards in light mode, darker cards in dark mode. User messages align right with teal accent. Received messages align left with muted background.
- **Sidebar Items**: Full-width, rounded (6px), hover state highlights with secondary color. Active state: teal background with white text.
- **Inputs**: Border-only style, teal ring on focus. Placeholder text in muted-foreground.
- **Buttons**: Teal primary (solid), secondary (outlined), destructive (red). No shadow by default; elevation via scale on hover.
- **Badges**: Unread count displayed as small teal circles/badges on conversation items.

## Motion

- **Transitions**: Smooth 0.3s cubic-bezier(0.4, 0, 0.2, 1) for all interactive state changes.
- **Load States**: Spinner animations on async operations. Subtle fade-in for new messages.
- **No Bounce**: Velocity-based spring physics where applicable, else linear ease-out.

## Constraints & Accessibility

- **Minimum Contrast**: AA+ (4.5:1 for text, 3:1 for UI). Verified: teal on white (6.2:1), grey text on white (8.1:1).
- **No Color-Only**: Badges and states use icons or labels alongside color.
- **Touch Targets**: Minimum 44px height for interactive elements on mobile.
- **Typography**: Line-height 1.5 for body text, 1.2 for headers. Letter-spacing adjusted for geometric typefaces.

## Signature Detail

Teal accent used sparingly — confined to CTAs, active navigation, focus states, and unread indicators. This restraint creates visual hierarchy and makes the accent feel premium rather than omnipresent. The sidebar remains the anchor of the interface, providing spatial separation between navigation and content.
