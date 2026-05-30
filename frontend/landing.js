// Count up animation for stats on landing page
function animateStat(id, targetVal, suffix, duration) {
    const el = document.getElementById(id);
    if (!el) return;

    let startTime = null;
    const startVal = 0;

    function countAnim(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        let currentVal;
        if (id === 'stat-accuracy') {
            // Decimals count for accuracy (e.g. 98.4%)
            currentVal = (startVal + (targetVal - startVal) * progress).toFixed(1);
        } else {
            currentVal = Math.floor(startVal + (targetVal - startVal) * progress);
        }

        if (id === 'stat-latency') {
            el.textContent = `<${currentVal}${suffix}`;
        } else {
            el.textContent = `${currentVal}${suffix}`;
        }

        if (progress < 1) {
            window.requestAnimationFrame(countAnim);
        } else {
            if (id === 'stat-latency') {
                el.textContent = `<${targetVal}${suffix}`;
            } else {
                el.textContent = `${targetVal}${suffix}`;
            }
        }
    }

    window.requestAnimationFrame(countAnim);
}

window.addEventListener("DOMContentLoaded", () => {
    // Trigger count-ups with different speeds
    setTimeout(() => {
        animateStat("stat-accuracy", 98.4, "%", 1500);
        animateStat("stat-guidelines", 12, "+", 1200);
        animateStat("stat-latency", 200, "ms", 1000);
        animateStat("stat-encryption", 100, "%", 1400);
    }, 400);
});
