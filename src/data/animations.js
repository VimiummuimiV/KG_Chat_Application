export function addJumpEffect(element, initialTranslateX = 0, initialTranslateY = 0) {
  // Define keyframes with specified percentages, scale effect, and calc for Y translation
  const keyframes = [
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}%)) scale(1)` }, // 0%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 60%)) scale(1.1)` }, // 20%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 15%)) scale(1)` }, // 40%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 20%)) scale(1.05)` }, // 60%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 8%)) scale(1)` }, // 75%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% - 10%)) scale(1.05)` }, // 85%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}% + 4%)) scale(1)` }, // 92%
    { transform: `translate(${initialTranslateX}%, calc(${initialTranslateY}%)) scale(1)` } // 100%
  ];

  // Animation options
  const options = {
    duration: 500, // Total animation duration in ms (adjust as needed)
    easing: 'ease', // Smooth easing between keyframes
    iterations: 1 // Play once
  };

  // Start the animation
  const animation = element.animate(keyframes, options);

  // Optional: Return a promise that resolves when animation completes
  return animation.finished;
}

// Helper function to add shake effect
export function addShakeEffect(element) {
  element.classList.add('shake-effect');
  setTimeout(() => {
    element.classList.remove('shake-effect');
  }, 500);
}

export function addPulseEffect(element) {
  element.classList.add('pulse-effect');
  setTimeout(() => {
    element.classList.remove('pulse-effect');
  }, 500);
}