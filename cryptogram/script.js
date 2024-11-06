// משתנה לאחסון המשפט הנוכחי שהמשתמש מנסה לפענח
let currentSentence = "";

// משתנה לאחסון המשפט המוצפן
let encryptedSentence = "";

// מילון הממפה כל אות מהאלפבית העברי לאות מוצפנת
let letterMapping = {};

// מילון הממפה כל אות מוצפנת לאות העברית המקורית
let reversedMapping = {};

// מילון לאחסון פתרונות המשתמש (אותות שנכנסו להקלטות)
let solutionMapping = {};

// סט המעקב אחר אותיות שכבר נעשה בהן שימוש
let usedLetters = new Set();

// משתנה לאחסון האלפבית העברי
const hebrewAlphabet = 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';



/**
 * מפונקציה לערבוב אותיות במחרוזת
 * @param {string} str - המחרוזת שיש לערבב אותיותיה
 * @returns {string} מחרוזת עם אותיות מעורבבות
 */
function shuffleString(str) {
    const arr = Array.from('אבגדהוזחטיכלמנסעפצקרשתךםןףץ');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function encryptSentence(sentence) {
    const hebrewAlphabet = 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ';
    const shuffledAlphabet = shuffleString(hebrewAlphabet);

    letterMapping = {};
    reversedMapping = {};
    solutionMapping = {};
    usedLetters.clear();

    for (let i = 0; i < hebrewAlphabet.length; i++) {
        letterMapping[hebrewAlphabet[i]] = shuffledAlphabet[i];
        reversedMapping[shuffledAlphabet[i]] = hebrewAlphabet[i];
    }

    return sentence
        .split('')
        .map(char => {
            // Skip punctuation and non-alphabet characters
            if (!hebrewAlphabet.includes(char)) {
                return char; // Return the character as is
            }
            return letterMapping[char] || char; // Map the letter or return as is
        })
        .join('');
}


function createPuzzleUI() {
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = '';

    const words = encryptedSentence.split(' ');
    const wordContainer = document.createElement('div');
    wordContainer.style.display = 'flex';
    wordContainer.style.gap = '1rem';
    wordContainer.style.flexWrap = 'wrap';
    wordContainer.style.justifyContent = 'center';

    words.forEach((word, wordIndex) => {
        const wordGroup = document.createElement('div');
        wordGroup.className = 'word-group';

        Array.from(word).forEach((letter, letterIndex) => {
            const encryptedSpan = document.createElement('div');
            encryptedSpan.className = 'encrypted-letter';

            const letterGroup = document.createElement('div');
            letterGroup.className = 'letter-group';



            if (hebrewAlphabet.includes(letter)) {
                encryptedSpan.textContent = letter; // Encrypt the letter


                const input = document.createElement('input');
                input.className = 'solution-letter';
                input.maxLength = 1;
                input.dataset.encrypted = letter;
                input.dataset.wordIndex = wordIndex;
                input.dataset.letterIndex = letterIndex;
                input.inputMode = 'none'

                input.addEventListener('keydown', handleKeyDown);
                input.addEventListener('input', handleKeyBoardInput);
                input.addEventListener('click', function () {
                    this.select();
                });

                input.value = solutionMapping[letter] || '';

                letterGroup.appendChild(input);
                letterGroup.appendChild(encryptedSpan);
                wordGroup.appendChild(letterGroup);

            } else {



                encryptedSpan.textContent = letter; // Copy punctuation as is


                const input = document.createElement('input');
                input.className = 'solution-letter-punctuation';


                input.value = letter;
                input.disabled = true;
                letterGroup.appendChild(input);
                // letterGroup.appendChild(encryptedSpan);
                wordGroup.appendChild(letterGroup);
            }


        });

        wordContainer.appendChild(wordGroup);
    });

    container.appendChild(wordContainer);
    updateAllInputColors(); // עדכון צבעים התחלתי

    document.querySelectorAll('.solution-letter').forEach(input => {
        input.addEventListener('focus', (event) => {
            lastFocusedInput = event.target; // עדכון לתיבת הקלט האחרונה
        });
        
    });
    document.querySelectorAll('.solution-letter').forEach(input => {
        input.addEventListener('focus', function (event) {
            event.preventDefault(); // מונע את פעולת הפוקוס הרגילה
            event.stopPropagation(); // מונע את הפוקנציה של המקלדת הניידת
        });
    });
    // הוספת מאזיני האירועים
    document.querySelectorAll('.solution-letter').forEach(input => {
        input.addEventListener('focus', highlightMatchingLetters); // כשעומדים על תיבת הקלט
        input.addEventListener('blur', resetHighlight); // כשהעכבר עוזב את תיבת הקלט
    });



    console.log("puzzle created");
}

function highlightMatchingLetters(event) {
    // console.log('highlightMatchingLetters called');
    const letter = event.target.getAttribute('data-encrypted'); // מקבל את האות שהעכבר עומד עליה

    // console.log(letter);

    const allLetters = document.querySelectorAll(`.solution-letter[data-encrypted="${letter}"]`); // מוצא את כל האלמנטים עם אות זהה

    // console.log(allLetters);

    // מחליף את צבע הרקע של כל האלמנטים עם האות הזהה
    allLetters.forEach(element => {
        element.style.backgroundColor = 'lightgray'; // צבע רקע להדגשה
    });
}

function resetHighlight() {
    const allLetters = document.querySelectorAll('.solution-letter'); // מוצא את כל האלמנטים
    allLetters.forEach(element => {
        element.style.backgroundColor = ''; // מחזיר את צבע הרקע לברירת המחדל
    });
}


let lastFocusedInput = null; // משתנה גלובלי לשמירת הפוקוס האחרון






// פונקציה שתטפל באירוע קלט מהמקלדת
function handleKeyBoardInput(event) {
    const letter = event.target.value;  // מקבל את האות שהוזנה
    handleLetterInput(letter);  // שולח את האות לפונקציה נוספת
}

function useKey (letter) {
    if (lastFocusedInput) {
        lastFocusedInput.focus()
        handleLetterInput(letter);
    }
}



function handleLetterInput(letter) {
    const focusedInput = document.querySelector('.solution-letter:focus');


    const encryptedLetter = focusedInput.dataset.encrypted;
    let newValue = letter.replace(/[^א-ת]/g, '');

    if (newValue.length > 0) {

        // אם האות כבר אושרה כנכונה, אז אל תאפשר לכתוב אותה שוב
        const existingInputs = document.querySelectorAll(`.solution-letter`);

        const isReadOnly = Array.from(existingInputs).some(inp => {
            const letterInInput = inp.value; // Check what letter is in the input
            return letterInInput == newValue && inp.readOnly == true;
        });

        if (isReadOnly) {
            focusedInput.value = '';
            return;
        }



        // Reset background color for all instances of the same letter
        document.querySelectorAll(`.solution-letter[data-encrypted="${encryptedLetter}"]`)
            .forEach(inp => inp.style.backgroundColor = 'white');


        newValue = newValue[newValue.length - 1];

        // אם האות כבר בשימוש, מוצאים ומוחקים אותה מהמקום הקודם
        if (usedLetters.has(newValue)) {
            const previousEncryptedLetter = Object.keys(solutionMapping).find(key => solutionMapping[key] === newValue);
            if (previousEncryptedLetter) {
                delete solutionMapping[previousEncryptedLetter];
                document.querySelectorAll(`.solution-letter[data-encrypted="${previousEncryptedLetter}"]`)
                    .forEach(inp => inp.value = '');
            }
        }

        focusedInput.value = newValue;
        solutionMapping[encryptedLetter] = newValue;
        usedLetters.add(newValue);

        document.querySelectorAll(`.solution-letter[data-encrypted="${encryptedLetter}"]`)
            .forEach(inp => {
                inp.value = newValue;
            });

        moveToNextInput(focusedInput);
    } else {
        if (solutionMapping[encryptedLetter]) {
            usedLetters.delete(solutionMapping[encryptedLetter]);
        }
        delete solutionMapping[encryptedLetter];
        document.querySelectorAll(`.solution-letter[data-encrypted="${encryptedLetter}"]`)
            .forEach(input => input.style.backgroundColor = 'white');


        // Clear the letter in all instances when deleted
        document.querySelectorAll(`.solution-letter[data-encrypted="${encryptedLetter}"]`)
            .forEach(inp => inp.value = '');

    }
    // Check if the input is a valid Hebrew letter
    if (!/^[א-ת]$/.test(letter)) {
        const message = document.getElementById('message');
        message.className = 'message error'; // Set class for styling
        message.textContent = 'נא לשים לב שהמקלדת שלך על עברית.'; // Set message
    } else {
        // Clear the error message if input is valid
        const message = document.getElementById('message');
        message.className = 'message'; // Reset class
        message.textContent = ''; // Clear message
    }
    updateKeyboardHighlights()
}

function updateInputColor(input) {
    const encryptedLetter = input.dataset.encrypted;
    const userSolution = solutionMapping[encryptedLetter];
    const correctSolution = reversedMapping[encryptedLetter];

    // בדיקה אם הרקע כבר כחול בהיר (#ADD8E6)
    if (input.style.backgroundColor === 'lightblue') {
        return; // יציאה מהפונקציה בלי לשנות צבע
    }

    if (!userSolution) {
        input.style.backgroundColor = 'white';
        return;
    }

    if (userSolution === correctSolution) {
        input.style.backgroundColor = '#90EE90'; // ירוק בהיר
        input.readOnly = true;  // נעילת הקלט אם הפתרון נכון
    } else {
        input.style.backgroundColor = '#FFB6C6'; // אדום בהיר
    }
}


function updateAllInputColors() {
    document.querySelectorAll('.solution-letter').forEach(updateInputColor);
}

function handleKeyDown(event) {
    const input = event.target;

    switch (event.key) {
        case 'ArrowRight':
            event.preventDefault();
            moveToPreviousInput(input);
            break;
        case 'ArrowLeft':
            event.preventDefault();
            moveToNextInput(input);
            break;
        case 'ArrowUp':
            event.preventDefault();
            moveToInputAbove(input);
            break;
        case 'ArrowDown':
            event.preventDefault();
            moveToInputBelow(input);
            break;
        case 'Backspace':
            if (input.value === '') {
                event.preventDefault();
                const previousInput = findPreviousInput(input);
                if (previousInput) {
                    const encryptedLetter = previousInput.dataset.encrypted;
                    if (solutionMapping[encryptedLetter]) {
                        usedLetters.delete(solutionMapping[encryptedLetter]);
                    }
                    moveToPreviousInput(input);
                }
            }
            break;
    }
}

function moveToNextInput(currentInput) {
    const allInputs = [...document.querySelectorAll('.solution-letter')];
    let currentIndex = allInputs.indexOf(currentInput);

    // Loop until an empty input is found
    do {
        currentIndex = (currentIndex + 1) % allInputs.length; // Move to next input, wrap around if needed
    } while ((allInputs[currentIndex].readOnly || allInputs[currentIndex].value) &&
        currentIndex !== allInputs.indexOf(currentInput)); // Check if it's read-only or has a value

    allInputs[currentIndex].focus();
    allInputs[currentIndex].select();
}


function moveToPreviousInput(currentInput) {
    const allInputs = [...document.querySelectorAll('.solution-letter')];
    let currentIndex = allInputs.indexOf(currentInput);

    // Loop until an empty or editable input is found
    do {
        currentIndex = (currentIndex - 1 + allInputs.length) % allInputs.length; // Move to previous input, wrap around if needed
    } while (allInputs[currentIndex].readOnly && currentIndex !== allInputs.indexOf(currentInput));

    allInputs[currentIndex].focus();
    allInputs[currentIndex].select();
}

function findPreviousInput(currentInput) {
    const allInputs = [...document.querySelectorAll('.solution-letter')];
    const currentIndex = allInputs.indexOf(currentInput);
    return currentIndex > 0 ? allInputs[currentIndex - 1] : null;
}

function moveToInputAbove(currentInput) {
    const currentWordIndex = parseInt(currentInput.dataset.wordIndex);
    const currentLetterIndex = parseInt(currentInput.dataset.letterIndex);
    const inputs = [...document.querySelectorAll('.solution-letter')];

    // מחפש את התא המתאים בשורה שמעל
    const currentIndex = inputs.indexOf(currentInput);
    let targetInput = inputs.find(input =>
        parseInt(input.dataset.wordIndex) === currentWordIndex - 1 &&
        parseInt(input.dataset.letterIndex) === currentLetterIndex
    );

    if (targetInput) {
        targetInput.focus();
        targetInput.select();
    } else {
        // אם אין תא למעלה, עובר לשורה האחרונה
        targetInput = inputs.findLast(input =>
            parseInt(input.dataset.letterIndex) === currentLetterIndex
        );
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    }
}

function moveToInputBelow(currentInput) {
    const currentWordIndex = parseInt(currentInput.dataset.wordIndex);
    const currentLetterIndex = parseInt(currentInput.dataset.letterIndex);
    const inputs = [...document.querySelectorAll('.solution-letter')];

    // מחפש את התא המתאים בשורה שמתחת
    const targetInput = inputs.find(input =>
        parseInt(input.dataset.wordIndex) === currentWordIndex + 1 &&
        parseInt(input.dataset.letterIndex) === currentLetterIndex
    );

    if (targetInput) {
        targetInput.focus();
        targetInput.select();
    } else {
        // אם אין תא למטה, עובר לשורה הראשונה
        const firstRowInput = inputs.find(input =>
            parseInt(input.dataset.letterIndex) === currentLetterIndex
        );
        if (firstRowInput) {
            firstRowInput.focus();
            firstRowInput.select();
        }
    }
}

function checkSolution() {
    updateKeyboardHighlights()
    let allFilled = true; // Check if all inputs are filled
    let allCorrect = true; // Check if all filled inputs are correct

    // Loop through all input fields
    document.querySelectorAll('.solution-letter').forEach(input => {
        const encryptedLetter = input.getAttribute('data-encrypted'); // Fix attribute access
        const userSolution = input.value;
        const correctSolution = reversedMapping[encryptedLetter];


        // Check if input is filled
        if (!userSolution) {
            allFilled = false; // If any input is empty, set allFilled to false
            return; // Exit early since we found an empty input
        }

        // Check if the user solution matches the correct solution
        if (userSolution !== correctSolution) {
            allCorrect = false; // If there's a mismatch, set allCorrect to false
        }
    });
    console.log('allFilled:', allFilled, 'allCorrect:', allCorrect);

    const message = document.getElementById('message');
    if (!allFilled) {
        message.className = 'message';
        message.textContent = 'עדיין לא מילאת את כל האותיות'; // "You haven't filled all the letters yet"
    } else if (allCorrect) {
        message.className = 'message success';
        message.textContent = 'כל הכבוד! פתרת את החידה בהצלחה!'; // "Congratulations! You solved the puzzle successfully!"
    } else {
        message.className = 'message';
        message.textContent = 'לא בדיוק... נסה שוב!'; // "Not quite... Try again!"
    }

    updateAllInputColors(); // Update input colors based on correctness
}



function getHint() {
    updateKeyboardHighlights()
    // סינון האותיות המוצפנות שעדיין לא נחשפו ומופיעות במשפט
    const unsolvedLetters = Array.from(document.querySelectorAll('.solution-letter'))
        .map(input => input.dataset.encrypted)
        .filter(letter => !solutionMapping[letter] && letter !== ' ');

    // אם יש אותות לא פתורות, נבחר אחת מהן באופן רנדומלי
    if (unsolvedLetters.length > 0) {
        const randomLetter = unsolvedLetters[Math.floor(Math.random() * unsolvedLetters.length)];
        const correctSolution = reversedMapping[randomLetter];

        // אם האות כבר בשימוש, מוחקים אותה מהמיקום הקודם
        if (usedLetters.has(correctSolution)) {
            const previousEncryptedLetter = Object.keys(solutionMapping).find(key => solutionMapping[key] === correctSolution);
            if (previousEncryptedLetter) {
                delete solutionMapping[previousEncryptedLetter];
                document.querySelectorAll(`.solution-letter[data-encrypted="${previousEncryptedLetter}"]`)
                    .forEach(inp => {
                        inp.value = '';
                        inp.style.backgroundColor = 'white'; // Reset color
                    });
            }
        }

        // הגדרת הרמז והוספת צבע כחול לכל ההופעות
        solutionMapping[randomLetter] = correctSolution;
        usedLetters.add(correctSolution);

        document.querySelectorAll(`.solution-letter[data-encrypted="${randomLetter}"]`)
            .forEach(input => {
                input.value = correctSolution;
                input.style.backgroundColor = 'lightblue'; // Set hint color to blue
                input.readOnly = true;  // Lock input if the solution is correct, but allow focus
            });
    }
}




function clearBoard() {
    updateKeyboardHighlights()
    // Create new mappings for correct answers
    const newSolutionMapping = {};
    const newUsedLetters = new Set();

    document.querySelectorAll('.solution-letter').forEach(input => {
        const encryptedLetter = input.dataset.encrypted;
        const userSolution = solutionMapping[encryptedLetter];
        const correctSolution = reversedMapping[encryptedLetter];

        // Clear only if the solution is not correct or if the input is empty
        if (!userSolution || userSolution !== correctSolution) {
            input.value = ''; // Clear the input value
            input.style.backgroundColor = 'white'; // Reset background color
        } else {
            // Retain correct entries in the new mappings
            newSolutionMapping[encryptedLetter] = userSolution;
            newUsedLetters.add(userSolution);
        }
    });

    // Update mappings to keep only correct entries
    solutionMapping = newSolutionMapping;
    usedLetters = newUsedLetters;

    // Clear the message
    const message = document.getElementById('message');
    message.className = 'message';
    message.textContent = '';
}


// נגדיר משתנה גלובלי לשמירת המילון
let dictionary = null;

// פונקציה לטעינת המילון
function loadDictionary() {
    return fetch('sentences-dictionary.json')
        .then(response => response.json())
        .then(data => {
            dictionary = data; // שמירת המילון במשתנה הגלובלי
            return dictionary;
        });
}



// פונקציה מעודכנת ל-reset
function resetGame() {
    // בדיקה אם המילון כבר נטען
    if (!dictionary) {
        loadDictionary().then(() => {
            performReset();
        });
    } else {
        performReset();
    }
}

// הפונקציה שמבצעת את האיפוס בפועל
function performReset() {
    const categories = Object.keys(dictionary);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    // Get a random sentence from the selected category
    const sentences = dictionary[randomCategory];
    const randomSentence = Array.isArray(sentences) ?
        sentences[Math.floor(Math.random() * sentences.length)] :
        sentences;

    currentSentence = randomSentence;
    encryptedSentence = encryptSentence(currentSentence);

    // Display the category above the puzzle
    const categoryContainer = document.getElementById('categoryContainer');
    categoryContainer.innerHTML = '';

    const categoryHeading = document.createElement('h2');
    categoryHeading.textContent = `קטגוריה: ${randomCategory}`;

    categoryContainer.appendChild(categoryHeading);

    solutionMapping = {};
    usedLetters.clear();

    createPuzzleUI();

    const message = document.getElementById('message');
    message.className = 'message';
    message.textContent = '';
}

// טעינת המילון כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    loadDictionary().then(() => {
        // אפשר להפעיל כאן את resetGame אם רוצים
        resetGame();
    }).catch(error => {
        console.error('Error loading dictionary:', error);
    });
});





// Modal functionality
function showInstructions() {
    const modal = document.getElementById('instructionsModal');
    modal.style.display = 'block';
}

// כשהדף נטען, נוסיף את ההתנהגות לכפתור הסגירה ולחיצה מחוץ למודל
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('instructionsModal');
    const span = document.getElementsByClassName('close')[0];

    // כשלוחצים על X, סוגרים את המודל
    span.onclick = function () {
        modal.style.display = 'none';
    }

    // כשלוחצים מחוץ למודל, סוגרים אותו
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});


function updateKeyboardHighlights() {
    console.log('Updating keyboard highlights...');
    const keyboardKeys = document.querySelectorAll('.key'); // Get all keyboard keys

    Array.from(keyboardKeys).forEach(key => {
        const letter = key.textContent.trim();  // Ensure there is no extra whitespace

        console.log(letter);

        // Highlight if the letter has been used
        if (usedLetters.has(letter)) {
            key.style.backgroundColor = '#dedede'; // Used but unconfirmed
            key.style.color = '#383838';
        } else {
            key.style.backgroundColor = ''; // Reset color for unused letters
        }
    });
}

function toggleKeyboard() {
    const keyboardContainer = document.getElementById("keyboardContainer");
    const button = document.querySelector("#toggleKeyboard");  // גישה לכפתור

    // שינוי תצוגת המקלדת
    keyboardContainer.style.display = (keyboardContainer.style.display === "none") ? "block" : "none";

    // עדכון טקסט הכפתור בהתאם למצב המקלדת
    if (keyboardContainer.style.display === "none") {
        button.textContent = "הצג מקלדת";  // אם המקלדת מוסתרת
    } else {
        button.textContent = "הסתר מקלדת";  // אם המקלדת מוצגת
    }
}


