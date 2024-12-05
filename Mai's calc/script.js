document.getElementById('calculate-btn').addEventListener('click', () => {
    const numPieces = parseInt(document.getElementById('num-pieces').value);
    const sizes = Array.from(document.querySelectorAll('.size-input')).map(input => parseFloat(input.value));
    const rangeLow = parseFloat(document.getElementById('range-low').value);
    const rangeHigh = parseFloat(document.getElementById('range-high').value);
    const output = document.getElementById('output');

    output.textContent = '';  // Clear previous output

    let isCombination = false;

    for (let i = 1; i <= numPieces; i++) {
        const combinations = getCombinations(sizes, i);
        const filteredCombinations = filterCombinations(combinations, rangeLow, rangeHigh);
        const uniqueCombinations = getUniqueCombinations(filteredCombinations);

        if (uniqueCombinations.length > 0) {
            // Add a header for the number of pieces
            const numPiecesHeader = document.createElement('div');
            numPiecesHeader.classList.add('num-pieces-header');
            numPiecesHeader.textContent = `${i} חתיכות:`;
            output.appendChild(numPiecesHeader);

            uniqueCombinations.forEach((combination, index) => {
                if (combination.includes(0)) return; // Skip combinations with 0

                isCombination = true;

                // Create HTML elements dynamically for each combination
                const combinationDiv = document.createElement('div');
                combinationDiv.classList.add('combination');

                const header = document.createElement('div');
                header.classList.add('combination-header');
                header.textContent = `קומבינציה ${index + 1} (אורך כולל: ${combination.reduce((a, b) => a + b, 0).toFixed(1)})`;
                combinationDiv.appendChild(header);

                const piecesDiv = document.createElement('div');
                piecesDiv.classList.add('combination-pieces');
                const counts = countPieces(combination);
                Object.keys(counts).forEach(size => {
                    const pieceDetail = document.createElement('div');
                    pieceDetail.textContent = `${size} x ${counts[size]}`;
                    pieceDetail.classList.add('piece-detail');
                    piecesDiv.appendChild(pieceDetail);
                });
                combinationDiv.appendChild(piecesDiv);
                output.appendChild(combinationDiv);
            });
        }
    }

    if (!isCombination) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.textContent = "לא נמצאו קומבינציות.";
        output.appendChild(errorDiv);
    }
});

document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('output').textContent = '';
});

function getCombinations(arr, len) {
    let result = [];
    function generate(curr, index) {
        if (curr.length === len) {
            result.push(curr);
            return;
        }
        for (let i = index; i < arr.length; i++) {
            generate([...curr, arr[i]], i);
        }
    }
    generate([], 0);
    return result;
}

function filterCombinations(combinations, rangeLow, rangeHigh) {
    return combinations.filter(combination => {
        const total = combination.reduce((a, b) => a + b, 0);
        return total >= rangeLow && total <= rangeHigh;
    });
}

function getUniqueCombinations(combinations) {
    const uniqueSet = new Set(combinations.map(c => JSON.stringify(c)));
    return Array.from(uniqueSet).map(c => JSON.parse(c));
}

function countPieces(combination) {
    return combination.reduce((acc, size) => {
        acc[size] = (acc[size] || 0) + 1;
        return acc;
    }, {});
}
document.getElementById('toggle-instructions').addEventListener('click', () => {
    const instructions = document.getElementById('full-instructions');

    // Toggle the visibility of the content
    if (instructions.style.display === "none"|| instructions.style.display === "") {
        instructions.style.display = "block";
        document.getElementById('toggle-instructions').textContent = "הסתרת הסבר"; // Change button text
    } else {
        instructions.style.display = "none";
        document.getElementById('toggle-instructions').textContent = "הסבר על הכלי"; // Revert button text
    }
});
