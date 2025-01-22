const json_web_editor = {
    /*  [What is this?]

        This compact script defines a recursive modern-ui editor of JSON structures.

        [How to?]

        First of all, load the stylesheet with : this.reloadCSS()

        Afer that, you solely need one function : this.createEditor(<json object here>)
        it returns the dom element of the editor, which you can append wherever you'd like.

        You can also customize a few things below as needed.
    */

    // ------------------- CONFIGURATIONS -------------------

    config: {
        debug: false, // Enable/disable logs

        /*  Feel free to change the orientations to fit your needs, although the default configuration gives the best results in my opinion.
            If you are using very big dictionaries it would be pertinent to change the orientation of dict to 'column'.

            This default configuration is more oriented to handle big arrays of medium-sized dictionaries.
        */
        orientations: {
            dict: 'row',
            array: 'column',
            keyval: 'row',
        },

        
        font: '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif', // Default font, you can change that

        themes: {
            Neptune: ['#1B3966', '#335994'],    // Sea blue
            Aphrodite: ['#9F0B4C', '#D12E75'],  // Pink power
            Demeter: ['#366442', '#708E41'],    // Nature green 
            Hephaestus: ['#A11919', '#C25F14'], // Orange fire
            Lyssa: ['#8B0F0F', '#AE0440'],      // Crimson red
            Hecate: ['#55336F', '#855CA4'],     // Witchy purple
            Kronos: ['#2E2E2E', '#4C4C4C'],     // Grayish
        },
    
        current_theme: 'Neptune', // Default theme, you can change that
    },

    /* You can call those functions anytime to change the font or theme at runtime.
    */
    
    changeFont: function(newFont) {
        this.config.font = newFont
        this.reloadCSS()
    },
    
    changeTheme: function(newTheme) {
        this.config.current_theme = newTheme
        this.reloadCSS()
    },

    // ------------------- INTERNAL -------------------
    /* Only change the below code if you know what you're doing.
    */

    internal: {
        style: null,
    },

    log: function(message) {
        if (this.config.debug)
            console.log(message)
    },

    clickAction: function(domElement, clickedFunc, controlClickedFunc) {
        domElement.onclick = (e) => {
            e.stopPropagation() 

            if (document.activeElement.classList.contains('json-editor-input'))
                return

            if (e.ctrlKey)
                controlClickedFunc(e)
            else
                clickedFunc(e)        
        }
    },

    deepCopy: function(obj) {
        return JSON.parse(JSON.stringify(obj))
    },
    
    createArrayEditor: function(array) {
        let domArray = document.createElement('div')
        domArray.classList.add('json-editor-div', `json-editor-${this.config.orientations.array}-div`, 'json-editor-array')
    
        let buildArrayElement = (obj) => {
            let built = this._createEditor(obj)
            built.classList.add('json-editor-clickable')
    
            this.clickAction(built, () => {
                array.push(this.deepCopy(obj))
                buildArrayElement(array[array.length - 1])
    
                this.log('Cloned array element')
            }, () => {
                array.splice(array.indexOf(obj), 1)
                built.remove()
    
                this.log('Destroyed array element')
            })
    
            domArray.append(built)
        }
    
        for (let obj of array)
            buildArrayElement(obj)
    
        return domArray
    },
    
    
    createDictEditor: function(dict) {
        let domDict = document.createElement('div')
        domDict.classList.add('json-editor-div', `json-editor-${this.config.orientations.dict}-div`, 'json-editor-dict')

        let buildKeyValueElement = (key) => {
            let keyKeeper = [ key ]
            let value = dict[key]

            if (value === null)
            {
                console.warn('Ignoring unsupported null value in JSON structure.')
                return
            }

            let domKeyValue = document.createElement('div')
            domKeyValue.classList.add('json-editor-div', `json-editor-${this.config.orientations.keyval}-div`, 'json-editor-clickable', 'json-editor-key-value')

            this.clickAction(domKeyValue, () => {
                console.log('old key ' + key)

                key = keyKeeper[0]

                console.log('new key ' + key)

                console.log(dict)

                let copyKey = key + ' - copy'

                dict[copyKey] = this.deepCopy(dict[key])
                buildKeyValueElement(copyKey)

                this.log('Cloned dict key-value element')
            }, () => {
                key = keyKeeper[0]

                delete dict[key]
                domKeyValue.remove()

                this.log('Destroyed dict key-value element')
            })

            let domKey = this.createDictKeyEditor(dict, keyKeeper)
            domKey.classList.add('json-editor-key')

            let domValue

            if (typeof value == 'string')
                domValue = this.createDictStringValueEditor(dict, keyKeeper)
            else if (typeof value == 'number')
                domValue = value % 1 === 0 ? this.createDictIntegerValueEditor(dict, keyKeeper) : this.createDictFloatValueEditor(dict, keyKeeper)
            else if (typeof value == 'boolean')
                domValue = this.createDictBooleanValueEditor(dict, keyKeeper)
            else
                domValue = this._createEditor(value)

            domKeyValue.append(domKey, domValue)
            domDict.append(domKeyValue)
        }

        for (let key of Object.keys(dict))
            buildKeyValueElement(key)

        return domDict
    },

    resizeTextInput: function(domInput) {
        domInput.style.width = `${domInput.value.length * 0.4}vw` 
    },

    createTextInputEditor: function(dictContainer, dictKeyKeeper, editKey, inputUpdateFunc) {
        let domInput = document.createElement('input')
        domInput.classList.add('json-editor-input')
        domInput.type = 'text'
    
        let dictKey = dictKeyKeeper[0]
    
        domInput.value = editKey ? dictKey : dictContainer[dictKey]
        this.resizeTextInput(domInput)
    
        domInput.addEventListener('keyup', () => {
            this.resizeTextInput(domInput)
        });
    
        ['change'].forEach((event) => 
            domInput.addEventListener(event, () => {
                dictKey = dictKeyKeeper[0] // Updating key as it may have changed
    
                let oldValue = editKey ? dictKey : dictContainer[dictKey]
                let newValue = domInput.value
    
                newValue = inputUpdateFunc(oldValue, newValue)
                domInput.value = newValue
    
                if (editKey) {
                    dictContainer[newValue] = dictContainer[dictKey]
                    delete dictContainer[dictKey]
    
                    this.log(`Renamed ${dictKey} to ${newValue}`)
    
                    dictKeyKeeper[0] = newValue
                }
                else {
                    dictContainer[dictKey] = newValue
                    this.log(`Updated ${dictKey} to '${newValue}'`)
                }
            }
        ))
    
        return domInput
    },

    createDictKeyEditor: function(dictContainer, dictKeyKeeper) {
        return this.createTextInputEditor(dictContainer, dictKeyKeeper, true, (oldV, newV) => newV)
    },
    
    createDictStringValueEditor: function(dictContainer, dictKeyKeeper) {
        return this.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => newV )
    },
    
    createDictNumberValueEditor: function(dictContainer, dictKeyKeeper, parseFunc) {
        return this.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => { 
            try {
                return parseFunc(newV)    
            } catch (err) {
                return oldV
            }
        })
    },

    createDictIntegerValueEditor: function(dictContainer, dictKeyKeeper) {
        return this.createDictNumberValueEditor(dictContainer, dictKeyKeeper, parseInt)
    },

    createDictFloatValueEditor: function(dictContainer, dictKeyKeeper) {
        return this.createDictNumberValueEditor(dictContainer, dictKeyKeeper, parseFloat)
    },

    createDictBooleanValueEditor: function(dictContainer, dictKeyKeeper) {
        return this.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => newV == 'true')
    },

    createEditorButton: function(text, clickFunc) {
        let domEditorButton = document.createElement('div')
        domEditorButton.classList.add('json-editor-button')
        domEditorButton.innerText = text
    
        domEditorButton.onclick = () => { clickFunc(domEditorButton) }
    
        return domEditorButton   
    },
    
    _createEditor: function(object) {
        let built
    
        if (Array.isArray(object))
            built = this.createArrayEditor(object)
        else if (object.constructor == Object)
            built = this.createDictEditor(object)
        else {
            console.error(`Unknown object type : ${typeof object} `)
            return null
        }
    
        return built
    },

    createEditor: function(object) {
        let built = this._createEditor(object)
    
        let domEditor = document.createElement('div')
        domEditor.classList.add('json-editor', 'json-editor-column-div')
    
        domEditor.append(built)
    
        let domEditorButtons = document.createElement('div')
        domEditorButtons.classList.add('json-editor-buttons', 'json-editor-row-div')
    
        domEditorButtons.append(
            this.createEditorButton('Paste JSON to clipboard', (button) => {
                navigator.clipboard.writeText(JSON.stringify(object, null, 2))
            }),
            this.createEditorButton(`Theme: ${this.config.current_theme}`, (button) => {
                let themesList = Object.keys(this.config.themes)
                let currIndex = themesList.indexOf(this.config.current_theme)
    
                currIndex += 1
    
                if (currIndex >= themesList.length)
                    currIndex = 0
    
                this.changeTheme(themesList[currIndex])
                button.innerText = `Theme: ${this.config.current_theme}`
            })
        )
    
        domEditor.append(domEditorButtons)
    
        return domEditor
    },

    style: null,

    css: function() { 
        return `
                :root {
                    --dark: ${this.config.themes[this.config.current_theme][0]};
                    --light: ${this.config.themes[this.config.current_theme][1]};
                }
    
                .json-editor {
                    gap: 2vh;
                }
    
                .json-editor-div {
                    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
                    padding: 0.5vw;
                    border-radius: 20px;
                    margin: auto auto;
                    animation: slide-in 0.5s;
                }
    
                @keyframes slide-in {
                    from {
                        transform: scale(0%);
                    }
                    to {
                        transform: scale(100%);
                    }
                }
    
                .json-editor-row-div, .json-editor-column-div {
                    display: flex;
                    flex-wrap: nowrap;
                    align-items: center;
                    justify-items: center;
                }
    
                .json-editor-row-div {
                    flex-direction: row;
                    gap: 0.5vw;
                }
    
                .json-editor-column-div {
                    flex-direction: column;
                    gap: 0.5vh;
                }
    
                .json-editor-buttons {
                    gap: 0.5vw;
                }
    
                .json-editor-button {
                    transition: all 0.2s linear;
                    background-image: linear-gradient(to right bottom, var(--dark), var(--light));
                    padding: 0.5vw;
                    border-radius: 10px;
                    font-size: 0.5vw;
                }
    
                .json-editor-button:hover {
                    transform: scale(105%);
                    cursor: pointer;
                }
    
                .json-editor-dict, .json-editor-array {
                    background-color: var(--light);
                }
    
                .json-editor-key-value {
                    background-color: var(--dark);
                }
    
                .json-editor-input {
                    all: unset;
                    padding-left: 0.2vw;
                }
    
                .json-editor-input, .json-editor-button {
                    color: white;
                    font-family: ${this.config.font};
                }
    
                .json-editor-input {
                    font-size: 0.5vw;
                }
    
                .json-editor-key {
                    font-weight: 600;
                }
                `
    },
    
    reloadCSS: function() {
        console.log(this)

        if (this.internal.style !== null)
            this.internal.style.remove()
    
        this.internal.style = document.createElement('style')
        this.internal.style.innerHTML = this.css()
        document.getElementsByTagName('head')[0].append(this.internal.style)
    },
}