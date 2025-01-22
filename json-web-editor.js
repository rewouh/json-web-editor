var json_editor = {}

/*  [What is this?]

    This compact script defines a recursive modern-ui editor of JSON structures.

    [How to?]

    First of all, load the stylesheet with : json_editor.reloadCSS()

    Afer that, you solely need one function : json_editor.createEditor(<json object here>)
    it returns the dom element of the editor, which you can append wherever you'd like.

    You can also customize a few things below as needed.
*/

// ------------------- CONFIGURATIONS -------------------

/*  Feel free to change the orientations to fit your needs, although the default configuration gives the best results in my opinion.
    If you are using very big dictionaries it would be pertinent to change the orientation of dict to 'column'.

    This default configuration is more oriented to handle big arrays of medium-sized dictionaries.
*/
json_editor.orientations = {
    dict: 'row',
    array: 'column',
    keyval: 'row',
}

json_editor.font = '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif' // Default font, you can change that

json_editor.themes = {
    Neptune: ['#1B3966', '#335994'],    // Sea blue
    Aphrodite: ['#9F0B4C', '#D12E75'],  // Pink power
    Demeter: ['#366442', '#708E41'],    // Nature green 
    Hephaestus: ['#A11919', '#C25F14'], // Orange fire
    Lyssa: ['#8B0F0F', '#AE0440'],      // Crimson red
    Hecate: ['#55336F', '#855CA4'],     // Witchy purple
    Kronos: ['#2E2E2E', '#4C4C4C'],     // Grayish
}

json_editor.current_theme = 'Neptune' // Default theme, you can change that

/* You can call those functions anytime to change the font or theme at runtime.
*/

json_editor.changeFont = (newFont) => {
    json_editor.font= newFont
    json_editor.reloadCSS()
}

json_editor.changeTheme = (newTheme) => {
    json_editor.current_theme = newTheme
    json_editor.reloadCSS()
}

// ------------------- INTERNAL -------------------
/* Only change the below code if you know what you're doing.
*/

json_editor.clickAction = (domElement, clickedFunc, controlClickedFunc) => {
    domElement.onclick = (e) => {
        e.stopPropagation() 

        if (document.activeElement.classList.contains('json-editor-input'))
            return

        if (e.ctrlKey)
            controlClickedFunc(e)
        else
            clickedFunc(e)        
    }
}

json_editor.deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

json_editor.createArrayEditor = (array) => {
    let domArray = document.createElement('div')
    domArray.classList.add('json-editor-div', `json-editor-${json_editor.orientations.array}-div`, 'json-editor-array')

    let buildArrayElement = (obj) => {
        let built = json_editor._createEditor(obj)
        built.classList.add('json-editor-clickable')

        json_editor.clickAction(built, () => {
            array.push(json_editor.deepCopy(obj))
            buildArrayElement(array[array.length - 1])

            console.log('Cloned array element')
        }, () => {
            array.splice(array.indexOf(obj), 1)
            built.remove()

            console.log('Destroyed array element')
        })

        domArray.append(built)
    }

    for (let obj of array)
        buildArrayElement(obj)

    return domArray
}

json_editor.createDictEditor = (dict) => {
    let domDict = document.createElement('div')
    domDict.classList.add('json-editor-div', `json-editor-${json_editor.orientations.dict}-div`, 'json-editor-dict')

    let buildKeyValueElement = (key) => {
        let keyKeeper = [ key ]
        let value = dict[key]

        if (value === null)
        {
            console.warn('Ignoring unsupported null value in JSON structure.')
            return
        }

        let domKeyValue = document.createElement('div')
        domKeyValue.classList.add('json-editor-div', `json-editor-${json_editor.orientations.keyval}-div`, 'json-editor-clickable', 'json-editor-key-value')

        json_editor.clickAction(domKeyValue, () => {
            let copyKey = key + ' - copy'

            dict[copyKey] = json_editor.deepCopy(dict[key])
            buildKeyValueElement(copyKey)

            console.log('Cloned dict key-value element')
        }, () => {
            delete dict[key]
            domKeyValue.remove()

            console.log('Destroyed dict key-value element')
        })

        let domKey = json_editor.createDictKeyEditor(dict, keyKeeper)
        domKey.classList.add('json-editor-key')

        let domValue

        if (typeof value == 'string')
            domValue = json_editor.createDictStringValueEditor(dict, keyKeeper)
        else if (typeof value == 'number')
            domValue = value % 1 === 0 ? json_editor.createDictIntegerValueEditor(dict, keyKeeper) : json_editor.createDictFloatValueEditor(dict, keyKeeper)
        else if (typeof value == 'boolean')
            domValue = json_editor.createDictBooleanValueEditor(dict, keyKeeper)
        else
            domValue = json_editor._createEditor(value)

        domKeyValue.append(domKey, domValue)
        domDict.append(domKeyValue)
    }

    for (let key of Object.keys(dict))
        buildKeyValueElement(key)

    return domDict
}

json_editor.resizeTextInput = (domInput) => {
    domInput.style.width = `${domInput.value.length * 0.4}vw` 
}

json_editor.createTextInputEditor = (dictContainer, dictKeyKeeper, editKey, inputUpdateFunc) => {
    let domInput = document.createElement('input')
    domInput.classList.add('json-editor-input')
    domInput.type = 'text'

    let dictKey = dictKeyKeeper[0]

    domInput.value = editKey ? dictKey : dictContainer[dictKey]
    json_editor.resizeTextInput(domInput)

    domInput.addEventListener('keyup', () => {
        json_editor.resizeTextInput(domInput)
    })

    domInput.addEventListener('change', () => {
        dictKey = dictKeyKeeper[0] // Updating key as it may have changed

        let oldValue = editKey ? dictKey : dictContainer[dictKey]
        let newValue = domInput.value

        newValue = inputUpdateFunc(oldValue, newValue)
        domInput.value = newValue

        if (editKey) {
            dictContainer[newValue] = dictContainer[dictKey]
            delete dictContainer[dictKey]

            console.log(`Renamed ${dictKey} to ${newValue}`)

            dictKeyKeeper[0] = newValue
        }
        else {
            dictContainer[dictKey] = newValue
            console.log(`Updated ${dictKey} to '${newValue}'`)
        }
    })

    return domInput
}

json_editor.createDictKeyEditor = (dictContainer, dictKeyKeeper) => {
    return json_editor.createTextInputEditor(dictContainer, dictKeyKeeper, true, (oldV, newV) => newV)
}

json_editor.createDictStringValueEditor = (dictContainer, dictKeyKeeper) => {
    return json_editor.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => newV )
}

json_editor.createDictNumberValueEditor = (dictContainer, dictKeyKeeper, parseFunc) => {
    return json_editor.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => { 
        try {
            return parseFunc(newV)    
        } catch (err) {
            return oldV
        }
    })
}

json_editor.createDictIntegerValueEditor = (dictContainer, dictKeyKeeper) => {
        return json_editor.createDictNumberValueEditor(dictContainer, dictKeyKeeper, parseInt)
}

json_editor.createDictFloatValueEditor = (dictContainer, dictKeyKeeper) => {
    return json_editor.createDictNumberValueEditor(dictContainer, dictKeyKeeper, parseFloat)
}

json_editor.createDictBooleanValueEditor = (dictContainer, dictKeyKeeper) => {
    return json_editor.createTextInputEditor(dictContainer, dictKeyKeeper, false, (oldV, newV) => newV == 'true')
}

json_editor.createEditorButton = (text, clickFunc) => {
    let domEditorButton = document.createElement('div')
    domEditorButton.classList.add('json-editor-button')
    domEditorButton.innerText = text

    domEditorButton.onclick = () => { clickFunc(domEditorButton) }

    return domEditorButton   
}

json_editor._createEditor = (object) => {
    let built

    if (Array.isArray(object))
        built = json_editor.createArrayEditor(object)
    else if (object.constructor == Object)
        built = json_editor.createDictEditor(object)
    else {
        console.error(`Unknown object type : ${typeof object} `)
        return null
    }

    return built
}

json_editor.createEditor= (object) => {
    let built = json_editor._createEditor(object)

    let domEditor = document.createElement('div')
    domEditor.classList.add('json-editor', 'json-editor-column-div')

    domEditor.append(built)

    let domEditorButtons = document.createElement('div')
    domEditorButtons.classList.add('json-editor-buttons', 'json-editor-row-div')

    domEditorButtons.append(
        json_editor.createEditorButton('Paste JSON to clipboard', (button) => {
            navigator.clipboard.writeText(JSON.stringify(object, null, 2))
        }),
        json_editor.createEditorButton(`Theme: ${json_editor.current_theme}`, (button) => {
            let themesList = Object.keys(json_editor.themes)
            let currIndex = themesList.indexOf(json_editor.current_theme)

            currIndex += 1

            if (currIndex >= themesList.length)
                currIndex = 0

            json_editor.changeTheme(themesList[currIndex])
            button.innerText = `Theme: ${json_editor.current_theme}`
        })
    )

    domEditor.append(domEditorButtons)

    return domEditor
}

json_editor.css = () => { 
    return `
            :root {
                --dark: ${json_editor.themes[json_editor.current_theme][0]};
                --light: ${json_editor.themes[json_editor.current_theme][1]};
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
                font-family: ${json_editor.font};
            }

            .json-editor-input {
                font-size: 0.5vw;
            }

            .json-editor-key {
                font-weight: 600;
            }
            `
}

json_editor.reloadCSS = () => {
    if (Object.hasOwn(json_editor, 'style'))
        json_editor.style.remove()

    json_editor.style = document.createElement('style')
    json_editor.style.innerHTML = json_editor.css()
    document.getElementsByTagName('head')[0].append(json_editor.style)
}

/* Example :

let example = { text: 'Hello World!' }

json_editor.reloadCSS()

document.body.appendChild(json_editor.createEditor(example))
*/