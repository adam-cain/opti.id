# Optic ID Coin Animation

A storyboard for an animated sequence involving a coin transitioning through several images of optmism superchain before revealing a chain and a nameplate.

---

## 1. Idle State
- **Visual**: The coin is spinning slowly.
- **Effect**: Coin appears slightly blurred to suggest motion.
- **Suggested Duration**: Infinite until user interaction (hover, click, or other).

---

## 2. On Click (Acceleration)
- **Trigger**: User clicks the coin.
- **Visual**: The coin’s rotation speeds up, reducing or removing the blur.
- **Effect**: Transition from slow spin to fast spin (smooth easing).
- **Suggested Duration**: ~0.5–1 second.

---

## 3. Rising Effect
- **Transition**: The coin lifts off from its current position while spinning.
- **Visual**: Coin moves upward on the y-axis, maintaining its faster spin rate.
- **Effect**: Emphasize the coin’s upward motion (could add a slight glow or scale up to make it appear closer).
- **Suggested Duration**: 3 second.

---

## 4. Redrop (Crash Down)
- **Trigger**: Immediately follows the rising action or a brief pause at the top.
- **Visual**: The coin abruptly crashes back down to its starting position (or slightly below for a bounce effect).
- **Effect**: A short camera shake or rumble effect can enhance impact.
- **Suggested Duration**: 0.5–1 second for the downward motion.

---

## 5. Flash Effect
- **Trigger**: Coin hits the ground.
- **Visual**: A bright flash fills the screen or a large area, temporarily obscuring the coin.
- **Effect**: Emphasizes the force of the impact, setting up the reveal.
- **Suggested Duration**: Flash appears quickly (~0.2 seconds) and can linger (fades out) over ~0.5 seconds.

---

## 6. Chain Reveal (+ Fireworks)
- **Transition**: After the flash fades, the chain is revealed where the coin was.
- **Visual**: Sparkles or mini-fireworks around the chain.
- **Effect**: The chain glows or pulses to draw attention.
- **Suggested Duration**: Fireworks/sparkles could last ~1–2 seconds.

---

## 7. Nameplate Appearance
- **Trigger**: A short delay (e.g., ~0.5–1 second) after the chain appears.
- **Visual**: The nameplate (or label) smoothly transitions in, possibly sliding up from below or fading in. Positioned below the spinning coin.
- **Effect**: Final identification element, clarifying that this is the "Optic ID."
- **Suggested Duration**: Fade/slide in over ~0.5 seconds; remain visible.

---

## Overall Sequence in Order
1. **Idle**: Coin spins slowly (blurred).
2. **On Click**: Speed up the spin (blur disappears).
3. **Rising**: Coin moves upward (fast spin).
4. **Crash Down**: Coin collides with ground.
5. **Flash**: Bright flash obscures the coin upon impact.
6. **Reveal**: Chain appears with optional fireworks or spark effects.
7. **Nameplate**: Fades/slides in after a short delay.

---

## Additional Notes & Suggestions
- **Easing & Timing**: Use smooth easing (e.g., `ease-in-out` or `cubic-bezier`) for all transitions to create a polished feel.
- **Sound Effects (Optional)**: 
  - A subtle “whoosh” when the coin rises. 
  - A “clink” or “impact” sound for the crash down.
  - A quick “sparkle” effect for the fireworks reveal.
- **Responsiveness**: Ensure the animation adapts to different screen sizes. For mobile, consider a smaller coin or slightly shorter animation durations.
- **Accessibility**: 
  - Offer a “reduced motion” option for users who prefer minimized animations.
  - Provide clear visuals even for those who may have color-vision deficiencies (e.g., ensure high contrast in the flash and reveal states).

---

**Storyboard Summary**:  
This animation guides the user’s attention from a casual spinning coin (idle) through a dramatic impact and flash, culminating in the final reveal of a chain (symbolic of the Optic ID) and a nameplate. The sequence is designed to be engaging, memorable, and clearly convey the transition from the coin’s identity to the newly revealed chain identity.

---