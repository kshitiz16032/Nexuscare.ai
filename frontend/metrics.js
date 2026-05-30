// Interactive mouse highlights on metrics cards
window.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".metric-value-card");
    cards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.style.borderColor = "var(--color-primary)";
            card.style.boxShadow = "0 8px 20px var(--color-primary-glow)";
            card.style.transform = "translateY(-2px)";
        });
        
        card.addEventListener("mouseleave", () => {
            card.style.borderColor = "var(--border-color)";
            card.style.boxShadow = "none";
            card.style.transform = "translateY(0)";
        });
    });
});
