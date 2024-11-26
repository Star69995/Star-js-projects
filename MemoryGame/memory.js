let cards = document.querySelectorAll('.card');
let flippedCards = 0

const arrColors = ["aquamarine", "darkcyan", "blueviolet", "crimson", "chartreuse", "deeppink", "darksalmon", "gold"];
// dooubledColorsכאן יצרתי 2 מעדכים של  והכנסתי אותם למשתנה שנקרא arrColors
const doubledColors = [...arrColors, ...arrColors];


const button = document.querySelector('button');
button.addEventListener("click", assignColorsToPairs);


// פונקציית ערבוב מערך (שיטת Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // החלפה
    }
    return array;
}
function backFlip(card) {
    // card.classList.remove('flipped');
    card.style.backgroundColor = "";

}

// פונקציה לאיפוס וצביעת קלפים
function assignColorsToPairs() {
    const shuffledColors = shuffleArray(doubledColors);

    cards.forEach((card, index) => {
        card.dataset.color = shuffledColors[index]; // שמירת הצבע ב-data-color


        card.style.backgroundColor = ""; // איפוס הצבע החזותי

    });
}

// הגדרת אירוע קליק לכל קלף
cards.forEach((card) => {
    card.addEventListener('click', () => {
        card.style.backgroundColor = card.dataset.color; // חושף את הצבע
        console.log(card.dataset.color);
        console.log(card);
        console.log(card.style.backgroundColor);

        flippedCards +=1
        if (flippedCards === 2) {
            
            setTimeout(() => cards.forEach(backFlip), 1000);
            flippedCards = 0
        }
    });
});


assignColorsToPairs()