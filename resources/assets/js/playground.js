import { runSkulpt, stopSkulpt, debugSkulpt } from './SkulptSetup'
import { Editor } from './EditorSetup'
import './editorLayout'
const Sk = require('skulpt')

const editorWindow = document.getElementById('editor')
const session = 0

let filename = 'main.py'
const urlParams = new URLSearchParams(window.location.search)
const project = urlParams.get('project')
let hasProject = false
if (project != null && project.length > 0) {
  filename = project
  hasProject = true
}
const aceEditor = new Editor(Sk, filename)
Sk.PyAngelo.aceEditor = aceEditor
const listenForErrors = true
const autosave = true
aceEditor.onChange(listenForErrors, autosave)
aceEditor.listenForBreakPoints()

const startStopButton = document.getElementById('startStop')
startStopButton.addEventListener('click', runCode)
const copyButton = document.getElementById('copyButton')
copyButton.addEventListener('click', copyCode)
const saveButton = document.getElementById('saveButton')
saveButton.addEventListener('click', saveCodeToFile)
const loadFileInput = document.getElementById('file-input')
loadFileInput.addEventListener('change', userLoadCode, false)
const openButton = document.getElementById('openButton')
openButton.addEventListener('click', loadCodeFromFile)
const resetButton = document.getElementById('resetButton')
if (hasProject) {
  resetButton.addEventListener('click', resetProject)
} else {
  resetButton.style.display = 'none'
}
const fullscreenButton = document.getElementById('fullscreenButton')
fullscreenButton.addEventListener('click', openFullscreen)
const stepIntoButton = document.getElementById('stepInto')
stepIntoButton.addEventListener('click', debugSkulpt)
const stepOverButton = document.getElementById('stepOver')
stepOverButton.addEventListener('click', debugSkulpt)
const slowMotionButton = document.getElementById('slowMotion')
slowMotionButton.addEventListener('click', debugSkulpt)
const continueButton = document.getElementById('continue')
continueButton.addEventListener('click', debugSkulpt)

function runCode () {
  aceEditor.saveToLocalStorage()
  startStopButton.removeEventListener('click', runCode, false)
  startStopButton.style.backgroundColor = '#880000'
  startStopButton.textContent = 'Stop'
  startStopButton.addEventListener('click', stopCode, false)
  Sk.PyAngelo.console.innerHTML = ''
  const debugging = document.getElementById('debug').checked
  runSkulpt(aceEditor.getCode(session), debugging, stopCode)
}

function stopCode () {
  stopSkulpt()
  startStopButton.removeEventListener('click', stopCode, false)
  startStopButton.style.backgroundColor = '#008800'
  startStopButton.textContent = 'Start'
  startStopButton.addEventListener('click', runCode, false)
}

function copyCode () {
  aceEditor.copyCode()
}

function saveCodeToFile () {
  aceEditor.saveToLocalStorage()
  aceEditor.saveCodeToFile()
}

function loadCodeFromFile () {
  loadFileInput.click()
}

function userLoadCode (event) {
  const files = event.target.files
  let file = null
  if (files.length > 0) {
    file = files[0]
  } else {
    return
  }
  const reader = new FileReader()
  reader.onload = (function (theFile) {
    return function (e) {
      aceEditor.replaceSession(session, e.target.result)
    }
  })(file)
  reader.readAsText(file)
  event.target.value = ''
  Sk.PyAngelo.reset()
}

function resetProject () {
  if (confirm('This will reset the code and you will lose your progress so far.\nIs this okay?')) {
    aceEditor.loadFromProject()
    aceEditor.saveToLocalStorage()
    Sk.PyAngelo.reset()
  }
}

function openFullscreen () {
  const isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
      (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
      (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
      (document.msFullscreenElement && document.msFullscreenElement !== null)

  if (!isInFullScreen) {
    const docElm = document.documentElement
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen()
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen()
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen()
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

const onresize = (domElem, callback) => {
  const resizeObserver = new ResizeObserver(() => callback())
  resizeObserver.observe(domElem)
}

onresize(editorWindow, function () {
  aceEditor.resize()
})

aceEditor.addSession('# Write your code below')
if (hasProject && localStorage.getItem(filename) === null) {
  aceEditor.loadFromProject()
}
aceEditor.loadCodeFromLocalStorage()
aceEditor.setSession(0)
