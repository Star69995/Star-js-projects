let players = []; // רשימה של שמות השחקנים
let playersHands = {}; // הידיים של השחקנים בפורמט { playerName: [card1, card2, ...] }
let currentPlayer = 0; // אינדקס השחקן הנוכחי
let currentPlayerName = ''; // שם השחקן הנוכחי (להקלת קריאה)
let playerHand = []; // היד של השחקן הנוכחי (עדכון דינמי לפי currentPlayerName)
const playedCards = []; // רשימה של קלפים ששוחקו
let currentPlayerIndex = 0;

let deck = generateDeck(); // חבילת הקלפים
let centralCard = { color: 'red', value: '1' }; // הקלף המרכזי
let player1Cards = [];
let player2Cards = [];
let player3Cards = [];
let player4Cards = [];

//עזר ותשתיות  

function generateDeck() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'שנה צבע'];
    let new_deck = [];
    const doubledColors = colors.concat(colors);
    const doubledValues = values.concat(values);

    doubledColors.forEach(color => {
        doubledValues.forEach(value => {
            new_deck.push({ color: color, value: value });
        });
    });

    // קלפי +4 וקלפי wild (שנה צבע)
    for (let i = 0; i < 2; i++) {
        new_deck.push({ color: 'wild', value: '+2' });
        new_deck.push({ color: 'wild', value: 'שנה צבע' });
    }
    // console.log(generateDeck);

    shuffleDeck(new_deck); // ערבוב החפיסה
    return new_deck;
}



function shuffleDeck(deck) {
    // מערבב את הקופה בצורה אקראית
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // מחליף בין שני קלפים
    }
    return deck;
}
// console.log(shuffleDeck);



// פונקציה שמחזירה את הצבע המתאים
function getColor(color) {
    switch (color) {
        case 'red': return '#d96c6c';
        case 'green': return '#6cbd6c';
        case 'blue': return '#6c86d9';
        case 'yellow': return '#d9d36c';
        default: return 'gray';
    }
}
// console.log(getColor);

function generateHiddenCards(count) {
    console.log("count:", count)
    // מחזירה HTML שמייצג כמות קלפים מוסתרים
    let hiddenCardsHTML = '';
    for (let i = 0; i < count; i++) {
        hiddenCardsHTML += '<div class="card hidden"></div>'; // יוצרת כרטיס מוסתר
    }
    console.log("code to add:", hiddenCardsHTML)
    return hiddenCardsHTML;
}
// console.log(generateHiddenCards);



// ניהול שחקנים וידיים



function setupPlayers(playerCount, playerName) {
    players = []; // מאפס את רשימת השחקנים
    playersHands = {}
    for (let i = 1; i <= playerCount; i++) {
        const player = (i === 1) ? playerName : `שחקן מחשב ${i - 1}`;
        players.push(player);
        playersHands[player] = []; // יצירת יד ריקה
    }

    // console.log('שחקנים:', players);
}
// console.log(setupPlayers);

setupPlayers(4);


// פונקציה לחלוק את הקלפים
function dealCards() {
    players.forEach(player => {
        playersHands[player] = [];
        for (let j = 0; j < 8; j++) {
            if (deck.length > 0) {
                playersHands[player].push(deck.pop());
            }
        }
        // console.log(playersHands[player])

    });
    playerHand = playersHands[players[0]]; // היד של השחקן האנושי
    updateHand();
}
// console.log(dealCards);





function renderPlayers() {
    const positions = ['top-player', 'left-player', 'right-player', 'bottom-player']; // המיקומים על פי העיצוב החדש
    players.forEach((player, index) => {
        const playerDiv = document.getElementById(positions[index]);
        const isHuman = index === 0;
        playerDiv.innerHTML = `
            <div>${player}</div>
           
        `;
        // <div class="cards">${isHuman ? '' : generateHiddenCards(playersHands[player].length)}</div>

        if (!isHuman) {
            updateHiddenCards(player)
        }
    });
}
// console.log(renderPlayers);




function updateHiddenCards(playerName) {
    const positions = ['top-player', 'left-player', 'right-player', 'bottom-player'];
    const playerIndex = players.indexOf(playerName);
    // if (playerIndex >= 0) {
    //     const playerDiv = document.getElementById(positions[playerIndex]);
    //     const cardCount = playersHands[playerName].length;
    //     playerDiv.querySelector('.cards').innerHTML = generateHiddenCards(cardCount); // מייצר קלפים מוסתרים בכמות הנכונה
    // }
    const playerPotition = positions[playerIndex]
    console.log("updatting hidden card for ai", playerName)
    const playerArea = document.getElementById(playerPotition)?.firstElementChild;
    console.log("paler thing:", playerPotition)

    console.log("player area:", playerArea)
    if (playerArea) {
        const cardCount = playersHands[playerName].length;
        console.log("the player cards:", cardCount)
        playerArea.innerHTML = generateHiddenCards(cardCount);
    }
}

// console.log(cardCount);




function updateHand() {
    const handContainer = document.getElementById('player-hand');
    handContainer.innerHTML = ''; // מוחק את היד הישנה
    if (playersHands.length === 0) {
        showMessage('אין קלפים ביד!');
        return;
    }
    // יוצרים את התצוגה עבור כל קלף
    playerHand.forEach((card, index) => {  // כאן השתמש ב playerHand ולא ב playersHands
        const cardElement = document.createElement('div');
        cardElement.classList.add('card'); // ניתן להוסיף גם סגנון CSS לקלפים
        cardElement.style.backgroundColor = getColor(card.color); // צבע הקלף
        cardElement.textContent = card.value; // הערך של הקלף
        cardElement.addEventListener('click', () => playCard(players[0], index));

        handContainer.appendChild(cardElement);
    });
}
// console.log(updateHand);


//תור ותצוגה



function highlightCurrentPlayer() {
    const positions = ['top-player', 'left-player', 'right-player', 'bottom-player'];
    positions.forEach((position, index) => {
        const playerDiv = document.getElementById(position);
        playerDiv.classList.toggle('active-player', index === currentPlayer);
    });
}
// console.log(highlightCurrentPlayer);




// עדכון התצוגה של הקלף המרכזי
function updateCentralCard() {
    const centralCardDiv = document.getElementById('central-card');
    centralCardDiv.innerHTML = `
        <div class="card ${centralCard.color}">
            <span>${centralCard.value}</span>
        </div>
    `;
}
// console.log(updateCentralCard);



// פונקציה להציג הודעה על המסך
function showMessage(message) {
    const messageLine = document.getElementById('message-line');
    messageLine.textContent = message;
    messageLine.style.display = 'block';  // מציגה את שורת ההודעות
    setTimeout(() => {
        messageLine.style.display = 'none';  // מסתירה את שורת ההודעות אחרי 3 שניות
    }, 3000);
}
// console.log(showMessage);



// פונקציה לשינוי תור
function nextTurn() {
    currentPlayer = (currentPlayer + 1) % players.length; // מחליף את התור בין השחקנים
    const currentPlayerName = players[currentPlayer];
    playerHand = playersHands[currentPlayerName]; // מעדכן את היד של השחקן הנוכחי
    highlightCurrentPlayer(); // מציג את השחקן הנוכחי בתצוגה
    // אם השחקן הנוכחי הוא מחשב (AI), נסה לבצע את מהלך השחקן האוטומטי
    if (currentPlayerName.startsWith('שחקן מחשב')) {
        showMessage(`${currentPlayerName} זה התור שלו!`);
        setTimeout(() => aiPlayCard(currentPlayerName), 1000); // השחקן האוטומטי משחק אחרי הפסקה
    } else {
        showMessage(`${currentPlayerName}, זה התור שלך!`);
    }
}
// console.log(nextTurn);




// מערבבים מחדש את הקלפים ששוחקו (למעט הקלף המרכזי)
function reshuffleDeck() {
    if (deck.length === 0 && playedCards.length > 1) {
        deck.push(...playedCards.splice(1)); // משאיר את הקלף המרכזי
        shuffleDeck(deck);
        showMessage('הקופה עורבבה מחדש!');
    } else if (deck.length === 0) {
        showMessage('אין קלפים זמינים בקופה!');
    }
}
// console.log(nextTurn);






//מהלכי שחקן

function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    return players[currentPlayerIndex];
}
// console.log(nextPlayer);

// פונקציה להנחת קלף
function playCard(playerName, cardIndex) {
    const cardToPlay = playersHands[playerName][cardIndex]; // שליפת הקלף מיד השחקן
    const player = nextPlayer();
    // בדיקה אם הקלף מתאים לקלף המרכזי
    if (cardToPlay.color === centralCard.color || cardToPlay.value === centralCard.value || cardToPlay.value === 'שנה צבע') {
        playedCards.push(centralCard); // הוספת הקלף המרכזי הנוכחי להיסטוריית הקלפים
        centralCard = cardToPlay; // עדכון הקלף המרכזי לקלף שנבחר
        playersHands[playerName].splice(cardIndex, 1); // הסרת הקלף מהיד של השחקן

        // עדכון תצוגה
        updateHand(playerName); // עדכון היד של השחקן בתצוגה
        updateCentralCard(); // עדכון תצוגת הקלף המרכזי
        showMessage(`${playerName} שיחק את הקלף ${cardToPlay.color} ${cardToPlay.value}`);

        // בדיקה האם הקלף דורש פעולה מיוחדת
        if (cardToPlay.value === '+2') {
            drawCards(nextPlayer(), 2); // השחקן הבא מושך שני קלפים
            showMessage('השחקן הבא צריך למשוך שני קלפים!');
        } else if (cardToPlay.value === '+4') {
            drawCards(nextPlayer(), 4); // השחקן הבא מושך ארבעה קלפים
            showMessage('השחקן הבא צריך למשוך ארבעה קלפים!');

        } else if (cardToPlay.value === 'שנה צבע') {
            showColorPicker(); // פתיחת בורר הצבעים
            return; // ממתין לבחירת צבע
        }

        // בדיקה אם השחקן ניצח
        if (playersHands[playerName].length === 0) {
            showMessage(`${playerName} ניצח במשחק!`);
        } else {
            nextTurn(); // העברת התור לשחקן הבא
        }
    } else {
        showMessage('הקלף לא מתאים לקלף המרכזי!');
    }
}
// console.log(playCard);




// הוספת קלף ליד של השחקן
function drawCard() {
    if (deck.length > 0) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        const drawnCard = deck.splice(randomIndex, 1)[0];

        if (playerHand && Array.isArray(playerHand)) { // בדוק אם היד הוגדרה כראוי
            playerHand.push(drawnCard);
            updateHand();
        } else {
            console.error('playerHand is not defined or is not an array');
        }
    } else {
        showMessage('הקופה ריקה!');
    }
}
// console.log(drawCard);

function drawCards(playerName, count) {
    for (let i = 0; i < count; i++) {
        if (deck.length > 0) {
            const drawnCard = deck.pop(); // מושך קלף מהקופה
            playersHands[playerName].push(drawnCard); // מוסיף את הקלף ליד של השחקן
        } else {
            showMessage('הקופה ריקה!');
            break;
        }
    }
    updateHand(playerName); // עדכון היד של השחקן בתצוגה
    showMessage(`${playerName} משך ${count} קלפים!`); // הצגת הודעה על המשיכה
}
// console.log(drawCards);


function showColorPicker() {
    document.getElementById('color-picker').style.display = 'block';
}
// console.log(showColorPicker);

// פונקציה לבחירת צבע
function chooseColor(color) {
    centralCard = { color: color, value: 'שנה צבע' }; // משנה את הצבע בקופה ל-'wild' עם הצבע שנבחר
    document.getElementById('color-picker').style.display = 'none'; // מסתיר את כפתורי הצבעים
    showMessage(`הקופה שונתה ל-${color}!`); // הצגת הודעה
    updateCentralCard(); // עדכון הקופה
    nextTurn(); // התור עובר לשחקן הבא
}
//  console.log(chooseColor);






// מהלכי שחקן אוטומטי


function aiPlayCard(playerName) {
    const aiHand = playersHands[playerName];
    const availableCards = aiHand.filter(card =>
        card.color === centralCard.color || card.value === centralCard.value || card.value === 'שנה צבע'
    );

    // אם יש קלפים שמתאימים
    if (availableCards.length > 0) {
        const cardToPlay = availableCards[Math.floor(Math.random() * availableCards.length)]; // בוחר קלף אקראי מתאים
        centralCard = cardToPlay;
        aiHand.splice(aiHand.indexOf(cardToPlay), 1); // מסיר את הקלף מהיד
        updateCentralCard();
        showMessage(`${playerName} שיחק קלף ${cardToPlay.color} ${cardToPlay.value}`);

        if (cardToPlay.value === 'שנה צבע') {
            aiChooseWildColor(playerName);
        } else {
            nextTurn(); // העברת התור
        }
    } else {
        showMessage(`${playerName} לא יכול לשחק קלף!`);
        drawCardForAI(playerName); // אם אין קלף לשחק, משיכה קלף
        nextTurn();
    }


    updateHiddenCards(playerName)
}

// console.log(aiPlayCard);



function drawCardForAI(playerName) {
    if (deck.length > 0) {
        const drawnCard = deck.pop();
        playersHands[playerName].push(drawnCard); // מוסיף את הקלף ליד של השחקן האוטומטי
        showMessage(`${playerName} משך קלף!`);
    } else {
        showMessage('הקופה ריקה!');
    }
}
// console.log(drawCardForAI);




function aiChooseWildColor(playerName) {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    centralCard.color = chosenColor; // שינוי צבע הקלף המרכזי
    showMessage(`${playerName} בחר את הצבע ${chosenColor}!`);
    console.log(`הצבע שנבחר: ${chosenColor}`);
    updateCentralCard();
    nextTurn(); // העברת התור
}

// console.log(aiChooseWildColor);


//אתחול המשחק



function startPlayerSetup() {
    const playerName = document.getElementById('player-name').value.trim();
    const playerCount = parseInt(document.getElementById('player-count').value);

    // בדיקה: לוודא שהשם מוזן
    if (!playerName) {
        alert('אנא הכנס את שמך לפני תחילת המשחק.');
        return;
    }

    setupPlayers(playerCount, playerName); // הגדרת השחקנים
    document.getElementById('player-setup').style.display = 'none'; // הסתרת מסך ההגדרות
    startGame(); // התחלת המשחק
}
// console.log(startPlayerSetup);



function startGame() {
    const numPlayers = players.length;
    const startingHandSize = 8;

    // חלוקת קלפים
    for (let i = 0; i < numPlayers; i++) {
        const player = players[i];
        playersHands[player] = deck.splice(0, startingHandSize); // לוקח 7 קלפים מהקופה
    }

    // הגדרת הקלף המרכזי
    centralCard = deck.pop(); // שולף את הקלף העליון בקופה
    while (centralCard.color === 'wild') {
        deck.unshift(centralCard); // מחזיר לקופה אם הקלף הוא wild
        centralCard = deck.pop();
    }

    updateCentralCard(); // מעדכן את התצוגה




    shuffleDeck(deck);
    dealCards(); // חילוק הקלפים
    centralCard = deck.pop(); // קלף מרכזי
    renderPlayers(); // הצגת השחקנים מסביב לשולחן
    updateCentralCard();
    showMessage('המשחק התחיל!');
    nextTurn();
}

// console.log(startGame);


// מאזינים לאירועים
document.getElementById('deck').addEventListener('click', drawCard);

// אתחול ראשוני
updateCentralCard();
updateHand();
updateHiddenCards(1, player1Cards);
updateHiddenCards(2, player2Cards);
updateHiddenCards(3, player3Cards);
updateHiddenCards(4, player4Cards);

