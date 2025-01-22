## This js script defines a recursive modern-ui editor of JSON structures.

<p align="center">
  <img src="https://github.com/rewouh/json-web-editor/blob/main/example.png?raw=true"/>
</p>

### How to ?

First of all, download (or copy) the script and import it in your web page. \
It exports a json_editor dictionary that contains everything.

### Then ?

From another JS script, start by loading the CSS with : 

```js
json_editor.reloadCSS()
```

After that, you can create as much JSON editors as you want with :

```js
let editor = json_editor.createEditor(/* <json structure here> */)
```

This function returns the built dom element, which you can append wherever you'd like in the page.

Complete example : 

```js
json_editor.reloadCSS()

let example = { first_text: 'Hello', second_text: 'World !' }
document.body.appendChild(json_editor.createEditor(example))
```

### The editor

You can edit any key or value by simply clicking on its text. \
Modifications are echoed to the JSON object upon pressing enter in an input or when unfocusing that same input.

Any item of the editor can be clicked to create a clone of it, while Ctrl + click will delete that item.

There are two utilities buttons at the bottom of an editor, one to copy the JSON to clipboard and the other to change the theme.

### Customization

Some customization parameters are available at the beginning of the script.

There are a bunch of default themes pre-built in the script, you can add your owns easily (a theme is basically a pair of dark/light colors). \
You can also change the default font.

Finally you may want to change the layout (display) of the editor, right now it is configured to handle big arrays of medium-sized dictionaries. \
Let's say you want to handle a very big dictionary, then it would be smoother to change the orientations of 'dict' to 'column' instead of 'row' (at the beginning of the script).
