import * as runBash from "/linuxSimulator/index.js"
console.log(runBash);

function filterXSS(input) {
    return input.replace("&", "&amp;").replace(/</g, "&lt;").replace(/>/, "&gt;").replace(/\ /g, "&nbsp;").replace(/\n/g, "<br>")
}
let hook = {
    changeCommand: function(apiarg, binary, args) {
        prefix.innerText = "";
        runningCommand = true;
        api = apiarg;
        api.io.stdout.onwrite = function(text) {
            if (api.hideout) { return }
            output.innerHTML += filterXSS(text);
            output.scrollTop = output.scrollHeight
        }
        api.io.stderr.output.onwrite = function(text) {
            if (text == "{{{clear}}}") {
                output.innerHTML = "";
                return
            }
            output.innerHTML += filterXSS(text);
            output.scrollTop = output.scrollHeight
        }
        api.io.stdin.output.onwrite = function(text) {
            if (text == "{{{clear}}}") {
                input.innerHTML = "";
                return
            }
            input.innerHTML += filterXSS(text);
        }
        api.io.stderr.input.onwrite = function(text) {
            input.innerHTML = "";
            output.innerHTML += filterXSS(text);
            output.scrollTop = output.scrollHeight
        }
        api.io.stdout.ondone = function(text) {}
    },
    ondone: function() {
        runningCommand = false;
        prefix.innerText = runBash.data.user + "@" + runBash.data.computer + ":" + runBash.data.env.PWD + "$";
        api = null;
    }
}
let runningCommand = false;
let api;
let triedFullscreen = false;
let commandHistory = [];
let historyIndex = 0;
if ('ontouchstart' in document.documentElement) {
    document.body.contentEditable = true
}
onkeydown = function(e) {
    if (runningCommand) {
        let keyEvent = {}
        for (let prop in e) {
            if (["boolean", "string", "number"].includes(typeof e[prop])) {
                keyEvent[prop] = e[prop];
            }
        }
        api.io.keys.write(keyEvent)
    }
    e.preventDefault()
    if (!triedFullscreen) {
        // document.documentElement.requestFullscreen();
        triedFullscreen = true;
    }
    if (!runningCommand && e.key == "ArrowDown") {
        if (historyIndex == commandHistory.length) {
            return
        }
        if (historyIndex == commandHistory.length - 1) {
            input.innerText = "";
            historyIndex++;
            return
        }
        historyIndex++;
        input.innerText = commandHistory[historyIndex]
    }
    if (!runningCommand && e.key == "ArrowUp") {
        if (historyIndex == 0) {
            return
        }
        historyIndex--;
        input.innerText = commandHistory[historyIndex]
    }
    if (e.ctrlKey) {
        shortcut(e);
        return;
    }
    if (e.key == "Backspace") {
        input.innerText = input.innerText.slice(0, -1);
        return
    }
    if (e.key == "Enter") {
        if (runningCommand) {
            api.io.stderr.input.write(input.innerText)
            return;
        }
        commandHistory.push(input.innerText);
        historyIndex = commandHistory.length
        runBash.runCommand(input.innerText, hook);
        output.innerHTML += `<br><a style='color:rgb(20, 238, 20);'>${filterXSS(runBash.data.user+"@"+runBash.data.computer+":"+runBash.data.env.PWD)}$&nbsp;</a><a>${filterXSS(input.innerText)}</a><br>`;
        input.innerText = "";
        return
    }
    if (e.key == " ") {
        input.innerHTML += "&nbsp;";
        return;
    }
    if (e.key.length == 1) {
        input.innerText += e.key;
    }
}

function shortcut(e) {
    if (e.key == "c" && e.ctrlKey) {
        api.io.stdout.done()
    }
}