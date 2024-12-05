class Panel {
    constructor() {
        this.addingPanel = `<div class="editing-panel">
                            <div class='buttons'> 
                                <button data-type="text">הוסף טקסט</button>
                                <button data-type="image">הוסף תמונה</button>
                                <button data-type="div">הוסף דיב</button>
                            </div>
                            </div>`;
        this.panel = document.createElement('div');
        this.panel.innerHTML = this.addingPanel;
        document.body.appendChild(this.panel);

        this.currentPanel = this.addingPanel;

        // General event listener for all buttons
        this.panel.addEventListener('click', (event) => {
            const { type: elementType } = event.target.dataset;
            // console.log(elementType);
            if (elementType) {
                new Element(elementType);
            }
        });

    }

    showPanel(panel = this.currentPanel) {
        this.panel.innerHTML = panel;
    }

    showAddingPanel() {
        this.showPanel(this.addingPanel);
    }

    hidePanel() {
        this.panel.innerHTML = '';
    }

    showElementEditingPanel(element) {
        // יצירת פאנל עריכה דינמי
        if (element && element.propStyles) {
            let panelForm = `<div class="editing-panel element-editing-panel">`;

            // יצירת שדות קלט דינמיים עבור כל תכונה ב-propStyles
            Object.entries(element.propStyles).forEach(([key, value]) => {
                panelForm += `
            <label for="${key}">${key}:</label>
            <input type="${typeof value === 'number' ? 'number' : key.includes('color') ? 'color' : 'text'}" 
                id="${key}" value="${value}">
            <br>`;
            });

            panelForm += `</div>`;
            this.showPanel(panelForm);

            // מאזינים לשדות הקלט
            Object.keys(element.propStyles).forEach((key) => {
                const inputField = document.getElementById(key);
                if (inputField) {
                    inputField.addEventListener('input', (event) => {
                        const newValue = event.target.value;

                        // עדכון ב-propStyles
                        element.propStyles[key] = newValue;

                        // עדכון בסגנון הויזואלי (style) של האלמנט
                        element.element.style[key] = newValue;  // עדכון ישיר ב-style של האלמנט
                        element.applyStyles();
                    });

                }
            });
        }
    }


    showPanel(panelHTML) {
        this.panel.innerHTML = panelHTML;
    }


    // addEventListeners(element) {
    //     // בדוק אם האלמנט קיים לפני הוספת מאזינים
    //     const textContentField = document.getElementById('textContent');
    //     const fontSizeField = document.getElementById('fontSize');
    //     const fontFamilyField = document.getElementById('fontFamily');
    //     const underlineColorField = document.getElementById('underlineColor');
    //     const boldToggleField = document.getElementById('boldToggle');
    //     const imageUrlField = document.getElementById('imageUrl');
    //     const imageWidthField = document.getElementById('imageWidth');
    //     const imageHeightField = document.getElementById('imageHeight');
    //     const imageBorderRadiusField = document.getElementById('imageBorderRadius');
    //     const divBackgroundColorField = document.getElementById('divBackgroundColor');
    //     const divBorderField = document.getElementById('divBorder');
    //     const divBorderRadiusField = document.getElementById('divBorderRadius');

    //     // הוספת מאזינים עבור טקסט
    //     if (textContentField) {
    //         textContentField.addEventListener('input', (event) => {
    //             element.innerText = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור גודל פונט
    //     if (fontSizeField) {
    //         fontSizeField.addEventListener('input', (event) => {
    //             element.style.fontSize = event.target.value + 'px';
    //         });
    //     }

    //     // הוספת מאזינים עבור פונט
    //     if (fontFamilyField) {
    //         fontFamilyField.addEventListener('change', (event) => {
    //             element.style.fontFamily = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור צבע קו תחתון
    //     if (underlineColorField) {
    //         underlineColorField.addEventListener('input', (event) => {
    //             element.style.textDecoration = `underline ${event.target.value}`;
    //         });
    //     }

    //     // הוספת מאזינים עבור בולד
    //     if (boldToggleField) {
    //         boldToggleField.addEventListener('change', (event) => {
    //             element.style.fontWeight = event.target.checked ? 'bold' : 'normal';
    //         });
    //     }

    //     // הוספת מאזינים עבור קישור תמונה
    //     if (imageUrlField) {
    //         imageUrlField.addEventListener('input', (event) => {
    //             element.src = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור רוחב תמונה
    //     if (imageWidthField) {
    //         imageWidthField.addEventListener('input', (event) => {
    //             element.width = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור גובה תמונה
    //     if (imageHeightField) {
    //         imageHeightField.addEventListener('input', (event) => {
    //             element.height = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור רדיוס פינות תמונה
    //     if (imageBorderRadiusField) {
    //         imageBorderRadiusField.addEventListener('input', (event) => {
    //             element.style.borderRadius = event.target.value + 'px';
    //         });
    //     }

    //     // הוספת מאזינים עבור צבע רקע של דיב
    //     if (divBackgroundColorField) {
    //         divBackgroundColorField.addEventListener('input', (event) => {
    //             element.style.backgroundColor = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור גבול של דיב
    //     if (divBorderField) {
    //         divBorderField.addEventListener('input', (event) => {
    //             element.style.border = event.target.value;
    //         });
    //     }

    //     // הוספת מאזינים עבור רדיוס גבול של דיב
    //     if (divBorderRadiusField) {
    //         divBorderRadiusField.addEventListener('input', (event) => {
    //             element.style.borderRadius = event.target.value + 'px';
    //         });
    //     }
    // }

}

class Element {
    constructor(type) {
        this.type = type;
        this.createElement();

        document.addEventListener('click', (event) => {
            document.querySelectorAll('.selected').forEach(selectedEl => {
                if (!selectedEl.contains(event.target) && !panel.panel.contains(event.target)) {
                    selectedEl.classList.remove('selected');
                    panel.showAddingPanel();
                }
            });
        });

    }
    createElement() {
        this.element = document.createElement('div');
        switch (this.type) {
            case 'div':
                this.element.innerHTML = `<div class="divUser"></div>`
                this.propStyles = {
                    borderRadius: '0px',
                    width: '100%',
                    backgroundColor: '#ebb0eb',
                    height: '100px',
                    borderColor: 'black',
                    borderStyle: 'solid',
                    borderWidth: '2px'
                }
                break;
            case 'text':
                this.element.innerHTML = `<p class="textUser">טקסט</p>`
                this.propStyles = {
                    width: '100%',
                    backgroundColor: 'transparent',
                    borderColor: 'none',
                    borderStyle: 'none',
                    borderWidth: '0px'
                }
                break;
            case 'image':
                this.element.innerHTML = `<img class="imageUser" scr="" alt="תמונה">`
                this.propStyles = {
                    src: '',
                    alt: '',
                    borderRadius: '0px',
                    width: '100px',
                    backgroundColor: 'lightgray',
                    height: '100px',
                    borderColor: 'none',
                    borderStyle: 'none',
                    borderWidth: '0px'
                }
                break;
        }
        this.applyStyles();
        this.element.addEventListener('click', () => this.selectElement());

        main.appendChild(this.element)
    }

    applyStyles() {
        for (const key in this.propStyles) {
            this.element.style[key] = this.propStyles[key];
        }
    }


    selectElement() {
        // הסרת קלאס 'selected' מכל האלמנטים האחרים לפני סימון האלמנט הנוכחי
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

        // סימון האלמנט הנוכחי כ'נבחר'
        this.element.classList.add('selected');

        // הצגת פאנל עריכה מתאים
        panel.showElementEditingPanel(this);  // העבר את האלמנט עצמו כאן, לא את הסוג
    }



    deselectElement(event) {
        // נוודא שהלחיצה לא התבצעה בתוך האלמנט עצמו או בתוך הפאנל
        if (!this.element.contains(event.target) && !panel.panel.contains(event.target)) {
            this.element.classList.remove('selected');
            panel.showAddingPanel();
        }
    }


}


const panel = new Panel();

// Main content section
const main = document.createElement('section');
main.classList.add('main');
document.body.appendChild(main);

